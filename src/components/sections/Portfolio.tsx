"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { RevealHeading } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

interface Project {
  title: string;
  kind: string;
  image: string;
  href?: string;
  linkLabel?: string;
  featured?: boolean;
}

const PROJECTS: Project[] = [
  { title: "Jesus.Net Philippines", kind: "Ministry portal, 160+ countries", image: "/images/jesus-site.jpg", href: "https://jesus.net.ph", featured: true },
  { title: "Turn Vertical", kind: "Evangelism app, iOS", image: "/images/turn-vertical-siteB.jpg", href: "https://apps.apple.com/my/app/turn-vertical/id6758944157", linkLabel: "App Store", featured: true },
  { title: "HopeBegins.Today", kind: "Mental health coaching site", image: "/images/hope-begins-site.jpg", href: "https://hopebegins.today" },
  { title: "Himala Every Day", kind: "Devotional, 25+ languages", image: "/images/himala-site.jpg", href: "https://himalaeveryday.ph" },
  { title: "eSTAR Foundation", kind: "Missions impact reporting", image: "/images/estar-site.jpg", href: "https://www.estar.ws/" },
  { title: "Glassbox Philippines", kind: "Inventory and ordering system", image: "/images/glassbox-site.png" },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const body = (
    <>
      <span className={cn("relative block overflow-hidden rounded-[14px] bg-sheet ring-1 ring-rule", project.featured ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <Image
          src={project.image}
          alt=""
          fill
          sizes={project.featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </span>
      <span className="mt-4 flex items-start justify-between gap-4">
        <span className="min-w-0">
          <span className={cn("block font-semibold tracking-[-0.015em] text-ink", project.featured ? "text-[1.2rem]" : "text-[1rem]")}>{project.title}</span>
          <span className="block mt-0.5 text-[0.88rem] text-graphite">{project.kind}</span>
        </span>
        {project.href && (
          <span className="flex items-center gap-1 shrink-0 pt-1 text-[0.82rem] font-medium text-mist group-hover:text-gold-bright transition-colors">
            {project.linkLabel ?? "Visit"} <ArrowUpRight size={14} />
          </span>
        )}
      </span>
    </>
  );

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={project.featured ? "md:col-span-2" : undefined}
    >
      {project.href ? (
        <a href={project.href} target="_blank" rel="noopener noreferrer" className="group block no-underline">
          {body}
        </a>
      ) : (
        <div className="group">{body}</div>
      )}
    </motion.li>
  );
}

export function Portfolio() {
  return (
    <section id="work" className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <RevealHeading text="Selected work" className="heading-section text-ink" />
          <p className="text-[1.05rem] text-graphite">Live and in use.</p>
        </div>
        <ul className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-12">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
