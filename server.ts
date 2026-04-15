import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import { Dropbox } from "dropbox";
import sizeOf from "image-size";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

function serializeError(err: any) {
  return {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    stack: err?.stack,
    cause: err?.cause ? String(err.cause) : undefined,
    response: err?.response
      ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers,
        }
      : undefined,
    errors: err?.errors,
  };
}

function logDriveError(context: string, err: any, extra?: Record<string, any>) {
  console.error(
    `[${context}]`,
    JSON.stringify(
      {
        context,
        extra,
        error: serializeError(err),
      },
      null,
      2
    )
  );
}

dotenv.config();

// Validate critical environment variables
const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`CRITICAL: Missing required environment variables: ${missingEnv.join(', ')}`);
  // We don't exit here to allow the server to start and potentially show a health check error
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
);

const supabaseAdmin = (() => {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL. Admin features will be disabled.');
    // Return a dummy client that will fail on use, or handle it gracefully
    return createClient(
      url || 'https://placeholder.supabase.co',
      'invalid-key'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
})();

const isAdminServiceConfigured =
  !!process.env.VITE_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureAdminService(res: express.Response) {
  if (!isAdminServiceConfigured) {
    res.status(503).json({
      error: "Admin service is not configured on the server. Check SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL."
    });
    return false;
  }
  return true;
}

async function getSuperAdminAssignments() {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role_id, roles!inner(key)")
    .eq("roles.key", "super_admin");

  if (error) throw error;
  return data || [];
}

async function isUserSuperAdmin(userId: string) {
  const rows = await getSuperAdminAssignments();
  return rows.some((row: any) => row.user_id === userId);
}

async function getSuperAdminCount() {
  const rows = await getSuperAdminAssignments();
  return rows.length;
}

async function listAllAuthUsers() {
  const users: any[] = [];
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

const GEMINI_KEY_PLACEHOLDERS = new Set(['', 'TODO_KEYHERE', 'YOUR_GEMINI_API_KEY_HERE', 'changeme']);
const GEMINI_SETTINGS_KEYS = ['gemini_api_key:published', 'gemini_api_key', 'gemini_api_key:draft'];
let cachedGeminiApiKey: { value: string | null; expiresAt: number } = { value: null, expiresAt: 0 };

const parseGeminiKeyValue = (value: any): string | null => {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const candidate = value.apiKey || value.key || value.value;
    if (typeof candidate === 'string') return candidate.trim();
  }
  return null;
};

const isValidGeminiKey = (value: string | null | undefined) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (GEMINI_KEY_PLACEHOLDERS.has(trimmed)) return false;
  return trimmed.length >= 20;
};

async function getGeminiApiKey(): Promise<string | null> {
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (isValidGeminiKey(envKey)) return envKey!;

  const now = Date.now();
  if (cachedGeminiApiKey.expiresAt > now) {
    return cachedGeminiApiKey.value;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('key,value')
      .in('key', GEMINI_SETTINGS_KEYS);

    if (error) {
      console.warn('[Gemini Key] Failed to load key from site_settings:', error.message);
      cachedGeminiApiKey = { value: null, expiresAt: now + 60_000 };
      return null;
    }

    for (const keyName of GEMINI_SETTINGS_KEYS) {
      const row = data?.find((item: any) => item.key === keyName);
      const parsed = parseGeminiKeyValue(row?.value);
      if (isValidGeminiKey(parsed)) {
        cachedGeminiApiKey = { value: parsed!, expiresAt: now + 60_000 };
        return parsed!;
      }
    }
  } catch (error: any) {
    console.warn('[Gemini Key] Unexpected key lookup error:', error?.message || error);
  }

  cachedGeminiApiKey = { value: null, expiresAt: now + 60_000 };
  return null;
}

// Helper to normalize resort names for duplicate detection
const normalizeResortName = (name: string) => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/resort/gi, '')
    .replace(/spa/gi, '')
    .replace(/maldives/gi, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Helper for Google Drive Auth
async function getDriveAuth() {
  const serviceAccountPath = path.join(process.cwd(), "service_account.json");
  let key: any;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON env var");
    }
  }

  if (!key && fs.existsSync(serviceAccountPath)) {
    key = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  if (!key) {
    throw new Error("Google Service Account credentials not found. Please set GOOGLE_SERVICE_ACCOUNT_JSON environment variable or provide service_account.json file.");
  }

  const auth = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return auth;
}

