import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

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
      const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
      const folderId = match ? match[1] : null;

      if (!folderId) {
        return res.status(400).json({ error: "Invalid Google Drive folder URL" });
      }

      let auth: any;
      const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
      if (fs.existsSync(serviceAccountPath)) {
        auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountPath,
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
      } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
          auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
          });
        } catch (e) {
          console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON (list):", e);
          return res.status(500).json({ error: "Invalid GOOGLE_SERVICE_ACCOUNT_JSON format." });
        }
      } else if (process.env.GOOGLE_DRIVE_API_KEY) {
        auth = process.env.GOOGLE_DRIVE_API_KEY;
      } else {
        console.error("Google Drive credentials missing (list). Checked: service_account.json, GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_API_KEY");
        return res.status(500).json({ error: "Google Drive credentials not found. Please configure them in the Settings menu." });
      }

      const drive = google.drive({ version: 'v3', auth: typeof auth === 'string' ? undefined : auth });
      const requestParams: any = {
        q: `'${folderId}' in parents and mimeType='application/pdf'`,
        fields: 'files(id, name)',
      };
      if (typeof auth === 'string') {
        requestParams.key = auth;
      }

      const listResponse = await drive.files.list(requestParams);

      const files = listResponse.data.files || [];
      res.json({ files });
    } catch (error: any) {
      console.error("Drive API list error:", error);
      res.status(500).json({ error: `Failed to list files from Google Drive: ${error.message}` });
    }
  });

  app.post("/api/fetch-drive-pdf", async (req, res) => {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: "File ID is required" });

    try {
      let auth: any;
      const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
      if (fs.existsSync(serviceAccountPath)) {
        auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountPath,
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
      } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
          auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
          });
        } catch (e) {
          console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON (fetch):", e);
          return res.status(500).json({ error: "Invalid GOOGLE_SERVICE_ACCOUNT_JSON format." });
        }
      } else if (process.env.GOOGLE_DRIVE_API_KEY) {
        auth = process.env.GOOGLE_DRIVE_API_KEY;
      } else {
        console.error("Google Drive credentials missing (fetch). Checked: service_account.json, GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_API_KEY");
        return res.status(500).json({ error: "Google Drive credentials not found. Please configure them in the Settings menu." });
      }

      const drive = google.drive({ version: 'v3', auth: typeof auth === 'string' ? undefined : auth });
      const requestParams: any = { fileId: fileId, alt: 'media' };
      if (typeof auth === 'string') {
        requestParams.key = auth;
      }

      const response = await drive.files.get(
        requestParams,
        { responseType: 'stream' }
      );
      
      const chunks: Buffer[] = [];
      for await (const chunk of response.data) {
        chunks.push(Buffer.from(chunk));
      }
      const base64 = Buffer.concat(chunks).toString('base64');
      
      res.json({ base64 });
    } catch (error: any) {
      console.error("Drive API fetch error:", error);
      res.status(500).json({ error: "Failed to download PDF from Google Drive." });
    }
  });

  app.post("/api/import-media", async (req, res) => {
    const { url, resort_id } = req.body;
    if (!url || !resort_id) return res.status(400).json({ error: "URL and Resort ID are required" });

    try {
      console.log(`Importing media for resort ${resort_id} from ${url}`);
      
      // If it's a Google Drive folder or file
      const folderMatch = url.match(/folders\/([a-zA-Z0-9-_]+)/);
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      
      const folderId = folderMatch ? folderMatch[1] : null;
      const fileId = fileMatch ? fileMatch[1] : (idMatch ? idMatch[1] : null);

      if (folderId || fileId) {
        let auth: any;
        const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
        if (fs.existsSync(serviceAccountPath)) {
          auth = new google.auth.GoogleAuth({
            keyFile: serviceAccountPath,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
          });
        } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
          try {
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            auth = new google.auth.GoogleAuth({
              credentials,
              scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            });
          } catch (e) {
            console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON (import):", e);
          }
        } else if (process.env.GOOGLE_DRIVE_API_KEY) {
          auth = process.env.GOOGLE_DRIVE_API_KEY;
        }

        if (auth) {
          const drive = google.drive({ version: 'v3', auth: typeof auth === 'string' ? undefined : auth });
          
          if (folderId) {
            const requestParams: any = {
              q: `'${folderId}' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/webp')`,
              fields: 'files(id, name, webContentLink, thumbnailLink)',
            };
            if (typeof auth === 'string') {
              requestParams.key = auth;
            }

            const listResponse = await drive.files.list(requestParams);
            
            const files = listResponse.data.files || [];
            const media = files.map(f => ({
              id: f.id,
              storage_path: f.thumbnailLink?.replace('=s220', '=s1000') || f.webContentLink,
              category: 'villa',
              original_filename: f.name
            }));
            
            return res.json({ success: true, media });
          } else if (fileId) {
            const requestParams: any = {
              fileId: fileId,
              fields: 'id, name, webContentLink, thumbnailLink',
            };
            if (typeof auth === 'string') {
              requestParams.key = auth;
            }

            const fileResponse = await drive.files.get(requestParams);
            
            const f = fileResponse.data;
            const media = [{
              id: f.id,
              storage_path: f.thumbnailLink?.replace('=s220', '=s1000') || f.webContentLink,
              category: 'villa',
              original_filename: f.name
            }];
            
            return res.json({ success: true, media });
          }
        } else {
          console.warn("Google Drive import attempted but no credentials found.");
        }
      }
      
      // Fallback to scraping if not a drive folder
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const images: any[] = [];
      $("img").each((i, el) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("http") && !src.includes("logo") && !src.includes("icon")) {
          images.push({
            id: `scraped-${i}`,
            storage_path: src,
            category: 'villa'
          });
        }
      });

      res.json({ success: true, media: images.slice(0, 20) });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import media" });
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
