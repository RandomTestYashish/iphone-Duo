import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Columns2, Keyboard, Maximize2, RectangleVertical, ScanLine, Smartphone } from "lucide-react";
import { Home } from "@/components/Home";
import { cn } from "@/utils";

/**
 * iPhone Duo preview: a book-style foldable.
 *   Folded  → 375 × 812 cover screen (Figma 81735:10718)
 *   Unfolded → 760 × 812 inner screen, two 375 panes around a 10 px hinge (Figma 81737:1054)
 */

const SCREEN_H = 812;
const BEZEL = 12;
const FINISHES = [
  { id: "titanium", label: "Natural Titanium", body: "linear-gradient(145deg,#d9d6d0,#b9b5ad 45%,#e4e1db)", edge: "#a7a39b" },
  { id: "black", label: "Black Titanium", body: "linear-gradient(145deg,#4a4a4d,#2a2a2d 45%,#545457)", edge: "#1f1f21" },
  { id: "desert", label: "Desert Titanium", body: "linear-gradient(145deg,#e3cdb6,#c4a888 45%,#ead8c5)", edge: "#a98d6f" },
  { id: "blue", label: "Ice Blue", body: "linear-gradient(145deg,#cfdbe8,#a9bccf 45%,#dde6ef)", edge: "#8ea2b7" },
];

type Posture = "folded" | "unfolded";

