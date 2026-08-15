import type { RequestHandler } from "express";

const builtInDesktopOrigins = new Set(["tauri://localhost", "http://tauri.localhost"]);

function configuredOrigins(raw = process.env.ARCA_DESKTOP_CORS_ORIGINS ?? "") {
  return raw.split(",").map(origin => origin.trim()).filter(origin => origin.startsWith("https://"));
}

function isDevelopmentLocalhost(origin: string, isDevelopment: boolean) {
  if (!isDevelopment) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

/** Only public desktop traffic uses this policy. No credentials are exposed cross-origin. */
export function isDesktopCorsOriginAllowed(origin: string | undefined, rawOrigins?: string, isDevelopment = process.env.NODE_ENV === "development") {
  if (!origin) return true;
  return builtInDesktopOrigins.has(origin)
    || configuredOrigins(rawOrigins).includes(origin)
    || isDevelopmentLocalhost(origin, isDevelopment);
}

export const desktopPublicCors: RequestHandler = (req, res, next) => {
  const origin = req.header("Origin");
  if (!isDesktopCorsOriginAllowed(origin)) {
    if (req.method === "OPTIONS") {
      res.status(403).json({ error: "desktop origin not allowed" });
      return;
    }
    next();
    return;
  }
  if (origin) {
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
};
