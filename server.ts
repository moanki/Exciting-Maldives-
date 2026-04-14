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

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("service_account.json not found in app root");
  }

  const key = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
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
 * Middleware to require a specific permission.
 */
async function requirePermission(req: express.Request, res: express.Response, next: express.NextFunction, permissionKey: string) {
  try {
    const user = await getAuthenticatedUser(req);
    const permissions = await getUserPermissionsServerSide(user.id);

    if (!permissions.includes(permissionKey)) {
      return res.status(403).json({ error: `Forbidden: Missing permission ${permissionKey}` });
    }

    // Attach user to request for later use
    (req as any).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

async function startServer() {
  const app = express();
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
      const apiKey = process.env.GEMINI_API_KEY;
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


  // --- Generic Sync Endpoint to bypass WAF ---
  async function processResortPDF(base64Data: string, filename: string, batchId: string, skipDuplicates: boolean = false) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[DEBUG] API Key prefix:", apiKey?.substring(0, 5));
    if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey === '') {
      throw new Error("Gemini API key is missing or invalid.");
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-3.1-pro-preview";
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
      const authClient = await getDriveAuth();
      const drive = google.drive({ version: "v3", auth: authClient as any });

      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`,
        fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      res.json({ files: response.data.files || [] });
    } catch (err: any) {
      logDriveError("Direct Drive List failed", err, { folderId });
      res.status(500).json({
        error: err.message,
        debug: serializeError(err),
      });
    }
  });

  app.post("/api/drive/import", async (req, res) => {
    const { batchId, fileId, filename, skipDuplicates = false } = req.body;

    if (!fileId || !batchId) {
      return res.status(400).json({ error: "Batch ID and File ID are required" });
    }

    try {
      const authClient = await getDriveAuth();
      const drive = google.drive({ version: "v3", auth: authClient as any });

      const driveResponse = await drive.files.get(
        {
          fileId,
          alt: "media",
          supportsAllDrives: true,
        },
        {
          responseType: "stream",
        }
      );

      const chunks: Buffer[] = [];
      for await (const chunk of driveResponse.data) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      const base64Data = buffer.toString("base64");

      const result = await processResortPDF(base64Data, filename, batchId, skipDuplicates);
      res.json(result);
    } catch (err: any) {
      logDriveError("Direct Drive Import failed", err, { fileId, filename, batchId });
      res.status(500).json({
        error: err.message,
        debug: serializeError(err),
      });
    }
  });

async function handleGList(req: any, res: any) {
  const folderId = req.query.folderId as string;

  try {
    const authClient = await getDriveAuth();
    const drive = google.drive({ version: "v3", auth: authClient as any });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`,
      fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    res.json({ files: response.data.files || [] });
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      debug: serializeError(err),
    });
  }
}

  async function handleGFetch(req: any, res: any) {
    try {
      const { fileId } = req.body;
      console.log(`[Drive Fetch] Fetching file: ${fileId}`);
      const authClient = await getDriveAuth();
      const drive = google.drive({ version: 'v3', auth: authClient as any });
      const response = await drive.files.get(
        {
          fileId,
          alt: "media",
          supportsAllDrives: true,
        },
        {
          responseType: "stream",
        }
      );
      response.data.pipe(res);
    } catch (error: any) {
      console.error("[Drive Fetch] Error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async function handleLocalImport(req: any, res: any) {
    try {
      const { batchId, base64Data, filename, skipDuplicates = false } = req.body;
      const result = await processResortPDF(base64Data, filename, batchId, skipDuplicates);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async function handleScrape(req: any, res: any) {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      const images = new Set<string>();
      
      $("img").each((i, el) => {
        const src = $(el).attr("src");
        if (src) {
          try {
            const absoluteUrl = new URL(src, url).toString();
            images.add(absoluteUrl);
          } catch (e) {}
        }
      });

      async function scrapePage(pageUrl: string) {
        try {
          const pageResponse = await axios.get(pageUrl, { timeout: 5000 });
          const page$ = cheerio.load(pageResponse.data);
          page$("img").each((i, el) => {
            const src = page$(el).attr("src");
            if (src) {
              try {
                const absoluteUrl = new URL(src, pageUrl).toString();
                images.add(absoluteUrl);
              } catch (e) {}
            }
          });
        } catch (e) {}
      }

      const links: string[] = [];
      $("a").each((i, el) => {
        const href = $(el).attr("href");
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).toString();
            if (absoluteUrl.startsWith(url) && !absoluteUrl.includes("#")) {
              links.push(absoluteUrl);
            }
          } catch (e) {}
        }
      });

      for (const link of links.slice(0, 3)) {
        await scrapePage(link);
      }
      
      const filteredImages = Array.from(images).filter(img => !img.includes("logo") && !img.includes("icon"));
      res.json({ images: filteredImages.slice(0, 50) });
    } catch (error) {
      res.status(500).json({ error: "Failed to scrape URL" });
    }
  }