export function App() {
  const [posture, setPosture] = useState<Posture>(() => (new URLSearchParams(location.search).get("posture") === "folded" ? "folded" : "unfolded"));
  const [wide, setWide] = useState(posture === "unfolded");
  const [fading, setFading] = useState(false);
  const [hinge, setHinge] = useState(false);
  const [zoom, setZoom] = useState<"fit" | "100">("fit");
  const [finish, setFinish] = useState(FINISHES[0]);
  const [help, setHelp] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 1200, h: 900 });

  const screenW = posture === "unfolded" ? 760 : 375;
  const devW = screenW + BEZEL * 2;
  const devH = SCREEN_H + BEZEL * 2;

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the unfolded width so the device doesn't jump in scale when it folds.
  const scale = zoom === "100" ? 1 : Math.min(1, (avail.w - 32) / (760 + BEZEL * 2 + 8), (avail.h - 32) / (devH + 8));

  const fold = (p: Posture) => {
    if (p === posture) return;
    setFading(true);
    setPosture(p);
    // Swap the layout part-way through the hinge animation, like the OS does on a real foldable.
    setTimeout(() => setWide(p === "unfolded"), 200);
    setTimeout(() => setFading(false), 380);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.key === "f" || e.key === "F") fold(posture === "unfolded" ? "folded" : "unfolded");
      if (e.key === "g" || e.key === "G") setHinge((h) => !h);
      if (e.key === "0") setZoom((z) => (z === "fit" ? "100" : "fit"));
      if (e.key === "?") setHelp((h) => !h);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_50%_20%,#F7F9FC,#E3E8EF_70%)]">
      {/* Viewer toolbar */}
      <header className="z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/5 bg-white/70 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="mr-auto flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#292C31] text-white">
            <Columns2 className="size-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] font-bold text-[#292C31]">iPhone Duo · Manage Landing</p>
            <p className="truncate text-[11px] text-[#696B6F]">{posture === "unfolded" ? "Unfolded · 760 × 812 · two panes" : "Folded · 375 × 812 · cover screen"}</p>
          </div>
        </div>

        <div role="radiogroup" aria-label="Posture" className="relative flex rounded-[12px] bg-[#E6E9EF] p-1">
          {(["folded", "unfolded"] as Posture[]).map((p) => (
            <button key={p} role="radio" aria-checked={posture === p} onClick={() => fold(p)} className={cn("relative flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold capitalize transition-colors", posture === p ? "text-[#292C31]" : "text-[#696B6F] hover:text-[#292C31]")}>
              {posture === p && <motion.span layoutId="posture" className="absolute inset-0 rounded-[9px] bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative flex items-center gap-1.5">
                {p === "folded" ? <RectangleVertical className="size-4" /> : <Smartphone className="size-4 rotate-90" />}
                {p}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ToolButton active={hinge} onClick={() => setHinge((h) => !h)} title="Show the hinge safe zone (G)">
            <ScanLine className="size-4" /> Hinge
          </ToolButton>
          <ToolButton active={zoom === "100"} onClick={() => setZoom((z) => (z === "fit" ? "100" : "fit"))} title="Toggle fit / 100% (0)">
            <Maximize2 className="size-4" /> {zoom === "fit" ? `${Math.round(scale * 100)}%` : "100%"}
          </ToolButton>
          <div className="ml-1 flex items-center gap-1.5" aria-label="Device finish">
            {FINISHES.map((f) => (
              <button key={f.id} title={f.label} aria-label={f.label} onClick={() => setFinish(f)} className={cn("size-5 rounded-full border border-black/10 transition-transform hover:scale-110", finish.id === f.id && "ring-2 ring-[#075EE8] ring-offset-2")} style={{ background: f.body }} />
            ))}
          </div>
          <ToolButton active={help} onClick={() => setHelp((h) => !h)} title="Shortcuts & interactions (?)" className="hidden sm:flex">
            <Keyboard className="size-4" />
          </ToolButton>
        </div>
      </header>

      {/* Stage */}
      <div ref={stage} className={cn("relative min-h-0 flex-1", zoom === "100" ? "overflow-auto" : "overflow-hidden")}>
        <div className="flex min-h-full min-w-full items-center justify-center p-4" style={zoom === "100" ? { width: devW + 64, height: devH + 64, minWidth: "100%" } : undefined}>
          <div style={{ width: devW * scale, height: devH * scale }} className="relative shrink-0 transition-[width] duration-500">
            <motion.div
              className="absolute left-0 top-0 origin-top-left"
              style={{ scale, height: devH }}
              initial={false}
              animate={{ width: devW }}
              transition={{ type: "spring", stiffness: 170, damping: 24 }}
            >
              <Device finish={finish} posture={posture}>
                <motion.div className="h-full w-full" animate={{ opacity: fading ? 0 : 1, filter: fading ? "blur(6px)" : "blur(0px)" }} transition={{ duration: 0.18 }}>
                  <div style={{ width: wide ? 760 : 375 }} className="h-full">
                    <Home wide={wide} showHinge={hinge} />
                  </div>
                </motion.div>
              </Device>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {help && (
            <motion.aside initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="absolute right-4 top-4 z-20 w-[280px] rounded-[16px] border border-black/5 bg-white/95 p-4 text-[12px] leading-[18px] text-[#3E4146] shadow-xl backdrop-blur">
              <p className="mb-2 text-[13px] font-bold text-[#292C31]">Try it</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Fold / unfold. Your scroll position is kept.</li>
                <li>Recharge Now → pick a pack → Pay. The status card turns green.</li>
                <li>Unfolded, details open in the right pane. Folded, they open as a bottom sheet you can drag down.</li>
                <li>Swipe or drag the carousels. Tap a side card in Featuring Fresh.</li>
                <li>Menu, Search, category tabs, bottom nav, bank balance and Claim cards.</li>
              </ul>
              <p className="mb-1 mt-3 text-[13px] font-bold text-[#292C31]">Shortcuts</p>
              <p>
                <Kbd>F</Kbd> fold · <Kbd>G</Kbd> hinge · <Kbd>0</Kbd> zoom · <Kbd>?</Kbd> help
              </p>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return <kbd className="rounded border border-[#CDD3DD] bg-[#F7F9FC] px-1.5 py-0.5 font-sans text-[11px] font-semibold">{children}</kbd>;
}

function ToolButton({ active, onClick, title, children, className }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} title={title} aria-pressed={active} className={cn("flex h-8 items-center gap-1.5 rounded-[10px] border px-2.5 text-[12px] font-semibold transition-colors", active ? "border-[#292C31] bg-[#292C31] text-white" : "border-[#E6E9EF] bg-white text-[#3E4146] hover:bg-[#F7F9FC]", className)}>
      {children}
    </button>
  );
}

/** The device body: titanium frame, side buttons, cameras and the hinge. */
function Device({ finish, posture, children }: { finish: (typeof FINISHES)[number]; posture: Posture; children: React.ReactNode }) {
  const open = posture === "unfolded";
  return (
    <div className="relative h-full w-full rounded-[58px] p-[3px] shadow-[0_40px_80px_-20px_rgba(20,30,50,0.35),0_12px_24px_-8px_rgba(20,30,50,0.2)]" style={{ background: finish.body }}>
      {/* side buttons */}
      <span className="absolute -left-[3px] top-[150px] h-[30px] w-[4px] rounded-l-[2px]" style={{ background: finish.edge }} />
      <span className="absolute -left-[3px] top-[200px] h-[56px] w-[4px] rounded-l-[2px]" style={{ background: finish.edge }} />
      <span className="absolute -left-[3px] top-[268px] h-[56px] w-[4px] rounded-l-[2px]" style={{ background: finish.edge }} />
      <span className="absolute -right-[3px] top-[220px] h-[86px] w-[4px] rounded-r-[2px]" style={{ background: finish.edge }} />
      {/* hinge knuckles at the top and bottom edge */}
      <motion.span animate={{ opacity: open ? 1 : 0 }} className="absolute left-1/2 top-[-2px] h-[5px] w-[22px] -translate-x-1/2 rounded-full" style={{ background: finish.edge }} />
      <motion.span animate={{ opacity: open ? 1 : 0 }} className="absolute bottom-[-2px] left-1/2 h-[5px] w-[22px] -translate-x-1/2 rounded-full" style={{ background: finish.edge }} />

      <div className="relative h-full w-full rounded-[55px] bg-black" style={{ padding: BEZEL - 3 }}>
        <div data-phone-screen className="relative h-full w-full overflow-hidden rounded-[46px] bg-white">
          {children}
          {/* crease: a soft light/shadow band down the middle of the inner screen */}
          <motion.span
            animate={{ opacity: open ? 1 : 0 }}
            className="pointer-events-none absolute inset-y-0 left-1/2 z-[70] w-[26px] -translate-x-1/2"
            style={{ background: "linear-gradient(90deg,transparent,rgba(0,0,0,0.035) 35%,rgba(255,255,255,0.25) 50%,rgba(0,0,0,0.035) 65%,transparent)" }}
          />
          {/* cameras: Dynamic Island when folded, punch-hole in the right pane when unfolded */}
          <motion.span
            initial={false}
            animate={open ? { width: 12, height: 12, left: "calc(75% - 6px)", top: 14 } : { width: 120, height: 34, left: "calc(50% - 60px)", top: 11 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="pointer-events-none absolute z-[80] rounded-full bg-black"
          />
          <span className="pointer-events-none absolute bottom-2 left-1/2 z-[80] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black/80" />
        </div>
      </div>
    </div>
  );
}
