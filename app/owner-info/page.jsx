"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import {
  ArrowDown,
  ArrowUpRight,
  Code2,
  ExternalLink,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

import { FaGithub, FaInstagram, FaLinkedinIn } from "react-icons/fa";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Cormorant_Garamond, DM_Sans, Space_Grotesk } from "next/font/google";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const accentFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-accent",
});

/* =========================================================
   PAGE
========================================================= */

export default function OwnerInfoPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      /* -----------------------------------------------------
         HERO
      ----------------------------------------------------- */

      gsap.from(".hero-label", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".hero-line", {
        yPercent: 120,
        duration: 1.15,
        stagger: 0.1,
        delay: 0.1,
        ease: "power4.out",
      });

      gsap.from(".hero-description", {
        y: 25,
        opacity: 0,
        duration: 0.9,
        delay: 0.45,
        ease: "power3.out",
      });

      gsap.from(".hero-social", {
        y: 20,
        opacity: 0,
        duration: 0.7,
        delay: 0.65,
        stagger: 0.08,
        ease: "power3.out",
      });

      gsap.from(".hero-photo", {
        clipPath: "inset(100% 0 0 0)",
        scale: 1.08,
        duration: 1.2,
        delay: 0.2,
        ease: "power4.inOut",
      });

      gsap.from(".hero-photo-frame", {
        scale: 0.9,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });

      /* -----------------------------------------------------
         GENERAL REVEALS
      ----------------------------------------------------- */

      gsap.utils.toArray(".reveal").forEach((element) => {
        gsap.from(element, {
          y: 55,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
            once: true,
          },
        });
      });

      gsap.utils.toArray(".reveal-left").forEach((element) => {
        gsap.from(element, {
          x: -60,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            once: true,
          },
        });
      });

      gsap.utils.toArray(".reveal-right").forEach((element) => {
        gsap.from(element, {
          x: 60,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            once: true,
          },
        });
      });

      /* -----------------------------------------------------
         IMAGE REVEALS
      ----------------------------------------------------- */

      gsap.utils.toArray(".image-reveal").forEach((element) => {
        gsap.from(element, {
          clipPath: "inset(100% 0 0 0)",
          scale: 1.08,
          duration: 1.2,
          ease: "power4.inOut",
          scrollTrigger: {
            trigger: element,
            start: "top 82%",
            once: true,
          },
        });
      });

      /* -----------------------------------------------------
         FOOTER NAME INTERACTION
      ----------------------------------------------------- */

      const footerName = document.querySelector(".footer-name");

      if (footerName) {
        const originalText = footerName.textContent.trim();
        footerName.innerHTML = "";

        [...originalText].forEach((char, index) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.className = "footer-name-char";
          span.style.display = "inline-block";
          span.style.transformOrigin = "center bottom";
          span.style.willChange = "transform, color";
          span.style.transition = "color 0.25s ease";
          footerName.appendChild(span);

          gsap.fromTo(
            span,
            { y: 18, opacity: 0, rotateX: -40 },
            {
              y: 0,
              opacity: 1,
              rotateX: 0,
              duration: 0.7,
              delay: 0.45 + index * 0.04,
              ease: "power3.out",
            },
          );
        });

        footerName.addEventListener("pointermove", (event) => {
          const rect = footerName.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;

          gsap.to(footerName, {
            rotateY: (x - 0.5) * 18,
            rotateX: (0.5 - y) * 12,
            duration: 0.5,
            ease: "power2.out",
            transformPerspective: 600,
          });
        });

        footerName.addEventListener("pointerenter", () => {
          gsap.to(".footer-name-char", {
            y: -5,
            color: "#F4C7B7",
            duration: 0.35,
            stagger: 0.03,
            ease: "power2.out",
          });
        });

        footerName.addEventListener("pointerleave", () => {
          gsap.to(footerName, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.7,
            ease: "power3.out",
          });

          gsap.to(".footer-name-char", {
            y: 0,
            color: "#FFFFFF",
            duration: 0.5,
            stagger: 0.02,
            ease: "power2.out",
          });
        });
      }

      /* -----------------------------------------------------
         ABOUT ME BIG NUMBER
      ----------------------------------------------------- */

      gsap.from(".about-number", {
        y: 80,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".about-number",
          start: "top 85%",
          once: true,
        },
      });

      /* -----------------------------------------------------
         HIGHLIGHT WORDS
      ----------------------------------------------------- */

      gsap.utils.toArray(".line-highlight").forEach((element) => {
        gsap.fromTo(
          element,
          {
            backgroundSize: "0% 100%",
          },
          {
            backgroundSize: "100% 100%",
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          },
        );
      });

      /* -----------------------------------------------------
         TECHNOLOGY MARQUEE
      ----------------------------------------------------- */

      const marquee = document.querySelector(".tech-track");

      if (marquee) {
        gsap.to(marquee, {
          xPercent: -25,
          duration: 20,
          repeat: -1,
          ease: "none",
        });
      }

      /* -----------------------------------------------------
         JOURNEY LINE
      ----------------------------------------------------- */

      gsap.from(".journey-progress", {
        scaleY: 0,
        transformOrigin: "top center",
        duration: 2,
        ease: "none",
        scrollTrigger: {
          trigger: ".journey-section",
          start: "top 70%",
          end: "bottom 70%",
          scrub: true,
        },
      });

      /* -----------------------------------------------------
         PARALLAX
      ----------------------------------------------------- */

      gsap.utils.toArray(".parallax-image").forEach((element) => {
        gsap.to(element, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      /* -----------------------------------------------------
         PROJECT IMAGE
      ----------------------------------------------------- */

      gsap.from(".project-image-wrap", {
        scale: 0.94,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".project-image-wrap",
          start: "top 82%",
          once: true,
        },
      });

      /* -----------------------------------------------------
         CLEANUP
      ----------------------------------------------------- */
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={pageRef}
      className={`${displayFont.variable} ${bodyFont.variable} ${accentFont.variable} min-h-screen overflow-hidden bg-[#F5F0E8] text-[#171513]`}
    >
      {/* =====================================================
          SEO STRUCTURED DATA
      ====================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Piyush Singh",
            url: "https://p7yu5h.in",
            image: [
              "https://p7yu5h.in/owner/PiyushSingh.JPEG",
              "https://p7yu5h.in/owner/piyush-singh.jpeg",
              "https://p7yu5h.in/owner/PS.JPEG",
            ],
            jobTitle: "Software Developer",
            sameAs: [
              "https://www.linkedin.com/in/p7yu5h-singh/",
              "https://github.com/P7yush-Singh",
              "https://instagram.com/p7yu5h",
              "https://p7yu5h.in",
            ],
            knowsAbout: [
              "Software Development",
              "Web Development",
              "Full Stack Development",
              "JavaScript",
              "React",
              "Next.js",
              "Node.js",
              "MongoDB",
            ],
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Ramen Cafe",
            applicationCategory: "BusinessApplication",
            description:
              "A digital cafe ordering and management platform created by Piyush Singh.",
            creator: {
              "@type": "Person",
              name: "Piyush Singh",
              url: "https://p7yu5h.in",
            },
          }),
        }}
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#DED6C9]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="group">
            <p className="font-accent text-[10px] font-bold uppercase tracking-[0.3em] text-[#B83A2E]">
              Ramen Cafe
            </p>

            <p className="mt-1 font-body text-[10px] text-[#6B6258]">
              Owner / Developer
            </p>
          </Link>

          <a
            href="https://p7yu5h.in"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 font-accent text-[10px] font-bold uppercase tracking-[0.12em]"
          >
            My Portfolio
            <ArrowUpRight
              size={13}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </a>
        </div>
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative min-h-[calc(100vh-70px)] overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-28">
          {/* HERO CONTENT */}

          <div className="relative z-10">
            <div className="hero-label mb-8 flex items-center gap-3">
              <span className="h-px w-11 bg-[#B83A2E]" />

              <span className="font-accent text-[10px] font-bold uppercase tracking-[0.22em] text-[#B83A2E]">
                The person behind Ramen Cafe
              </span>
            </div>

            <h1 className="font-display text-[4.8rem] leading-[0.78] tracking-[-0.065em] sm:text-[6.5rem] lg:text-[8.3rem]">
              <span className="hero-line block overflow-hidden">
                Hi, I&apos;m
              </span>

              <span className="hero-line block overflow-hidden">
                <span className="font-display italic text-[#B83A2E]">
                  Piyush
                </span>
              </span>

              <span className="hero-line block overflow-hidden">
                <span className="font-display italic text-[#B83A2E]">
                  Singh
                </span>
                <span className="font-display text-4xl text-[#B83A2E] sm:text-5xl lg:text-6xl">
                  .
                </span>
              </span>
            </h1>

            {/* DIFFERENT FONT — NOT BOLD */}

            <div className="hero-description mt-10 max-w-xl">
              <p className="font-display text-2xl italic leading-tight text-[#6B6258] sm:text-3xl">
                I&apos;m a software developer interested in turning ideas into
                useful digital products.
              </p>

              <p className="mt-5 font-body text-sm leading-7 text-[#6B6258] sm:text-base">
                I enjoy working across the product — understanding the idea,
                shaping the experience and building the technology that makes it
                work.
              </p>
            </div>

            {/* SOCIAL */}

            <div className="mt-9 flex flex-wrap gap-2.5">
              <a
                href="https://www.linkedin.com/in/p7yu5h-singh/"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social magnetic group flex items-center gap-2 rounded-full border border-[#171513] px-4 py-2.5 font-accent text-[10px] font-bold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#171513] hover:text-white"
              >
                <FaLinkedinIn size={13} />
                LinkedIn
              </a>

              <a
                href="https://github.com/P7yush-Singh"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social magnetic group flex items-center gap-2 rounded-full border border-[#171513] px-4 py-2.5 font-accent text-[10px] font-bold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#171513] hover:text-white"
              >
                <FaGithub size={13} />
                GitHub
              </a>

              <a
                href="https://instagram.com/p7yu5h"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social magnetic group flex items-center gap-2 rounded-full border border-[#171513] px-4 py-2.5 font-accent text-[10px] font-bold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#171513] hover:text-white"
              >
                <FaInstagram size={13} />
                Instagram
              </a>
            </div>

            <div className="mt-14 flex items-center gap-3 text-[#6B6258]">
              <ArrowDown size={15} />

              <span className="font-accent text-[9px] font-bold uppercase tracking-[0.25em]">
                Discover the story
              </span>
            </div>
          </div>

          {/* HERO PHOTO #1 */}

          <div className="hero-photo-frame relative mx-auto w-full max-w-107.5">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[#B83A2E]/20" />

            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#B83A2E]/6" />

            <div className="relative overflow-hidden rounded-[2.2rem] border border-[#DED6C9] bg-[#FFFDF8] p-3">
              <div className="hero-photo relative aspect-4/5 overflow-hidden rounded-[1.7rem]">
                <Image
                  src="/owner/PiyushSingh.jpeg"
                  alt="Piyush Singh, software developer and creator of Ramen Cafe"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>

            <div className="absolute -bottom-5 right-5 rounded-full bg-[#171513] px-5 py-2.5 text-white">
              <span className="font-accent text-[9px] font-bold uppercase tracking-[0.2em]">
                Software Developer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          EDITORIAL MARQUEE
      ====================================================== */}

      <section className="overflow-hidden border-y border-[#DED6C9] bg-[#171513] py-4 text-white">
        <div className="tech-track flex w-max items-center gap-8">
          {[
            "SOFTWARE",
            "PRODUCT",
            "DESIGN",
            "CODE",
            "RAMEN CAFE",
            "NEXT.JS",
            "JAVASCRIPT",
            "BUILDING",
            "SOFTWARE",
            "PRODUCT",
            "DESIGN",
            "CODE",
            "RAMEN CAFE",
            "NEXT.JS",
            "JAVASCRIPT",
            "BUILDING",
          ].map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center gap-8 whitespace-nowrap"
            >
              <span className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                {item}
              </span>

              <span className="text-[#B83A2E]">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          ABOUT ME
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">
            {/* LEFT */}

            <div className="reveal-left">
              <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                01 — About Me
              </p>

              <div className="about-number mt-8 font-display text-[8rem] leading-none text-[#DED6C9] sm:text-[10rem]">
                01
              </div>

              <h2 className="font-display -mt-8 max-w-md text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
                Building instead of just learning.
              </h2>
            </div>

            {/* RIGHT */}

            <div className="reveal-right max-w-2xl">
              <p className="font-body text-base leading-8 text-[#6B6258] sm:text-lg">
                I&apos;m Piyush Singh, a software developer who enjoys building
                practical web applications and exploring how technology can
                solve real problems.
              </p>

              <p className="mt-7 font-body text-base leading-8 text-[#6B6258] sm:text-lg">
                My approach starts before the code. I like understanding the
                problem first, then thinking about the experience, the workflow
                and finally the technology required to bring it together.
              </p>

              <div className="my-10 border-y border-[#DED6C9] py-8">
                <p className="font-display text-3xl italic leading-tight text-[#171513] sm:text-4xl">
                  &ldquo;Good software should make a complicated process feel
                  simple.&rdquo;
                </p>
              </div>

              <p className="font-body text-base leading-8 text-[#6B6258] sm:text-lg">
                That is why I enjoy projects that go beyond a simple interface.
                I want to understand what happens behind the screen, how
                information moves through a system and how the final product can
                actually help someone.
              </p>

              <p className="mt-7 font-body text-base leading-8 text-[#6B6258] sm:text-lg">
                Ramen Cafe gives me exactly that opportunity: building something
                that connects a digital experience with a real-world business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PERSONAL STATEMENT
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
            {/* PHOTO #2 */}

            <div className="reveal-left relative">
              <div className="absolute -left-5 -top-5 h-20 w-20 border-l border-t border-[#B83A2E]/30" />

              <div className="overflow-hidden rounded-4xl border border-[#DED6C9] bg-[#FFFDF8] p-3">
                <div className="image-reveal relative aspect-4/3 overflow-hidden rounded-3xl">
                  <Image
                    src="/owner/piyush-singh.jpeg"
                    alt="Piyush Singh working on software projects"
                    fill
                    className="parallax-image object-cover"
                  />
                </div>
              </div>
            </div>

            {/* CONTENT */}

            <div className="reveal-right">
              <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                What I Believe
              </p>

              <h2 className="mt-6 font-display text-5xl leading-[0.95] tracking-[-0.045em] sm:text-6xl">
                I don&apos;t want to
                <br />
                <span className="font-display italic text-[#6B6258]">
                  just write code.
                </span>
              </h2>

              <div className="mt-8">
                <p className="font-display text-4xl italic leading-[1.05] text-[#B83A2E] sm:text-5xl">
                  I want to create something useful.
                </p>
              </div>

              <p className="mt-8 max-w-xl font-body text-base leading-8 text-[#6B6258] sm:text-lg">
                For me, development becomes more interesting when the code has a
                reason to exist. A real customer, a real workflow or a real
                problem gives every technical decision more meaning.
              </p>

              <div className="mt-9 flex items-center gap-4">
                <div className="h-px w-14 bg-[#B83A2E]" />

                <span className="font-accent text-[9px] font-bold uppercase tracking-[0.2em] text-[#6B6258]">
                  Think → Build → Improve
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW I THINK
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="reveal mb-14 max-w-3xl">
            <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
              02 — How I Think
            </p>

            <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-tighter sm:text-7xl">
              I like solving
              <br />
              <span className="font-display italic text-[#B83A2E]">
                the whole problem.
              </span>
            </h2>
          </div>

          <div className="grid gap-10 border-t border-[#DED6C9] pt-8 md:grid-cols-3">
            <div className="reveal">
              <span className="font-accent text-[10px] font-bold text-[#B83A2E]">
                01
              </span>

              <h3 className="mt-5 font-display text-3xl">Understand</h3>

              <p className="mt-4 font-body text-sm leading-7 text-[#6B6258]">
                Start with the actual problem instead of immediately jumping
                into implementation.
              </p>
            </div>

            <div className="reveal">
              <span className="font-accent text-[10px] font-bold text-[#B83A2E]">
                02
              </span>

              <h3 className="mt-5 font-display text-3xl">Design</h3>

              <p className="mt-4 font-body text-sm leading-7 text-[#6B6258]">
                Think through the user journey, information, workflow and
                experience before connecting all the technical pieces.
              </p>
            </div>

            <div className="reveal">
              <span className="font-accent text-[10px] font-bold text-[#B83A2E]">
                03
              </span>

              <h3 className="mt-5 font-display text-3xl">Build</h3>

              <p className="mt-4 font-body text-sm leading-7 text-[#6B6258]">
                Turn the idea into a working product and continue improving it
                through feedback and real usage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RAMEN CAFE
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="reveal mb-16">
            <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
              03 — Current Project
            </p>

            <h2 className="mt-6 font-display text-6xl leading-[0.82] tracking-[-0.055em] sm:text-8xl">
              Why I built
              <br />
              <span className="font-display italic text-[#B83A2E]">
                Ramen Cafe.
              </span>
            </h2>
          </div>

          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            {/* PROJECT IMAGE */}

            <div className="project-image-wrap relative overflow-hidden rounded-4xl bg-[#171513]">
              <div className="relative aspect-4/3">
                <Image
                  src="/projects/ramen-cafe.png"
                  alt="Ramen Cafe website and digital ordering platform created by Piyush Singh"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="absolute bottom-6 left-6 rounded-full bg-[#171513]/90 px-5 py-3 text-white backdrop-blur-md">
                <span className="font-accent text-[9px] font-bold uppercase tracking-[0.2em]">
                  Ramen Cafe / Digital Product
                </span>
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="reveal-right">
              <div className="mb-7 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B83A2E]" />

                <span className="font-accent text-[9px] font-bold uppercase tracking-[0.2em] text-[#B83A2E]">
                  The idea
                </span>
              </div>

              <p className="font-display text-3xl leading-[1.15] sm:text-4xl">
                What if a cafe website could become part of the actual business
                workflow?
              </p>

              <p className="mt-7 font-body text-base leading-8 text-[#6B6258]">
                Ramen Cafe started from that question. Instead of creating
                another static restaurant website, I wanted to build a digital
                experience that connects the customer with the cafe&apos;s
                actual ordering and management process.
              </p>

              <p className="mt-6 font-body text-base leading-8 text-[#6B6258]">
                Customers should be able to explore the menu, understand
                products, select what they want, customize their order and move
                through a clear checkout experience.
              </p>

              <p className="mt-6 font-body text-base leading-8 text-[#6B6258]">
                Behind that experience, the cafe needs its own structured system
                for products, orders, pricing and operational information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          THE PROBLEM
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="reveal-left">
              <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                04 — The Problem
              </p>

              <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
                What problem
                <br />
                is Ramen Cafe
                <br />
                trying to solve?
              </h2>
            </div>

            <div className="space-y-0">
              {[
                {
                  number: "01",
                  title: "Ordering",
                  text: "Reduce dependence on manual ordering workflows and make the customer journey clearer.",
                },

                {
                  number: "02",
                  title: "Menu",
                  text: "Keep menu information structured and easier to maintain as products change.",
                },

                {
                  number: "03",
                  title: "Pricing",
                  text: "Keep products, add-ons and pricing connected to the order instead of handling them separately.",
                },

                {
                  number: "04",
                  title: "Operations",
                  text: "Give the business a structured way to manage products and customer orders.",
                },

                {
                  number: "05",
                  title: "Billing",
                  text: "Connect bill requests, payments and order receipts to the underlying order information.",
                },

                {
                  number: "06",
                  title: "Experience",
                  text: "Create a digital experience that feels like part of the cafe rather than a generic restaurant website.",
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="reveal group grid grid-cols-[45px_1fr] gap-5 border-t border-[#DED6C9] py-6 last:border-b"
                >
                  <span className="font-accent text-[10px] font-bold text-[#B83A2E]">
                    {item.number}
                  </span>

                  <div>
                    <h3 className="font-display text-2xl transition-colors duration-300 group-hover:text-[#B83A2E]">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-xl font-body text-sm leading-7 text-[#6B6258]">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT EXISTS
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="reveal mb-14 max-w-3xl">
            <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
              05 — Inside The Project
            </p>

            <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-[-0.045em] sm:text-7xl">
              More than
              <br />
              <span className="font-display italic text-[#B83A2E]">
                a landing page.
              </span>
            </h2>
          </div>

          <div className="grid border-t border-[#DED6C9] md:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "Digital Menu",
                "Customers can explore available products through a structured digital menu.",
              ],

              [
                "Ordering Flow",
                "The customer journey connects product selection, customization and checkout.",
              ],

              [
                "Add-ons & Pricing",
                "Additional selections and their pricing are connected to the order.",
              ],

              [
                "Order Management",
                "Orders are stored and handled through a dedicated application workflow.",
              ],

              [
                "Product Management",
                "The cafe side includes structured product management rather than static content.",
              ],

              [
                "Billing Workflow",
                "Bill requests, payments and order receipts are connected to the order journey.",
              ],
            ].map(([title, text], index) => (
              <div
                key={title}
                className={`reveal border-b border-[#DED6C9] p-7 lg:p-9 ${
                  index % 3 !== 0 ? "lg:border-l" : ""
                } ${index % 2 !== 0 ? "md:border-l lg:border-l" : ""}`}
              >
                <span className="font-accent text-[9px] font-bold text-[#B83A2E]">
                  0{index + 1}
                </span>

                <h3 className="mt-6 font-display text-3xl">{title}</h3>

                <p className="mt-4 font-body text-sm leading-7 text-[#6B6258]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          TECHNOLOGY
      ====================================================== */}

      <section className="overflow-hidden border-b border-[#DED6C9] bg-[#171513] text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="reveal-left">
              <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                06 — Technology
              </p>

              <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
                Built with
                <br />
                <span className="font-display italic text-white/60">
                  modern web technology.
                </span>
              </h2>

              <p className="mt-7 max-w-md font-body text-sm leading-7 text-white/50">
                The project combines the customer-facing interface with
                application logic, APIs and persistent data to create one
                connected system.
              </p>
            </div>

            <div className="reveal-right flex flex-wrap content-start gap-3">
              {[
                "Next.js",
                "React",
                "JavaScript",
                "Tailwind CSS",
                "Node.js",
                "MongoDB",
                "Mongoose",
                "REST APIs",
                "Vercel",
                "Git",
              ].map((technology) => (
                <div
                  key={technology}
                  className="rounded-full border border-white/15 px-5 py-3 font-accent text-[10px] font-bold uppercase tracking-[0.08em] text-white/70 transition-all duration-300 hover:border-[#B83A2E] hover:text-white"
                >
                  {technology}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CURRENT STATUS
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="reveal rounded-4xl bg-[#171513] p-8 text-white sm:p-12 lg:p-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                  Current Status
                </p>

                <h2 className="mt-6 max-w-3xl font-display text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
                  Ramen Cafe is becoming
                  <br />
                  <span className="font-display italic text-white/60">
                    a real product.
                  </span>
                </h2>

                <p className="mt-7 max-w-2xl font-body text-sm leading-7 text-white/50">
                  The core customer and administration workflow has been
                  developed. The focus now is on refinement, edge cases,
                  usability and making the overall experience stronger for
                  real-world use.
                </p>
              </div>

              <div className="hidden lg:block">
                <span className="font-display text-7xl italic text-white/10">
                  進む
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          THE JOURNEY
      ====================================================== */}

      <section className="journey-section relative border-b border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.65fr_1.35fr]">
            {/* STICKY TITLE */}

            <div className="reveal-left lg:sticky lg:top-20 lg:h-fit">
              <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                07 — The Journey
              </p>

              <h2 className="mt-6 font-display text-5xl leading-[0.88] tracking-tighter sm:text-7xl">
                One project.
                <br />
                <span className="font-display italic text-[#B83A2E]">
                  Many lessons.
                </span>
              </h2>

              <p className="mt-7 max-w-sm font-body text-sm leading-7 text-[#6B6258]">
                Ramen Cafe has become an opportunity to understand much more
                than writing code.
              </p>
            </div>

            {/* JOURNEY */}

            <div className="relative pl-8">
              <div className="absolute bottom-0 left-1.25 top-0 w-px bg-[#DED6C9]" />

              <div className="journey-progress absolute left-1.25 top-0 h-full w-px bg-[#B83A2E]" />

              {[
                {
                  number: "01",
                  title: "Start with an idea",
                  text: "The project began with the thought of creating a digital experience around a cafe rather than simply designing another restaurant page.",
                },

                {
                  number: "02",
                  title: "Understand the workflow",
                  text: "Thinking about customers and cafe operations changed the project from a visual website into a product with connected workflows.",
                },

                {
                  number: "03",
                  title: "Build the system",
                  text: "The customer journey, products, orders, checkout and administration became connected pieces of the same application.",
                },

                {
                  number: "04",
                  title: "Learn from the details",
                  text: "Real product work exposes edge cases, usability decisions and small details that are easy to miss when building only for practice.",
                },

                {
                  number: "05",
                  title: "Keep improving",
                  text: "The project continues to evolve as I refine the experience and think about what would make it genuinely useful in the real world.",
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="reveal relative pb-14 last:pb-0"
                >
                  <span className="absolute -left-8.5 top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#F5F0E8] bg-[#B83A2E]" />

                  <div className="mb-3 font-accent text-[10px] font-bold tracking-[0.15em] text-[#B83A2E]">
                    {step.number}
                  </div>

                  <h3 className="font-display text-3xl sm:text-4xl">
                    {step.title}
                  </h3>

                  <p className="mt-4 max-w-xl font-body text-sm leading-7 text-[#6B6258]">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PHOTO / PERSONAL CLOSING
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="reveal-left">
              <p className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                Looking Ahead
              </p>

              <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-[-0.045em] sm:text-7xl">
                Keep learning.
                <br />
                <span className="font-display italic text-[#B83A2E]">
                  Keep building.
                </span>
              </h2>

              <p className="mt-8 max-w-xl font-body text-base leading-8 text-[#6B6258] sm:text-lg">
                Ramen Cafe is one chapter in my development journey. The project
                has taught me how much more there is to consider when software
                is connected to a real business and real users.
              </p>

              <p className="mt-6 max-w-xl font-body text-base leading-8 text-[#6B6258] sm:text-lg">
                I want to continue taking ideas, understanding the problems
                behind them and turning them into products that people can
                actually use.
              </p>
            </div>

            {/* PHOTO #3 */}

            <div className="reveal-right relative">
              <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full border border-[#B83A2E]/25" />

              <div className="overflow-hidden rounded-4xl border border-[#DED6C9] bg-[#FFFDF8] p-3">
                <div className="image-reveal relative aspect-4/5 overflow-hidden rounded-3xl">
                  <Image
                    src="/owner/PS.jpeg"
                    alt="Piyush Singh, developer and creator of Ramen Cafe"
                    fill
                    className="parallax-image object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONNECT WITH ME
      ====================================================== */}

      <section className="border-b border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center lg:px-10">
          <div className="reveal">
            <div className="mb-7 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#B83A2E]" />

              <span className="font-accent text-[10px] font-bold uppercase tracking-[0.25em] text-[#B83A2E]">
                Connect With Me
              </span>

              <span className="h-px w-10 bg-[#B83A2E]" />
            </div>

            <h2 className="font-display text-6xl leading-[0.85] tracking-[-0.055em] sm:text-8xl">
              Follow the
              <br />
              <span className="font-display italic text-[#B83A2E]">
                journey.
              </span>
            </h2>

            <p className="mx-auto mt-8 max-w-xl font-body text-sm leading-7 text-[#6B6258] sm:text-base">
              If you want to see what I&apos;m working on, explore my code,
              follow my professional journey or simply connect with me, you can
              find me here.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a
                href="https://www.linkedin.com/in/p7yu5h-singh/"
                target="_blank"
                rel="noopener noreferrer"
                className="magnetic flex items-center gap-2 rounded-full bg-[#171513] px-6 py-3.5 font-accent text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#B83A2E]"
              >
                <FaLinkedinIn size={15} />
                LinkedIn
              </a>

              <a
                href="https://github.com/P7yush-Singh"
                target="_blank"
                rel="noopener noreferrer"
                className="magnetic flex items-center gap-2 rounded-full bg-[#171513] px-6 py-3.5 font-accent text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#B83A2E]"
              >
                <FaGithub size={15} />
                GitHub
              </a>

              <a
                href="https://instagram.com/p7yu5h"
                target="_blank"
                rel="noopener noreferrer"
                className="magnetic flex items-center gap-2 rounded-full border border-[#171513] px-6 py-3.5 font-accent text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#171513] hover:text-white"
              >
                <FaInstagram size={15} />
                Instagram
              </a>

              <a
                href="mailto:piyush@p7yu5h.in"
                className="magnetic flex items-center gap-2 rounded-full border border-[#171513] px-6 py-3.5 font-accent text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#171513] hover:text-white"
              >
                <Mail size={15} />
                Email
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-[#171513] px-6 py-12 text-white lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.2em]">
                Ramen Cafe
              </p>

              <p className="mt-4 max-w-xs font-body text-sm leading-6 text-white/40">
                A digital cafe project created by Piyush Singh to explore how
                software can solve real-world business problems.
              </p>
            </div>

            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                Software Developer
              </p>

              <p className="mt-4 font-display text-3xl italic tracking-widest font-bold">
                PIYUSH SINGH
              </p>
            </div>

            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                Connect
              </p>

              <div className="mt-4 flex gap-4">
                <a
                  href="https://www.linkedin.com/in/p7yu5h-singh/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 transition-colors hover:text-white"
                  aria-label="Piyush Singh LinkedIn"
                >
                  <FaLinkedinIn size={17} />
                </a>

                <a
                  href="https://github.com/P7yush-Singh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 transition-colors hover:text-white"
                  aria-label="Piyush Singh GitHub"
                >
                  <FaGithub size={17} />
                </a>

                <a
                  href="https://instagram.com/p7yu5h"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 transition-colors hover:text-white"
                  aria-label="Piyush Singh Instagram"
                >
                  <FaInstagram size={17} />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-7">
            <p className="font-body text-[10px] text-white/30">
              © 2026 Ramen Cafe · Created by Piyush Singh
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
