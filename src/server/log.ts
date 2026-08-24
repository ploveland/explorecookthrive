type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | null | undefined>;

function emit(level: LogLevel, message: string, fields: LogFields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...sanitize(fields),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

const BLOCKED_KEYS = new Set([
  "recipe",
  "rawText",
  "instructions",
  "ingredients",
  "prompt",
  "system",
  "comment",
]);

function sanitize(fields: LogFields): LogFields {
  const next: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (BLOCKED_KEYS.has(key)) continue;
    next[key] = value;
  }
  return next;
}

export const log = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
