import Image from "next/image";
import { NAV_LINKS } from "./nav-links";

export function Footer() {
  return (
    <footer className="bg-night text-ink py-12 px-5 md:px-10 border-t border-rule">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={30} height={30} className="w-[30px] h-[30px] object-contain" />
          <span className="font-brand text-[1.15rem] font-bold">
            Zion <span className="text-gold-bright">Systems &amp; Build</span>
          </span>
        </div>

        <nav className="flex flex-wrap gap-x-7 gap-y-3" aria-label="Footer">
          {[...NAV_LINKS, { name: "Contact", href: "#contact" }].map((link) => (
            <a key={link.name} href={link.href} className="text-[0.85rem] text-graphite hover:text-ink transition-colors no-underline">
              {link.name}
            </a>
          ))}
        </nav>

        <div className="text-[0.8rem] text-mist">© {new Date().getFullYear()} Zion Systems · Manila</div>
      </div>
    </footer>
  );
}
