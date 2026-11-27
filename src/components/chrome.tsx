import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { animate, motion, motionValue, useMotionValue, useTransform, type MotionValue } from "framer-motion";

/**
 * Homepage scroll interaction, ported from the Airtel homepage prototype
 * (randomtestyashish.github.io/homepage-intraction-dev, V1 "Top nav small icons"):
 *  - the top nav (menu · search · Scan QR) leaves on a downward scroll and returns only at the top;
 *  - the category tabs pin at the top and shrink to small icons, with a hairline under them;
 *  - the hero card eases back over the first 260px;
 *  - the bottom nav hides on the way down and comes back on the way up or when scrolling rests;
 *  - sections below the fold ease up into place the first time they're seen.
 */

const TOP_ZONE = 6;
const HIDE_DISTANCE = 10;
const FAST_VELOCITY = 0.5;
const FAST_DISTANCE = 8;
const SHOW_DISTANCE = 8;
const STOP_DELAY = 400;
const TABS_COMPACT_AT = 16;
const TABS_NORMAL_AT = 9;
export const HEADER_H = 69;

const HEADER_SPRING = { type: "spring" as const, stiffness: 400, damping: 35, mass: 0.8 };

export type Chrome = { hidden: MotionValue<number>; compact: MotionValue<number>; y: MotionValue<number>; navHidden: boolean };

export function useScrollChrome(ref: React.RefObject<HTMLElement>, deps: unknown[]): Chrome {
  const hidden = useMotionValue(0);
  const compact = useMotionValue(0);
  const y = useMotionValue(0);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    const page = ref.current;
    hidden.set(0);
    compact.set(0);
    y.set(page?.scrollTop ?? 0);
    setNavHidden(false);
    if (!page) return;
    let lastY = page.scrollTop;
    let lastTime = performance.now();
    let anchor = lastY;
    let direction = 0;
    let velocity = 0;
    let headerHidden = false;
    let nav = false;
    let tabsCompact = page.scrollTop > TABS_COMPACT_AT; // keep the shrunk tabs when a pose change lands mid-page
    compact.set(tabsCompact ? 1 : 0);
    let ticking = false;
    let stopTimer = 0;

    const setHeader = (h: boolean) => {
      if (h === headerHidden) return;
      headerHidden = h;
      animate(hidden, h ? 1 : 0, HEADER_SPRING);
    };
    const setNav = (h: boolean) => {
      if (h === nav) return;
      nav = h;
      setNavHidden(h);
    };
    const onRest = () => {
      velocity = 0;
      anchor = lastY;
      setNav(false);
    };
    const update = (now: number) => {
      ticking = false;
      const max = page.scrollHeight - page.clientHeight;
      const cy = Math.max(0, Math.min(page.scrollTop, max));
      const delta = cy - lastY;
      const next = Math.sign(delta);
      if (next !== 0) {
        velocity = 0.7 * (delta / Math.max(now - lastTime, 1)) + 0.3 * velocity;
        if (next !== direction) {
          direction = next;
          anchor = lastY;
        }
      }
      lastY = cy;
      lastTime = now;
      y.set(cy);
      const c = cy > (tabsCompact ? TABS_NORMAL_AT : TABS_COMPACT_AT);
      if (c !== tabsCompact) {
        tabsCompact = c;
        animate(compact, c ? 1 : 0, HEADER_SPRING);
      }
      if (cy <= TOP_ZONE) {
        setHeader(false);
        setNav(false);
      } else if (direction > 0) {
        const travelled = cy - anchor;
        if (travelled > HIDE_DISTANCE || (velocity > FAST_VELOCITY && travelled > FAST_DISTANCE)) {
          setHeader(true);
          setNav(true);
        }
      } else if (direction < 0 && anchor - cy > SHOW_DISTANCE) {
        setNav(false); // the header waits for the top of the page
      }
      clearTimeout(stopTimer);
      stopTimer = window.setTimeout(onRest, STOP_DELAY);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    page.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      page.removeEventListener("scroll", onScroll);
      clearTimeout(stopTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { hidden, compact, y, navHidden };
}

/** Header + tabs, pinned at the top. The header slides off; the tabs stay and shrink. */
export function StickyTop({ chrome, top = 0, header, tabs }: { chrome: Chrome; top?: number; header: React.ReactNode; tabs: React.ReactNode }) {
  const stickTop = useTransform(chrome.hidden, (h) => top - HEADER_H * h);
  const clip = useTransform(chrome.compact, (c) => `inset(0 0 ${(8 * c).toFixed(2)}px 0)`);
  const headerOpacity = useTransform(chrome.hidden, (h) => 0.6 + 0.4 * (1 - h));
  return (
    <motion.div className="sticky z-20 bg-white" style={{ top: stickTop, clipPath: clip, ["--compact" as string]: chrome.compact }}>
      <motion.div style={{ opacity: headerOpacity }}>{header}</motion.div>
      <div className="relative">
        {tabs}
        <motion.span className="pointer-events-none absolute inset-x-0 h-px bg-[#E6E9EF]" style={{ opacity: chrome.compact, bottom: useTransform(chrome.compact, (c) => 8 * c) }} />
      </div>
    </motion.div>
  );
}

/** Scroll position for the hero card's ease-back. */
const ScrollYContext = createContext<MotionValue<number>>(motionValue(0));
export const ScrollYProvider = ScrollYContext.Provider;
export function useHeroEase() {
  const y = useContext(ScrollYContext);
  const scale = useTransform(y, (v) => 1 - 0.02 * Math.min(1, v / 260));
  const opacity = useTransform(y, (v) => 1 - 0.06 * Math.min(1, v / 260));
  return { scale, opacity };
}

/** Eases a section up into place the first time it scrolls into view. */
export function Reveal({ children, off }: { children: React.ReactNode; off?: boolean }) {
  if (off) return <>{children}</>;
  return (
    <motion.div initial={{ opacity: 0.35, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }} transition={{ type: "spring", visualDuration: 0.5, bounce: 0 }}>
      {children}
    </motion.div>
  );
}

/** Wraps each child of a fragment (or array) in Reveal. */
export function revealEach(node: React.ReactNode, off?: boolean): React.ReactNode {
  const kids = React.isValidElement(node) && node.type === React.Fragment ? (node.props as { children: React.ReactNode }).children : node;
  return React.Children.map(kids, (k, i) => (
    <Reveal key={i} off={off}>
      {k}
    </Reveal>
  ));
}
