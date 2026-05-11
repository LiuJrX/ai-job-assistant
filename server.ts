import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync, rmSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const GUIDANCE_PATH = path.join(__dirname, "投递岗位标准.md");
const BACKEND_DIR = path.join(__dirname, "backend");
const BACKEND_PYTHON = path.join(BACKEND_DIR, ".venv", "bin", "python");
const RUN_BOT_SCRIPT = path.join(BACKEND_DIR, "run_bot.py");
const SETTINGS_PATH = path.join(DATA_DIR, "runtime-settings.json");
const BOSS_AUTH_DIR = path.join(BACKEND_DIR, "auth", "boss");
const BOSS_STORAGE_STATE_PATH = path.join(BOSS_AUTH_DIR, "storage_state.json");

type DeliveryGuidance = {
  markdown: string;
  updatedAt: string | null;
};

type RuntimeSettings = {
  webhookEnabled: boolean;
  webhookUrl: string;
  apiBaseUrl: string;
  aiModel: string;
  apiKey: string;
};

type StartOptions = {
  cities?: string[];
  aiFiltering?: boolean;
  maxJobsPerPlatform?: number;
  maxCityCount?: number;
  maxKeywordCount?: number;
  executionMode?: string;
  queryOverride?: string;
};

const GUIDANCE_DEFAULT = `# 投递评价

在这里直接写你的内容。`;

const SETTINGS_DEFAULT: RuntimeSettings = {
  webhookEnabled: true,
  webhookUrl: "",
  apiBaseUrl: "",
  aiModel: "gpt-4o-mini",
  apiKey: "",
};

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function loadGuidance(): Promise<DeliveryGuidance> {
  if (!existsSync(GUIDANCE_PATH)) {
    return {
      markdown: GUIDANCE_DEFAULT,
      updatedAt: null,
    };
  }

  const [markdown, fileStat] = await Promise.all([readFile(GUIDANCE_PATH, "utf8"), stat(GUIDANCE_PATH)]);
  return {
    markdown,
    updatedAt: fileStat.mtime.toISOString(),
  };
}

async function saveGuidance(markdown: string): Promise<DeliveryGuidance> {
  const trimmed = markdown.trim() || GUIDANCE_DEFAULT;
  await writeFile(GUIDANCE_PATH, trimmed, "utf8");
  const fileStat = await stat(GUIDANCE_PATH);
  return {
    markdown: trimmed,
    updatedAt: fileStat.mtime.toISOString(),
  };
}

