"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { Menu, Crown, Sparkles, Gem, ArrowRight } from "lucide-react";

const experiences = [
  {
    eyebrow: "MASQUERADE",
    title: "The Crown's Unveiling",
    date: "FRI 05 FEB 2027",
    gradient: "from-[#5b3a1a] via-[#17110c] to-black",
  },
  {
    eyebrow: "YACHT EXPERIENCE",
    title: "Silk & Sea",
    date: "SAT 06 FEB 2027",
    gradient: "from-[#263341] via-[#151617] to-black",
  },
  {
    eyebrow: "ROAD EXPERIENCE",
    title: "Monarchs of the Road",
    date: "MON 08 FEB 2027",
    gradient: "from-[#4b341e] via-[#15100b] to-black",
  },
];

const tagData = [
  {
    label: "VIP",
    icon: Crown,
    className: "left-2 top-[74px] sm:left-8",
    from: { x: -180, y: -110, rotate: -28, opacity: 0 },
    to: { x: 0, y: 0, rotate: -10, opacity: 1 },
    delay: 0.45,
  },
  {
    label: "ALL\nINCLUSIVE",
    icon: Sparkles,
    className: "right-0 top-[250px] sm:right-8",
    from: { x: 190, y: 60, rotate: 26, opacity: 0 },
    to: { x: 0, y: 0, rotate: -4, opacity: 1 },
    delay: 0.72,
  },
  {
    label: "CARNIVAL\n2027",
    icon: Gem,
    className: "left-10 top-[318px] sm:left-20",
    from: { x: -120, y: 190, rotate: 22, opacity: 0 },
    to: { x: 0, y: 0, rotate: 8, opacity: 1 },
    delay: 0.95,
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function MasHalo() {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-1/2 top-[92px] h-[330px] w-[330px] -translate-x-1/2 rounded-full opacity-90"
      initial={{ scale: 0.76, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(216,171,91,0.24),rgba(92,49,111,0.12)_32%,transparent_64%)] blur-sm" />
      <motion.div
        className="absolute inset-[42px] rounded-full border border-[#c79a52]/25"
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[70px] rounded-full border border-dashed border-[#d9b06b]/35"
        animate={{ rotate: -360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      />
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const radius = 135 + (i % 3) * 12;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[#d8ab5b] shadow-[0_0_18px_rgba(216,171,91,0.8)]"
            style={{ marginLeft: x, marginTop: y }}
            animate={{ opacity: [0.25, 0.95, 0.35], scale: [0.7, 1.25, 0.8] }}
            transition={{ duration: 3.8 + (i % 5) * 0.35, repeat: Infinity, delay: i * 0.11 }}
          />
        );
      })}
      <div className="absolute left-1/2 top-5 h-40 w-28 -translate-x-1/2 rounded-t-full border border-[#d8ab5b]/30 bg-[linear-gradient(120deg,rgba(216,171,91,0.18),rgba(21,84,86,0.16),transparent)] blur-[1px]" />
      <div className="absolute left-1/2 top-10 h-16 w-10 -translate-x-1/2 rounded-full border border-[#d8ab5b]/50 bg-[#0a1515]/40 shadow-[0_0_40px_rgba(40,160,150,0.35)]" />
    </motion.div>
  );
}

function FlyingTag({ item }: { item: (typeof tagData)[number] }) {
  const Icon = item.icon;
  return (
    <motion.div
      className={cn("absolute z-30", item.className)}
      initial={item.from}
      animate={{ ...item.to }}
      transition={{
        delay: item.delay,
        duration: 1.15,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0], x: [0, 4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: item.delay }}
        className="relative flex min-w-[118px] items-center gap-3 rounded-xl border border-[#d8ab5b]/35 bg-black/35 px-4 py-3 text-[#f1d19a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
      >
        <span className="absolute -left-10 top-1/2 h-[1px] w-12 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#d8ab5b] to-[#d8ab5b] opacity-70" />
        <span className="absolute -left-16 top-[54%] h-[1px] w-16 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f2c879]/60 to-transparent blur-[1px]" />
        <Icon size={17} className="shrink-0 text-[#d8ab5b]" />
        <span className="whitespace-pre-line text-[12px] font-medium uppercase tracking-[0.23em] leading-relaxed">
          {item.label}
        </span>
      </motion.div>
    </motion.div>
  );
}

function LuxuryPass({ rotateX, rotateY }: { rotateX: MotionValue<number>; rotateY: MotionValue<number> }) {
  return (
    <motion.div
      className="relative z-20 mx-auto mt-16 h-[190px] w-[335px] max-w-[92vw] origin-center"
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ y: 36, opacity: 0, scale: 0.88, rotateZ: -4 }}
      animate={{ y: [0, -10, 0], opacity: 1, scale: 1, rotateZ: [-4, -2.5, -4] }}
      transition={{
        opacity: { duration: 0.8 },
        scale: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
        rotateZ: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <div className="absolute -inset-7 rounded-[44px] bg-[radial-gradient(circle_at_60%_35%,rgba(216,171,91,0.38),transparent_46%),radial-gradient(circle_at_80%_72%,rgba(20,118,114,0.18),transparent_36%)] blur-2xl" />

      <div className="absolute inset-0 rounded-[30px] border border-[#f7cf7b]/60 bg-[linear-gradient(145deg,#f1cc7c,#7c5426_36%,#f7df9f_52%,#6f451e)] p-[4px] shadow-[0_34px_90px_rgba(0,0,0,0.8)]">
        <div className="relative h-full overflow-hidden rounded-[25px] border border-black/60 bg-[radial-gradient(circle_at_25%_45%,rgba(216,171,91,0.16),transparent_31%),linear-gradient(135deg,#050505,#16120c_38%,#080808_68%,#0a2524)]">
          <motion.div
            className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.04)_35%,rgba(255,231,176,0.32)_48%,rgba(255,255,255,0.04)_60%,transparent_100%)]"
            animate={{ x: ["-120%", "130%"] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
          />

          <div className="absolute left-0 top-1/2 h-14 w-7 -translate-y-1/2 rounded-r-full border-y border-r border-[#f5d28a]/65 bg-black" />
          <div className="absolute right-0 top-1/2 h-14 w-7 -translate-y-1/2 rounded-l-full border-y border-l border-[#f5d28a]/65 bg-black" />

          <div className="absolute left-7 top-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#d8ab5b]/25 bg-black/25 shadow-[inset_0_0_24px_rgba(216,171,91,0.1)]">
            <div className="absolute inset-3 rounded-full border border-dashed border-[#d8ab5b]/30" />
            <Sparkles className="h-12 w-12 text-[#d8ab5b] drop-shadow-[0_0_20px_rgba(216,171,91,0.55)]" />
          </div>

          <div className="absolute right-8 top-8 h-[122px] w-[132px] rounded-2xl border border-white/25 bg-white/[0.08] p-4 shadow-[inset_0_1px_3px_rgba(255,255,255,0.22),0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-sm">
            <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d8ab5b]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d8ab5b]" />
            <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-[#d8ab5b]" />
            <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-[#d8ab5b]" />
            <p className="text-center font-serif text-[13px] uppercase tracking-[0.22em] text-[#edd29f]">Midnight Mas</p>
            <p className="mt-1 text-center text-[8px] uppercase tracking-[0.28em] text-[#e9d1a0]/70">Invitation</p>
            <div className="mx-auto my-3 h-px w-16 bg-[#d8ab5b]/50" />
            <p className="text-center text-[9px] uppercase tracking-[0.25em] text-[#e9d1a0]/80">Trinidad Carnival</p>
            <p className="mt-1 text-center font-serif text-[30px] tracking-[0.16em] text-[#f1d19a]">2027</p>
            <p className="mt-2 text-center text-[8px] uppercase tracking-[0.28em] text-[#e9d1a0]/70">All Access</p>
          </div>

          <div className="absolute bottom-4 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#d8ab5b]/30 to-transparent" />
          <div className="absolute inset-0 opacity-[0.25] [background-image:radial-gradient(circle_at_1px_1px,rgba(216,171,91,0.55)_1px,transparent_0)] [background-size:14px_14px]" />
        </div>
      </div>
    </motion.div>
  );
}

