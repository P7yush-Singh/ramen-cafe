import Link from "next/link";
import { ArrowRight, MapPin, Clock3 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* Navbar */}
      <nav className="border-b border-[#DED6C9]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B83A2E] text-sm font-semibold text-white">
              R
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10 lg:py-20">
          {/* Hero copy */}
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

            {/* Info */}
            <div className="mt-14 flex flex-wrap gap-8 border-t border-[#DED6C9] pt-7">
              <div className="flex items-center gap-3">
                <MapPin size={18} />

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6258]">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Delhi, India
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock3 size={18} />

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6258]">
                    Open Today
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    11:00 AM — 11:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero image */}
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

      {/* Story */}
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

      {/* Footer */}
      <footer className="bg-[#171513] px-6 py-10 text-white lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em]">
              RAMEN CAFE
            </p>

            <p className="mt-2 font-japanese text-sm text-white/50">
              ラーメンカフェ
            </p>
          </div>

          <p className="text-xs text-white/40">
            © 2026 Ramen Cafe. Crafted with care.
          </p>
        </div>
      </footer>
    </main>
  );
}