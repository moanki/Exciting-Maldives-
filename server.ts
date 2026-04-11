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
import { Dropbox } from "dropbox";
import sizeOf from "image-size";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper for Google Drive Auth
async function getDriveAuth() {
  const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
  let credentials: any = null;
  let source = '';

  const fileExists = fs.existsSync(serviceAccountPath);
  const envExists = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (fileExists && envExists) {
    console.log("Note: Both service_account.json and GOOGLE_SERVICE_ACCOUNT_JSON exist. Preferring service_account.json.");
  }

  if (fileExists) {
    try {
      credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      source = 'service_account.json';
    } catch (e) {
      console.error("Failed to parse service_account.json:", e);
      throw new Error("Malformed service_account.json: Invalid JSON format.");
    }
  } else if (envExists) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
      source = 'GOOGLE_SERVICE_ACCOUNT_JSON environment variable';
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", e);
      throw new Error("Malformed GOOGLE_SERVICE_ACCOUNT_JSON: Invalid JSON format.");
    }
  } else if (process.env.GOOGLE_DRIVE_API_KEY) {
    console.log("Using GOOGLE_DRIVE_API_KEY for Drive authentication (fallback).");
    return process.env.GOOGLE_DRIVE_API_KEY;
  } else {
    throw new Error("No valid Google Drive service account credentials found (service_account.json or GOOGLE_SERVICE_ACCOUNT_JSON).");
  }

  // Validate Service Account structure
  if (credentials.type !== 'service_account') {
    throw new Error(`Invalid credential type in ${source}: Expected "service_account", got "${credentials.type}".`);
  }
  if (!credentials.client_email) {
    throw new Error(`Missing "client_email" in ${source}.`);
  }
  if (!credentials.private_key) {
    throw new Error(`Missing "private_key" in ${source}.`);
  }

  // Harden Private Key
  let privateKey = credentials.private_key.trim();
  
  // Remove accidental wrapping quotes if present (common when pasting into env vars)
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }

  // Replace literal \n with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  // Verify PEM markers
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error(`Invalid PEM format in ${source}: Missing BEGIN/END PRIVATE KEY markers.`);
  }

  console.log(`Google Drive Auth initialized successfully.`);
  console.log(`- Source: ${source}`);
  console.log(`- Project ID: ${credentials.project_id || 'N/A'}`);
  console.log(`- Client Email: ${credentials.client_email}`);

  return new JWT({
    email: credentials.client_email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

// Helper for classification
const classifyMedia = (folderName: string, fileName: string) => {
  const combined = `${folderName.toLowerCase()} ${fileName.toLowerCase()}`;
  
  // Priority keywords
  const keywords = {
    banner: ['hero', 'banner', 'cover', 'main', 'landing', 'exterior', 'aerial'],
    rooms: ['room', 'villa', 'suite', 'residence', 'bedroom', 'accommodation', 'stay', 'living'],
    dining: ['dining', 'restaurant', 'bar', 'breakfast', 'lunch', 'dinner', 'culinary', 'food', 'drink', 'kitchen'],
    spa: ['spa', 'wellness', 'treatment', 'massage', 'therapy', 'gym', 'fitness', 'yoga', 'pool'],
    activities: ['activity', 'experience', 'diving', 'snorkel', 'excursion', 'marine', 'dolphin', 'cruise', 'sport', 'kids', 'club'],
    maps: ['map', 'floorplan', 'floor plan', 'site plan', 'layout', 'location'],
    logos: ['logo', 'brand', 'wordmark', 'emblem', 'asset']
  };

  const subcategories = {
    'water villa': ['water villa', 'overwater', 'ocean villa'],
    'beach villa': ['beach villa', 'sand villa'],
    'residence': ['residence', 'estate', 'mansion'],
    'suite': ['suite'],
    'deluxe room': ['deluxe'],
    'family room': ['family']
  };

  let detectedCategory = 'uncategorized';
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(word => combined.includes(word))) {
      detectedCategory = cat;
      break;
    }
  }

  let detectedSubcategory = null;
  for (const [sub, words] of Object.entries(subcategories)) {
    if (words.some(word => combined.includes(word))) {
      detectedSubcategory = sub;
      break;
    }
  }

  return { category: detectedCategory, subcategory: detectedSubcategory };
};

// --- Authentication & RBAC Helpers ---

/**
 * Extracts and validates the JWT from the Authorization header.
 * Returns the authenticated user object.
 */