// Bootstrap Initial Admin
async function bootstrapInitialAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  
  if (!email || !password) {
    console.log('[Bootstrap] Skipping initial admin bootstrap: INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set.');
    return;
  }
  
  try {
    console.log(`[Bootstrap] Checking for super admin: ${email}`);
    
    // 1. Check if user exists in auth.users
    const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      // If we can't list users, we might not have service role key
      console.warn(`[Bootstrap] Could not list users (likely missing service role key): ${listError.message}`);
      return;
    }
    
    const users = userData?.users || [];
    let user = users.find((u: any) => u.email === email);
    
    if (!user) {
      console.log(`[Bootstrap] Creating new user: ${email}`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      if (createError) throw createError;
      user = newUser.user;
    } else {
      console.log(`[Bootstrap] User already exists: ${email}`);
      // Update password as requested
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password
      });
      if (updateError) console.warn(`[Bootstrap] Could not update password for ${email}:`, updateError.message);
    }

    if (!user) throw new Error("User creation/retrieval failed");

    // 2. Ensure profile exists and has superadmin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: email,
        role: 'superadmin',
        full_name: 'Shakila'
      }, { onConflict: 'id' });
    
    if (profileError) throw profileError;

    // 3. Ensure user has super_admin role in RBAC system
    const { data: roleData, error: roleFetchError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('key', 'super_admin')
      .single();
    
    if (roleFetchError) throw roleFetchError;

    const { error: userRoleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role_id: roleData.id
      }, { onConflict: 'user_id,role_id' });
    
    if (userRoleError) throw userRoleError;

    console.log(`[Bootstrap] Super admin rights granted to ${email} successfully.`);
  } catch (err: any) {
    console.error(`[Bootstrap] Failed to bootstrap super admin ${email}:`, err.message);
  }
}

// Seed Role and Permission Metadata
async function seedMetadata() {
  console.log('[Seed] Updating role and permission metadata...');
  
  const roles = [
    {
      key: 'super_admin',
      label: 'Super Administrator',
      description: 'Absolute system access. Can manage all aspects of the platform including security, users, and system settings.'
    },
    {
      key: 'admin',
      label: 'Administrator',
      description: 'Full administrative access to resorts, content, and imports. Can manage users but cannot modify system-level security settings.'
    },
    {
      key: 'content_manager',
      label: 'Content Manager',
      description: 'Responsible for managing resort data, media, and site content. Has access to import tools and content moderation.'
    },
    {
      key: 'partner',
      label: 'Resort Partner',
      description: 'Limited access to manage their own resort data and view relevant analytics.'
    }
  ];

  for (const role of roles) {
    try {
      await supabaseAdmin
        .from('roles')
        .update({ 
          label: role.label, 
          description: role.description 
        })
        .eq('key', role.key);
    } catch (e) {
      // Ignore errors if columns don't exist
    }
  }

  // Seed some permission labels if they are missing
  const permissions = [
    { key: 'users.read', label: 'View Users' },
    { key: 'users.manage', label: 'Manage Users' },
    { key: 'roles.read', label: 'View Roles' },
    { key: 'roles.manage', label: 'Manage Roles' },
    { key: 'resorts.read', label: 'View Resorts' },
    { key: 'resorts.create', label: 'Create Resorts' },
    { key: 'resorts.update', label: 'Update Resorts' },
    { key: 'resorts.delete', label: 'Delete Resorts' },
    { key: 'imports.read', label: 'View Imports' },
    { key: 'imports.create', label: 'Run Imports' }
  ];

  for (const perm of permissions) {
    try {
      await supabaseAdmin
        .from('permissions')
        .update({ label: perm.label })
        .eq('key', perm.key);
    } catch (e) {
      // Ignore
    }
  }
  
  console.log('[Seed] Metadata update completed.');
}

