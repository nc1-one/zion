// Questions the Zion Agent asks during the scoping assessment.
// Shared by the wizard (client) and the agent/estimator (server).

export const BUILD_TYPES = [
  { id: "website", label: "A new website", hint: "Landing page or full site" },
  { id: "redesign", label: "A redesign of our current site", hint: "Fresh look, better structure" },
  { id: "webapp", label: "A web app or portal", hint: "Members, giving, bookings, dashboards" },
  { id: "mobile", label: "A mobile app", hint: "iOS and Android" },
  { id: "integration", label: "Connected systems", hint: "CRM, inventory, workflow automation" },
  { id: "itsupport", label: "Managed IT or security", hint: "We become your IT team" },
  { id: "marketing", label: "Marketing and growth", hint: "SEO, social, email, campaigns" },
] as const;

export const ORG_TYPES = [
  { id: "ministry", label: "Ministry or NGO" },
  { id: "church", label: "Local church" },
  { id: "business", label: "Faith-driven business" },
  { id: "school", label: "School or training org" },
  { id: "other", label: "Something else" },
] as const;

export const FEATURES = [
  { id: "giving", label: "Online giving" },
  { id: "events", label: "Event registration or booking" },
  { id: "accounts", label: "Member accounts and logins" },
  { id: "content", label: "Content we can edit (blog, sermons, news)" },
  { id: "multilang", label: "More than one language" },
  { id: "payments", label: "Payments or online store" },
  { id: "integrations", label: "Connect to tools we already use" },
  { id: "reporting", label: "Reports and dashboards" },
] as const;

export const AUDIENCE_SIZES = [
  { id: "small", label: "Under 1,000 people a month" },
  { id: "medium", label: "1,000 – 10,000 a month" },
  { id: "large", label: "10,000 – 100,000 a month" },
  { id: "xlarge", label: "More than 100,000 a month" },
] as const;

export const CONTENT_READINESS = [
  { id: "ready", label: "Our brand and content are ready" },
  { id: "partial", label: "We have some, but need help" },
  { id: "scratch", label: "We're starting from scratch" },
] as const;

// Where the client's team works. Zion is in Manila and also covers these time zones.
export const WORK_REGIONS = [
  { id: "manila", label: "Philippines or elsewhere in Asia", hint: "Manila time, GMT+8" },
  { id: "australia", label: "Australia or New Zealand", hint: "AEST to NZST" },
  { id: "americas", label: "United States, Canada, or Latin America", hint: "Eastern to Pacific" },
  { id: "uk", label: "United Kingdom or Europe", hint: "GMT to CET" },
] as const;

export const TIMELINES = [
  { id: "asap", label: "As soon as possible" },
  { id: "quarter", label: "In the next 1–3 months" },
  { id: "half", label: "In 3–6 months" },
  { id: "flexible", label: "We're flexible" },
] as const;

type Ids<T extends readonly { id: string }[]> = T[number]["id"];

export type BuildTypeId = Ids<typeof BUILD_TYPES>;
export type OrgTypeId = Ids<typeof ORG_TYPES>;
export type FeatureId = Ids<typeof FEATURES>;
export type AudienceSizeId = Ids<typeof AUDIENCE_SIZES>;
export type ContentReadinessId = Ids<typeof CONTENT_READINESS>;
export type TimelineId = Ids<typeof TIMELINES>;
export type WorkRegionId = Ids<typeof WORK_REGIONS>;

export const idsOf = <T extends readonly { id: string }[]>(list: T) =>
  list.map((item) => item.id) as unknown as [Ids<T>, ...Ids<T>[]];

export const labelOf = (list: readonly { id: string; label: string }[], id: string) =>
  list.find((item) => item.id === id)?.label ?? id;
