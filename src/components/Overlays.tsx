import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight, Loader2, Search, X } from "lucide-react";
import { home } from "@/assets/home";
import { cn } from "@/utils";
import type { Pack } from "@/store";

export type DetailSpec =
  | { kind: "info"; title: string; body: string; img?: string; cta: string }
  | { kind: "recharge"; tab: "popular" | "all" | "others"; preset?: number };

/**
 * Folded: a bottom sheet over the whole screen.
 * Unfolded: the detail opens in the right pane (list–detail), so the left pane stays usable.
 */
export function DetailPanel({ open, pane, onClose, children }: { open: boolean; pane: { left: number; width: number } | null; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open &&
        (pane ? (
          // Inner display: the detail replaces the trailing pane (list–detail); the leading pane stays live.
          <motion.div
            key="pane"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute inset-y-0 z-[36] flex flex-col bg-white pt-[18px]"
            style={{ left: pane.left, width: pane.width }}
          >
            {children}
          </motion.div>
        ) : (
          <React.Fragment key="sheet">
            <motion.button aria-label="Close" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/40" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, i) => (i.offset.y > 120 || i.velocity.y > 600) && onClose()}
              className="absolute inset-x-0 bottom-0 z-50 flex max-h-[88%] flex-col rounded-t-[24px] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
            >
              <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#CDD3DD]" />
              {children}
            </motion.div>
          </React.Fragment>
        ))}
    </AnimatePresence>
  );
}

const PACKS = [
  { price: 399, days: 28, data: "2.5 GB/day", perks: "Unlimited 5G · Calls · 100 SMS/day", tag: "Current pack" },
  { price: 349, days: 28, data: "2 GB/day", perks: "Unlimited 5G · Calls · 100 SMS/day" },
  { price: 859, days: 84, data: "1.5 GB/day", perks: "Unlimited 5G · Calls · OTT pack", tag: "Best value" },
  { price: 3599, days: 365, data: "2 GB/day", perks: "Unlimited 5G · Calls · 100 SMS/day" },
  { price: 199, days: 28, data: "2 GB total", perks: "Unlimited calls · 300 SMS" },
];
const OTHERS = [
  { price: 200, days: 30, data: "Box Office Pack", perks: "20+ OTTs incl. premium movies", tag: "Popular" },
  { price: 39, days: 3, data: "3 GB/day", perks: "Data booster for 3 days" },
];

function till(days: number) {
  const d = new Date(Date.now() + days * 864e5);
  return `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`;
}

export function Detail({ spec, onClose, onRecharged, toast, hideClose }: { spec: DetailSpec; onClose: () => void; onRecharged: (p: Pack) => void; toast: (t: string) => void; hideClose?: boolean }) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4">
        <p className="flex-1 text-[18px] font-bold leading-6 text-[#292C31]">{spec.kind === "info" ? spec.title : spec.tab === "others" ? "Recharge for others" : "Recharge"}</p>
        {!hideClose && (
          <button aria-label="Close" onClick={onClose} className="flex size-8 items-center justify-center rounded-full bg-[#F0F4F9] hover:bg-[#E6E9EF]">
            <X className="size-4" />
          </button>
        )}
      </div>
      {spec.kind === "info" ? (
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8">
          {spec.img && <img src={home(spec.img)} alt="" className="max-h-[220px] w-full rounded-[16px] border border-[#E6E9EF] bg-[#F7F9FC] object-contain" />}
          <p className="text-[14px] leading-5 text-[#3E4146]">{spec.body}</p>
          <button
            onClick={() => {
              onClose();
              toast(`${spec.title}: ${spec.cta.toLowerCase()} ✓`);
            }}
            className="mt-2 flex h-12 items-center justify-center rounded-[12px] bg-black text-[14px] font-medium text-white hover:bg-[#292C31]"
          >
            {spec.cta}
          </button>
        </div>
      ) : (
        <RechargeFlow spec={spec} onClose={onClose} onRecharged={onRecharged} />
      )}
    </>
  );
}

