import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ExtractError } from "./schema";

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

function isPrivateIPv4(ip: string) {
  return PRIVATE_V4.some((pattern) => pattern.test(ip));
}

function isPrivateIPv6(ip: string) {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

function isBlockedHostname(hostname: string) {
  const host = hostname.replace(/\.+$/, "").toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.includes("metadata.google.internal")
  );
}

export type SafeUrl = {
  href: string;
  hostname: string;
};

export async function assertSafeHttpUrl(input: string): Promise<SafeUrl> {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new ExtractError("invalid_url", "That does not look like a web address.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new ExtractError("invalid_url", "Recipe links need to start with http or https.");
  }
  if (parsed.username || parsed.password) {
    throw new ExtractError("blocked_url", "We cannot open links that include credentials.");
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new ExtractError("blocked_url", "We cannot open that address.");
  }

  const host = parsed.hostname;
  if (isIP(host)) {
    if (isPrivateIPv4(host) || isPrivateIPv6(host)) {
      throw new ExtractError("blocked_url", "We cannot open that address.");
    }
    return { href: parsed.href, hostname: host };
  }

  try {
    const addresses = await lookup(host, { all: true });
    if (addresses.length === 0) {
      throw new ExtractError("fetch_failed", "We could not resolve that site.");
    }
    for (const address of addresses) {
      if (isPrivateIPv4(address.address) || isPrivateIPv6(address.address)) {
        throw new ExtractError("blocked_url", "We cannot open that address.");
      }
    }
  } catch (error) {
    if (error instanceof ExtractError) throw error;
    throw new ExtractError("fetch_failed", "We could not resolve that site.");
  }

  return { href: parsed.href, hostname: host };
}
