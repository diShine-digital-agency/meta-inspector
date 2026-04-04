import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
import { URL } from "url";

/**
 * Fetches a URL following redirects (up to 10 hops).
 * Returns { html, finalUrl, statusCode, headers, redirectChain, timing }.
 */
export async function fetchUrl(url, options = {}) {
  const { maxRedirects = 10, timeout = 15000, userAgent = null } = options;

  const redirectChain = [];
  let currentUrl = url;
  let hops = 0;
  const startTime = Date.now();

  while (hops < maxRedirects) {
    const result = await singleFetch(currentUrl, { timeout, userAgent });

    if (result.statusCode >= 300 && result.statusCode < 400 && result.headers.location) {
      redirectChain.push({ url: currentUrl, statusCode: result.statusCode });
      // Resolve relative redirects
      currentUrl = new URL(result.headers.location, currentUrl).href;
      hops++;
      continue;
    }

    return {
      html: result.body,
      finalUrl: currentUrl,
      statusCode: result.statusCode,
      headers: result.headers,
      redirectChain,
      timing: Date.now() - startTime,
    };
  }

  throw new Error(`Too many redirects (${maxRedirects})`);
}

function singleFetch(url, { timeout, userAgent }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqFn = parsed.protocol === "https:" ? httpsRequest : httpRequest;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "User-Agent": userAgent || "Mozilla/5.0 (compatible; meta-inspector/1.0; +https://github.com/diShine-digital-agency/meta-inspector)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
      },
      timeout,
    };

    const req = reqFn(reqOptions, (res) => {
      // For redirects, don't bother reading the full body
      if (res.statusCode >= 300 && res.statusCode < 400) {
        res.resume();
        resolve({ statusCode: res.statusCode, headers: res.headers, body: "" });
        return;
      }

      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf-8"),
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeout}ms`));
    });
    req.end();
  });
}
