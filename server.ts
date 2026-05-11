import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock API routes for the Job Assistant
  app.get("/api/status", (req, res) => {
    res.json({ 
      status: "ready",
      message: "Python Backend (Simulation Mode) is active",
      python_ready: false,
      environment: "AI Studio Preview"
    });
  });

  app.post("/api/start", (req, res) => {
    const { keywords, cities, platforms } = req.body;
    console.log("Starting job hunt with:", { keywords, cities, platforms });
    res.json({ 
      success: true, 
      message: "Bot simulation started. Checkout /backend folder for Python source code.",
      jobId: "job_" + Math.random().toString(36).substr(2, 9)
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Keep dev mode on a single HTTP listener to avoid extra websocket ports
        // in restricted environments.
        hmr: false,
      },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
