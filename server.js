import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pg from "pg";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Set it in your hosting provider's environment settings.");
  process.exit(1);
}
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

app.disable("x-powered-by");
app.set("trust proxy", 1); // Render terminates HTTPS at its edge proxy.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "https://videos.pexels.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: isProduction ? { maxAge: 15552000, includeSubDomains: true } : false
}));
app.use(express.json({ limit: "20kb", type: "application/json" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many enquiries from this connection. Please wait a little and try again." }
});

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional().default(""),
  interest: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(5000),
  consent: z.union([z.boolean(), z.string()]).transform(v => v === true || v === "true" || v === "on"),
  website: z.string().max(300).optional().default("")
}).strict();

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.post("/api/enquiries", enquiryLimiter, async (req, res) => {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the required fields and try again." });
  const data = parsed.data;
  // Honeypot catches simple automated spam; return a generic success to avoid tipping bots off.
  if (data.website) return res.status(201).json({ ok: true });
  if (!data.consent) return res.status(400).json({ error: "Please confirm the privacy consent before sending." });
  try {
    await pool.query(
      `INSERT INTO enquiries (full_name, email, company, interest, message, consent, status)
       VALUES ($1, $2, $3, $4, $5, TRUE, 'new')`,
      [data.name, data.email.toLowerCase(), data.company || null, data.interest, data.message]
    );
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Enquiry storage failed:", error?.code || "database_error");
    return res.status(500).json({ error: "We could not save your enquiry right now. Please contact AfriBridge by WhatsApp or email." });
  }
});

app.use(express.static(__dirname, {
  extensions: ["html"],
  dotfiles: "deny",
  index: "index.html",
  setHeaders(res, filePath) {
    if (/\.(?:html)$/.test(filePath)) res.setHeader("Cache-Control", "no-cache");
    if (/\.(?:css|js|svg|png|jpe?g|webp|woff2?)$/.test(filePath)) res.setHeader("Cache-Control", "public, max-age=86400");
  }
}));
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Endpoint not found." });
  return res.status(404).sendFile(path.join(__dirname, "404.html"));
});

const schema = `
CREATE TABLE IF NOT EXISTS enquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  company VARCHAR(160),
  interest VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT FALSE CHECK (consent = TRUE),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','replied','closed','spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);
`;
let server;
async function start() {
  // Create the initial table/indexes on first boot. Keep schema.sql for review/version control.
  await pool.query(schema);
  server = app.listen(port, "0.0.0.0", () => console.log(`AfriBridge listening on port ${port}`));
}
async function shutdown() {
  if (server) server.close(async () => { await pool.end(); process.exit(0); });
  else { await pool.end(); process.exit(0); }
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
start().catch(async error => {
  console.error("AfriBridge startup failed:", error?.code || "startup_error");
  await pool.end();
  process.exit(1);
});