async function handleDrivePdfImport(req: any, res: any) {
  const { batchId, fileId, filename, skipDuplicates = false } = req.body;

  if (!fileId || !batchId) {
    return res.status(400).json({ error: "Batch ID and File ID are required" });
  }

  try {
    const authClient = await getDriveAuth();
    const drive = google.drive({ version: "v3", auth: authClient as any });

    const driveResponse = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      {
        responseType: "stream",
      }
    );

    const chunks: Buffer[] = [];
    for await (const chunk of driveResponse.data) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    const base64Data = buffer.toString("base64");

    const result = await processResortPDF(base64Data, filename, batchId, skipDuplicates);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      debug: serializeError(err),
    });
  }
}

  async function handleUrlImport(req: any, res: any) {
    const { url, resort_id } = req.body;
    if (!url || !resort_id) return res.status(400).json({ error: "URL and Resort ID are required" });

    try {
      console.log(`[Smart Import] Starting import for resort ${resort_id} from ${url}`);
      
      const baseUrl = new URL(url);
      const visited = new Set<string>();
      const mediaMap = new Map<string, any>();
      const queue: { url: string; depth: number; categoryHint?: string }[] = [{ url, depth: 0 }];
      
      const MAX_DEPTH = 2;
      const MAX_PAGES = 15;
      const MAX_IMAGES = 100;

      // Provider Checks (Dropbox, GDrive)
      const dropboxMatch = url.match(/dropbox\.com\/(sh|scl\/fo)\/([a-zA-Z0-9-_]+)/);
      if (dropboxMatch) {
        const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
        if (!accessToken) {
          return res.status(500).json({ error: "Dropbox access token missing. Please configure DROPBOX_ACCESS_TOKEN." });
        }
        const dbx = new Dropbox({ accessToken });
        const response = await dbx.filesListFolder({ path: "", shared_link: { url } });
        const media = response.result.entries
          .filter(entry => entry['.tag'] === 'file' && /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(entry.name))
          .map(entry => {
            const { category, subcategory, confidence } = classifyMedia("", entry.name);
            return {
              id: (entry as any).id,
              storage_path: url.replace(/\?dl=[01]/, '') + '?raw=1&path=' + encodeURIComponent((entry as any).path_lower || ""),
              category,
              subcategory,
              confidence_score: confidence,
              original_filename: entry.name,
              source_type: 'dropbox',
              source_url: url
            };
          });
        return res.json({ success: true, media, source_type: 'dropbox' });
      }

      const driveMatch = url.match(/drive\.google\.com\/(?:drive\/folders\/|file\/d\/|open\?id=)([a-zA-Z0-9-_]+)/);
      if (driveMatch) {
        try {
          const authClient = await getDriveAuth();
          const drive = google.drive({ version: 'v3', auth: authClient as any });
          const id = driveMatch[1];
          
          // Check if it's a folder or file
          const metadata = await drive.files.get({
            fileId: id,
            fields: "mimeType,name",
            supportsAllDrives: true,
          });
          if (metadata.data.mimeType === 'application/vnd.google-apps.folder') {
            const media: any[] = [];
            const listResponse = await drive.files.list({
              q: `'${id}' in parents and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder')`,
              fields: "files(id,name,mimeType,webContentLink,thumbnailLink)",
              supportsAllDrives: true,
              includeItemsFromAllDrives: true,
            });
            
            for (const file of (listResponse.data as any).files || []) {
              if (file.mimeType?.startsWith('image/')) {
                const { category, subcategory, confidence } = classifyMedia("", file.name || "");
                media.push({
                  id: file.id,
                  storage_path: file.thumbnailLink?.replace('=s220', '=s1600') || file.webContentLink,
                  category,
                  subcategory,
                  confidence_score: confidence,
                  original_filename: file.name,
                  source_type: 'google_drive',
                  source_url: url
                });
              }
            }
            return res.json({ success: true, media, source_type: 'google_drive' });
          } else {
            const { category, subcategory, confidence } = classifyMedia("", (metadata.data as any).name || "");
            const media = [{
              id: id,
              storage_path: `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
              category,
              subcategory,
              confidence_score: confidence,
              original_filename: (metadata.data as any).name,
              source_type: 'google_drive',
              source_url: url
            }];
            return res.json({ success: true, media, source_type: 'google_drive' });
          }
        } catch (e) {
          console.warn("[Smart Import] Drive API failed, falling back to scraping if possible", e);
        }
      }

      // Smart Crawling Logic
      while (queue.length > 0 && visited.size < MAX_PAGES && mediaMap.size < MAX_IMAGES) {
        const { url: currentUrl, depth, categoryHint } = queue.shift()!;
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        try {
          console.log(`[Smart Import] Fetching: ${currentUrl} (Depth: ${depth})`);
          const response = await axios.get(currentUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 10000
          });

          const $ = cheerio.load(response.data);
          const pageTitle = $("title").text();

          // Check if it's a directory listing (Apache/Nginx)
          const isDirectoryListing = pageTitle.includes("Index of") || $("h1").text().includes("Index of");

          // 1. Extract Images
          if (isDirectoryListing) {
            console.log(`[Smart Import] Detected directory listing at ${currentUrl}`);
            $("a").each((_, el) => {
              const href = $(el).attr("href");
              if (href && /\.(jpg|jpeg|png|webp|avif)$/i.test(href)) {
                try {
                  const src = new URL(href, currentUrl).href;
                  const fileName = path.basename(new URL(src).pathname);
                  const { category, subcategory, confidence } = classifyMedia(categoryHint || "", fileName, pageTitle, "");
                  
                  if (!mediaMap.has(src)) {
                    mediaMap.set(src, {
                      id: `scraped-${mediaMap.size}`,
                      storage_path: src,
                      category,
                      subcategory,
                      confidence_score: confidence,
                      original_filename: fileName,
                      source_type: 'url_import',
                      source_url: currentUrl
                    });
                  }
                } catch (e) {}
              }
            });
          }

          $("img").each((_, el) => {
            let src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
            if (!src) return;

            // Resolve relative URLs
            try {
              src = new URL(src, currentUrl).href;
            } catch (e) { return; }

            // Filter out obvious non-resort images
            if (src.includes("logo") || src.includes("icon") || src.includes("avatar") || src.includes("pixel") || src.includes("tracking")) return;
            if (src.endsWith(".svg") || src.endsWith(".gif")) return;

            const alt = $(el).attr("alt") || "";
            const fileName = path.basename(new URL(src).pathname);
            
            // Classification
            const { category, subcategory, confidence } = classifyMedia(categoryHint || "", fileName, pageTitle, alt);
            
            if (!mediaMap.has(src)) {
              mediaMap.set(src, {
                id: `scraped-${mediaMap.size}`,
                storage_path: src,
                category,
                subcategory,
                confidence_score: confidence,
                original_filename: fileName,
                source_type: 'url_import',
                source_url: currentUrl
              });
            }
          });

          // 2. Discover Links (if depth < MAX_DEPTH)
          if (depth < MAX_DEPTH) {
            $("a").each((_, el) => {
              let href = $(el).attr("href");
              if (!href) return;

              try {
                const absoluteHref = new URL(href, currentUrl);
                // Stay on same domain
                if (absoluteHref.hostname !== baseUrl.hostname) return;
                
                const linkText = $(el).text().toLowerCase();
                const linkHref = absoluteHref.href.toLowerCase();
                
                // Heuristics for gallery/folder links
                const galleryKeywords = ['gallery', 'photo', 'media', 'image', 'album', 'resort', 'villa', 'room', 'dining', 'restaurant', 'spa', 'activity', 'experience'];
                const isLikelyGallery = galleryKeywords.some(kw => linkText.includes(kw) || linkHref.includes(kw));
                
                if (isLikelyGallery && !visited.has(absoluteHref.href)) {
                  // Determine hint from link text
                  let hint = '';
                  if (linkText.includes('room') || linkText.includes('villa')) hint = 'room_types';
                  else if (linkText.includes('dining') || linkText.includes('restaurant')) hint = 'restaurants';
                  else if (linkText.includes('spa')) hint = 'spa';
                  else if (linkText.includes('activity')) hint = 'activities';

                  queue.push({ url: absoluteHref.href, depth: depth + 1, categoryHint: hint });
                }
              } catch (e) {}
            });
          }
        } catch (err) {
          console.warn(`[Smart Import] Failed to fetch ${currentUrl}:`, err instanceof Error ? err.message : String(err));
        }
      }

      const finalMedia = Array.from(mediaMap.values());
      console.log(`[Smart Import] Finished. Found ${finalMedia.length} images across ${visited.size} pages.`);

      res.json({ 
        success: true, 
        media: finalMedia, 
        source_type: 'url_import',
        stats: {
          pages_scanned: visited.size,
          images_found: finalMedia.length
        }
      });
    } catch (error: any) {
      console.error("[Smart Import] Fatal error:", error);
      res.status(500).json({ 
        error: "Failed to import media", 
        details: error.message
      });
    }
  }



  app.get("/api/proxy-image", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).send("URL required");
    
    try {
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      res.set("Content-Type", response.headers["content-type"]);
      res.send(response.data);
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      res.status(500).send("Failed to proxy image");
    }
  });

  // User Management Endpoints
  app.get("/api/admin/users", (req, res, next) => requirePermission(req, res, next, 'users.read'), async (req, res) => {
    try {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*, user_roles(role_id, roles(key, label))')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch auth user data for each profile to get email and last sign in
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      const combinedUsers = profiles.map(profile => {
        const authUser = authUsers.find(u => u.id === profile.id);
        return {
          ...profile,
          email: authUser?.email,
          last_sign_in_at: authUser?.last_sign_in_at,
          confirmed_at: authUser?.confirmed_at
        };
      });

      res.json(combinedUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", (req, res, next) => requirePermission(req, res, next, 'users.manage'), async (req, res) => {
    const { email, password, full_name, role_id } = req.body;
    
    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;
      const userId = authData.user.id;

      // 2. Update Profile (Profile is usually created via trigger, but let's ensure full_name)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ full_name })
        .eq('id', userId);
      
      if (profileError) throw profileError;

      // 3. Assign Initial Role if provided
      if (role_id) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role_id });
        if (roleError) throw roleError;
      }

      res.json({ success: true, user: authData.user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/users/:id", (req, res, next) => requirePermission(req, res, next, 'users.manage'), async (req, res) => {
    const { id } = req.params;
    const { email, password, full_name } = req.body;
    
    try {
      // 1. Update Auth User
      const authUpdates: any = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
        if (authError) throw authError;
      }

      // 2. Update Profile
      if (full_name) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ full_name })
          .eq('id', id);
        if (profileError) throw profileError;
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", (req, res, next) => requirePermission(req, res, next, 'users.manage'), async (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (id === currentUser.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users/:id/roles", (req, res, next) => requirePermission(req, res, next, 'users.manage'), async (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;
    
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: id, role_id });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:id/roles/:roleId", (req, res, next) => requirePermission(req, res, next, 'users.manage'), async (req, res) => {
    const { id, roleId } = req.params;
    
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', id)
        .eq('role_id', roleId);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/roles", (req, res, next) => requirePermission(req, res, next, 'roles.read'), async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('*, role_permissions(permission_id, permissions(key, label))')
        .order('label');

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk Import Endpoints
  app.post("/api/import/create-batch", (req, res, next) => requirePermission(req, res, next, 'imports.create'), async (req, res) => {
    const { batch_type, source_type, source_ref } = req.body;
    const user = (req as any).user;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('import_batches')
        .insert({
          batch_type,
          source_type,
          source_ref,
          status: 'ingested',
          created_by: user.id,
          summary_json: {
            resorts: { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 },
            media: { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 }
          }
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  app.post("/api/import/media-to-staging", (req, res, next) => requirePermission(req, res, next, 'imports.create'), async (req, res) => {
    const { batchId, mediaItems, resortStagingId, targetResortId } = req.body;
    
    try {
      const stagingItems = mediaItems.map((item: any) => ({
        import_batch_id: batchId,
        resort_staging_id: resortStagingId,
        target_resort_id: targetResortId,
        original_filename: item.original_filename,
        original_url: item.source_url,
        staged_storage_path: item.url || item.storage_path,
        inferred_category_key: item.category,
        inferred_subcategory: item.subcategory,
        inferred_room_type_name: item.room_type_name,
        confidence_score: 0.85,
        review_status: 'pending'
      }));

      const { data, error } = await supabaseAdmin
        .from('media_staging')
        .insert(stagingItems)
        .select();

      if (error) throw error;

      // Update batch summary
      const { data: batch } = await supabaseAdmin.from('import_batches').select('summary_json').eq('id', batchId).single();
      const summary = batch?.summary_json || {};
      summary.media = summary.media || { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 };
      summary.media.total += stagingItems.length;
      summary.media.pending += stagingItems.length;
      
      await supabaseAdmin.from('import_batches').update({ summary_json: summary }).eq('id', batchId);

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/import/publish-batch", (req, res, next) => requirePermission(req, res, next, 'imports.publish'), async (req, res) => {
    const { batchId } = req.body;
    const user = (req as any).user;
    
    try {
      // 1. Get approved resorts that haven't been published
      const { data: approvedResorts, error: resError } = await supabaseAdmin
        .from('resort_staging')
        .select('*')
        .eq('import_batch_id', batchId)
        .eq('review_status', 'approved')
        .is('published_at', null);

      if (resError) throw resError;

      const publishResults = [];
      const errorLog = [];

      for (const staged of approvedResorts) {
        try {
          let resortId = staged.duplicate_candidate_resort_id;
          
          if (resortId) {
            // Update existing
            const { error: updateError } = await supabaseAdmin.from('resorts').update({
              ...staged.normalized_json,
              status: 'published'
            }).eq('id', resortId);
            if (updateError) throw updateError;
          } else {
            // Create new
            const { data: newResort, error: insertError } = await supabaseAdmin.from('resorts').insert({
              ...staged.normalized_json,
              status: 'published'
            }).select().single();
            if (insertError) throw insertError;
            resortId = newResort.id;
          }

          // Update staging status and published_at
          await supabaseAdmin.from('resort_staging').update({ 
            review_status: 'approved',
            published_at: new Date().toISOString(),
            reviewer_id: user.id
          }).eq('id', staged.id);
          
          publishResults.push({ type: 'resort', id: resortId, stagingId: staged.id });
        } catch (err: any) {
          errorLog.push({ type: 'resort', id: staged.id, error: err.message });
        }
      }

      // 2. Get approved media that haven't been published
      const { data: approvedMedia, error: mediaError } = await supabaseAdmin
        .from('media_staging')
        .select('*')
        .eq('import_batch_id', batchId)
        .eq('review_status', 'approved')
        .is('published_at', null);

      if (mediaError) throw mediaError;

      for (const staged of approvedMedia) {
        try {
          // Find target resort ID
          let targetResortId = staged.target_resort_id;
          if (!targetResortId && staged.resort_staging_id) {
            // If it was part of a resort import, find the published resort ID
            const resMatch = publishResults.find(r => r.stagingId === staged.resort_staging_id);
            if (resMatch) targetResortId = resMatch.id;
            else {
              // Check if it was already published in a previous run
              const { data: prevResort } = await supabaseAdmin.from('resort_staging').select('duplicate_candidate_resort_id, published_at').eq('id', staged.resort_staging_id).single();
              if (prevResort?.published_at) {
                // If we don't have the ID from the new insert, we might need to find it
                // This is a bit complex, but for now we'll assume targetResortId should be set if approved
              }
            }
          }

          if (targetResortId) {
            const categoryKey = staged.reviewer_override_category_key || staged.inferred_category_key || 'uncategorized';
            
            // Ensure category exists
            const { data: cat } = await supabaseAdmin
              .from('resort_media_categories')
              .select('id')
              .eq('resort_id', targetResortId)
              .eq('key', categoryKey)
              .maybeSingle();

            let categoryId = cat?.id;
            if (!categoryId) {
              const { data: newCat } = await supabaseAdmin.from('resort_media_categories').insert({
                resort_id: targetResortId,
                key: categoryKey,
                label: categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              }).select().single();
              categoryId = newCat?.id;
            }

            const { error: mediaInsertError } = await supabaseAdmin.from('resort_media').insert({
              resort_id: targetResortId,
              category: categoryKey,
              category_id: categoryId,
              subcategory: staged.reviewer_override_subcategory || staged.inferred_subcategory,
              room_type_name: staged.reviewer_override_room_type_name || staged.inferred_room_type_name,
              storage_path: staged.staged_storage_path,
              original_filename: staged.original_filename,
              source_url: staged.original_url,
              import_batch_id: batchId,
              status: 'active'
            });

            if (mediaInsertError) throw mediaInsertError;

            // Update staging status and published_at
            await supabaseAdmin.from('media_staging').update({ 
              review_status: 'approved',
              published_at: new Date().toISOString(),
              reviewer_id: user.id
            }).eq('id', staged.id);
          } else {
            throw new Error("Target resort ID missing for media item");
          }
        } catch (err: any) {
          errorLog.push({ type: 'media', id: staged.id, error: err.message });
        }
      }

      // 3. Update batch summary and status
      const { data: allResorts } = await supabaseAdmin.from('resort_staging').select('review_status, published_at').eq('import_batch_id', batchId);
      const { data: allMedia } = await supabaseAdmin.from('media_staging').select('review_status, published_at').eq('import_batch_id', batchId);

      const summary = {
        resorts: {
          total: allResorts?.length || 0,
          pending: allResorts?.filter(r => r.review_status === 'pending').length || 0,
          approved: allResorts?.filter(r => r.review_status === 'approved' && !r.published_at).length || 0,
          rejected: allResorts?.filter(r => r.review_status === 'rejected').length || 0,
          published: allResorts?.filter(r => r.published_at).length || 0
        },
        media: {
          total: allMedia?.length || 0,
          pending: allMedia?.filter(m => m.review_status === 'pending').length || 0,
          approved: allMedia?.filter(m => m.review_status === 'approved' && !m.published_at).length || 0,
          rejected: allMedia?.filter(m => m.review_status === 'rejected').length || 0,
          published: allMedia?.filter(m => m.published_at).length || 0
        }
      };

      let finalStatus = 'published';
      if (summary.resorts.pending > 0 || summary.media.pending > 0) finalStatus = 'reviewing';
      else if (summary.resorts.approved > 0 || summary.media.approved > 0) finalStatus = 'partially_approved';
      if (errorLog.length > 0 && summary.resorts.published === 0 && summary.media.published === 0) finalStatus = 'failed';

      await supabaseAdmin.from('import_batches').update({ 
        status: finalStatus,
        summary_json: summary,
        error_log_json: errorLog
      }).eq('id', batchId);

      res.json({ 
        success: errorLog.length === 0, 
        publishedCount: publishResults.length + (approvedMedia?.length || 0) - errorLog.filter(e => e.type === 'media').length,
        errors: errorLog
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ai/extract-resort-pdf", async (req, res) => {
    const { base64Data } = req.body;
    if (!base64Data) return res.status(400).json({ error: "Base64 data is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey === '') {
      return res.status(500).json({ error: "Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in the Settings menu." });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-3.1-pro-preview";
    const prompt = `
      Extract resort information from this PDF document. 
      Return a JSON object with the following fields. IMPORTANT: Keep all descriptions concise to prevent output truncation.
      - name: string
      - location: string
      - atoll: string
      - description: string (luxury tone, maximum 3 sentences)
      - category: string (e.g., Ultra-Luxury, Luxury, Premium)
      - transfer_type: string (e.g., Seaplane, Speedboat)
      - meal_plans: string[] (maximum 5 items)
      - room_types: object[] (name, description (maximum 1 sentence), max_guests, size. Maximum 10 room types total)
      - highlights: string[] (key selling points, maximum 8 items)
    `;

    try {
      const result = await genAI.models.generateContent({
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

      res.json(JSON.parse(result.text || '{}'));
    } catch (error: any) {
      console.error('PDF extraction error:', error);
      if (error.message && error.message.includes("API key not valid")) {
        return res.status(500).json({ error: "Gemini API key is invalid. Please configure a valid GEMINI_API_KEY in the Settings menu." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-resort-marketing", async (req, res) => {
    const { resortData } = req.body;
    if (!resortData) return res.status(400).json({ error: "Resort data is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey === '') {
      return res.status(500).json({ error: "Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in the Settings menu." });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-3.1-pro-preview";
    const prompt = `
      You are a luxury travel copywriter for "Exciting Maldives", a B2B DMC. 
      Create high-end marketing copy for the following resort:
      Name: ${resortData.name}
      Location: ${resortData.location} (${resortData.atoll})
      Category: ${resortData.category}
      Features: ${resortData.highlights?.join(', ')}
      Meal Plans: ${resortData.meal_plans?.join(', ')}

      Return a JSON object with:
      - marketing_hook: A one-sentence punchy headline for travel agents.
      - unique_selling_points: 3-5 bullet points focusing on B2B value.
      - luxury_description: A 2-paragraph evocative description for a brochure.
      - ideal_for: Who is the target client? (e.g., Honeymooners, Multi-gen families, Divers).
    `;

    try {
      const result = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marketing_hook: { type: Type.STRING },
              unique_selling_points: { type: Type.ARRAY, items: { type: Type.STRING } },
              luxury_description: { type: Type.STRING },
              ideal_for: { type: Type.STRING }
            }
          }
        }
      });

      res.json(JSON.parse(result.text || '{}'));
    } catch (error: any) {
      console.error('Marketing copy generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/classify-image", async (req, res) => {
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ error: "Base64 image is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey === '') {
      return res.status(500).json({ error: "Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in the Settings menu." });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze this image of a Maldives resort and classify it into one of these categories:
      - main_hero (exterior shots, aerials, main pool, landing)
      - room_types (bedrooms, bathrooms, villa interiors)
      - restaurants (dining areas, food, bars)
      - spa (wellness areas, gym, massage rooms)
      - activities (diving, excursions, kids club)
      - maps (site plans, floor plans)
      - logos (brand logos)
      - beaches (beach shots, ocean views)

      Return a JSON object with:
      - category: The chosen category key.
      - subcategory: A more specific label if applicable (e.g., "Water Villa", "Italian Restaurant").
      - description: A brief alt-text description.
    `;

    try {
      const result = await genAI.models.generateContent({
        model,
        contents: [
          { 
            role: 'user', 
            parts: [
              { text: prompt }, 
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
            ] 
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      });

      res.json(JSON.parse(result.text || '{}'));
    } catch (error: any) {
      console.error('Image classification error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai/status", (req, res) => {
    console.log("[AI Status] Request received");
    res.json({ 
      configured: !!process.env.GEMINI_API_KEY,
      model: "gemini-3.1-pro-preview/gemini-3-flash-preview"
    });
  });

  // 404 handler for API routes (must be before Vite/Static middleware)
  app.all("/api/*", (req, res) => {
    console.warn(`[API 404] ${req.method} ${req.path}`);
    res.status(404).json({ 
      error: "API route not found", 
      method: req.method, 
      path: req.path 
    });
  });

  // Global API Error Handler to ensure JSON responses
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      details: err.details || null,
      path: req.path
    });
  });

  app.get("/api/debug/drive-test", async (req, res) => {
    const folderId = req.query.folderId as string;

    try {
      const authClient = await getDriveAuth();
      const drive = google.drive({ version: "v3", auth: authClient as any });

      if (!folderId) {
        return res.json({
          ok: true,
          message: "Auth works. Pass folderId to test folder access."
        });
      }

      const folder = await drive.files.get({
        fileId: folderId,
        fields: "id,name,mimeType,driveId,parents",
        supportsAllDrives: true,
      });

      const filesResult = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id,name,mimeType,driveId,parents)",
        pageSize: 20,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      res.json({
        ok: true,
        folder: folder.data,
        files: filesResult.data.files || [],
      });
    } catch (err: any) {
      logDriveError("Drive Debug Test failed", err, { folderId });
      res.status(500).json({
        ok: false,
        error: err.message,
        debug: serializeError(err),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
