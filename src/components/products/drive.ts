"use client";

import { createContext, type ReactNode } from "react";

// Kept apart from ProtoKit so the showcase can drive a prototype without
// loading the prototype kit up front.

export interface StackEntry {
  screen: string;
  id?: string;
  label?: string;
}

// How a product presents itself, so each demo reads as its own product.
export type ProtoShell = "classic" | "tinted" | "dark" | "topnav" | "paper" | "commerce" | "brandbar";

export interface ProtoBrand {
  accent: string;
  mark?: ReactNode; // logo mark, about 26px square
  shell?: ProtoShell;
  barColor?: string; // dark sidebar or top bar color
  font?: "inter" | "serif" | "grotesk";
  radius?: "sharp" | "soft";
  stats?: "cards" | "strip" | "plain";
}

// The product showcase drives a prototype from outside (the guided tour),
// brands it, and listens for where the visitor is.
export interface ProtoDrive {
  target?: { key: number; stack: StackEntry[] };
  brand?: ProtoBrand;
  framed?: boolean;
  page?: boolean; // full-page demo: fills its container and drives the browser's back button
  onPath?: (path: string) => void;
}

export const DriveContext = createContext<ProtoDrive>({});
export const ProtoDriveProvider = DriveContext.Provider;
