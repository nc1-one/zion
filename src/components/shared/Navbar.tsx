"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";
import { ScrollProgress } from "@/components/ui/motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // Track which section is on screen so the underline can follow it.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const link of NAV_LINKS) {
      const el = document.querySelector(link.href);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const [hidden, setHidden] = useState(false);

  // Solid once scrolled; tucks away while scrolling down, returns on the way up.
  useEffect(() => {
    let last = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 12);
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 400);
        last = y;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 h-[var(--nav-height)] flex items-center justify-between px-5 md:px-10 border-b transition-[background-color,border-color,transform] duration-300",
          isScrolled || isMenuOpen ? "bg-paper border-rule" : "bg-transparent border-transparent",
          hidden && !isMenuOpen && "-translate-y-full",
        )}
      >
        <ScrollProgress />
        <a href="#assessment" className="flex items-center gap-3 no-underline" onClick={() => setIsMenuOpen(false)}>
          <Image src="/logo.png" alt="" width={36} height={36} priority className="w-9 h-9 object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.2rem] font-bold text-ink tracking-tight">
              Zion <span className="text-gold-deep">Systems &amp; Build</span>
            </span>
            <span className="annot text-mist text-[0.55rem] mt-1">Frameworks for a higher purpose</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              aria-current={active === link.href ? "location" : undefined}
              className={cn(
                "relative px-3.5 py-2 text-[0.85rem] font-medium transition-colors no-underline",
                active === link.href ? "text-ink" : "text-graphite hover:text-ink",
              )}
            >
              {link.name}
              {active === link.href && (
                <motion.span layoutId="nav-underline" className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] rounded-full bg-gold" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
              )}
            </a>
          ))}
          <a
            href="#contact"
            className="ml-3 px-4 py-2 text-[0.85rem] font-semibold text-paper bg-gold rounded-lg hover:bg-gold-bright hover:-translate-y-px transition-[background-color,transform] no-underline"
          >
            Talk to us
          </a>
        </div>

        <button
          type="button"
          className="lg:hidden w-10 h-10 -mr-2 flex items-center justify-center text-ink cursor-pointer"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={cn(
          "fixed top-[var(--nav-height)] inset-x-0 bottom-0 z-40 bg-paper flex flex-col px-5 py-6 lg:hidden transition-[opacity,transform] duration-300",
          isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
        )}
        inert={!isMenuOpen}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.href}
            onClick={() => setIsMenuOpen(false)}
            className="py-4 font-display text-[1.6rem] font-semibold text-ink border-b border-rule no-underline"
          >
            {link.name}
          </a>
        ))}
        <a
          href="#contact"
          onClick={() => setIsMenuOpen(false)}
          className="mt-6 text-center py-3.5 bg-gold text-paper font-semibold rounded-lg no-underline"
        >
          Talk to us
        </a>
      </div>
    </>
  );
}
