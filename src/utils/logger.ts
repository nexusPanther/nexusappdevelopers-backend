import pino from "pino";
import pinoHttp from "pino-http";
import pretty from "pino-pretty";
import fs from "fs";
import path from "path";
import { Writable } from "stream";

const isProduction = process.env.NODE_ENV === "production";

export interface ParsedLogEntry {
  id: string;
  timestamp: string;
  timeMs: number;
  level: number;
  levelLabel: "debug" | "info" | "warn" | "error" | "fatal";
  type: "http" | "app";
  msg: string;
  req?: {
    id?: string | number;
    method?: string;
    url?: string;
    remoteAddress?: string;
  };
  res?: {
    statusCode?: number;
  };
  responseTime?: number;
  err?: any;
  details?: Record<string, any>;
}

const MAX_LOG_ENTRIES = 1000;
const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

const logBuffer: ParsedLogEntry[] = [];
let logCounter = 0;

const mapLevelLabel = (level: number): ParsedLogEntry["levelLabel"] => {
  if (level >= 60) return "fatal";
  if (level >= 50) return "error";
  if (level >= 40) return "warn";
  if (level >= 30) return "info";
  return "debug";
};

const parseRawPinoLine = (line: string): ParsedLogEntry | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const raw = JSON.parse(trimmed);
    const timeMs = typeof raw.time === "number" ? raw.time : Date.now();
    const level = typeof raw.level === "number" ? raw.level : 30;
    const isHttp = Boolean(raw.req || raw.res || raw.responseTime !== undefined);

    const {
      level: _l,
      time: _t,
      pid: _p,
      hostname: _h,
      msg,
      req,
      res,
      responseTime,
      err,
      ...rest
    } = raw;

    logCounter += 1;
    return {
      id: `${timeMs}-${logCounter}`,
      timestamp: new Date(timeMs).toISOString(),
      timeMs,
      level,
      levelLabel: mapLevelLabel(level),
      type: isHttp ? "http" : "app",
      msg: msg || (isHttp && req ? `${req.method} ${req.url}` : "Log event"),
      ...(req ? { req } : {}),
      ...(res ? { res } : {}),
      ...(responseTime !== undefined ? { responseTime } : {}),
      ...(err ? { err } : {}),
      ...(Object.keys(rest).length > 0 ? { details: rest } : {}),
    };
  } catch {
    return null;
  }
};

// Load persisted logs from disk on startup
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (fs.existsSync(LOG_FILE)) {
    const content = fs.readFileSync(LOG_FILE, "utf8");
    const lines = content.split("\n").filter(Boolean);
    const recentLines = lines.slice(-MAX_LOG_ENTRIES);
    for (const line of recentLines) {
      const parsed = parseRawPinoLine(line);
      if (parsed) {
        logBuffer.push(parsed);
      }
    }
  }
} catch {
  // Ignore file read errors on startup
}

const prettyStream = !isProduction
  ? pretty({
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    })
  : null;

const captureStream = new Writable({
  write(chunk, _encoding, callback) {
    const str = chunk.toString();

    // Forward to console (pretty in dev, raw JSON in prod)
    if (prettyStream) {
      prettyStream.write(str);
    } else {
      process.stdout.write(str);
    }

    // Store in memory buffer and append to log file
    const lines = str.split("\n").filter(Boolean);
    for (const line of lines) {
      const parsed = parseRawPinoLine(line);
      if (parsed) {
        logBuffer.push(parsed);
        if (logBuffer.length > MAX_LOG_ENTRIES) {
          logBuffer.shift();
        }
      }
      try {
        fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
      } catch {
        // Ignore disk write errors
      }
    }

    callback();
  },
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    hooks: {
      logMethod(inputArgs, method) {
        if (inputArgs.length >= 2 && typeof inputArgs[0] === "string") {
          const [msg, ...rest] = inputArgs;
          const firstArg: unknown = rest[0];
          const payload =
            rest.length === 1 && firstArg instanceof Error
              ? { err: firstArg }
              : rest.length === 1 && typeof firstArg === "object" && firstArg !== null
                ? firstArg
                : { err: rest.length === 1 ? firstArg : rest };
          return method.apply(this, [payload as any, msg]);
        }
        return method.apply(this, inputArgs);
      },
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']",
        "password",
        "token",
      ],
      censor: "[REDACTED]",
    },
  },
  captureStream
);

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => {
      const url = req.url || "";
      return url.includes("/api/admin/logs") || url.includes("/api/logs");
    },
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

export const getRecentLogs = () => {
  // Return newest first
  return [...logBuffer].reverse();
};

export const clearStoredLogs = () => {
  logBuffer.length = 0;
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, "", "utf8");
    }
  } catch {
    // Ignore file errors
  }
};

export default logger;