// Helper for classification with weighted scoring
const classifyMedia = (folderName: string, fileName: string, pageTitle: string = '', altText: string = '') => {
  const combined = `${folderName.toLowerCase()} ${fileName.toLowerCase()} ${pageTitle.toLowerCase()} ${altText.toLowerCase()}`;
  
  const categories = [
    {
      key: 'main_hero',
      keywords: [
        { word: 'hero', weight: 10 },
        { word: 'banner', weight: 10 },
        { word: 'cover', weight: 8 },
        { word: 'main', weight: 5 },
        { word: 'exterior', weight: 7 },
        { word: 'aerial', weight: 9 },
        { word: 'overview', weight: 4 },
        { word: 'resort-view', weight: 6 }
      ]
    },
    {
      key: 'room_types',
      keywords: [
        { word: 'room', weight: 8 },
        { word: 'villa', weight: 10 },
        { word: 'suite', weight: 10 },
        { word: 'residence', weight: 10 },
        { word: 'bedroom', weight: 9 },
        { word: 'accommodation', weight: 7 },
        { word: 'stay', weight: 5 },
        { word: 'living', weight: 6 },
        { word: 'interior', weight: 4 },
        { word: 'bathroom', weight: 7 }
      ]
    },
    {
      key: 'restaurants',
      keywords: [
        { word: 'dining', weight: 10 },
        { word: 'restaurant', weight: 10 },
        { word: 'bar', weight: 9 },
        { word: 'breakfast', weight: 8 },
        { word: 'lunch', weight: 8 },
        { word: 'dinner', weight: 8 },
        { word: 'culinary', weight: 7 },
        { word: 'food', weight: 9 },
        { word: 'drink', weight: 7 },
        { word: 'kitchen', weight: 6 },
        { word: 'buffet', weight: 8 },
        { word: 'wine', weight: 7 }
      ]
    },
    {
      key: 'spa',
      keywords: [
        { word: 'spa', weight: 10 },
        { word: 'wellness', weight: 10 },
        { word: 'treatment', weight: 9 },
        { word: 'massage', weight: 9 },
        { word: 'therapy', weight: 8 },
        { word: 'gym', weight: 7 },
        { word: 'fitness', weight: 7 },
        { word: 'yoga', weight: 8 },
        { word: 'sauna', weight: 9 },
        { word: 'steam', weight: 7 }
      ]
    },
    {
      key: 'activities',
      keywords: [
        { word: 'activity', weight: 10 },
        { word: 'experience', weight: 8 },
        { word: 'diving', weight: 10 },
        { word: 'snorkel', weight: 10 },
        { word: 'excursion', weight: 9 },
        { word: 'marine', weight: 7 },
        { word: 'dolphin', weight: 8 },
        { word: 'cruise', weight: 8 },
        { word: 'sport', weight: 7 },
        { word: 'kids', weight: 9 },
        { word: 'club', weight: 8 },
        { word: 'water-sport', weight: 10 },
        { word: 'surfing', weight: 9 },
        { word: 'fishing', weight: 8 }
      ]
    },
    {
      key: 'beaches',
      keywords: [
        { word: 'beach', weight: 10 },
        { word: 'sand', weight: 8 },
        { word: 'shore', weight: 7 },
        { word: 'coast', weight: 6 },
        { word: 'ocean', weight: 5 },
        { word: 'lagoon', weight: 7 }
      ]
    },
    {
      key: 'facilities',
      keywords: [
        { word: 'facility', weight: 10 },
        { word: 'pool', weight: 9 },
        { word: 'tennis', weight: 8 },
        { word: 'court', weight: 7 },
        { word: 'boutique', weight: 7 },
        { word: 'shop', weight: 6 },
        { word: 'library', weight: 8 },
        { word: 'reception', weight: 7 },
        { word: 'lobby', weight: 7 }
      ]
    },
    {
      key: 'maps',
      keywords: [
        { word: 'map', weight: 10 },
        { word: 'floorplan', weight: 10 },
        { word: 'floor plan', weight: 10 },
        { word: 'site plan', weight: 10 },
        { word: 'layout', weight: 9 },
        { word: 'location', weight: 5 },
        { word: 'plan', weight: 6 }
      ]
    },
    {
      key: 'logos',
      keywords: [
        { word: 'logo', weight: 10 },
        { word: 'brand', weight: 8 },
        { word: 'wordmark', weight: 10 },
        { word: 'emblem', weight: 9 },
        { word: 'asset', weight: 5 }
      ]
    }
  ];

  const subcategories = {
    'water villa': ['water villa', 'overwater', 'ocean villa', 'lagoon villa'],
    'beach villa': ['beach villa', 'sand villa', 'beachfront'],
    'residence': ['residence', 'estate', 'mansion', 'palace'],
    'suite': ['suite'],
    'deluxe room': ['deluxe'],
    'family room': ['family']
  };

  let bestCategory = 'uncategorized';
  let maxScore = 0;

  for (const cat of categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (combined.includes(kw.word)) {
        score += kw.weight;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat.key;
    }
  }

  let detectedSubcategory = null;
  for (const [sub, words] of Object.entries(subcategories)) {
    if (words.some(word => combined.includes(word))) {
      detectedSubcategory = sub;
      break;
    }
  }

  return { 
    category: bestCategory, 
    subcategory: detectedSubcategory,
    confidence: Math.min(maxScore / 20, 1.0) // Normalize confidence
  };
};

