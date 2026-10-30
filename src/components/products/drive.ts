"use client";

import { createContext } from "react";

// Kept apart from ProtoKit so the showcase can drive a prototype without
// loading the prototype kit up front.

export interface StackEntry {
  screen: string;
  id?: string;
  label?: string;
}

// The product showcase drives a prototype from outside (the guided tour),
// brands it, and listens for where the visitor is.
export interface ProtoDrive {
  target?: { key: number; stack: StackEntry[] };
  brand?: { accent: string };
  framed?: boolean;
  onPath?: (path: string) => void;
}

export const DriveContext = createContext<ProtoDrive>({});
export const ProtoDriveProvider = DriveContext.Provider;
