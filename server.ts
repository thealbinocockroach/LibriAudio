import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Gutenberg API Proxy
  app.get("/api/gutenberg/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      const gutUrl = `https://gutendex.com/books/?search=${encodeURIComponent(q)}`;
      const fetchRes = await fetch(gutUrl);
      const data = await fetchRes.json();
      res.json(data);
    } catch (err) {
      console.error("Gutendex search error:", err);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/gutenberg/text", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith("https://www.gutenberg.org/")) {
        return res.status(400).json({ error: "Invalid Gutenberg URL" });
      }
      
      const fetchRes = await fetch(url);
      const text = await fetchRes.text();
      res.send(text);
    } catch (err) {
      console.error("Gutenberg text fetch error:", err);
      res.status(500).json({ error: "Text fetch failed" });
    }
  });

  app.get("/api/proxy-audio", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
      }
      
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) {
        return res.status(fetchRes.status).send(fetchRes.statusText);
      }
      
      res.set('Content-Type', fetchRes.headers.get('content-type') || 'audio/mpeg');
      if (fetchRes.headers.has('content-length')) {
        res.set('Content-Length', fetchRes.headers.get('content-length')!);
      }
      
      const arrayBuffer = await fetchRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error("Audio proxy error:", err);
      res.status(500).json({ error: "Audio fetch failed" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support React Router SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