// --- Authentication & RBAC Helpers ---

/**
 * Extracts and validates the JWT from the Authorization header.
 * Returns the authenticated user object.
 */
async function getAuthenticatedUser(req: express.Request) {
  // Try custom headers first to avoid proxy interference, then fallback to standard Authorization
  const authHeader = req.headers['x-session-id'] as string || req.headers['x-app-auth'] as string || req.headers['x-app-authorization'] as string || req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Missing or invalid Authorization header. Headers:', JSON.stringify(req.headers));
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

/**
 * Fetches the user's effective permissions from the database.
 */
async function getUserPermissionsServerSide(userId: string) {
  // Check if super admin first
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('user_roles')
    .select('roles(key)')
    .eq('user_id', userId);

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    return [];
  }

  const isSuperAdmin = roles?.some((r: any) => r.roles.key === 'super_admin');
  if (isSuperAdmin) {
    // Super admins have all permissions
    const { data: allPerms } = await supabaseAdmin.from('permissions').select('key');
    return allPerms?.map(p => p.key) || [];
  }

  // Fetch specific permissions
  const { data: perms, error: permsError } = await supabaseAdmin
    .from('user_roles')
    .select('role_permissions(permissions(key))')
    .eq('user_id', userId);

  if (permsError) {
    console.error('Error fetching user permissions:', permsError);
    return [];
  }

  const permissionKeys = new Set<string>();
  perms?.forEach((ur: any) => {
    ur.role_permissions?.forEach((rp: any) => {
      if (rp.permissions?.key) {
        permissionKeys.add(rp.permissions.key);
      }
    });
  });

  return Array.from(permissionKeys);
}

/**
 * Middleware factory to require a specific permission.
 */
function requirePermission(permissionKey: string) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const user = await getAuthenticatedUser(req);
      const permissions = await getUserPermissionsServerSide(user.id);

      if (!permissions.includes(permissionKey)) {
        console.warn(`[RBAC] Forbidden: User ${user.id} missing ${permissionKey}`);
        return res.status(403).json({ error: `Forbidden: Missing permission ${permissionKey}` });
      }

      // Attach user to request for later use
      (req as any).user = user;
      next();
    } catch (error: any) {
      console.error(`[RBAC] Auth error for ${req.path}: ${error.message}`);
      res.status(401).json({ error: error.message });
    }
  };
}

