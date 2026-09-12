"use client";

import React from "react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="py-12 px-6 md:px-12 border-t border-solid border-gray-850">
      <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <div className="font-display text-[0.95rem] font-bold text-gray-400">
              Zion <span className="text-gold-dark">Systems & Build</span>
            </div>
          </div>
          <div className="text-[0.65rem] text-gray-600 font-mono mt-1 pl-10">
            v0.1.0
          </div>
        </div>

        <div className="flex gap-8">
          {["Home", "Services", "ZPL", "Portfolio", "About"].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-[0.75rem] font-medium text-gray-500 uppercase tracking-wider hover:text-gold transition-colors no-underline"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="text-[0.72rem] text-gray-600">
          © {new Date().getFullYear()} Zion Systems. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
