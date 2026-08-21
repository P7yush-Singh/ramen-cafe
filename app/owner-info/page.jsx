import Image from "next/image";

import {
  ArrowUpRight,
  Mail,
  MapPin,
  Code2,
  Lightbulb,
  Rocket,
  Utensils,
  ExternalLink,
} from "lucide-react";

import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

export const metadata = {
  title: "Piyush Singh — Developer, Builder & Creator of Ramen Cafe",

  description:
    "Learn about Piyush Singh, the developer and creator behind Ramen Cafe. Discover his background, projects, the idea behind Ramen Cafe, the problems it aims to solve, and his journey of building digital products.",

  keywords: [
    "Piyush Singh",
    "Piyush Singh Developer",
    "Piyush Singh Delhi",
    "Ramen Cafe",
    "Ramen Cafe Project",
    "Ramen Cafe Delhi",
    "Piyush Singh Projects",
    "Full Stack Developer",
    "Web Developer India",
    "Ramen Cafe Owner",
  ],

  authors: [
    {
      name: "Piyush Singh",
      url: "https://p7yu5h.in",
    },
  ],

  creator: "Piyush Singh",

  openGraph: {
    title:
      "Piyush Singh — Developer, Builder & Creator of Ramen Cafe",

    description:
      "The story behind Piyush Singh, his projects, and the idea behind Ramen Cafe.",

    type: "profile",

    url: "https://p7yu5h.in/owner-info",

    siteName: "Ramen Cafe",

    images: [
      {
        url: "/owner/PiyushSingh.jpeg",
        width: 1200,
        height: 630,
        alt: "Piyush Singh",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Piyush Singh — Developer & Creator of Ramen Cafe",

    description:
      "Discover the person, projects and ideas behind Ramen Cafe.",

    images: [
      "/owner/PiyushSingh.jpeg",
    ],
  },
};

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/p7yu5h-singh/",
    icon: FaLinkedinIn,
  },

  {
    name: "GitHub",
    href: "https://github.com/P7yush-Singh",
    icon: FaGithub,
  },

  {
    name: "Instagram",
    href: "https://instagram.com/p7yu5h",
    icon: FaInstagram,
  },

  {
    name: "Portfolio",
    href: "https://p7yu5h.in",
    icon: ExternalLink,
  },
];

