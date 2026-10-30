import type { WorkRegionId } from "./questions";

// Zion's internal hourly rates, in USD, by where the client needs the team to
// work. Server-only: import from API routes and server actions, never from
// client components. Visitors only ever see totals.
const RATES: Record<WorkRegionId, number> = {
  manila: 8,
  australia: 20,
  americas: 20,
  uk: 20,
};

export const rateFor = (region: WorkRegionId | undefined) => RATES[region ?? "manila"] ?? RATES.manila;
