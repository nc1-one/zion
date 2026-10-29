import type { ServiceId } from "./types";

// Zion's offerings. Shown in the Offerings section and referenced by the
// agent when it recommends which teams a scope needs.
export const SERVICES: { id: ServiceId; title: string; desc: string }[] = [
  {
    id: "software",
    title: "Custom Software",
    desc: "Web apps, mobile platforms, and enterprise systems designed from the ground up for mission-driven organizations.",
  },
  {
    id: "design",
    title: "UI/UX & Product Design",
    desc: "User-centered design that makes complex systems intuitive — from wireframes to high-fidelity prototypes.",
  },
  {
    id: "infrastructure",
    title: "Infrastructure & DevOps",
    desc: "Cloud architecture, CI/CD pipelines, and scalable infrastructure to keep your operations running securely.",
  },
  {
    id: "consulting",
    title: "Technology Consulting",
    desc: "Strategic guidance on tech decisions, digital transformation roadmaps, and system audits aligned to your vision.",
  },
  {
    id: "managed",
    title: "Managed IT Services",
    desc: "Ongoing support, maintenance, and monitoring so your team stays focused on the mission while we handle the tech.",
  },
  {
    id: "security",
    title: "Cybersecurity",
    desc: "Protect your data with security audits, penetration testing, compliance frameworks, and incident response planning.",
  },
];

export const serviceTitle = (id: ServiceId) => SERVICES.find((s) => s.id === id)?.title ?? id;
