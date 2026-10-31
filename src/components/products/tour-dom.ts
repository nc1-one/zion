// Finding things in a live demo, for the guided tour and the full-page guide.

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The visible element whose own text matches, exact match first.
export function findText(root: Element | null, text: string): HTMLElement | null {
  if (!root) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let partial: HTMLElement | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue?.trim();
    const el = node.parentElement;
    if (!value || !el || !el.getClientRects().length) continue;
    if (value === text) return el;
    if (!partial && value.startsWith(text)) partial = el;
  }
  return partial;
}

// What a click on that text would hit: a control, a row, or the panel around it.
export function hitTarget(el: HTMLElement) {
  return (
    el.closest<HTMLElement>("button, a, select, tr, [role=row]") ??
    el.closest<HTMLElement>("[class*='rounded'][class*='border']") ??
    el
  );
}

export async function waitFor<T>(find: () => T | null, timeout = 2500): Promise<T | null> {
  const end = Date.now() + timeout;
  for (;;) {
    const found = find();
    if (found || Date.now() > end) return found;
    await sleep(100);
  }
}