function RechargeFlow({ spec, onClose, onRecharged }: { spec: Extract<DetailSpec, { kind: "recharge" }>; onClose: () => void; onRecharged: (p: Pack) => void }) {
  const others = spec.tab === "others";
  const list = others ? OTHERS : spec.tab === "popular" ? PACKS.slice(0, 3) : PACKS;
  const [sel, setSel] = useState(others ? list.findIndex((p) => p.price === spec.preset) : 0);
  const [step, setStep] = useState<"pick" | "pay" | "done">("pick");
  const [number, setNumber] = useState(others ? "" : "9876543210");
  const pack = list[Math.max(0, sel)];
  const valid = number.replace(/\D/g, "").length === 10;

  const pay = () => {
    setStep("pay");
    setTimeout(() => {
      setStep("done");
      if (!others) onRecharged({ price: pack.price, days: pack.days, data: pack.data, till: till(pack.days) });
    }, 1400);
  };

  if (step !== "pick")
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-10 pt-6 text-center">
        <AnimatePresence mode="wait">
          {step === "pay" ? (
            <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <Loader2 className="size-10 animate-spin text-[#075EE8]" />
              <p className="text-[14px] text-[#3E4146]">Processing ₹{pack.price}…</p>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3">
              <span className="flex size-16 items-center justify-center rounded-full bg-[#D1EFDC]">
                <Check className="size-8 text-[#0F7033]" strokeWidth={3} />
              </span>
              <p className="text-[18px] font-bold text-[#292C31]">Recharge successful</p>
              <p className="text-[14px] leading-5 text-[#696B6F]">
                ₹{pack.price} · {pack.data} for {number}. Valid till {till(pack.days)}.
              </p>
              <button onClick={onClose} className="mt-3 flex h-12 w-[240px] items-center justify-center rounded-[12px] bg-black text-[14px] font-medium text-white">
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );

  return (
    <>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#696B6F]">Mobile number</span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 12))}
            inputMode="numeric"
            placeholder="Enter 10-digit number"
            className="h-12 rounded-[12px] border border-[#E6E9EF] bg-[#F0F4F9] px-4 text-[16px] font-semibold tracking-wide text-[#292C31] outline-none focus:border-[#075EE8] focus:bg-white"
          />
        </label>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[1.76px] text-[#3E4146]">{others ? "Packs" : spec.tab === "popular" ? "Recommended" : "All packs"}</p>
        {list.map((p, k) => (
          <button
            key={p.price}
            onClick={() => setSel(k)}
            className={cn("relative flex items-center gap-3 rounded-[16px] border p-4 text-left transition-colors", sel === k ? "border-[#292C31] bg-[#F7F9FC]" : "border-[#E6E9EF] bg-white hover:bg-[#F7F9FC]")}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-[#292C31]">₹{p.price}</span>
                {"tag" in p && p.tag && <span className="rounded-full bg-[#E6F0FF] px-2 py-0.5 text-[10px] font-semibold text-[#04388B]">{p.tag}</span>}
              </span>
              <span className="text-[13px] font-semibold text-[#3E4146]">
                {p.data} · {p.days} days
              </span>
              <span className="truncate text-[12px] text-[#696B6F]">{p.perks}</span>
            </span>
            <span className={cn("flex size-5 items-center justify-center rounded-full border-2", sel === k ? "border-[#292C31] bg-[#292C31]" : "border-[#CDD3DD]")}>
              {sel === k && <Check className="size-3 text-white" strokeWidth={3} />}
            </span>
          </button>
        ))}
      </div>
      <div className="shrink-0 border-t border-[#E6E9EF] bg-white px-5 pb-7 pt-3">
        <button disabled={!valid || sel < 0} onClick={pay} className="flex h-12 w-full items-center justify-center rounded-[12px] bg-black text-[14px] font-medium text-white transition-opacity hover:bg-[#292C31] disabled:opacity-30">
          {valid ? `Pay ₹${pack.price}` : "Enter a 10-digit number"}
        </button>
      </div>
    </>
  );
}

/* ---------------- Hamburger drawer (Figma "Hamburger" pattern) ---------------- */

const ROWS: { title: string; subtitle: string; sub?: string[] }[] = [
  { title: "My Active Services", subtitle: "View and manage your plans & services", sub: ["Prepaid • 9876543210", "Postpaid • 0987654321", "Wi-Fi • 01234567897_dsl", "DTH • 0123456789876"] },
  { title: "New Connections", subtitle: "Buy new Postpaid, Prepaid, Wi-Fi & more" },
  { title: "Recharge & Pay Bills", subtitle: "Pay for mobile, electricity, FASTag & more" },
  { title: "Bank and UPI", subtitle: "Manage your banking and UPI services" },
  { title: "Rewards & OTTs", subtitle: "Claim OTTs and rewards", sub: ["Refer a Friend", "Claim OTTs & More"] },
  { title: "Safety Report", subtitle: "Check the number of fraud attempts prevented" },
  { title: "Settings", subtitle: "Accounts, payment & bank, privacy & security" },
];

export function Drawer({ open, onClose, toast, open2 }: { open: boolean; onClose: () => void; toast: (t: string) => void; open2: (d: DetailSpec) => void }) {
  const [exp, setExp] = useState<string | null>("My Active Services");
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button aria-label="Close menu" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/45" />
          <motion.aside
            initial={{ x: -340 }}
            animate={{ x: 0 }}
            exit={{ x: -340 }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.6, right: 0 }}
            onDragEnd={(_, i) => (i.offset.x < -90 || i.velocity.x < -500) && onClose()}
            className="no-scrollbar absolute inset-y-0 left-0 z-50 w-[329px] overflow-y-auto bg-white pb-10 pt-[56px] shadow-[8px_0_32px_rgba(0,0,0,0.18)]"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex size-[88px] items-center justify-center p-2">
                <img src={home("hm-progress.svg")} alt="" className="absolute inset-[-2.06%] size-[104.12%] max-w-none" />
                <div className="flex size-[72px] items-center justify-center rounded-full border border-[#9CBFF6] bg-[#E6F0FF] text-[20px] text-[#292C31]">SS</div>
              </div>
              <p className="text-[16px] font-bold text-[#292C31]">Sharon Stone</p>
              <p className="text-[12px] font-light text-[#292C31]">+91 9876543210</p>
              <button onClick={() => toast("Edit Profile")} className="text-[14px] font-medium text-[#075EE8]">
                Edit Profile
              </button>
            </div>
            <div className="mt-6 flex flex-col">
              {ROWS.map((r) => {
                const isOpen = exp === r.title;
                return (
                  <div key={r.title} className="border-t border-[#E6E9EF]">
                    <button onClick={() => (r.sub ? setExp(isOpen ? null : r.title) : open2({ kind: "info", title: r.title, body: r.subtitle + ".", cta: "Open" }))} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#F7F9FC]">
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-[16px] font-bold leading-[18px] text-[#1A1A1A]">{r.title}</span>
                        <span className="text-[12px] leading-[16px] text-[#696B6F]">{r.subtitle}</span>
                      </span>
                      {r.sub ? <ChevronDown className={cn("size-5 transition-transform", isOpen && "rotate-180")} /> : <ChevronRight className="size-5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && r.sub && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-[#F0F4F9]">
                          <div className="flex flex-col gap-5 py-5 pl-8 pr-4">
                            {r.sub.map((s) => (
                              <button key={s} onClick={() => (s.startsWith("Prepaid") ? open2({ kind: "recharge", tab: "popular" }) : toast(s))} className="text-left text-[14px] text-[#3E4146] hover:text-black">
                                {s}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-center text-[12px] text-[#3E4146]">Version 4.81.0</p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Search ---------------- */

const SEARCHABLE: DetailSpec[] = [
  { kind: "recharge", tab: "all" },
  { kind: "info", title: "Pay Bills", body: "Pay postpaid, Wi-Fi, electricity and FASTag bills.", cta: "Continue" },
  { kind: "info", title: "International Roaming", body: "Activate roaming packs for 180+ countries.", cta: "Continue" },
  { kind: "info", title: "Credit Card", body: "Lifetime-free credit card with up to 25% cashback.", img: "buy-credit.png", cta: "Apply" },
  { kind: "info", title: "Gold Loan", body: "Instant loans against your gold.", img: "buy-gold.png", cta: "Apply" },
  { kind: "info", title: "Manage Family", body: "Add members and share your plan.", cta: "Continue" },
  { kind: "info", title: "My Wi-Fi", body: "Check speed, devices and bills for your Wi-Fi.", cta: "Open" },
  { kind: "info", title: "Upgrade to Postpaid", body: "Keep your number and move to postpaid.", img: "buy-postpaid.png", cta: "Upgrade" },
];
const label = (d: DetailSpec) => (d.kind === "info" ? d.title : "Recharge");

export function SearchOverlay({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (d: DetailSpec) => void }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => input.current?.focus(), 120);
    }
  }, [open]);
  const results = useMemo(() => SEARCHABLE.filter((d) => label(d).toLowerCase().includes(q.trim().toLowerCase())), [q]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }} className="absolute inset-0 z-50 flex flex-col bg-white pt-[52px]">
          <div className="flex items-center gap-2 px-4">
            <label className="flex h-11 flex-1 items-center gap-2 rounded-[12px] border border-[#E6E9EF] bg-[#F0F4F9] px-3 focus-within:border-[#075EE8] focus-within:bg-white">
              <Search className="size-4 text-[#696B6F]" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onClose()} placeholder="Search services, offers, help" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
            </label>
            <button onClick={onClose} className="px-1 text-[14px] font-medium text-[#075EE8]">
              Cancel
            </button>
          </div>
          <p className="mt-5 px-5 text-[11px] font-bold uppercase tracking-[1.76px] text-[#3E4146]">{q ? `${results.length} results` : "Popular"}</p>
          <div className="no-scrollbar mt-2 flex-1 overflow-y-auto">
            {results.map((d) => (
              <button key={label(d)} onClick={() => onPick(d)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#F7F9FC]">
                <Search className="size-4 text-[#A0A2A4]" />
                <span className="flex-1 text-[14px] text-[#292C31]">{label(d)}</span>
                <ChevronRight className="size-4 text-[#A0A2A4]" />
              </button>
            ))}
            {results.length === 0 && <p className="px-5 py-6 text-[14px] text-[#696B6F]">No matches for “{q}”.</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Toast ---------------- */

export function Toast({ msg, onDone, area, bottom }: { msg: { id: number; t: string } | null; onDone: () => void; area: { left: number; width: number } | null; bottom: number }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => done.current(), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <div className="pointer-events-none absolute z-[60] flex justify-center px-4" style={{ bottom, left: area ? area.left : 0, width: area ? area.width : "100%" }}>
      <AnimatePresence>
        {msg && (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className="max-w-[340px] rounded-[12px] bg-[#292C31] px-4 py-3 text-center text-[13px] font-medium text-white shadow-lg">
            {msg.t}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