async function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
  app.use(express.json());
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
    res.json({ status: "ok" });
  });

  app.post("/api/scrape-resort", async (req, res) => {
    const { url, crawl } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const baseUrl = new URL(url).origin;
      const visited = new Set<string>();
      const images = new Set<string>();

      async function scrapePage(pageUrl: string) {
        if (visited.has(pageUrl) || visited.size > 5) return; // Limit to 5 pages
        visited.add(pageUrl);

        const { data } = await axios.get(pageUrl);
        const $ = cheerio.load(data);

        // Extract images
        $("img").each((_, el) => {
          const src = $(el).attr("src");
          if (src && src.startsWith("http")) {
            images.add(src);
          }
        });

        // If crawling enabled, find links
        if (crawl) {
          const links: string[] = [];
          $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (href) {
              const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
              if (fullUrl.startsWith(baseUrl)) {
                links.push(fullUrl);
              }
            }
          });
          
          // Crawl found links
          for (const link of links.slice(0, 3)) { // Limit to 3 links per page
            await scrapePage(link);
          }
        }
      }

      await scrapePage(url);
      
      // Simple filtering
      const filteredImages = Array.from(images).filter(img => !img.includes("logo") && !img.includes("icon"));
      res.json({ images: filteredImages.slice(0, 50) });
    } catch (error) {
      res.status(500).json({ error: "Failed to scrape URL" });
    }
  });

  app.post("/api/list-drive-pdfs", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      let folderId = null;
      const folderMatch = url.match(/folders\/([a-zA-Z0-9-_]+)/);
      if (folderMatch) {
        folderId = folderMatch[1];
      } else if (url.match(/^[a-zA-Z0-9-_]+$/)) {
        folderId = url;
      }

      if (!folderId) {
        return res.status(400).json({ error: "Invalid Google Drive folder URL or ID" });
      }

      const authClient = await getDriveAuth();
      const drive = google.drive({ version: 'v3', auth: authClient });
      const requestParams: any = {
        q: `'${folderId}' in parents and mimeType='application/pdf'`,
        fields: 'files(id, name)',
      };

      const listResponse = await drive.files.list(requestParams);
      res.json({ files: listResponse.data.files || [] });
    } catch (error: any) {
      console.error("Drive API list error:", error);
      res.status(500).json({ error: `Failed to list files from Google Drive: ${error.message}` });
    }
  });

  app.post("/api/fetch-drive-pdf", async (req, res) => {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: "File ID is required" });

    try {
      const authClient = await getDriveAuth();
      const drive = google.drive({ version: 'v3', auth: authClient });
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
      
      const chunks: Buffer[] = [];
      for await (const chunk of response.data) {
        chunks.push(Buffer.from(chunk));
      }
      res.json({ base64: Buffer.concat(chunks).toString('base64') });
    } catch (error: any) {
      console.error("Drive API fetch error:", error);
      res.status(500).json({ error: `Failed to download PDF from Google Drive: ${error.message}` });
    }
  });

  app.post("/api/import-media", async (req, res) => {
    const { url, resort_id } = req.body;
    if (!url || !resort_id) return res.status(400).json({ error: "URL and Resort ID are required" });

    try {
      console.log(`Importing media for resort ${resort_id} from ${url}`);
      
      // Dropbox Check
      const dropboxMatch = url.match(/dropbox\.com\/(sh|scl\/fo)\/([a-zA-Z0-9-_]+)/);
      if (dropboxMatch) {
        const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
        if (!accessToken) {
          return res.status(500).json({ error: "Dropbox access token missing. Please configure DROPBOX_ACCESS_TOKEN." });
        }
        
        const dbx = new Dropbox({ accessToken });
        const media: any[] = [];
        
        async function scanDropbox(sharedLink: string, path: string = "", currentCategory: string = 'uncategorized') {
          const response = await dbx.filesListFolder({
            path,
            shared_link: { url: sharedLink }
          });
          
          for (const entry of response.result.entries) {
            if (entry['.tag'] === 'folder') {
              const { category } = classifyMedia(entry.name, "");
              await scanDropbox(sharedLink, entry.path_lower || "", category !== 'uncategorized' ? category : currentCategory);
            } else if (entry['.tag'] === 'file' && /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(entry.name)) {
              // Get temporary link for the file
              const linkResponse = await dbx.sharingGetSharedLinkFile({
                url: sharedLink,
                path: entry.path_lower
              });
              
              const { category, subcategory } = classifyMedia(path, entry.name);
              media.push({
                id: entry.id,
                storage_path: url.replace('?dl=0', '?raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com') + '&path=' + encodeURIComponent(entry.path_lower || ""), // This is a bit hacky for dropbox shared links
                // Better way for dropbox shared links:
                webContentLink: url.replace('?dl=0', '?raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com') + '&path=' + encodeURIComponent(entry.path_lower || ""),
                category: category !== 'uncategorized' ? category : currentCategory,
                subcategory,
                original_filename: entry.name,
                source_type: 'dropbox',
                source_url: url
              });
            }
          }
        }
        
        // Dropbox shared links for folders are tricky. 
        // For now, let's use a simpler approach if it's a direct shared link to a folder.
        // The above recursive scan is more for a full app integration.
        // Let's try to just get the files in that shared link.
        const response = await dbx.filesListFolder({
          path: "",
          shared_link: { url }
        });
        
        for (const entry of response.result.entries) {
          if (entry['.tag'] === 'file' && /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(entry.name)) {
             const { category, subcategory } = classifyMedia("", entry.name);
             media.push({
                id: entry.id,
                storage_path: url.replace(/\?dl=[01]/, '') + '?raw=1&path=' + encodeURIComponent(entry.path_lower || ""),
                category,
                subcategory,
                original_filename: entry.name,
                source_type: 'dropbox',
                source_url: url
             });
          }
        }

        return res.json({ success: true, media, source_type: 'dropbox' });
      }

      // Google Drive Check
      let folderId = null;
      const folderMatch = url.match(/folders\/([a-zA-Z0-9-_]+)/);
      if (folderMatch) {
        folderId = folderMatch[1];
      } else if (url.match(/^[a-zA-Z0-9-_]+$/)) {
        folderId = url;
      }

      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      
      const fileId = fileMatch ? fileMatch[1] : (idMatch ? idMatch[1] : null);

      if (folderId || fileId) {
        try {
          const authClient = await getDriveAuth();
          const drive = google.drive({ version: 'v3', auth: authClient });
          
          if (folderId) {
            const media: any[] = [];
            
            async function scanFolder(fId: string, currentCategory: string = 'uncategorized', path: string = "") {
              const requestParams: any = {
                q: `'${fId}' in parents`,
                fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
              };

              const response = await drive.files.list(requestParams);
              const files = response.data.files || [];

              for (const file of files) {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                  const { category } = classifyMedia(file.name, "");
                  await scanFolder(file.id, category !== 'uncategorized' ? category : currentCategory, path + "/" + file.name);
                } else if (file.mimeType?.startsWith('image/')) {
                  const { category, subcategory } = classifyMedia(path, file.name);
                  media.push({
                    id: file.id,
                    storage_path: file.thumbnailLink?.replace('=s220', '=s1600') || file.webContentLink,
                    category: category !== 'uncategorized' ? category : currentCategory,
                    subcategory,
                    original_filename: file.name,
                    source_type: 'google_drive',
                    source_url: url
                  });
                }
              }
            }

            await scanFolder(folderId);
            return res.json({ success: true, media, source_type: 'google_drive' });
          } else if (fileId) {
            const requestParams: any = {
              fileId: fileId,
              fields: 'id, name, webContentLink, thumbnailLink',
            };

            const fileResponse = await drive.files.get(requestParams);
            const f = fileResponse.data;
            const { category, subcategory } = classifyMedia("", f.name || "");
            
            const media = [{
              id: f.id,
              storage_path: f.thumbnailLink?.replace('=s220', '=s1600') || f.webContentLink,
              category,
              subcategory,
              original_filename: f.name,
              source_type: 'google_drive',
              source_url: url
            }];
            
            return res.json({ success: true, media, source_type: 'google_drive' });
          }
        } catch (authError: any) {
          console.error("Drive Auth error in import-media:", authError.message);
          // Don't return yet, might fallback to scraping if it wasn't a drive link 
          // but here folderId/fileId matched so it likely was.
        }
      }
      
      // Fallback to scraping
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const images: any[] = [];
      $("img").each((i, el) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("http") && !src.includes("logo") && !src.includes("icon")) {
          const { category, subcategory } = classifyMedia("", path.basename(src));
          images.push({
            id: `scraped-${i}`,
            storage_path: src,
            category,
            subcategory,
            original_filename: path.basename(src),
            source_type: 'local_upload'
          });
        }
      });

      res.json({ success: true, media: images.slice(0, 20), source_type: 'local_upload' });
    } catch (error: any) {
      console.error("Import error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      res.status(500).json({ 
        error: "Failed to import media", 
        details: error.message,
        code: error.response?.status
      });
    }
  });

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

  app.post("/api/import/resort-pdf", (req, res, next) => requirePermission(req, res, next, 'imports.create'), async (req, res) => {
    const { batchId, base64Data, filename } = req.body;
    if (!base64Data || !batchId) return res.status(400).json({ error: "Batch ID and Base64 data are required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey === '') {
      return res.status(500).json({ error: "Gemini API key is missing or invalid." });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-1.5-pro";
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

      const extracted = JSON.parse(result.text || '{}');
      
      // Improved Duplicate detection
      // 1. Exact name match
      // 2. Slug-based match (simplified)
      const normalizedName = extracted.name?.toLowerCase().trim();
      
      const { data: existingResorts } = await supabaseAdmin
        .from('resorts')
        .select('id, name, atoll')
        .or(`name.ilike.${normalizedName},name.ilike.%${normalizedName}%`);
      
      let duplicateCandidate = null;
      let confidence = 0.9;

      if (existingResorts && existingResorts.length > 0) {
        // Find best match
        const exactMatch = existingResorts.find(r => r.name.toLowerCase() === normalizedName);
        if (exactMatch) {
          duplicateCandidate = exactMatch.id;
          confidence = 0.95;
        } else {
          duplicateCandidate = existingResorts[0].id;
          confidence = 0.7; // Fuzzy match
        }
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

      res.json(staging);
    } catch (error: any) {
      console.error('PDF extraction error:', error);
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
        staged_storage_path: item.storage_path,
        inferred_category_key: item.category,
        inferred_subcategory: item.subcategory,
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
    const model = "gemini-1.5-pro";
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
    const model = "gemini-1.5-pro";
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
    const model = "gemini-1.5-flash";
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
    res.json({ 
      configured: !!process.env.GEMINI_API_KEY,
      model: "gemini-1.5-pro/flash"
    });
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
