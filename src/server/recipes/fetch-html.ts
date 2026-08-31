import { Agent, fetch as undiciFetch } from "undici";
import { isIP } from "node:net";
import { ExtractError } from "./schema";
import { assertSafeHttpUrl, type LookupAll, type SafeHttpTarget } from "./ssrf";

export const MAX_HTML_BYTES = 1_500_000;
export const MAX_REDIRECTS = 4;
export const CONNECT_TIMEOUT_MS = 5_000;
export const RESPONSE_TIMEOUT_MS = 10_000;

const USER_AGENT = "ExploreCookThrive/0.1 (recipe import; +https://explorecookthrive.local)";

export type PinnedRequest = (
  target: SafeHttpTarget,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

function tlsServername(hostname: string) {
  const unwrapped =
    hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  return isIP(unwrapped) ? undefined : hostname;
}

async function defaultPinnedRequest(
  target: SafeHttpTarget,
  init: { headers: Record<string, string>; signal: AbortSignal },
): Promise<Response> {
  const dispatcher = new Agent({
    connectTimeout: CONNECT_TIMEOUT_MS,
    headersTimeout: RESPONSE_TIMEOUT_MS,
    bodyTimeout: RESPONSE_TIMEOUT_MS,
    connect: {
      timeout: CONNECT_TIMEOUT_MS,
      servername: tlsServername(target.hostname),
      lookup(_hostname, options, callback) {
        const cb = typeof options === "function" ? options : callback;
        cb(null, target.pin.address, target.pin.family);
      },
    },
  });
  try {
    const response = await undiciFetch(target.href, {
      method: "GET",
      redirect: "manual",
      headers: init.headers,
      signal: init.signal,
      dispatcher,
    });
    return response as unknown as Response;
  } finally {
    await dispatcher.close();
  }
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ExtractError("fetch_failed", "That page is too large for us to read safely.");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new ExtractError("fetch_failed", "That page is too large for us to read safely.");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(concatBytes(chunks));
}

export async function fetchRecipeHtml(
  url: string,
  options: { lookup?: LookupAll; request?: PinnedRequest } = {},
): Promise<{ finalUrl: string; html: string }> {
  const lookup = options.lookup;
  const request = options.request ?? defaultPinnedRequest;
  let target = await assertSafeHttpUrl(url, lookup);

  for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
    let response: Response;
    try {
      response = await request(target, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": USER_AGENT,
          Host: target.host,
        },
        signal: AbortSignal.timeout(RESPONSE_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof ExtractError) throw error;
      throw new ExtractError(
        "fetch_failed",
        "We could not reach that page. You can paste the recipe instead.",
      );
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ExtractError("fetch_failed", "The site sent a redirect we could not follow.");
      }
      const next = new URL(location, target.href).href;
      target = await assertSafeHttpUrl(next, lookup);
      continue;
    }

    if (!response.ok) {
      throw new ExtractError(
        "fetch_failed",
        "That site did not let us read the recipe. Paste it below instead.",
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new ExtractError("not_a_recipe", "That link does not look like a recipe page.");
    }

    const html = await readLimitedBody(response, MAX_HTML_BYTES);
    return { finalUrl: target.href, html };
  }

  throw new ExtractError("fetch_failed", "That site redirected too many times.");
}
