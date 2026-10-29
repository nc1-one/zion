// Server-only website survey: fetches a visitor's home page and pulls out the
// facts the agent needs. Only public http(s) hosts are fetched.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { ScanResult } from "./types";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

export function normalizeUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.port && url.port !== "80" && url.port !== "443") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = address.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb")) return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateAddress(mapped[1]) : false;
}

async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (/(^|\.)(localhost|local|internal|lan|home|corp)$/i.test(host)) throw new Error("That address isn't a public website.");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error("That address isn't a public website.");
  }
}

async function fetchPage(start: URL): Promise<{ finalUrl: URL; html: string; ms: number; bytes: number }> {
  let url = start;
  const began = Date.now();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "ZionAgent/1.0 (+https://zionsystems.dev; scoping assessment)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("The site redirected without saying where.");
      const next = new URL(location, url);
      if (next.protocol !== "http:" && next.protocol !== "https:") throw new Error("The site redirected somewhere we can't read.");
      url = next;
      continue;
    }
    if (!res.ok) throw new Error(`The site answered with an error (${res.status}).`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new Error("That address doesn't return a web page.");

    const reader = res.body?.getReader();
    if (!reader) throw new Error("The site returned an empty page.");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      bytes += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return { finalUrl: url, html, ms: Date.now() - began, bytes };
  }
  throw new Error("The site redirected too many times.");
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

const meta = (html: string, name: string) => {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content) : undefined;
};

function detectPlatform(html: string): string | undefined {
  const generator = meta(html, "generator");
  if (generator) return generator.split(/\s+\d/)[0].slice(0, 60);
  if (/wp-content|wp-includes/i.test(html)) return "WordPress";
  if (/static\.wixstatic|wix\.com/i.test(html)) return "Wix";
  if (/squarespace/i.test(html)) return "Squarespace";
  if (/cdn\.shopify|Shopify\.theme/i.test(html)) return "Shopify";
  if (/webflow/i.test(html)) return "Webflow";
  if (/__NEXT_DATA__|\/_next\/static/i.test(html)) return "Next.js";
  if (/data-reactroot|react-dom/i.test(html)) return "React";
  if (/ng-version/i.test(html)) return "Angular";
  if (/__NUXT__/i.test(html)) return "Nuxt";
  if (/Drupal/i.test(html)) return "Drupal";
  if (/Joomla/i.test(html)) return "Joomla";
  return undefined;
}

export async function scanWebsite(input: string): Promise<ScanResult> {
  const url = normalizeUrl(input);
  if (!url) return { ok: false, url: input.slice(0, 500), error: "That doesn't look like a website address." };

  try {
    const { finalUrl, html, ms, bytes } = await fetchPage(url);
    const host = finalUrl.hostname.replace(/^www\./, "");

    const images = html.match(/<img\b[^>]*>/gi) ?? [];
    const missingAlt = images.filter((img) => !/\balt=["'][^"']+["']/i.test(img)).length;
    const links = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
    const internal = new Set(
      links.filter((href) => {
        try {
          return new URL(href, finalUrl).hostname.replace(/^www\./, "") === host;
        } catch {
          return false;
        }
      }),
    );
    const headings = [...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
      .map((m) => decode(m[1].replace(/<[^>]+>/g, " ")))
      .filter((h) => h.length > 1)
      .slice(0, 12)
      .map((h) => h.slice(0, 160));
    const body = html
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ");

    return {
      ok: true,
      url: url.toString(),
      finalUrl: finalUrl.toString(),
      title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 200) || undefined,
      description: (meta(html, "description") ?? meta(html, "og:description"))?.slice(0, 400),
      platform: detectPlatform(html),
      https: finalUrl.protocol === "https:",
      mobileViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
      responseMs: ms,
      pageWeightKb: Math.round(bytes / 1024),
      internalLinks: internal.size,
      images: images.length,
      imagesMissingAlt: missingAlt,
      hasForms: /<form\b/i.test(html),
      hasGiving: /\b(donate|donation|give|giving|tithe|offering|support us)\b/i.test(body),
      hasOpenGraph: /<meta[^>]+property=["']og:/i.test(html),
      headings,
      textExcerpt: decode(body).slice(0, 3000),
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "The site took too long to respond."
        : error instanceof Error && /public website|redirect|error \(|web page|empty page/.test(error.message)
          ? error.message
          : "We couldn't reach that site.";
    return { ok: false, url: url.toString(), error: message };
  }
}