export default function MidnightMasAnimatedHero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 90, damping: 18, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 90, damping: 18, mass: 0.4 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(px);
    mouseY.set(py);
  }

  function onPointerLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <main
      ref={heroRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="min-h-screen overflow-hidden bg-[#030303] text-[#f5dfb7]"
    >
      <section className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden px-5 pb-10 pt-6 sm:max-w-xl lg:max-w-6xl lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(216,171,91,0.2),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(23,116,111,0.13),transparent_26%),radial-gradient(circle_at_35%_24%,rgba(88,42,103,0.18),transparent_34%),linear-gradient(180deg,#050505,#090704_48%,#030303)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.08)_34%,#030303_94%)]" />
        <motion.div
          className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#d8ab5b]/10 blur-3xl"
          animate={{ opacity: [0.45, 0.75, 0.45], scale: [0.94, 1.07, 0.94] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <header className="relative z-40 flex items-center justify-between gap-3">
          <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }}>
            <p className="font-serif text-[22px] uppercase tracking-[0.28em] text-[#e8c178] sm:text-3xl">Midnight Mas</p>
            <p className="mt-1 text-center text-[9px] uppercase tracking-[0.45em] text-[#d8ab5b]/80">Invitation</p>
          </motion.div>

          <div className="flex items-center gap-3">
            <motion.a
              href="#access"
              whileTap={{ scale: 0.96 }}
              className="hidden rounded-lg border border-[#d8ab5b]/70 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e8c178] min-[390px]:block"
            >
              Request Access
            </motion.a>
            <motion.button
              aria-label="Open menu"
              whileTap={{ scale: 0.92 }}
              className="grid h-12 w-12 place-items-center rounded-full border border-[#d8ab5b]/45 bg-black/20 backdrop-blur-md"
            >
              <Menu size={20} />
            </motion.button>
          </div>
        </header>

        <div className="relative z-10 h-[490px] sm:h-[535px]">
          <MasHalo />
          <LuxuryPass rotateX={rotateX} rotateY={rotateY} />
          {tagData.map((item) => (
            <FlyingTag key={item.label} item={item} />
          ))}
        </div>

        <motion.div
          className="relative z-20"
          initial={{ opacity: 0, y: 36 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, delay: 1.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-8 bg-[#1cc5be]" />
            <p className="text-[11px] uppercase tracking-[0.38em] text-[#d8ab5b]">Caribbean Fetes &amp; Carnival 2027</p>
          </div>

          <h1 className="max-w-[12ch] font-serif text-[58px] leading-[0.98] tracking-[-0.04em] text-[#f2d9ad] sm:text-[76px] lg:max-w-[13ch] lg:text-[88px]">
            Your fete ticket, sorted.
          </h1>

          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#d8ab5b]/45" />
            <span className="h-2 w-2 rotate-45 border border-[#d8ab5b]" />
            <span className="h-px flex-1 bg-[#d8ab5b]/45" />
          </div>

          <p className="max-w-md text-[16px] leading-7 text-[#e8dfd2]/82">
            Find fetes across the Caribbean. Pay by bank transfer, get your QR ticket on WhatsApp, walk straight in. No cards, no chaos.
          </p>

          <div id="access" className="mt-7 space-y-4">
            <motion.a
              href="/discover"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="group flex h-16 items-center justify-center gap-4 rounded-lg bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] text-[13px] font-semibold uppercase tracking-[0.36em] text-black shadow-[0_18px_40px_rgba(185,133,63,0.34)]"
            >
              Find Your Next Fete
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </motion.a>
            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#e8dfd2]/65">
              <span>Selling tickets?</span>
              <a
                href="/sign-up?role=promoter"
                className="font-semibold text-[#d8ab5b] underline-offset-4 hover:underline"
              >
                Apply as a promoter →
              </a>
            </div>
          </div>

          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[#d8ab5b]/75">
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#d8ab5b]" aria-hidden />
              Bank transfer accepted
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#d8ab5b]" aria-hidden />
              QR delivered in 60s
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#d8ab5b]" aria-hidden />
              Refund guarantee
            </li>
          </ul>
        </motion.div>

        <section id="events" className="relative z-20 mt-8 space-y-3 pb-16">
          {experiences.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, delay: index * 0.1 }}
              className="group grid grid-cols-[112px_1fr_46px] items-center overflow-hidden rounded-xl border border-[#d8ab5b]/35 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              <div className={cn("h-[92px] bg-gradient-to-br", item.gradient)}>
                <div className="h-full w-full bg-[radial-gradient(circle_at_45%_35%,rgba(216,171,91,0.45),transparent_34%),radial-gradient(circle_at_70%_80%,rgba(20,118,114,0.18),transparent_36%)]" />
              </div>
              <div className="px-4">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#d8ab5b]">{item.eyebrow}</p>
                <h2 className="mt-2 font-serif text-[21px] leading-tight text-[#f1d19a]">{item.title}</h2>
                <p className="mt-2 text-[11px] uppercase tracking-[0.26em] text-[#eee1cc]/80">{item.date}</p>
              </div>
              <div className="pr-3">
                <motion.button
                  aria-label={`Open ${item.title}`}
                  whileTap={{ scale: 0.92 }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#d8ab5b]/45 text-[#d8ab5b] transition-colors group-hover:bg-[#d8ab5b] group-hover:text-black"
                >
                  <ArrowRight size={17} />
                </motion.button>
              </div>
            </motion.article>
          ))}
        </section>
      </section>
    </main>
  );
}
