import type { ScanResult } from "./types";

// Plain-language notes from the site scan, used in the live draft and the fallback.
export function surveyNotes(scan: ScanResult): string[] {
  const notes: string[] = [];
  if (scan.platform) notes.push(`Built on ${scan.platform}.`);
  if (scan.https === false) notes.push("Not served over HTTPS, so browsers mark it as not secure.");
  if (scan.mobileViewport === false) notes.push("No mobile viewport set, so it likely displays poorly on phones.");
  if (scan.responseMs !== undefined && scan.pageWeightKb !== undefined) {
    notes.push(`Home page took ${(scan.responseMs / 1000).toFixed(1)} s to respond and weighs ${scan.pageWeightKb.toLocaleString()} KB of HTML.`);
  }
  if (scan.images && scan.imagesMissingAlt) {
    notes.push(`${scan.imagesMissingAlt} of ${scan.images} images have no alt text for screen readers.`);
  }
  if (scan.hasGiving === false) notes.push("No online giving or donation link found on the home page.");
  if (!scan.description) notes.push("No meta description, which weakens how it shows up in search results.");
  return notes.slice(0, 5);
}