export default function OwnerInfoPage() {
  const personSchema = {
    "@context": "https://schema.org",

    "@type": "Person",

    name: "Piyush Singh",

    url: "https://p7yu5h.in",

    image: "/owner/PiyushSingh.jpeg",

    jobTitle: "Software Developer",

    sameAs: [
      "https://www.linkedin.com/in/p7yu5h-singh/",
      "https://github.com/P7yush-Singh",
      "https://instagram.com/p7yu5h",
      "https://p7yu5h.in",
    ],

    knowsAbout: [
      "Web Development",
      "Full Stack Development",
      "JavaScript",
      "React",
      "Next.js",
      "Node.js",
      "MongoDB",
      "Software Engineering",
    ],
  };

  const projectSchema = {
    "@context": "https://schema.org",

    "@type": "SoftwareApplication",

    name: "Ramen Cafe",

    applicationCategory: "BusinessApplication",

    description:
      "A digital cafe ordering and management platform created for Ramen Cafe.",

    creator: {
      "@type": "Person",

      name: "Piyush Singh",

      url: "https://p7yu5h.in",
    },
  };

  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#171513]">
      {/* =========================
          STRUCTURED DATA
      ========================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectSchema),
        }}
      />

      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-[#DED6C9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
              Ramen Cafe
            </p>

            <p className="mt-1 text-sm text-[#6B6258]">
              Behind the project
            </p>
          </div>

          <a
            href="/"
            className="flex items-center gap-2 text-sm font-medium transition hover:text-[#B83A2E]"
          >
            Visit Ramen Cafe

            <ArrowUpRight size={16} />
          </a>
        </div>
      </header>

      {/* =========================
          HERO
      ========================== */}

      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1fr_0.8fr] lg:px-10 lg:py-28">
          {/* Hero Content */}

          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-[#B83A2E]" />

              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                The person behind Ramen Cafe
              </span>
            </div>

            <h1 className="max-w-4xl text-5xl font-medium leading-[0.95] tracking-tighter sm:text-6xl lg:text-7xl">
              Hi, I&apos;m
              <br />

              <span className="font-japanese font-normal">
                Piyush Singh.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#6B6258]">
              I&apos;m a software developer and builder who enjoys
              turning ideas into real, usable products. Ramen Cafe
              is one of the projects where I&apos;m combining
              technology, product thinking and a real-world
              business experience into one platform.
            </p>

            {/* Social Links */}

            <div className="mt-9 flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-[#171513] px-5 py-3 text-sm font-medium transition hover:bg-[#171513] hover:text-white"
                  >
                    <Icon size={16} />

                    {social.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Personal Image */}

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full border border-[#B83A2E]/30" />

            <div className="absolute -bottom-7 -left-7 h-36 w-36 rounded-full bg-[#B83A2E]/10" />

            <div className="relative z-10 overflow-hidden rounded-[2rem] border border-[#DED6C9] bg-[#FFFDF8] p-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#DED6C9]">
                <Image
                  src="/owner/PiyushSingh.jpeg"
                  alt="Piyush Singh"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          ABOUT ME
      ========================== */}

      <section className="border-t border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                About Me
              </p>

              <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
                Building instead of just learning.
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-8 text-[#6B6258]">
              <p>
                I&apos;m Piyush Singh, a developer interested in
                building practical software products rather than
                only working on tutorials or small practice projects.
              </p>

              <p>
                My approach is simple: find a real problem,
                understand how people currently solve it, design
                a better workflow and then build the technology
                around that workflow.
              </p>

              <p>
                Over time, I&apos;ve worked on different kinds of web
                applications and product ideas. Ramen Cafe is
                particularly interesting to me because it connects
                software development with an actual physical
                business experience.
              </p>

              <p>
                The goal is not simply to make a website that looks
                good. The goal is to create a system that can
                actually be used by customers and the cafe team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          MY APPROACH
      ========================== */}

      <section className="border-t border-[#DED6C9]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
              How I Think
            </p>

            <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
              I like solving the whole problem.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Card 1 */}

            <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B83A2E]/10">
                <Lightbulb
                  size={22}
                  className="text-[#B83A2E]"
                />
              </div>

              <h3 className="mt-7 text-xl font-semibold">
                Start With The Problem
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#6B6258]">
                Before writing code, I try to understand what is
                actually creating friction for the customer or
                business.
              </p>
            </div>

            {/* Card 2 */}

            <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B83A2E]/10">
                <Code2
                  size={22}
                  className="text-[#B83A2E]"
                />
              </div>

              <h3 className="mt-7 text-xl font-semibold">
                Build The System
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#6B6258]">
                I focus on turning the workflow into a reliable
                product, including frontend experience, backend
                logic, data and administration.
              </p>
            </div>

            {/* Card 3 */}

            <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B83A2E]/10">
                <Rocket
                  size={22}
                  className="text-[#B83A2E]"
                />
              </div>

              <h3 className="mt-7 text-xl font-semibold">
                Keep Improving
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#6B6258]">
                A product is never finished after the first
                deployment. Feedback, bugs and real usage reveal
                what should come next.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          RAMEN CAFE STORY
      ========================== */}

      <section className="border-t border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
              Current Project
            </p>

            <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-6xl">
              Why I built Ramen Cafe.
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Project Image */}

            <div className="relative overflow-hidden rounded-[2rem] bg-[#171513]">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/projects/ramen-cafe.jpg"
                  alt="Ramen Cafe project"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-[#171513]/90 p-5 text-white backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <Utensils size={20} />

                  <div>
                    <p className="font-semibold">
                      Ramen Cafe
                    </p>

                    <p className="text-xs text-white/50">
                      A real-world digital cafe platform
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Story */}

            <div>
              <p className="text-lg leading-8 text-[#6B6258]">
                Ramen Cafe started from a simple thought: a cafe
                does not only need a beautiful website. It needs a
                digital system that supports the actual customer
                journey and the operations behind it.
              </p>

              <p className="mt-6 text-lg leading-8 text-[#6B6258]">
                Instead of treating the project as a static
                restaurant website, I wanted to build something
                closer to a real product — where customers can
                explore the menu, customize their orders, check
                out and interact with the cafe through a structured
                digital workflow.
              </p>

              <p className="mt-6 text-lg leading-8 text-[#6B6258]">
                At the same time, the cafe side needs tools for
                managing products, orders and the operational
                information required to run the business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          THE PROBLEM
      ========================== */}

      <section className="border-t border-[#DED6C9]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                The Problem
              </p>

              <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
                What problem is Ramen Cafe trying to solve?
              </h2>
            </div>

            <div className="space-y-4">
              {[
                "Customers often have to depend on manual ordering workflows.",

                "Menu information can become difficult to maintain when it is handled manually.",

                "Orders, add-ons and pricing need to stay consistent across the customer experience.",

                "The business needs a structured way to manage products and orders.",

                "Billing and payment information should be connected to the actual order rather than handled as disconnected information.",

                "The digital experience should feel like part of the cafe rather than just another generic restaurant website.",
              ].map((problem, index) => (
                <div
                  key={problem}
                  className="flex gap-5 rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] p-6"
                >
                  <span className="font-mono text-sm text-[#B83A2E]">
                    0{index + 1}
                  </span>

                  <p className="text-base leading-7 text-[#6B6258]">
                    {problem}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          WHAT I BUILT
      ========================== */}

      <section className="border-t border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
              Inside The Project
            </p>

            <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
              More than a landing page.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#6B6258]">
              The project is designed as a complete customer and
              administration workflow rather than only a marketing
              website.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Digital Menu",
                text: "Customers can browse available products and understand what the cafe offers.",
              },

              {
                title: "Ordering Flow",
                text: "The customer journey is structured from product selection through checkout.",
              },

              {
                title: "Add-ons & Pricing",
                text: "Orders can account for additional selections and their associated pricing.",
              },

              {
                title: "Order Management",
                text: "Orders are stored and managed through a dedicated backend workflow.",
              },

              {
                title: "Products Management",
                text: "Cafe products can be managed through the administration side of the platform.",
              },

              {
                title: "Billing Workflow",
                text: "The system is designed around bill requests, payment confirmation and order receipts.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-[#DED6C9] p-7"
              >
                <h3 className="text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#6B6258]">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          TECHNOLOGY
      ========================== */}

      <section className="border-t border-[#DED6C9]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                Technology
              </p>

              <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
                Built with modern web technologies.
              </h2>

              <p className="mt-5 text-base leading-7 text-[#6B6258]">
                Ramen Cafe uses a modern JavaScript-based web
                stack to connect the customer-facing experience
                with the application backend and database.
              </p>
            </div>

            <div className="flex flex-wrap content-start gap-3">
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
                <span
                  key={technology}
                  className="rounded-full border border-[#DED6C9] bg-[#FFFDF8] px-5 py-3 text-sm font-medium"
                >
                  {technology}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CURRENT STATUS
      ========================== */}

      <section className="border-t border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="rounded-[2rem] bg-[#171513] p-8 text-white sm:p-12 lg:p-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                  Where It Is Today
                </p>

                <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
                  Ramen Cafe is becoming a real product.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-7 text-white/60">
                  The core customer and administration workflow
                  has already been developed. The focus now is on
                  refining the remaining details, fixing edge
                  cases and improving the overall experience so
                  the platform feels ready for real-world use.
                </p>
              </div>

              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10">
                <span className="font-japanese text-4xl">
                  進む
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          WHAT'S NEXT
      ========================== */}

      <section className="border-t border-[#DED6C9]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                What&apos;s Next
              </p>

              <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
                Keep building.
              </h2>
            </div>

            <div>
              <p className="text-xl leading-9 text-[#6B6258]">
                Ramen Cafe is not meant to be the final project.
                It is part of a larger journey of learning how to
                take an idea from concept to product —
                understanding the problem, designing the
                experience, writing the software, deploying it
                and then improving it based on real usage.
              </p>

              <p className="mt-6 text-xl leading-9 text-[#6B6258]">
                Every project creates another opportunity to learn
                something new and build something better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CONNECT WITH ME
      ========================== */}

      <section className="border-t border-[#DED6C9] bg-[#FFFDF8]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
              Connect With Me
            </p>

            <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl">
              Follow the journey.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#6B6258]">
              I&apos;m always building, learning and experimenting
              with new ideas. You can find my work and professional
              journey through the links below.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {/* LinkedIn */}

              <a
                href="https://www.linkedin.com/in/p7yu5h-singh/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-[#171513] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B83A2E]"
              >
                <FaLinkedinIn size={17} />

                LinkedIn
              </a>

              {/* GitHub */}

              <a
                href="https://github.com/P7yush-Singh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-[#171513] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B83A2E]"
              >
                <FaGithub size={17} />

                GitHub
              </a>

              {/* Instagram */}

              <a
                href="https://instagram.com/p7yu5h"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-[#171513] px-6 py-3 text-sm font-semibold transition hover:bg-[#171513] hover:text-white"
              >
                <FaInstagram size={17} />

                Instagram
              </a>

              {/* Email */}

              <a
                href="mailto:piyush@p7yu5h.in"
                className="flex items-center gap-2 rounded-full border border-[#171513] px-6 py-3 text-sm font-semibold transition hover:bg-[#171513] hover:text-white"
              >
                <Mail size={17} />

                Email
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="bg-[#171513] px-6 py-12 text-white lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand */}

            <div>
              <p className="text-sm font-semibold tracking-[0.2em]">
                RAMEN CAFE
              </p>

              <p className="mt-2 font-japanese text-sm text-white/50">
                ラーメンカフェ
              </p>

              <p className="mt-5 max-w-xs text-sm leading-6 text-white/40">
                A real-world cafe project built by Piyush Singh.
              </p>
            </div>

            {/* Owner */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Owner
              </p>

              <p className="mt-5 text-lg font-medium">
                Piyush Singh
              </p>

              <p className="mt-2 text-sm text-white/40">
                Developer & Builder
              </p>
            </div>

            {/* Location */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Location
              </p>

              <div className="mt-5 flex items-start gap-3 text-sm text-white/60">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  Mayur Vihar Phase-1 Metro Station,
                  <br />
                  Delhi, India
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
            <p className="text-xs text-white/40">
              © 2026 Ramen Cafe. Built by Piyush Singh.
            </p>

            <div className="flex items-center gap-4">
              {/* LinkedIn */}

              <a
                href="https://www.linkedin.com/in/p7yu5h-singh/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 transition hover:text-white"
                aria-label="Piyush Singh LinkedIn"
              >
                <FaLinkedinIn size={18} />
              </a>

              {/* GitHub */}

              <a
                href="https://github.com/P7yush-Singh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 transition hover:text-white"
                aria-label="Piyush Singh GitHub"
              >
                <FaGithub size={18} />
              </a>

              {/* Instagram */}

              <a
                href="https://instagram.com/p7yu5h"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 transition hover:text-white"
                aria-label="Piyush Singh Instagram"
              >
                <FaInstagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}