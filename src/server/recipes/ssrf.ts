import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";
import { ExtractError } from "./schema";

export type LookupAddress = { address: string; family: 4 | 6 };
export type LookupAll = (hostname: string) => Promise<LookupAddress[]>;

export type SafeHttpTarget = {
  href: string;
  hostname: string;
  host: string;
  pin: LookupAddress;
};

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
  "kubernetes.default",
  "kubernetes.default.svc",
  "kubernetes.default.svc.cluster.local",
]);

async function defaultLookup(hostname: string): Promise<LookupAddress[]> {
  const addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => ({
    address: entry.address,
    family: entry.family === 6 ? 6 : 4,
  }));
}

export function isBlockedIp(ip: string): boolean {
  try {
    return ipaddr.process(ip).range() !== "unicast";
  } catch {
    return true;
  }
}

export function isBlockedHostname(hostname: string) {
  const host = hostname.replace(/\.+$/, "").toLowerCase();
  if (!host) return true;
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost")) return true;
  if (host.endsWith(".local")) return true;
  if (host.endsWith(".internal")) return true;
  if (host.endsWith(".corp")) return true;
  if (host.endsWith(".lan")) return true;
  if (host.endsWith(".home")) return true;
  if (host.includes("metadata.google.internal")) return true;
  return false;
}

function unwrapIpLiteral(hostname: string): string | null {
  const candidate =
    hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  return isIP(candidate) ? candidate : null;
}

function pinFamily(ip: string): 4 | 6 {
  return isIP(ip) === 6 ? 6 : 4;
}

export async function assertSafeHttpUrl(
  input: string,
  lookupFn: LookupAll = defaultLookup,
): Promise<SafeHttpTarget> {
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
  const ipLiteral = unwrapIpLiteral(host);
  if (ipLiteral) {
    if (isBlockedIp(ipLiteral)) {
      throw new ExtractError("blocked_url", "We cannot open that address.");
    }
    return {
      href: parsed.href,
      hostname: host,
      host: parsed.host,
      pin: { address: ipLiteral, family: pinFamily(ipLiteral) },
    };
  }

  let addresses: LookupAddress[];
  try {
    addresses = await lookupFn(host);
  } catch (error) {
    if (error instanceof ExtractError) throw error;
    throw new ExtractError("fetch_failed", "We could not resolve that site.");
  }

  if (addresses.length === 0) {
    throw new ExtractError("fetch_failed", "We could not resolve that site.");
  }

  for (const entry of addresses) {
    if (isBlockedIp(entry.address) || isBlockedHostname(entry.address)) {
      throw new ExtractError("blocked_url", "We cannot open that address.");
    }
  }

  return {
    href: parsed.href,
    hostname: host,
    host: parsed.host,
    pin: addresses[0]!,
  };
}
