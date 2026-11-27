import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Home, SIZES, type Mode } from "@/components/Home";
import { FoldScene, FOLD_SCENE } from "@/components/FoldScene";
import { cn } from "@/utils";

/**
 * iPhone Duo preview, following Apple's HIG "Designing for iPhone Duo".
 * Four poses: closed (outer display), open flat and partially folded (inner display, landscape),
 * and the inner display in portrait. Point sizes are estimates from the HIG diagrams.
 */

const BEZEL = 10;
const FINISHES = [
  { id: "titanium", label: "Natural Titanium", body: "linear-gradient(145deg,#d9d6d0,#b9b5ad 45%,#e4e1db)", edge: "#a7a39b" },
  { id: "black", label: "Black Titanium", body: "linear-gradient(145deg,#4a4a4d,#2a2a2d 45%,#545457)", edge: "#1f1f21" },
  { id: "desert", label: "Desert Titanium", body: "linear-gradient(145deg,#e3cdb6,#c4a888 45%,#ead8c5)", edge: "#a98d6f" },
  { id: "blue", label: "Ice Blue", body: "linear-gradient(145deg,#cfdbe8,#a9bccf 45%,#dde6ef)", edge: "#8ea2b7" },
];

const POSES: { id: Mode; label: string; hint: string; icon: JSX.Element }[] = [
  {
    id: "outer",
    label: "Closed",
    hint: "Outer display · compact width · controls on the side",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 3h9a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4Z" />
        <circle cx="13" cy="6" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "open",
    label: "Open",
    hint: "Inner display · regular width · split view",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="4.5" width="16" height="11" rx="2.5" />
      </svg>
    ),
  },
  {
    id: "book",
    label: "Book",
    hint: "Inner display partially folded · equal panes clear of the fold",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M2.5 4.5 10 6l7.5-1.5v10L10 16l-7.5-1.5Z" />
        <path d="M10 6v10" />
      </svg>
    ),
  },
  {
    id: "portrait",
    label: "Portrait",
    hint: "Inner display in portrait · horizontal bars",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4.5" y="2" width="11" height="16" rx="2.5" />
      </svg>
    ),
  },
];

