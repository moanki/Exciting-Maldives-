import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import fs from "fs";

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

      let auth;
      const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
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
        console.error("Google Drive credentials missing (list). Checked: service-account.json, GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_API_KEY");
        return res.status(500).json({ error: "Google Drive credentials not found. Please configure them in the Settings menu." });
      }

      const drive = google.drive({ version: 'v3', auth });

      const listResponse = await drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/pdf'`,
        fields: 'files(id, name)',
      });

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
      let auth;
      const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
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
        console.error("Google Drive credentials missing (fetch). Checked: service-account.json, GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_API_KEY");
        return res.status(500).json({ error: "Google Drive credentials not found. Please configure them in the Settings menu." });
      }

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.get(
        { fileId: fileId, alt: 'media' },
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
      // Placeholder: In a real implementation, this would trigger a background job
      // to process the URL based on its type (Google Drive, Dropbox, etc.)
      console.log(`Importing media for resort ${resort_id} from ${url}`);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({ success: true, message: "Import started" });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to start import" });
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
