"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X, ExternalLink, Apple } from "lucide-react";
import { cn } from "@/lib/utils";
import { RevealHeading } from "@/components/ui/motion";
import Image from "next/image";

const CATEGORIES = ["All", "Ministry", "Web & Mobile", "Enterprise"];

interface ProjectType {
  title: string;
  kind: string;
  desc: string;
  tags: string[];
  monogram: string;
  link?: string;
  appStore?: string;
  featured?: boolean;
  category: string;
  image?: string;
}

const PROJECTS: ProjectType[] = [
  {
    title: "Jesus.Net Philippines",
    kind: "Digital ministry portal",
    desc: "A full-scale digital missions portal featuring pathway-based navigation for individuals, churches, and Bible study leaders. Reach millions across 160+ countries.",
    tags: ["Web Platform", "Ministry Tech", "Multi-Tool"],
    monogram: "J.NET",
    link: "https://jesus.net.ph",
    featured: true,
    category: "Ministry",
    image: "/images/jesus-site.jpg",
  },
  {
    title: "Turn Vertical",
    kind: "Digital evangelism platform",
    desc: "Website and mobile app that helps believers record testimonies and share Gospel videos via QR codes and links.",
    tags: ["Web App", "Mobile App", "Video Platform"],
    monogram: "TV",
    appStore: "https://apps.apple.com/my/app/turn-vertical/id6758944157",
    category: "Web & Mobile",
    image: "/images/turn-vertical-siteB.jpg",
  },
  {
    title: "HopeBegins.Today",
    kind: "Faith-based mental health",
    desc: "A ministry website for a faith-driven mental health coaching program combining Christian principles with technology.",
    tags: ["Ministry Website", "Booking System"],
    monogram: "HB",
    link: "https://hopebegins.today",
    category: "Ministry",
    image: "/images/hope-begins-site.jpg",
  },
  {
    title: "Glassbox Philippines",
    kind: "Systems integration",
    desc: "End-to-end systems integration for an architectural finishes company, connecting inventory and ordering workflows.",
    tags: ["Systems Integration", "Enterprise"],
    monogram: "GB",
    category: "Enterprise",
    image: "/images/glassbox-site.png",
  },
  {
    title: "Himala Every Day",
    kind: "Devotional landing page",
    desc: "A beautifully crafted landing page for a daily devotional ministry reaching readers in 25+ languages.",
    tags: ["Landing Page", "UI/UX"],
    monogram: "HED",
    link: "https://himalaeveryday.ph",
    category: "Ministry",
    image: "/images/himala-site.jpg",
  },
  {
    title: "eSTAR Foundation",
    kind: "Ministry impact reporting",
    desc: "A missions-focused reporting platform featuring the Harvest database that maps churches and unreached communities.",
    tags: ["Impact Reporting", "Missions Data"],
    monogram: "eSF",
    link: "https://www.estar.ws/",
    category: "Enterprise",
    image: "/images/estar-site.jpg",
  },
];

export function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProject(null);
      }
    };
    if (selectedProject) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedProject]);

  const filteredProjects = activeCategory === "All"
    ? PROJECTS
    : PROJECTS.filter(project => project.category === activeCategory);

  return (
    <section id="work" className="py-20 md:py-28 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
          <div>
            <RevealHeading text="Projects built on purpose." className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink" />
            <p className="mt-4 text-[1rem] leading-[1.7] text-graphite max-w-[34rem]">
              Systems we&apos;ve built for organizations doing Kingdom work across multiple sectors.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter projects">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full border text-[0.82rem] font-medium transition-colors cursor-pointer",
                    isActive ? "bg-gold text-paper border-gold" : "bg-transparent text-graphite border-rule hover:border-graphite hover:text-ink",
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.article
                key={project.title}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "group bg-sheet border border-rule rounded-[10px] overflow-hidden flex flex-col transition-[border-color,transform] duration-300 hover:border-graphite hover:-translate-y-1",
                  project.featured && "md:col-span-2 md:grid md:grid-cols-[1.35fr_1fr]",
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className={cn(
                    "relative block w-full overflow-hidden bg-rule-soft cursor-zoom-in border-b border-rule",
                    project.featured ? "h-[240px] md:h-full md:min-h-[340px] md:border-b-0 md:border-r" : "h-[230px]",
                  )}
                  aria-label={`View ${project.title}`}
                >
                  {project.image ? (
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      sizes={project.featured ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 50vw"}
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-display text-[3rem] font-semibold text-rule">
                      {project.monogram}
                    </span>
                  )}
                </button>

                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <div className="annot text-mist mb-3">{project.tags.join("  ·  ")}</div>
                  <h3 className="font-display text-[1.45rem] leading-[1.15] font-semibold text-ink">{project.title}</h3>
                  <p className="mt-1 text-[0.88rem] font-medium text-gold-deep">{project.kind}</p>
                  <p className="mt-2.5 text-[0.88rem] leading-[1.65] text-graphite">{project.desc}</p>
                  <div className="mt-auto pt-5 flex flex-wrap items-center gap-5">
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-gold-deep no-underline hover:text-ink"
                      >
                        Visit site <ArrowUpRight size={14} />
                      </a>
                    )}
                    {project.appStore && (
                      <a
                        href={project.appStore}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-gold-deep no-underline hover:text-ink"
                      >
                        App Store <ArrowUpRight size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="text-[0.85rem] font-medium text-graphite hover:text-ink cursor-pointer"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-night/85"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-dialog-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-[960px] w-full bg-sheet rounded-[12px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-visible"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                autoFocus
                onClick={() => setSelectedProject(null)}
                className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-sheet/90 border border-rule flex items-center justify-center text-ink cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="relative w-full md:w-3/5 h-[240px] md:h-[480px] bg-rule-soft shrink-0">
                {selectedProject.image ? (
                  <Image src={selectedProject.image} alt="" fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover object-top" priority />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-display text-[4rem] font-semibold text-rule">
                    {selectedProject.monogram}
                  </span>
                )}
              </div>

              <div className="w-full md:w-2/5 p-7 md:p-9 flex flex-col justify-between">
                <div>
                  <div className="annot text-gold-deep">{selectedProject.category}</div>
                  <h3 id="project-dialog-title" className="font-display text-[1.6rem] leading-[1.15] font-semibold text-ink mt-3">
                    {selectedProject.title}
                  </h3>
                  <p className="mt-1 text-[0.9rem] font-medium text-gold-deep">{selectedProject.kind}</p>
                  <div className="annot text-mist mt-3">{selectedProject.tags.join("  ·  ")}</div>
                  <p className="mt-5 text-[0.9rem] leading-[1.7] text-graphite">{selectedProject.desc}</p>
                </div>

                <div className="flex flex-col gap-2.5 pt-6 mt-6 border-t border-rule">
                  {selectedProject.link && (
                    <a
                      href={selectedProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gold hover:bg-gold-bright text-ink font-semibold rounded-lg text-[0.88rem] no-underline transition-colors"
                    >
                      Visit live website <ExternalLink size={14} />
                    </a>
                  )}
                  {selectedProject.appStore && (
                    <a
                      href={selectedProject.appStore}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-raised hover:bg-rule text-ink border border-rule font-semibold rounded-lg text-[0.88rem] no-underline transition-colors"
                    >
                      <Apple size={14} className="fill-current" /> Download on the App Store
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="w-full py-3 px-4 border border-rule hover:border-graphite text-ink rounded-lg text-[0.88rem] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