async function loadSettings(): Promise<RuntimeSettings> {
  if (!existsSync(SETTINGS_PATH)) {
    return SETTINGS_DEFAULT;
  }

  const raw = await readFile(SETTINGS_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<RuntimeSettings>;
  return {
    ...SETTINGS_DEFAULT,
    ...parsed,
  };
}

async function saveSettings(payload: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
  const nextValue = {
    ...(await loadSettings()),
    ...payload,
  };
  await writeFile(SETTINGS_PATH, JSON.stringify(nextValue, null, 2), "utf8");
  return nextValue;
}

async function runBackendBot(options: StartOptions, settings: RuntimeSettings) {
  if (!existsSync(BACKEND_PYTHON)) {
    throw new Error("Python backend virtualenv is missing. Run `uv sync` inside /backend first.");
  }

  const { stdout, stderr } = await execFileAsync(BACKEND_PYTHON, [RUN_BOT_SCRIPT], {
    cwd: BACKEND_DIR,
    env: {
      ...process.env,
      JOB_REQUEST_JSON: JSON.stringify(options),
      JOB_SELECTED_CITIES_JSON: JSON.stringify(options.cities ?? []),
      AI_API_KEY: settings.apiKey,
      AI_MODEL: settings.aiModel,
      AI_BASE_URL: settings.apiBaseUrl,
      WEBHOOK_ENABLED: String(settings.webhookEnabled),
      WEBHOOK_URL: settings.webhookUrl,
    },
    maxBuffer: 10 * 1024 * 1024,
  });

  if (stderr?.trim()) {
    console.error(stderr);
  }

  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const jsonLine = lines[lines.length - 1];
  return JSON.parse(jsonLine);
}

async function loadBossCookieStatus(settings: RuntimeSettings) {
  const hasCookie = existsSync(BOSS_STORAGE_STATE_PATH);
  if (!hasCookie) {
    return {
      hasCookie: false,
      updatedAt: null,
      sessionValid: false,
      status: "cookie_missing",
      message: "还没有获取 Cookie",
      authDir: BOSS_AUTH_DIR,
    };
  }

  const payload = await runBackendBot(
    {
      executionMode: "session_status",
      maxCityCount: 1,
      maxKeywordCount: 1,
    },
    settings,
  ).catch((error) => ({
    success: false,
    status: "cookie_invalid",
    message: error instanceof Error ? error.message : "Cookie status check failed",
    logs: [],
  }));

  const updatedAt = hasCookie ? (await stat(BOSS_STORAGE_STATE_PATH)).mtime.toISOString() : null;
  return {
    hasCookie,
    updatedAt,
    sessionValid: Boolean(payload?.success),
    status: payload?.status ?? (hasCookie ? "cookie_unknown" : "cookie_missing"),
    message: payload?.message ?? (hasCookie ? "已检测到 Cookie 文件" : "还没有获取 Cookie"),
    authDir: BOSS_AUTH_DIR,
  };
}

async function startServer() {
  await ensureDataDir();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  app.get("/api/status", async (req, res) => {
    const [guidance, settings] = await Promise.all([loadGuidance(), loadSettings()]);
    const cookieStatus = await loadBossCookieStatus(settings);
    res.json({
      status: "ready",
      message: "Boss guidance document API is active",
      python_ready: existsSync(BACKEND_PYTHON),
      environment: "Local Node + Python Execution",
      guidance_ready: Boolean(guidance.markdown.trim()),
      ai_ready: Boolean(settings.apiBaseUrl && settings.aiModel && settings.apiKey),
      cookie_ready: cookieStatus.sessionValid,
    });
  });

  app.post("/api/start", async (req, res) => {
    try {
      const settings = await loadSettings();
      const { cities, aiFiltering, maxJobsPerPlatform, queryOverride } = req.body as StartOptions;
      const payload = await runBackendBot(
        {
          executionMode: "search",
          cities,
          aiFiltering,
          maxJobsPerPlatform,
          maxCityCount: 1,
          maxKeywordCount: 1,
          queryOverride,
        },
        settings,
      );
      res.status(payload.success === false ? 400 : 200).json(payload);
    } catch (error) {
      console.error("Start failed:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Backend execution failed",
      });
    }
  });

  app.get("/api/profile-center", async (req, res) => {
    const guidance = await loadGuidance();
    res.json({ guidance });
  });

  app.get("/api/profile-center/guidance", async (req, res) => {
    const guidance = await loadGuidance();
    res.json(guidance);
  });

  app.get("/api/settings", async (req, res) => {
    const settings = await loadSettings();
    res.json(settings);
  });

  app.put("/api/settings", async (req, res) => {
    const settings = await saveSettings(req.body as Partial<RuntimeSettings>);
    res.json({ success: true, settings });
  });

  app.put("/api/profile-center/guidance", async (req, res) => {
    const { markdown } = req.body as { markdown?: string };
    const guidance = await saveGuidance(String(markdown ?? ""));
    res.json({ success: true, guidance });
  });

  app.get("/api/boss/cookie-status", async (req, res) => {
    const settings = await loadSettings();
    const status = await loadBossCookieStatus(settings);
    res.json(status);
  });

  app.post("/api/boss/cookie/refresh", async (req, res) => {
    try {
      const settings = await loadSettings();
      const payload = await runBackendBot(
        {
          executionMode: "auth",
          maxCityCount: 1,
          maxKeywordCount: 1,
        },
        settings,
      );
      const status = await loadBossCookieStatus(settings);
      res.json({ success: true, payload, status });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Cookie refresh failed",
      });
    }
  });

  app.delete("/api/boss/cookie", async (req, res) => {
    rmSync(BOSS_AUTH_DIR, { recursive: true, force: true });
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
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