export function App() {
  const initial = (new URLSearchParams(location.search).get("pose") as Mode) || "open";
  const [pose, setPose] = useState<Mode>(SIZES[initial] ? initial : "open");
  const [mode, setMode] = useState<Mode>(pose);
  const [fading, setFading] = useState(false);
  const [regions, setRegions] = useState(false);
  const [zoom, setZoom] = useState<"fit" | "100">("fit");
  const [finish] = useState(FINISHES[0]);
  const stage = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 1200, h: 900 });

  const { w, h } = SIZES[pose];
  const devW = w + BEZEL * 2;
  const devH = h + BEZEL * 2;

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = (dw: number, dh: number) => (zoom === "100" ? 1 : Math.min(1.6, (avail.w - 300) / dw, (avail.h - 48) / dh));
  const scale = fit(devW, devH);
  const sClosed = fit(SIZES.outer.w + BEZEL * 2, SIZES.outer.h + BEZEL * 2);
  const sOpen = fit(FOLD_SCENE.w, FOLD_SCENE.h);

  // Fold transition (closed ⇄ open/book): p = 0 closed … 1 open, cosine-eased like the real hinge.
  const [fold, setFold] = useState<number | null>(() => {
    const f = new URLSearchParams(location.search).get("fold"); // ?fold=0.4 freezes the hinge (for review)
    return f === null ? null : Number(f);
  });
  const raf = useRef(0);
  const foldTo = (from: number, to: number, end: Mode) => {
    cancelAnimationFrame(raf.current);
    const dur = 1150 * Math.abs(to - from) + 200;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = (1 - Math.cos(Math.PI * t)) / 2;
      setFold(from + (to - from) * e);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else {
        setPose(end);
        setMode(end);
        setFold(null);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  const go = (p: Mode) => {
    if (p === pose || fold !== null) return;
    const isInner = (m: Mode) => m === "open" || m === "book";
    if ((pose === "outer" && isInner(p)) || (isInner(pose) && p === "outer")) {
      if (pose === "outer") foldTo(0, 1, p);
      else foldTo(1, 0, "outer");
      return;
    }
    setFading(true);
    setPose(p);
    setTimeout(() => setMode(p), 200);
    setTimeout(() => setFading(false), 380);
  };



  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      const i = ["1", "2", "3", "4"].indexOf(e.key);
      if (i >= 0) go(POSES[i].id);
      if (e.key === "f" || e.key === "F") go(pose === "outer" ? "open" : "outer");
      if (e.key === "g" || e.key === "G") setRegions((r) => !r);
      if (e.key === "0") setZoom((z) => (z === "fit" ? "100" : "fit"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });


  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_50%_20%,#F7F9FC,#E3E8EF_70%)]">

      <div ref={stage} className={cn("relative min-h-0 flex-1", zoom === "100" ? "overflow-auto" : "overflow-hidden")}>
        <div className="flex min-h-full min-w-full items-center justify-center p-6 pr-[140px]" style={zoom === "100" ? { width: devW + 80, height: devH + 80, minWidth: "100%" } : undefined}>
          {fold !== null ? (
            <div className="relative shrink-0" style={{ width: FOLD_SCENE.w * (sClosed + (sOpen - sClosed) * fold), height: FOLD_SCENE.h * (sClosed + (sOpen - sClosed) * fold) }}>
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{ transform: `translateX(${-(FOLD_SCENE.half / 2) * (1 - fold) * (sClosed + (sOpen - sClosed) * fold)}px) scale(${sClosed + (sOpen - sClosed) * fold})` }}
              >
                <FoldScene p={fold} body={finish.body} edge={finish.edge} />
              </div>
            </div>
          ) : (
          <motion.div className="relative shrink-0" initial={false} animate={{ width: devW * scale, height: devH * scale }} transition={{ type: "spring", stiffness: 170, damping: 24 }}>
            <motion.div className="absolute left-0 top-0 origin-top-left" initial={false} animate={{ width: devW, height: devH, scale }} transition={{ type: "spring", stiffness: 170, damping: 24 }}>
              <Device finish={finish} pose={pose}>
                <motion.div className="h-full w-full" animate={{ opacity: fading ? 0 : 1, filter: fading ? "blur(6px)" : "blur(0px)" }} transition={{ duration: 0.18 }}>
                  <div style={{ width: SIZES[mode].w, height: SIZES[mode].h }}>
                    <Home mode={mode} showRegions={regions} />
                  </div>
                </motion.div>
              </Device>
            </motion.div>
          </motion.div>
          )}
        </div>

        {/* Pose switcher: the only control, floating on the right */}
        <div role="radiogroup" aria-label="Device pose" className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-[16px] border border-black/5 bg-white/80 p-1.5 shadow-[0_8px_24px_rgba(20,30,50,0.10)] backdrop-blur-md">
          {POSES.map((p, i) => (
            <button key={p.id} role="radio" aria-checked={pose === p.id} title={`${p.hint} (${i + 1})`} onClick={() => go(p.id)} className={cn("relative flex w-[92px] flex-col items-center gap-1 rounded-[12px] px-2 py-2.5 text-[12px] font-semibold transition-colors", pose === p.id ? "text-[#292C31]" : "text-[#696B6F] hover:text-[#292C31]")}>
              {pose === p.id && <motion.span layoutId="pose" className="absolute inset-0 rounded-[12px] bg-white shadow-[0_2px_8px_rgba(20,30,50,0.12)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">{p.icon}</span>
              <span className="relative">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}



/**
 * Device body. Closed: the hinge is the leading (left) edge, so those corners are tighter and the
 * outer camera sits in the top trailing corner. Open: the inner camera hides behind the display.
 */
function Device({ finish, pose, children }: { finish: (typeof FINISHES)[number]; pose: Mode; children: React.ReactNode }) {
  const closed = pose === "outer";
  const book = pose === "book";
  const r = closed ? { tl: 22, tr: 56, br: 56, bl: 22 } : { tl: 50, tr: 50, br: 50, bl: 50 };
  const radius = `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
  const inner = (d: number) => `${Math.max(0, r.tl - d)}px ${Math.max(0, r.tr - d)}px ${Math.max(0, r.br - d)}px ${Math.max(0, r.bl - d)}px`;
  return (
    <motion.div
      className="relative h-full w-full p-[3px] shadow-[0_40px_80px_-20px_rgba(20,30,50,0.35),0_12px_24px_-8px_rgba(20,30,50,0.2)]"
      initial={false}
      animate={{ borderRadius: radius }}
      style={{ background: finish.body, borderRadius: radius }}
    >
      {/* hinge spine on the leading edge when closed */}
      {closed && <span className="absolute -left-[4px] inset-y-[40px] w-[6px] rounded-l-[4px]" style={{ background: finish.edge }} />}
      {/* buttons on the top edge */}
      <span className="absolute -top-[3px] right-[90px] h-[4px] w-[52px] rounded-t-[2px]" style={{ background: finish.edge }} />
      <span className="absolute -top-[3px] right-[150px] h-[4px] w-[34px] rounded-t-[2px]" style={{ background: finish.edge }} />
      {/* hinge knuckles when open in landscape */}
      {(pose === "open" || book) && (
        <>
          <span className="absolute left-1/2 top-[-3px] h-[6px] w-[26px] -translate-x-1/2 rounded-full" style={{ background: finish.edge }} />
          <span className="absolute bottom-[-3px] left-1/2 h-[6px] w-[26px] -translate-x-1/2 rounded-full" style={{ background: finish.edge }} />
        </>
      )}
      {pose === "portrait" && (
        <>
          <span className="absolute left-[-3px] top-1/2 h-[26px] w-[6px] -translate-y-1/2 rounded-full" style={{ background: finish.edge }} />
          <span className="absolute right-[-3px] top-1/2 h-[26px] w-[6px] -translate-y-1/2 rounded-full" style={{ background: finish.edge }} />
        </>
      )}

      <motion.div className="relative h-full w-full bg-black" initial={false} animate={{ borderRadius: inner(3) }} style={{ padding: BEZEL - 3, borderRadius: inner(3) }}>
        <motion.div data-phone-screen className="relative h-full w-full overflow-hidden bg-white" initial={false} animate={{ borderRadius: inner(BEZEL) }} style={{ borderRadius: inner(BEZEL) }}>
          {children}
          {/* crease */}
          {pose !== "outer" && (
            <span
              className={cn("pointer-events-none absolute z-[70]", pose === "portrait" ? "inset-x-0 top-1/2 h-[26px] -translate-y-1/2" : "inset-y-0 left-1/2 w-[26px] -translate-x-1/2")}
              style={{ background: `linear-gradient(${pose === "portrait" ? "180deg" : "90deg"},transparent,rgba(0,0,0,0.03) 35%,rgba(255,255,255,0.25) 50%,rgba(0,0,0,0.03) 65%,transparent)` }}
            />
          )}
          {/* partially folded: the two halves catch light differently */}
          {book && (
            <span className="pointer-events-none absolute inset-0 z-[70]" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.06) 47%,rgba(0,0,0,0.10) 50%,rgba(255,255,255,0.0) 53%,rgba(255,255,255,0) 100%)" }} />
          )}
          {/* outer front camera — always visible, top trailing corner, aligned with the side controls */}
          {closed && <span className="pointer-events-none absolute right-[14px] top-[14px] z-[80] size-[36px] rounded-full bg-black" />}
          {pose === "portrait" && <span className="pointer-events-none absolute bottom-2 left-1/2 z-[80] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black/80" />}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