async function startServer() {
  const app = express();
  console.log("--- STARTING SERVER WITH RBAC FIXES ---");
  
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Request logging for debugging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // --- Admin RBAC Endpoints (Moved up for priority) ---

  app.get("/api/admin/roles", requirePermission("roles.read"), async (req, res) => {
    try {
      if (!ensureAdminService(res)) return;

      const { data, error } = await supabaseAdmin
        .from("roles")
        .select("*, role_permissions(permission_id, permissions(key, label, description, module, action))")
        .order("label");

      if (error) throw error;

      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch roles" });
    }
  });

  app.get("/api/admin/users", requirePermission("users.read"), async (req, res) => {
    try {
      if (!ensureAdminService(res)) return;

      const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*, user_roles(role_id, roles(key, label, description))")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      const authUsers = await listAllAuthUsers();

      const combinedUsers = (authUsers || []).map((authUser: any) => {
        const profile = (profiles || []).find((p: any) => p.id === authUser.id);
        return {
          ...profile,
          id: authUser.id,
          email: authUser.email,
          full_name: profile?.full_name || authUser.user_metadata?.full_name || 'No Name',
          last_sign_in_at: authUser.last_sign_in_at || null,
          confirmed_at: authUser.confirmed_at || null,
          user_roles: profile?.user_roles || []
        };
      });

      res.json(combinedUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requirePermission("users.manage"), async (req, res) => {
    const { email, password, full_name, role_id } = req.body;

    try {
      if (!ensureAdminService(res)) return;

      if (!email || !password || !full_name) {
        return res.status(400).json({ error: "Email, password, and full name are required" });
      }

      if (!role_id) {
        return res.status(400).json({ error: "Initial role is required when creating a user" });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name })
        .eq("id", userId);

      if (profileError) throw profileError;

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role_id });

      if (roleError) throw roleError;

      res.json({ success: true, user: authData.user });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", requirePermission("users.manage"), async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, full_name } = req.body;

      // Update Auth
      if (email || password) {
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
        if (authError) throw authError;
      }

      // Update Profile
      if (full_name || email) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ full_name, email })
          .eq('id', id);
        if (profileError) throw profileError;
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('[Admin API] Error updating user:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/users/:id", requirePermission("users.manage"), async (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user;

    try {
      if (!ensureAdminService(res)) return;

      if (id === currentUser.id) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }

      const targetIsSuperAdmin = await isUserSuperAdmin(id);
      const superAdminCount = await getSuperAdminCount();

      if (targetIsSuperAdmin && superAdminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last super admin account" });
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  app.post("/api/admin/users/:id/roles", requirePermission("users.manage"), async (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;

    try {
      if (!ensureAdminService(res)) return;

      if (!role_id) {
        return res.status(400).json({ error: "role_id is required" });
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: id, role_id });

      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to assign role" });
    }
  });

  app.delete("/api/admin/users/:id/roles/:roleId", requirePermission("users.manage"), async (req, res) => {
    const { id, roleId } = req.params;
    const currentUser = (req as any).user;

    try {
      if (!ensureAdminService(res)) return;

      const { data: roleRow, error: roleRowError } = await supabaseAdmin
        .from("roles")
        .select("id, key")
        .eq("id", roleId)
        .single();

      if (roleRowError) throw roleRowError;

      if (roleRow.key === "super_admin") {
        const superAdminCount = await getSuperAdminCount();

        if (superAdminCount <= 1) {
          return res.status(400).json({ error: "Cannot remove the last super admin role" });
        }

        if (id === currentUser.id) {
          return res.status(400).json({ error: "You cannot remove your own super admin role" });
        }
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", id)
        .eq("role_id", roleId);

      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to remove role" });
    }
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Real-time Chat Logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    socket.on("send_message", (data) => {
      // data: { chatId, text, senderId, senderName }
      io.to(data.chatId).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.get("/api/debug/gemini-test", async (req, res) => {
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: "Gemini API key is missing or invalid." });
      }
      const genAI = new GoogleGenAI({ apiKey });
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: "Say OK" }] }],
      });
      res.json({ ok: true, text: result.text });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  await bootstrapInitialAdmin();
  await seedMetadata();

  // --- Generic Sync Endpoint to bypass WAF ---
  async function processResortPDF(base64Data: string, filename: string, batchId: string, skipDuplicates: boolean = false) {
    const apiKey = await getGeminiApiKey();
    
    const genAI = new GoogleGenAI(apiKey ? { apiKey } : {});
    const model = "gemini-3-flash-preview";
    const prompt = `
      Extract resort information from this PDF document. 
      Return a JSON object with the following fields:
      - name: string
      - location: string
      - atoll: string
      - description: string
      - category: string
      - transfer_type: string
      - meal_plans: string[]
      - room_types: object[] (name, description, max_guests, size)
      - highlights: string[]
      - seo_summary: string (short, luxury tone, human sounding, concise, suitable for listing/introduction)
    `;

    let result;
    try {
      result = await genAI.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              location: { type: Type.STRING },
              atoll: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              transfer_type: { type: Type.STRING },
              meal_plans: { type: Type.ARRAY, items: { type: Type.STRING } },
              room_types: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    max_guests: { type: Type.STRING },
                    size: { type: Type.STRING }
                  }
                } 
              },
              highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              seo_summary: { type: Type.STRING }
            }
          }
        }
      });
    } catch (error: any) {
      console.error("[Gemini API Error]", error);
      if (error.message && error.message.includes("API key not valid")) {
        throw new Error("Gemini API key is invalid. Please configure a valid GEMINI_API_KEY in the Settings menu.");
      }
      throw error;
    }

    const extracted = JSON.parse(result.text || '{}');
    
    // Improved Duplicate detection
    const resortName = extracted.name || '';
    const normalizedName = normalizeResortName(resortName);
    
    // Fetch existing resorts for comparison
    const { data: existingResorts } = await supabaseAdmin
      .from('resorts')
      .select('id, name, atoll, location');
    
    let duplicateCandidate = null;
    let confidence = 0.9;
    let isDefiniteDuplicate = false;

    if (existingResorts && existingResorts.length > 0) {
      for (const existing of existingResorts) {
        const existingNormalized = normalizeResortName(existing.name);
        
        // 1. Exact normalized name match
        if (existingNormalized === normalizedName) {
          duplicateCandidate = existing.id;
          isDefiniteDuplicate = true;
          confidence = 0.99;
          break;
        }
        
        // 2. Fuzzy match (contains)
        if (existingNormalized.includes(normalizedName) || normalizedName.includes(existingNormalized)) {
          // Check atoll/location to increase confidence
          const atollMatch = existing.atoll && extracted.atoll && 
            (existing.atoll.toLowerCase().includes(extracted.atoll.toLowerCase()) || 
             extracted.atoll.toLowerCase().includes(existing.atoll.toLowerCase()));
          
          if (atollMatch) {
            duplicateCandidate = existing.id;
            isDefiniteDuplicate = true;
            confidence = 0.95;
            break;
          } else {
            // Potential match but not certain
            if (!duplicateCandidate) {
              duplicateCandidate = existing.id;
              confidence = 0.7;
            }
          }
        }
      }
    }

    // If skipDuplicates is true and we found a definite duplicate, return early
    if (skipDuplicates && isDefiniteDuplicate) {
      console.log(`[Import] Skipping duplicate resort: ${resortName} (Matches existing ID: ${duplicateCandidate})`);
      return { 
        skipped: true, 
        reason: 'duplicate', 
        resortName, 
        existingId: duplicateCandidate 
      };
    }

    // Save to staging
    const { data: staging, error: stagingError } = await supabaseAdmin
      .from('resort_staging')
      .insert({
        import_batch_id: batchId,
        extracted_json: extracted,
        normalized_json: extracted,
        confidence_score: confidence,
        duplicate_candidate_resort_id: duplicateCandidate,
        review_status: 'pending'
      })
      .select()
      .single();

    if (stagingError) throw stagingError;

    // Update batch summary
    const { data: batch } = await supabaseAdmin.from('import_batches').select('summary_json').eq('id', batchId).single();
    const summary = batch?.summary_json || {};
    summary.resorts = summary.resorts || { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 };
    summary.resorts.total += 1;
    summary.resorts.pending += 1;
    
    await supabaseAdmin.from('import_batches').update({ summary_json: summary }).eq('id', batchId);

    return staging;
  }

  app.post("/api/v1/data/sync", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const permissions = await getUserPermissionsServerSide(user.id);
      if (!permissions.includes('imports.create')) {
        return res.status(403).json({ error: "Forbidden: Missing imports.create permission" });
      }

      const { payload } = req.body;
      if (!payload) return res.status(400).json({ error: "Missing payload" });

      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      const { action, data } = decoded;

      console.log(`[Sync] Action: ${action} for user: ${user.email}`);

      // Re-route based on action
      if (action === 'list') {
        req.query.folderId = data.folderId;
        return handleGList(req, res);
      } else if (action === 'import-drive-pdf') {
        req.body = data;
        return handleDrivePdfImport(req, res);
      } else if (action === 'import-url') {
        req.body = data;
        return handleUrlImport(req, res);
      } else if (action === 'import-local') {
        req.body = data;
        return handleLocalImport(req, res);
      } else if (action === 'fetch') {
        req.body = data;
        return handleGFetch(req, res);
      } else if (action === 'scrape') {
        req.body = data;
        return handleScrape(req, res);
      }

      res.status(400).json({ error: "Unknown action" });
    } catch (error: any) {
      console.error("[Sync] Error:", error);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/drive/list", async (req, res) => {
    const folderId = req.query.folderId as string;
    try {
      const auth = await getDriveAuth();
      const drive = google.drive({ version: "v3", auth });

      const response = await drive.files.list({
        q: `'${folderId || "root"}' in parents and trashed = false and mimeType = 'application/pdf'`,
        fields: "files(id, name, mimeType, size, thumbnailLink, webViewLink)",
      });

      res.json({ files: response.data.files || [] });
    } catch (err: any) {
      logDriveError("Drive List", err, { folderId });
      res.status(500).json({ error: err.message });
    }
  });

  async function handleGList(req: express.Request, res: express.Response) {
    const folderId = req.query.folderId as string;
    try {
      const auth = await getDriveAuth();
      const drive = google.drive({ version: "v3", auth });

      const response = await drive.files.list({
        q: `'${folderId || "root"}' in parents and trashed = false and mimeType = 'application/pdf'`,
        fields: "files(id, name, mimeType, size, thumbnailLink, webViewLink)",
      });

      res.json({ files: response.data.files || [] });
    } catch (err: any) {
      logDriveError("Sync List", err, { folderId });
      res.status(500).json({ error: err.message });
    }
  }

  async function handleDrivePdfImport(req: express.Request, res: express.Response) {
    const { fileId, filename, batchId, skipDuplicates } = req.body;
    try {
      const auth = await getDriveAuth();
      const drive = google.drive({ version: "v3", auth });

      const response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );

      const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
      const result = await processResortPDF(base64, filename, batchId, skipDuplicates);
      res.json(result);
    } catch (err: any) {
      logDriveError("Drive PDF Import", err, { fileId, filename });
      res.status(500).json({ error: err.message });
    }
  }

  async function handleUrlImport(req: express.Request, res: express.Response) {
    const { url, resort_id } = req.body;
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const images: any[] = [];
      
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt') || '';
        if (src && (src.startsWith('http') || src.startsWith('//'))) {
          const absoluteSrc = src.startsWith('//') ? `https:${src}` : src;
          const fileName = absoluteSrc.split('/').pop()?.split('?')[0] || 'image.jpg';
          const { category, subcategory } = classifyMedia('', fileName, $('title').text(), alt);
          
          images.push({
            source_url: absoluteSrc,
            storage_path: absoluteSrc, // Temporary until saved
            original_filename: fileName,
            category,
            subcategory,
            alt_text: alt
          });
        }
      });

      res.json({ 
        media: images,
        stats: { pages_scanned: 1, images_found: images.length }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async function handleLocalImport(req: express.Request, res: express.Response) {
    // This is mostly a placeholder as local files are handled by the client
    // but we might need it for server-side processing of large uploads
    res.json({ status: 'ok' });
  }

  async function handleGFetch(req: express.Request, res: express.Response) {
    const { fileId } = req.body;
    try {
      const auth = await getDriveAuth();
      const drive = google.drive({ version: "v3", auth });
      const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
      res.send(Buffer.from(response.data as ArrayBuffer));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async function handleScrape(req: express.Request, res: express.Response) {
    const { url } = req.body;
    try {
      const response = await axios.get(url);
      res.send(response.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  app.get("/api/ai/status", async (req, res) => {
    const apiKey = await getGeminiApiKey();
    res.json({ configured: !!apiKey });
  });

  app.post("/api/ai/generate-copy", async (req, res) => {
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is missing or invalid." });
      }
      const { resortData } = req.body;
      const genAI = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      const prompt = `
        You are a luxury travel copywriter for "Exciting Maldives", a B2B DMC.
        Generate a luxury marketing copy for the following resort:
        ${JSON.stringify(resortData)}
        
        Return a JSON object with:
        - luxury_description: string (3-4 paragraphs, evocative, professional)
        - unique_selling_points: string[] (5-7 points)
        - target_audience: string (who is this resort best for?)
      `;

      const result = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              luxury_description: { type: Type.STRING },
              unique_selling_points: { type: Type.ARRAY, items: { type: Type.STRING } },
              target_audience: { type: Type.STRING }
            }
          }
        }
      });

      res.json(JSON.parse(result.text || '{}'));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ai/classify-image", async (req, res) => {
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is missing or invalid." });
      }
      const { base64Image } = req.body;
      const genAI = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      const prompt = `
        Analyze this resort image and categorize it.
        Categories: main_hero, room_types, restaurants, spa, activities, beaches, facilities, maps, logos.
        Subcategories for rooms: water villa, beach villa, residence, suite, deluxe room, family room.
        
        Return JSON:
        {
          "category": "string",
          "subcategory": "string|null",
          "description": "short descriptive alt text"
        }
      `;

      const result = await genAI.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING, nullable: true },
              description: { type: Type.STRING }
            }
          }
        }
      });

      res.json(JSON.parse(result.text || '{}'));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 404 handler to prevent HTML fallback for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
