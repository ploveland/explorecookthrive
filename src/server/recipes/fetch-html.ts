import { ExtractError } from "./schema";
import { assertSafeHttpUrl } from "./ssrf";

const MAX_BYTES = 1_500_000;
const USER_AGENT = "ExploreCookThrive/0.1 (recipe import; +https://explorecookthrive.local)";

export async function fetchRecipeHtml(url: string, fetcher: typeof fetch = fetch): Promise<{
  finalUrl: string;
  html: string;
}> {
  const safe = await assertSafeHttpUrl(url);
  let current = safe.href;

  for (let hop = 0; hop < 4; hop += 1) {
    let response: Response;
    try {
      response = await fetcher(current, {
        redirect: "manual",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
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
      const next = new URL(location, current).href;
      await assertSafeHttpUrl(next);
      current = next;
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

    const html = await response.text();
    if (html.length > MAX_BYTES) {
      throw new ExtractError("fetch_failed", "That page is too large for us to read safely.");
    }

    return { finalUrl: current, html };
  }

  throw new ExtractError("fetch_failed", "That site redirected too many times.");
}
