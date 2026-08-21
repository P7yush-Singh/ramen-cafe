import Link from "next/link";

import {
  ArrowRight,
  MapPin,
  Clock3,
  Mail,
  ExternalLink,
} from "lucide-react";

import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* =========================
          NAVBAR
      ========================== */}

      <nav className="border-b border-[#DED6C9]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full">
              <Image
                src="/logo.png"
                alt="Ramen Cafe Logo"
                width={50}
                height={50}
              />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-[0.2em]">
                RAMEN CAFE
              </p>

              <p className="font-japanese text-xs text-[#6B6258]">
                ラーメンカフェ
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}

          <div className="hidden items-center gap-8 text-sm md:flex">
            <Link
              href="#story"
              className="transition hover:text-[#B83A2E]"
            >
              Our Story
            </Link>

            <Link
              href="/menu"
              className="transition hover:text-[#B83A2E]"
            >
              Menu
            </Link>

            <Link
              href="#location"
              className="transition hover:text-[#B83A2E]"
            >
              Location
            </Link>

            <Link
              href="#contact"
              className="transition hover:text-[#B83A2E]"
            >
              Contact
            </Link>
          </div>

          <Link
            href="/menu"
            className="flex items-center gap-2 rounded-full bg-[#171513] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#B83A2E]"
          >
            View Menu

            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* =========================
          HERO
      ========================== */}

      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10 lg:py-20">
          {/* Hero Copy */}

          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-[#B83A2E]" />

              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                Tokyo inspired
              </span>
            </div>

            <h1 className="max-w-3xl text-6xl font-medium leading-[0.95] tracking-tighter sm:text-7xl lg:text-8xl">
              Ramen made
              <br />

              <span className="font-japanese font-normal">
                with soul.
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-7 text-[#6B6258] sm:text-lg">
              Slow-simmered broths, handmade noodles and carefully
              selected ingredients. A little taste of Japan, served
              right at your table.
            </p>

            {/* Hero Buttons */}

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/menu"
                className="group flex items-center gap-3 rounded-full bg-[#B83A2E] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#171513]"
              >
                Explore Menu

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#story"
                className="rounded-full border border-[#171513] px-7 py-4 text-sm font-semibold transition hover:bg-[#171513] hover:text-white"
              >
                Our Story
              </Link>
            </div>

            {/* Quick Info */}

            <div className="mt-14 flex flex-wrap gap-8 border-t border-[#DED6C9] pt-7">
              {/* Location */}

              <div className="flex items-center gap-3">
                <MapPin size={18} />

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6258]">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    Mayur Vihar Phase-1
                  </p>
                </div>
              </div>

              {/* Opening Hours */}

              <div className="flex items-center gap-3">
                <Clock3 size={18} />

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6258]">
                    Open Today
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    3:00 PM — 12:00 AM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}

          <div className="relative">
            <div className="absolute -right-6 -top-6 z-0 h-32 w-32 rounded-full border border-[#B83A2E]/30" />

            <div className="absolute -bottom-8 -left-8 z-0 h-40 w-40 rounded-full bg-[#B83A2E]/10" />

            <div className="relative z-10 overflow-hidden rounded-4xl">
              <img
                src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85"
                alt="Japanese ramen bowl"
                className="h-137.5 w-full object-cover"
              />

              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-[#171513]/90 p-5 text-white backdrop-blur-md">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-japanese text-2xl">
                      一杯の幸せ
                    </p>

                    <p className="mt-1 text-xs text-white/60">
                      One bowl of happiness.
                    </p>
                  </div>

                  <span className="text-3xl">🍜</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          STORY
      ========================== */}

      <section
        id="story"
        className="border-t border-[#DED6C9] bg-[#FFFDF8]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                Our Philosophy
              </p>

              <h2 className="mt-5 font-japanese text-4xl leading-tight sm:text-5xl">
                食を楽しむ
              </h2>

              <p className="mt-3 text-sm text-[#6B6258]">
                Enjoy the food.
              </p>
            </div>

            <div>
              <p className="max-w-3xl text-2xl leading-relaxed tracking-tight sm:text-3xl">
                We believe a great bowl of ramen is more than
                food. It is warmth, patience, craft and a moment
                worth slowing down for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          LOCATION
      ========================== */}

      <section
        id="location"
        className="border-t border-[#DED6C9] bg-[#F5F0E8]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
              Find Us
            </p>

            <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
              Come visit Ramen Cafe.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#6B6258]">
              Drop by for a warm bowl of ramen, good food and a
              relaxed cafe experience in Delhi.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] lg:grid-cols-2">
            {/* Address */}

            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B83A2E]/10">
                <MapPin
                  className="text-[#B83A2E]"
                  size={22}
                />
              </div>

              <h3 className="mt-7 text-2xl font-semibold">
                Location
              </h3>

              <p className="mt-4 max-w-md text-base leading-7 text-[#6B6258]">
                Mayur Vihar Phase-1 Metro Station,
                <br />
                Delhi, India
              </p>

              {/* Opening Hours */}

              <div className="mt-8 border-t border-[#DED6C9] pt-7">
                <div className="flex items-start gap-4">
                  <Clock3
                    size={20}
                    className="mt-1 shrink-0"
                  />

                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#6B6258]">
                      Opening Hours
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      3:00 PM — 12:00 AM
                    </p>

                    <p className="mt-1 text-sm text-[#6B6258]">
                      Open every day
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Maps Link */}

              <a
                href="https://www.google.com/maps/search/?api=1&query=Mayur+Vihar+Phase-1+Metro+Station+Delhi"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#171513] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B83A2E]"
              >
                Get Directions

                <ExternalLink size={15} />
              </a>
            </div>

            {/* Google Map */}

            <div className="min-h-100 lg:min-h-full">
              <iframe
                title="Ramen Cafe Location"
                src="https://www.google.com/maps?q=Mayur%20Vihar%20Phase-1%20Metro%20Station%20Delhi&output=embed"
                className="h-full min-h-100 w-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CONTACT
      ========================== */}

      <section
        id="contact"
        className="border-t border-[#DED6C9] bg-[#FFFDF8]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                Contact
              </p>

              <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
                Let&apos;s connect.
              </h2>

              <p className="mt-5 max-w-md text-base leading-7 text-[#6B6258]">
                Have a question, feedback or simply want to know
                more about Ramen Cafe? Reach out to us.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email */}

              <a
                href="mailto:piyush@p7yu5h.in"
                className="group rounded-3xl border border-[#DED6C9] bg-[#F5F0E8] p-7 transition hover:-translate-y-1 hover:border-[#B83A2E]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B83A2E]/10">
                  <Mail
                    size={20}
                    className="text-[#B83A2E]"
                  />
                </div>

                <p className="mt-6 text-xs uppercase tracking-wider text-[#6B6258]">
                  Email
                </p>

                <p className="mt-2 break-all text-base font-semibold group-hover:text-[#B83A2E]">
                  piyush@p7yu5h.in
                </p>
              </a>

              {/* Instagram */}

              <a
                href="https://instagram.com/p7yu5h"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border border-[#DED6C9] bg-[#F5F0E8] p-7 transition hover:-translate-y-1 hover:border-[#B83A2E]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B83A2E]/10">
                  <FaInstagram
                    size={20}
                    className="text-[#B83A2E]"
                  />
                </div>

                <p className="mt-6 text-xs uppercase tracking-wider text-[#6B6258]">
                  Instagram
                </p>

                <p className="mt-2 text-base font-semibold group-hover:text-[#B83A2E]">
                  @p7yu5h
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          OWNER
      ========================== */}

      <section className="border-t border-[#DED6C9] bg-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="rounded-3xl bg-[#171513] p-8 text-white sm:p-12 lg:p-16">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B83A2E]">
                  The Owner
                </p>

                <h2 className="mt-5 flex text-4xl font-medium tracking-[0.04em] sm:text-5xl">
                  Piyush Singh
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
                  Ramen Cafe is built with a simple idea — create
                  a place where great food, thoughtful experiences
                  and the warmth of a local cafe come together.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {/* LinkedIn */}

                  <a
                    href="https://www.linkedin.com/in/p7yu5h-singh/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium transition hover:border-white hover:bg-white hover:text-[#171513]"
                  >
                    <FaLinkedinIn size={17} />

                    LinkedIn
                  </a>

                  {/* GitHub */}

                  <a
                    href="https://github.com/P7yush-Singh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium transition hover:border-white hover:bg-white hover:text-[#171513]"
                  >
                    <FaGithub size={17} />

                    GitHub
                  </a>
                </div>
              </div>

              {/* Japanese Owner Text */}

              <div className="hidden lg:block">
                <p className="font-japanese text-7xl text-white/10">
                  店主
                </p>

                <p className="mt-2 text-right text-xs uppercase tracking-[0.3em] text-white/30">
                  Owner
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="bg-[#171513] px-6 py-12 text-white lg:px-10">
        <div className="mx-auto max-w-7xl">
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
                Tokyo-inspired ramen, carefully crafted and served
                with warmth in Delhi.
              </p>
            </div>

            {/* Quick Links */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Explore
              </p>

              <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
                <Link
                  href="/menu"
                  className="transition hover:text-white"
                >
                  Menu
                </Link>

                <Link
                  href="#story"
                  className="transition hover:text-white"
                >
                  Our Story
                </Link>

                <Link
                  href="#location"
                  className="transition hover:text-white"
                >
                  Location
                </Link>

                <Link
                  href="#contact"
                  className="transition hover:text-white"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Contact / Visit Us */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Visit Us
              </p>

              <div className="mt-5 space-y-4 text-sm text-white/70">
                {/* Location */}

                <div className="flex items-start gap-3">
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-white/50"
                  />

                  <span>
                    Mayur Vihar Phase-1 Metro Station,
                    <br />
                    Delhi, India
                  </span>
                </div>

                {/* Hours */}

                <div className="flex items-center gap-3">
                  <Clock3
                    size={17}
                    className="shrink-0 text-white/50"
                  />

                  <span>3:00 PM — 12:00 AM</span>
                </div>

                {/* Email */}

                <a
                  href="mailto:piyush@p7yu5h.in"
                  className="flex items-center gap-3 transition hover:text-white"
                >
                  <Mail
                    size={17}
                    className="shrink-0 text-white/50"
                  />

                  <span>piyush@p7yu5h.in</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
            <p className="text-xs text-white/40">
              © 2026 Ramen Cafe. Crafted with care.
            </p>

            {/* Social Icons */}

            <div className="flex items-center gap-4">
              {/* Instagram */}

              <a
                href="https://instagram.com/p7yu5h"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ramen Cafe Instagram"
                className="text-white/50 transition hover:text-white"
              >
                <FaInstagram size={18} />
              </a>

              {/* LinkedIn */}

              <a
                href="https://www.linkedin.com/in/p7yu5h-singh/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Piyush Singh LinkedIn"
                className="text-white/50 transition hover:text-white"
              >
                <FaLinkedinIn size={18} />
              </a>

              {/* GitHub */}

              <a
                href="https://github.com/P7yush-Singh"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Piyush Singh GitHub"
                className="text-white/50 transition hover:text-white"
              >
                <FaGithub size={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}