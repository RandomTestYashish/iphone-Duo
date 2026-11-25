import * as React from "react";
import { useEffect, useRef } from "react";
import { home } from "@/assets/home";
import { cn } from "@/utils";

/** Card 1 surface (Gen4): white→#F5F5F5 gradient with #E6E9EF stroke. */
export const CARD = "border border-[#E6E9EF] bg-[linear-gradient(180deg,#FFFFFF,#F5F5F5)]";

/** Section Title ✅ — Inter Bold 11/12, tracking 1.76px, uppercase, #3E4146. */
export function SectionTitle({ children, action, tracking = 1.76, className }: { children: React.ReactNode; action?: React.ReactNode; tracking?: number; className?: string }) {
  return (
    <div className={cn("flex w-[343px] items-start gap-2", className)}>
      <p className="flex-1 text-[11px] font-bold uppercase leading-[12px] text-[#3E4146]" style={{ letterSpacing: tracking }}>
        {children}
      </p>
      {action}
    </div>
  );
}

/** Clip Tag ✅ — gradient label with SVG ankles. */
export function ClipTag({ children, size, tone = "red" }: { children: React.ReactNode; size: "lg" | "sm"; tone?: "red" | "dark" | "green" }) {
  const lg = size === "lg";
  const bg = tone === "green" ? "linear-gradient(180deg,#22A45D,#0F7033)" : tone === "dark" || !lg ? "linear-gradient(0deg,#000,#2D2B2B)" : "linear-gradient(180deg,#FC5252,#E32121)";
  const useRed = lg && tone === "red";
  return (
    <div className="flex items-center" style={{ height: lg ? 20 : 16 }}>
      <img src={home(useRed ? "clip-left-lg.svg" : "clip-left-sm.svg")} alt="" style={{ width: lg ? 13.012 : 10.41, height: lg ? 20 : 16, filter: tone === "green" ? "hue-rotate(140deg) saturate(1.4)" : undefined }} />
      <div className={cn("flex items-center justify-center whitespace-nowrap px-0.5 py-[2px] font-bold italic text-white", lg ? "h-5 text-[12px] leading-[14px]" : "h-4 text-[10px] leading-[12px]")} style={{ backgroundImage: bg }}>
        {children}
      </div>
      <img src={home(useRed ? "clip-right-lg.svg" : "clip-right-sm.svg")} alt="" style={{ width: lg ? 13.012 : 10.409, height: lg ? 20 : 16, filter: tone === "green" ? "hue-rotate(140deg) saturate(1.4)" : undefined }} />
    </div>
  );
}

export function Arrow({ src, size, className }: { src: string; size: number; className?: string }) {
  return (
    <span className={cn("relative block", className)} style={{ width: size, height: size, padding: size * 0.0833 }}>
      <img src={home(src)} alt="" className="size-full" />
    </span>
  );
}

/**
 * Horizontal carousels: native touch scrolling plus click-and-drag with a mouse,
 * so the desktop preview behaves like a finger swipe. A drag never fires the tile's click.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false, startX = 0, startLeft = 0, moved = 0;
    const snap = el.style.scrollSnapType;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = 0; startX = e.clientX; startLeft = el.scrollLeft;
      el.style.scrollSnapType = "none";
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.style.scrollSnapType = snap;
    };
    const onClick = (e: MouseEvent) => {
      if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);
  return ref;
}

/** iOS status bar (Status Bar/iPhone 11–Light) drawn in SVG so it stays crisp at any width. */
export function StatusBar({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none flex h-[44px] items-center justify-between px-[26px] pt-[3px]", className)}>
      <span className="w-[54px] text-center text-[15px] font-semibold tracking-[-0.3px] text-black">9:41</span>
      <span className="flex items-center gap-[5px]">
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 5} y={9 - i * 3} width="3" height={3 + i * 3} rx="1" fill="#000" />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden>
          <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1-1.1C13.1 2.1 10.7 1 8 1S2.9 2.1 1 3.9L2 5c1.6-1.5 3.7-2.4 6-2.4Z" fill="#000" />
          <path d="M8 5.9c1.4 0 2.7.5 3.7 1.4l1-1.1C11.4 5 9.8 4.3 8 4.3S4.6 5 3.3 6.2l1 1.1c1-.9 2.3-1.4 3.7-1.4Z" fill="#000" />
          <path d="M8 9.1c.6 0 1.1.2 1.5.6L8 11.3 6.5 9.7c.4-.4.9-.6 1.5-.6Z" fill="#000" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden>
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="#000" opacity=".35" fill="none" />
          <rect x="2" y="2" width="19" height="8" rx="1.6" fill="#000" />
          <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fill="#000" opacity=".4" />
        </svg>
      </span>
    </div>
  );
}
