import * as React from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpDown, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Delete, Info, Loader2, Mail, Phone, Search, Upload, X } from "lucide-react";
import { cn } from "@/utils";
import { store, useStore, type PP } from "@/store";
import { CARD } from "./ui";

/**
 * Postpaid · MNP & New number — new-acquisition journey, from Figma Yashis-Imaginarium_22-jun ·
 * page "iphone duo" · section "Postpaid MNP & New number" (81838:18506).
 * Opens from Postpaid on the Manage top nav.
 *
 * iPhone Duo layout (HIG split arrangement):
 *   inner display → leading pane = the journey "scene" (3 steps, live order summary);
 *                   trailing pane = the current form / bottom sheet, keyboard docked under it.
 *   outer display / portrait → the phone flow: page, bottom sheets over a dimmed page, keyboard.
 */

const pics = import.meta.glob<string>("../assets/pp/*.{png,jpg}", { eager: true, import: "default" });
const pic = (n: string) => pics[`../assets/pp/${n}.png`] ?? pics[`../assets/pp/${n}.jpg`];

/* ---------------- state ---------------- */

const INITIAL: PP = {
  step: "intro",
  history: [],
  focus: null,
  mobile: "",
  otp: "",
  conn: null,
  portNumber: "",
  portCode: "",
  search: "",
  newNumber: "",
  sim: null,
  eid: "",
  eidStage: "idle",
  upi: "",
  aadhaar: "",
  agree: false,
  aOtp: "",
  father: "Vijay Chauhan",
  refName: "",
  refMobile: "",
  refHouse: "",
  refStreet: "",
  refArea: "",
  refLandmark: "",
  refPin: "",
  refOtp: "",
  shot: "idle",
  disability: "no",
  disType: "Leprosy Cured Persons",
  disPct: "36",
  agree2: true,
  kycOtp: "",
  sheet: null,
};

export function openPostpaid(step?: string) {
  store.set({ pp: { ...INITIAL, step: step ?? "intro", focus: step ? FOCUS[step] ?? null : null } });
}
// ?flow=mobile opens the journey at a step (for review)
const startFlow = typeof location !== "undefined" ? new URLSearchParams(location.search).get("flow") : null;
if (startFlow) setTimeout(() => openPostpaid(startFlow), 0);
const usePP = () => useStore((s) => s.pp) as PP;
const set = (patch: Partial<PP>) => store.set({ pp: { ...(store.get().pp as PP), ...patch } });
const go = (step: string, patch: Partial<PP> = {}) => {
  const pp = store.get().pp as PP;
  set({ ...patch, step, history: [...pp.history, pp.step], focus: FOCUS[step] ?? null, sheet: null });
};
const back = () => {
  const pp = store.get().pp as PP;
  if (pp.sheet) return set({ sheet: null });
  if (!pp.history.length) return store.set({ pp: null });
  const prev = pp.history[pp.history.length - 1];
  set({ step: prev, history: pp.history.slice(0, -1), focus: FOCUS[prev] ?? null });
};

/* ---------------- fields & keyboards ---------------- */

type FieldSpec = { key: string; kb: "num" | "text" | "code"; max: number };
const FIELDS: Record<string, FieldSpec> = {
  mobile: { key: "mobile", kb: "num", max: 10 },
  otp: { key: "otp", kb: "num", max: 6 },
  portNumber: { key: "portNumber", kb: "num", max: 10 },
  portCode: { key: "portCode", kb: "code", max: 8 },
  search: { key: "search", kb: "num", max: 10 },
  eid: { key: "eid", kb: "num", max: 32 },
  aadhaar: { key: "aadhaar", kb: "num", max: 12 },
  aOtp: { key: "aOtp", kb: "num", max: 6 },
  father: { key: "father", kb: "text", max: 40 },
  refName: { key: "refName", kb: "text", max: 40 },
  refMobile: { key: "refMobile", kb: "num", max: 10 },
  refHouse: { key: "refHouse", kb: "text", max: 40 },
  refStreet: { key: "refStreet", kb: "text", max: 40 },
  refArea: { key: "refArea", kb: "text", max: 40 },
  refLandmark: { key: "refLandmark", kb: "text", max: 40 },
  refPin: { key: "refPin", kb: "num", max: 6 },
  refOtp: { key: "refOtp", kb: "num", max: 6 },
  disPct: { key: "disPct", kb: "num", max: 3 },
  kycOtp: { key: "kycOtp", kb: "num", max: 6 },
  upi: { key: "upi", kb: "num", max: 4 },
};
/** The field that takes focus (and opens the keyboard) when a step opens. */
const FOCUS: Record<string, string> = {
  mobile: "mobile",
  otp: "otp",
  portNumber: "portNumber",
  portCode: "portCode",
  selectNumber: "search",
  eidPaste: "eid",
  upi: "upi",
  aadhaar: "aadhaar",
  aadhaarOtp: "aOtp",
  aadhaarConfirm: "father",
  reference: "refName",
  refOtp: "refOtp",
  kycOtp: "kycOtp",
};

function type(k: string) {
  const pp = store.get().pp as PP;
  const f = pp.focus && FIELDS[pp.focus];
  if (!f) return;
  const v: string = pp[f.key] ?? "";
  if (k === "del") return set({ [f.key]: v.slice(0, -1) });
  if (k === "return") return set({ focus: null });
  const ch = k === "space" ? " " : k;
  if (f.kb === "num" && !/^\d$/.test(ch)) return;
  if (v.length >= f.max) return;
  set({ [f.key]: v + (f.kb === "code" ? ch.toUpperCase() : ch) });
}

/** Desktop typing goes to the focused field too. */
function useHardwareKeys(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const on = (e: KeyboardEvent) => {
      const pp = store.get().pp as PP | null;
      if (!pp?.focus || e.metaKey || e.ctrlKey) return;
      if (e.key === "Backspace") type("del");
      else if (e.key === "Enter") type("return");
      else if (e.key === " ") type("space");
      else if (e.key.length === 1) type(e.key);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, [enabled]);
}

const fmt = (key: string, v: string) => {
  if (key === "aadhaar") return v.replace(/(\d{4})(?=\d)/g, "$1 ");
  if (key === "eid") return v.replace(/(\d{4})(?=\d)/g, "$1 ");
  return v;
};

function Caret() {
  return <span className="ml-[1px] inline-block h-[18px] w-[2px] translate-y-[3px] animate-[blink_1s_steps(1)_infinite] bg-[#075EE8]" />;
}

/** Gen4 text field (Field ✅): prepend art, floating label, focus ring; tapping it opens the keyboard. */
function Field({ id, label, icon, hint, suffix, className }: { id: string; label: string; icon?: string; hint?: string; suffix?: React.ReactNode; className?: string }) {
  const pp = usePP();
  const focused = pp.focus === id;
  const v: string = pp[id] ?? "";
  const filled = v.length > 0;
  return (
    <div className={className}>
      <button
        onClick={() => set({ focus: id })}
        className={cn("flex h-16 w-full items-center gap-3 rounded-[12px] border bg-white px-3 text-left transition-colors", focused ? "border-[#075EE8] shadow-[0_0_0_3px_rgba(7,94,232,0.12)]" : "border-[#E6E9EF] hover:border-[#CDD3DD]")}
      >
        {icon && <img src={pic(icon)} alt="" className="size-10 shrink-0 object-contain mix-blend-multiply" />}
        <span className="min-w-0 flex-1">
          {filled || focused ? (
            <>
              <span className="block text-[11px] leading-[14px] text-[#696B6F]">{label}</span>
              <span className="block truncate text-[16px] font-medium leading-6 text-[#292C31]">
                {fmt(id, v)}
                {focused && <Caret />}
              </span>
            </>
          ) : (
            <span className="block text-[16px] leading-6 text-[#696B6F]">{label}</span>
          )}
        </span>
        {suffix}
      </button>
      {hint && <p className="mt-1.5 px-1 text-[11px] leading-[14px] text-[#696B6F]">{hint}</p>}
    </div>
  );
}

function OtpBoxes({ id }: { id: string }) {
  const pp = usePP();
  const v: string = pp[id] ?? "";
  const focused = pp.focus === id;
  return (
    <button onClick={() => set({ focus: id })} className="flex justify-center gap-2" aria-label="Enter OTP">
      {Array.from({ length: 6 }, (_, i) => {
        const active = focused && i === Math.min(v.length, 5);
        return (
          <span key={i} className={cn("flex h-12 w-10 items-center justify-center rounded-[10px] border bg-white text-[22px] font-medium text-[#292C31]", active ? "border-[#075EE8] shadow-[0_0_0_3px_rgba(7,94,232,0.12)]" : v[i] ? "border-[#CDD3DD]" : "border-[#E6E9EF]")}>
            {v[i] ?? (active ? <Caret /> : "")}
          </span>
        );
      })}
    </button>
  );
}

const NUM_KEYS = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
];

/** iOS keyboards: number pad and QWERTY (letters / 123). */
function Keyboard({ kind, suggestion, onSuggestion }: { kind: "num" | "text" | "code"; suggestion?: string; onSuggestion?: () => void }) {
  const [shift, setShift] = useState(true);
  const [nums, setNums] = useState(kind === "code");
  const key = "flex items-center justify-center rounded-[6px] bg-white shadow-[0_1px_0_rgba(0,0,0,0.3)] active:bg-[#D1D4DA] select-none";
  if (kind === "num")
    return (
      <div className="shrink-0 bg-[#D1D4DA] px-1.5 pb-6 pt-1.5">
        {suggestion && (
          <button onClick={onSuggestion} className="mb-1.5 flex h-9 w-full items-center justify-center gap-2 text-[13px] text-[#292C31]">
            <span className="rounded bg-white/70 px-2 py-0.5 font-medium">From Clipboard</span>
            <span className="truncate tabular-nums">{suggestion}</span>
          </button>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {NUM_KEYS.map(([n, l]) => (
            <button key={n} onClick={() => type(n)} className={cn(key, "h-[46px] flex-col")}>
              <span className="text-[24px] leading-6 text-black">{n}</span>
              {l && <span className="text-[9px] font-semibold tracking-[2px] text-black">{l}</span>}
            </button>
          ))}
          <span className="flex h-[46px] items-center justify-center text-[18px] text-black">+ * #</span>
          <button onClick={() => type("0")} className={cn(key, "h-[46px] text-[24px] text-black")}>
            0
          </button>
          <button aria-label="Delete" onClick={() => type("del")} className="flex h-[46px] items-center justify-center rounded-[6px] active:bg-white/60">
            <Delete className="size-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    );
  const rows = nums ? ["1234567890", "-/:;()₹&@\"", ".,?!'"] : ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const press = (c: string) => {
    type(nums || shift ? c : c.toLowerCase());
    if (shift && !nums && kind === "text") setShift(false);
  };
  return (
    <div className="shrink-0 bg-[#D1D4DA] px-1 pb-6 pt-2">
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={r} className="flex justify-center gap-1.5">
            {i === 2 && (
              <button aria-label="Shift" onClick={() => setShift((s) => !s)} className={cn("flex h-[42px] w-[42px] items-center justify-center rounded-[6px]", shift ? "bg-white" : "bg-[#ABB0BA]")}>
                ⇧
              </button>
            )}
            {r.split("").map((c) => (
              <button key={c} onClick={() => press(c)} className={cn(key, "h-[42px] min-w-0 flex-1 text-[22px] text-black")} style={{ maxWidth: 40 }}>
                {nums || shift ? c : c.toLowerCase()}
              </button>
            ))}
            {i === 2 && (
              <button aria-label="Delete" onClick={() => type("del")} className="flex h-[42px] w-[42px] items-center justify-center rounded-[6px] bg-[#ABB0BA]">
                <Delete className="size-5" strokeWidth={1.6} />
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-1.5">
          <button onClick={() => setNums((n) => !n)} className="h-[42px] w-[88px] rounded-[6px] bg-[#ABB0BA] text-[16px]">
            {nums ? "ABC" : "123"}
          </button>
          <button onClick={() => type("space")} className={cn(key, "h-[42px] flex-1 text-[16px] text-black")}>
            space
          </button>
          <button onClick={() => type("return")} className="h-[42px] w-[88px] rounded-[6px] bg-[#ABB0BA] text-[16px]">
            return
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- atoms ---------------- */

function Btn({ children, onClick, disabled, variant = "dark", className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "dark" | "light"; className?: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center gap-1.5 rounded-[12px] px-4 text-[14px] font-medium transition-colors active:scale-[0.99] disabled:cursor-not-allowed",
        variant === "dark" ? "bg-black text-white hover:bg-[#292C31] disabled:bg-[#CDD3DD] disabled:text-white" : "border border-[#E6E9EF] bg-white text-[#292C31] hover:bg-[#F7F9FC]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Safe({ text = "Your information is safe with Airtel" }: { text?: string }) {
  return (
    <p className="flex items-center justify-center gap-1 text-[11px] leading-[14px] text-[#3E4146]">
      <img src={pic("airtel-safe")} alt="" className="size-4 mix-blend-multiply" /> {text}
    </p>
  );
}

function Title({ title, sub, align = "center" }: { title: string; sub?: React.ReactNode; align?: "center" | "left" }) {
  return (
    <div className={cn(align === "center" && "text-center")}>
      <p className="text-[18px] font-bold leading-6 text-[#292C31]">{title}</p>
      {sub && <p className="mt-1 text-[12px] leading-[18px] text-[#696B6F]">{sub}</p>}
    </div>
  );
}

function OptionCard({ icon, title, sub, link, onLink, chip, onClick, selected }: { icon: string; title: string; sub: string; link?: string; onLink?: () => void; chip?: React.ReactNode; onClick: () => void; selected?: boolean }) {
  return (
    <div className={cn("overflow-hidden rounded-[16px]", CARD, selected && "border-[#292C31]")}>
      <button onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left hover:bg-black/[0.015]">
        <img src={pic(icon)} alt="" className="size-14 shrink-0 object-contain mix-blend-multiply" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold leading-5 text-[#292C31]">{title}</span>
          <span className="block text-[12px] leading-[18px] text-[#696B6F]">{sub}</span>
          {link && (
            <span
              role="link"
              onClick={(e) => {
                e.stopPropagation();
                onLink?.();
              }}
              className="mt-1 inline-block text-[12px] font-medium text-[#075EE8] hover:underline"
            >
              {link}
            </span>
          )}
        </span>
        <ChevronRight className="size-5 shrink-0" strokeWidth={1.6} />
      </button>
      {chip}
    </div>
  );
}

function Radio({ on }: { on: boolean }) {
  return <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-[#075EE8]" : "border-[#A0A2A4]")}>{on && <span className="size-2.5 rounded-full bg-[#075EE8]" />}</span>;
}

function CheckBox({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-start gap-2 text-left text-[12px] leading-[18px] text-[#292C31]">
      <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border-2", on ? "border-[#075EE8] bg-[#075EE8]" : "border-[#A0A2A4]")}>{on && <Check className="size-3 text-white" strokeWidth={3} />}</span>
      <span>{children}</span>
    </button>
  );
}

/* ---------------- steps ---------------- */

type Step = {
  /** "page" = full screen; "sheet" = bottom sheet over `under` on the phone. */
  kind: "page" | "sheet";
  under?: string;
  stage: 0 | 1 | 2 | 3;
  body: (pp: PP) => React.ReactNode;
  footer?: (pp: PP) => React.ReactNode;
  suggestion?: (pp: PP) => string | undefined;
  dark?: boolean;
};

const NUMBERS = ["9876543210", "9876501234", "9876543212", "9876598765", "9876511122", "9876577788", "9988776655", "9876500000"];
const EID = "66754818733372228231027564251484";

function stub(): React.ReactNode {
  return null;
}

const STEPS: Record<string, Step> = {
  intro: {
    kind: "page",
    stage: 0,
    body: () => (
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-bold text-[#292C31]">Choose your connection type</p>
        <OptionCard icon="ic-prepaid" title="Prepaid" sub="Stay in control, recharge as per your needs" onClick={() => go("mobile", { kind: "prepaid" })} />
        <OptionCard icon="ic-postpaid" title="Postpaid" sub="More convenience, fewer recharges" onClick={() => go("mobile", { kind: "postpaid" })} selected />
      </div>
    ),
    footer: () => <Safe />,
  },
  mobile: {
    kind: "sheet",
    under: "intro",
    stage: 0,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Mobile number" sub="This will be used to send all delivery updates" />
        <Field id="mobile" label="Mobile number" icon="ic-portsim" />
        <Safe />
      </div>
    ),
    footer: (pp) => (
      <Btn className="w-full" disabled={pp.mobile.length !== 10} onClick={() => go("otp")}>
        Proceed
      </Btn>
    ),
  },
  otp: {
    kind: "sheet",
    under: "intro",
    stage: 0,
    body: (pp) => (
      <div className="flex flex-col gap-4">
        <Title title="Verify mobile number" sub={<>6-digit OTP sent to <b className="text-[#292C31]">{pp.mobile}</b></>} />
        <p className="text-center text-[11px] text-[#696B6F]">Enter OTP</p>
        <OtpBoxes id="otp" />
        <ResendOtp />
        <Safe />
      </div>
    ),
    footer: (pp) => (
      <div className="flex gap-3">
        <Btn variant="light" className="w-12 px-0" onClick={back}>
          <ArrowLeft className="size-5" />
        </Btn>
        <Btn className="flex-1" disabled={pp.otp.length !== 6} onClick={() => go("address")}>
          Confirm
        </Btn>
      </div>
    ),
    suggestion: () => "245694",
  },
  address: {
    kind: "sheet",
    under: "intro",
    stage: 0,
    body: (pp) => (
      <div className="flex flex-col items-center gap-3 text-center">
        <Title title="Where should we deliver?" sub="We'll check availability and estimated delivery date" />
        <button onClick={() => set({ sheet: "mobileEdit" })} className="text-[12px] font-medium text-[#075EE8]">
          {pp.mobile || "9876543210"} ✎
        </button>
        <img src={pic("map-pin")} alt="" className="size-[110px] mix-blend-multiply" />
        <p className="text-[14px] font-bold text-[#292C31]">Sushant Lok</p>
        <p className="text-[12px] text-[#696B6F]">B 446, sushant lok, gurgaon, 112001</p>
        <button onClick={() => set({ sheet: "addresses" })} className="text-[14px] font-medium text-[#075EE8] hover:underline">
          Change
        </button>
      </div>
    ),
    footer: () => (
      <Btn className="w-full" onClick={() => go("choose")}>
        Proceed Now
      </Btn>
    ),
  },
  choose: {
    kind: "page",
    stage: 0,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Great! Let’s get started" />
        <OptionCard icon="ic-newnum" title="New number" sub="Pick a number you like" onClick={() => go("selectNumber", { conn: "new" })} />
        <OptionCard
          icon="ic-port"
          title="Port to Airtel"
          sub="Keep your current number"
          link="How it works"
          onLink={() => set({ sheet: "howPort" })}
          onClick={() => go("portNumber", { conn: "port" })}
          chip={<p className="bg-[#E6F0FF] py-1.5 text-center text-[11px] font-semibold text-[#04388B]">Popular choice • Easy to switch</p>}
        />
        <p className="mx-auto rounded-full border border-[#E6E9EF] bg-white px-3 py-1 text-[11px] text-[#696B6F]">Your SIM will be delivered by 26 Nov</p>
      </div>
    ),
    footer: () => <Safe />,
  },
  portNumber: {
    kind: "sheet",
    under: "choose",
    stage: 0,
    body: () => (
      <div className="flex flex-col gap-3">
        <Title title="Enter number to port" />
        <Field id="portNumber" label="Mobile number" icon="ic-portsim" hint="To generate code, SMS PORT <your number> to 1900" />
        <button onClick={() => go("portCode")} className="mx-auto text-[12px] font-medium text-[#075EE8] hover:underline">
          I Already Have A Code
        </button>
      </div>
    ),
    footer: (pp) => (
      <div className="flex flex-col gap-2">
        <Btn className="w-full" disabled={pp.portNumber.length !== 10} onClick={() => go("sms")}>
          Generate Porting Code
        </Btn>
        <p className="text-center text-[11px] text-[#696B6F]">We will open the SMS app in next step for you</p>
      </div>
    ),
  },
  sms: {
    kind: "page",
    stage: 0,
    body: stub,
  },
  portCode: {
    kind: "sheet",
    under: "choose",
    stage: 0,
    body: () => (
      <div className="flex flex-col gap-3">
        <Title title="Enter your porting code" sub="Unique porting code (UPC) is a 8-digit code required to move your number to Airtel" />
        <Field id="portCode" label="Porting code" icon="ic-port" />
        <p className="flex items-start gap-2 rounded-[10px] border border-[#9CBFF6] bg-[#E6F0FF] p-2.5 text-[11px] leading-4 text-[#04388B]">
          <Info className="mt-px size-3.5 shrink-0" /> Don’t have it? SMS PORT &lt;your number&gt; to 1900. Example: PORT 9876543210
        </p>
      </div>
    ),
    footer: (pp) => (
      <div className="flex gap-3">
        <Btn variant="light" className="w-12 px-0" onClick={back}>
          <ArrowLeft className="size-5" />
        </Btn>
        <Btn className="flex-1" disabled={pp.portCode.length !== 8} onClick={() => go("sim")}>
          Proceed
        </Btn>
      </div>
    ),
    suggestion: (pp) => (pp.smsSent ? "AD741542" : undefined),
  },
  selectNumber: {
    kind: "sheet",
    under: "choose",
    stage: 0,
    body: (pp) => {
      const list = NUMBERS.filter((n) => n.includes(pp.search));
      return (
        <div className="flex flex-col gap-3">
          <Title title="Select a number" sub="Here are best matching numbers for you - or search for one you like." />
          <button onClick={() => set({ focus: "search" })} className={cn("flex h-12 items-center gap-2 rounded-[12px] border bg-white px-3", pp.focus === "search" ? "border-[#075EE8] shadow-[0_0_0_3px_rgba(7,94,232,0.12)]" : "border-[#E6E9EF]")}>
            <Search className="size-5 text-[#696B6F]" />
            <span className={cn("flex-1 text-left text-[15px]", pp.search ? "text-[#292C31]" : "text-[#696B6F]")}>
              {pp.search || (pp.focus === "search" ? "" : "Search by digits")}
              {pp.focus === "search" && <Caret />}
            </span>
            {pp.search && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  set({ search: "" });
                }}
              >
                <X className="size-4" />
              </span>
            )}
          </button>
          <div className="flex flex-col">
            {list.map((n) => (
              <button key={n} onClick={() => set({ newNumber: n, focus: null })} className={cn("flex items-center justify-between rounded-[12px] border px-4 py-3 text-[15px] tabular-nums", pp.newNumber === n ? "border-[#075EE8] bg-[#F5F9FF] font-semibold" : "border-transparent")}>
                {n}
                <Radio on={pp.newNumber === n} />
              </button>
            ))}
            {list.length === 0 && <p className="py-4 text-center text-[13px] text-[#696B6F]">No numbers with “{pp.search}”. Try other digits.</p>}
          </div>
        </div>
      );
    },
    footer: (pp) => (
      <Btn className="w-full" disabled={!pp.newNumber} onClick={() => go("sim")}>
        Confirm
      </Btn>
    ),
  },
  sim: {
    kind: "page",
    stage: 0,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Choose your SIM" />
        <OptionCard
          icon="ic-esim"
          title="eSIM"
          sub="Activate instantly, no physical SIM needed"
          link="What is eSIM?"
          onLink={() => set({ sheet: "whatEsim" })}
          onClick={() => go("eid", { sim: "esim", eidStage: "idle" })}
          chip={<p className="bg-[#E6F0FF] py-1.5 text-center text-[11px] font-semibold text-[#04388B]">eSIM will be activated and can be used only on this device</p>}
        />
        <OptionCard icon="ic-physical" title="Physical SIM" sub="Easy quick activation" onClick={() => go("plan", { sim: "physical" })} chip={<p className="px-4 pb-3 text-[11px]"><span className="rounded bg-[#E6F0FF] px-1.5 py-0.5 font-semibold text-[#04388B]">Delivered by 26 Nov</span></p>} />
      </div>
    ),
    footer: () => <Safe />,
  },
  eid: {
    kind: "sheet",
    under: "sim",
    stage: 0,
    body: (pp) => <EidFetch stage={pp.eidStage} />,
    footer: (pp) =>
      pp.eidStage === "idle" ? (
        <div className="flex gap-3">
          <Btn variant="light" className="w-12 px-0" onClick={back}>
            <ArrowLeft className="size-5" />
          </Btn>
          <Btn
            className="flex-1"
            onClick={() => {
              set({ eidStage: "fetching" });
              setTimeout(() => set({ eidStage: "copied" }), 1600);
              setTimeout(() => (store.get().pp as PP)?.step === "eid" && go("eidPaste"), 2700);
            }}
          >
            Fetch EID Number
          </Btn>
        </div>
      ) : null,
  },
  eidPaste: {
    kind: "sheet",
    under: "sim",
    stage: 0,
    body: () => (
      <div className="flex flex-col gap-3">
        <Title title="EID number" sub="It’s copied automatically for you." />
        <Field id="eid" label="EID number" icon="eid-fetch" />
      </div>
    ),
    footer: (pp) => (
      <div className="flex gap-3">
        <Btn variant="light" className="w-12 px-0" onClick={back}>
          <ArrowLeft className="size-5" />
        </Btn>
        <Btn className="flex-1" disabled={pp.eid.length < 16} onClick={() => go("plan")}>
          Confirm and Proceed
        </Btn>
      </div>
    ),
    suggestion: (pp) => (pp.eid ? undefined : EID),
  },
  plan: {
    kind: "page",
    stage: 1,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Here is your postpaid plan" />
        <div className={cn("rounded-[16px] p-4", CARD)}>
          <p className="flex items-baseline gap-1">
            <span className="text-[28px] font-bold text-[#292C31]">₹449</span>
            <span className="text-[12px] text-[#696B6F]">/month + GST</span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 border-b border-[#E6E9EF] pb-3 text-center">
            {[
              [ArrowUpDown, "Unlimited", "Data"],
              [Phone, "Unlimited", "Calls"],
              [Mail, "100", "SMS"],
            ].map(([I, a, b]) => {
              const Icon = I as typeof Phone;
              return (
                <div key={b as string} className="flex flex-col items-center gap-0.5">
                  <Icon className="size-5" strokeWidth={1.6} />
                  <span className="text-[13px] font-bold text-[#292C31]">{a as string}</span>
                  <span className="text-[11px] text-[#696B6F]">{b as string}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {[
              ["lg-priority", "Fast lane technology with 5G slicing", ""],
              ["lg-googleone", "Google One", "(100GB Cloud Storage)"],
              ["lg-adobe", "Adobe Express Premium", "for 12 months"],
              ["lg-xstream", "Airtel Xstream Play Premium", ""],
            ].map(([l, t, s]) => (
              <p key={t} className="flex items-center gap-3 text-[13px] font-semibold text-[#292C31]">
                <img src={pic(l)} alt="" className="size-8 rounded-[8px]" />
                <span>
                  {t} <span className="font-normal text-[#696B6F]">{s}</span>
                </span>
              </p>
            ))}
          </div>
          <button onClick={() => set({ sheet: "benefits" })} className="mt-4 w-full text-center text-[13px] font-medium text-[#075EE8] hover:underline">
            View More Benefits
          </button>
        </div>
      </div>
    ),
    footer: () => (
      <Btn className="w-full" onClick={() => go("review")}>
        Proceed
      </Btn>
    ),
  },
  review: {
    kind: "page",
    stage: 1,
    body: (pp) => (
      <div className="flex flex-col gap-4">
        <Title title="Review order & Pay" sub="Check your details before confirming" />
        <p className="flex items-start gap-2 rounded-[10px] border border-[#9CBFF6] bg-[#E6F0FF] p-2.5 text-[11px] leading-4 text-[#04388B]">
          <Info className="mt-px size-3.5 shrink-0" /> We will be sending all activation related updates on {pp.mobile || "9876543210"}
        </p>
        <div className={cn("rounded-[16px] p-4", CARD)}>
          <p className="text-[11px] font-bold uppercase tracking-[1.76px] text-[#3E4146]">Amount payable</p>
          <div className="mt-3 flex justify-between text-[13px]">
            <span className="text-[#3E4146]">Postpaid</span>
            <span className="font-semibold text-[#292C31]">
              ₹449 <span className="font-normal text-[#696B6F]">+GST / Month</span>
            </span>
          </div>
          <div className="mt-2 flex justify-between text-[13px]">
            <span className="text-[#3E4146]">Activation charges</span>
            <span className="font-semibold text-[#292C31]">₹200</span>
          </div>
        </div>
        <div className={cn("rounded-[16px] p-4", CARD)}>
          <p className="text-[11px] font-bold uppercase tracking-[1.76px] text-[#3E4146]">Connection details</p>
          {[
            ["Connection type", pp.conn === "port" ? "You’re switching to Airtel network" : "New Airtel number"],
            ["Mobile number", pp.conn === "port" ? pp.portNumber || "9876543210" : pp.newNumber || "9876543210"],
            ["SIM preference", pp.sim === "esim" ? "eSIM" : "Physical SIM"],
            ["Address", "B 446, sushant lok, gurgaon, 112001"],
          ].map(([a, b]) => (
            <div key={a} className="mt-3 flex justify-between gap-4 text-[13px]">
              <span className="shrink-0 text-[#696B6F]">{a}</span>
              <span className="truncate text-right font-semibold text-[#292C31]">{b}</span>
            </div>
          ))}
          <p className="mt-3 text-[11px] text-[#0F7033]">{pp.sim === "esim" ? "eSIM activates on this device after KYC" : "Estimated delivery in 2–3 business days"}</p>
        </div>
      </div>
    ),
    footer: () => (
      <div className="flex flex-col gap-2">
        <Btn className="w-full" onClick={() => set({ sheet: "quickPay" })}>
          Pay Activation Charge • ₹200
        </Btn>
        <p className="text-center text-[11px] text-[#696B6F]">You will be redirected to KYC after payment</p>
      </div>
    ),
  },
  upi: { kind: "page", stage: 1, body: stub, dark: true },
  kycIntro: {
    kind: "page",
    stage: 2,
    body: () => (
      <div className="flex flex-col items-center gap-4">
        <Title title="Let’s start your KYC" sub="It takes just 2 mins" />
        <img src={pic("kyc-hand")} alt="" className="size-[120px] mix-blend-multiply" />
        <div className="flex w-full flex-col gap-1">
          {[
            ["ic-id", "Enter your Aadhaar number", "for KYC verification"],
            ["ic-camera", "Capture your photo & video", "Use a plain & bright white backdrop"],
            ["ic-kycv", "Share your disability status", "Keep your documents handy"],
          ].map(([i, t, s]) => (
            <div key={t} className="flex items-center gap-3 py-2">
              <img src={pic(i)} alt="" className="size-12 mix-blend-multiply" />
              <span>
                <span className="block text-[13px] font-bold text-[#292C31]">{t}</span>
                <span className="block text-[12px] text-[#696B6F]">{s}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    footer: () => (
      <div className="flex flex-col gap-2">
        <Safe text="Your information stays safe with Airtel" />
        <p className="flex items-start gap-2 rounded-[10px] bg-[#E6F0FF] p-2.5 text-[11px] leading-4 text-[#04388B]">
          <Info className="mt-px size-3.5 shrink-0" /> Your mobile number linked to your Aadhaar is required to complete KYC.
        </p>
        <Btn className="w-full" onClick={() => go("aadhaar")}>
          Proceed to KYC
        </Btn>
      </div>
    ),
  },
  aadhaar: {
    kind: "page",
    stage: 2,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Verify your Aadhaar" />
        <Field id="aadhaar" label="Enter Aadhar or VID number" icon="ic-aadhaar" />
      </div>
    ),
    footer: (pp) => (
      <div className="flex flex-col gap-3">
        <CheckBox on={pp.agree} onClick={() => set({ agree: !pp.agree })}>
          I agree to all terms and conditions{" "}
          <span
            role="link"
            onClick={(e) => {
              e.stopPropagation();
              set({ sheet: "tc" });
            }}
            className="font-medium text-[#075EE8]"
          >
            View T&amp;C
          </span>
        </CheckBox>
        <Btn className="w-full" disabled={pp.aadhaar.length !== 12 || !pp.agree} onClick={() => go("aadhaarOtp")}>
          Verify Aadhaar via OTP
        </Btn>
      </div>
    ),
  },
  aadhaarOtp: {
    kind: "sheet",
    under: "aadhaar",
    stage: 2,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Verify Aadhaar" sub={<>6-digit OTP sent to <b className="text-[#292C31]">XXXXXX9898</b></>} />
        <OtpBoxes id="aOtp" />
        <ResendOtp />
        <Safe />
      </div>
    ),
    footer: (pp) => (
      <div className="flex gap-3">
        <Btn variant="light" className="w-12 px-0" onClick={back}>
          <ArrowLeft className="size-5" />
        </Btn>
        <Btn className="flex-1" disabled={pp.aOtp.length !== 6} onClick={() => go("aadhaarConfirm")}>
          Confirm
        </Btn>
      </div>
    ),
    suggestion: () => "245694",
  },
  aadhaarConfirm: {
    kind: "sheet",
    under: "aadhaar",
    stage: 2,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Confirm Aadhaar Details" />
        <Field id="father" label="Father/Spouse/Guardian Name" icon="ic-father" />
        <Safe />
      </div>
    ),
    footer: (pp) => (
      <div className="flex gap-3">
        <Btn variant="light" className="w-12 px-0" onClick={back}>
          <ArrowLeft className="size-5" />
        </Btn>
        <Btn className="flex-1" disabled={pp.father.trim().length < 3} onClick={() => go("reference")}>
          Confirm
        </Btn>
      </div>
    ),
  },
  reference: {
    kind: "page",
    stage: 2,
    body: (pp) => (
      <div className="flex flex-col gap-3">
        <Title title="We need a local reference" sub="Your delivery address differs from your Aadhaar address" />
        <Field id="refName" label="Reference person’s name" icon="ic-refname" hint="Can not be same as of user submitting the KYC." />
        <Field id="refMobile" label="Mobile number" icon="ic-portsim" hint="Number must be registered in the delivery area." />
        <div className="mt-2 text-center">
          <p className="text-[14px] font-bold text-[#292C31]">Reference person’s address</p>
          <p className="mt-1 text-[11px] leading-4 text-[#696B6F]">Local address must be residential. PGs, hostels, other commercial properties aren’t permitted.</p>
        </div>
        <Field id="refHouse" label="House number, flat number" />
        <Field id="refStreet" label="Street, road name" />
        <Field id="refArea" label="Area, sector, locality" />
        <Field id="refLandmark" label="Landmark (optional)" />
        <Field id="refPin" label="6 Digit Pin Code" hint={pp.refPin.length === 6 ? "Lajpat nagar, New Delhi" : undefined} />
      </div>
    ),
    footer: (pp) => (
      <Btn className="w-full" disabled={!(pp.refName.length > 2 && pp.refMobile.length === 10 && pp.refHouse && pp.refStreet && pp.refArea && pp.refPin.length === 6)} onClick={() => go("refOtp")}>
        Verify via OTP
      </Btn>
    ),
  },
  refOtp: {
    kind: "sheet",
    under: "reference",
    stage: 2,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Verify local reference number" sub={<>6-digit OTP sent to <b className="text-[#292C31]">XXXXXX9898</b></>} />
        <OtpBoxes id="refOtp" />
        <ResendOtp />
        <Safe text="Your information stays safe with Airtel" />
      </div>
    ),
    footer: (pp) => (
      <Btn className="w-full" disabled={pp.refOtp.length !== 6} onClick={() => go("selfieIntro")}>
        Verify
      </Btn>
    ),
    suggestion: () => "444444",
  },
  selfieIntro: {
    kind: "page",
    stage: 2,
    body: () => (
      <div className="flex flex-col items-center gap-4">
        <Title title="Smile! It’s time for photo & video verification" />
        <img src={pic("selfie-girl")} alt="" className="size-[120px] mix-blend-multiply" />
        <div className="flex w-full flex-col gap-1">
          {[
            ["ic-face", "Face fully in frame", "Keep your face inside the circle"],
            ["ic-light", "Find a white background", "A bright evenly lit spot works best"],
            ["ic-glasses", "Remove your glasses/cap", "So that your face is clearly visible"],
          ].map(([i, t, s]) => (
            <div key={t} className="flex items-center gap-3 py-2">
              <img src={pic(i)} alt="" className="size-12 mix-blend-multiply" />
              <span>
                <span className="block text-[13px] font-bold text-[#292C31]">{t}</span>
                <span className="block text-[12px] text-[#696B6F]">{s}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    footer: () => (
      <Btn className="w-full" onClick={() => go("camera", { shot: "idle" })}>
        Proceed
      </Btn>
    ),
  },
  camera: { kind: "page", stage: 2, body: stub, dark: true },
  disability: {
    kind: "page",
    stage: 2,
    body: (pp) => (
      <div className="flex flex-col gap-4">
        <Title title="Disability Declaration" sub="Needed as per TRAI regulations" />
        <div className="rounded-[12px] border border-[#9CBFF6] bg-[#E6F0FF] p-3 text-[12px] leading-[18px] text-[#04388B]">
          <p className="flex items-center gap-1.5 font-semibold">
            <Info className="size-4" /> This information is confidential
          </p>
          <p className="mt-0.5 pl-[22px] text-[11px]">It is collected as per regulatory requirements and will be kept secure.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["yes", "Yes", "I’m a person with disability"],
            ["no", "No", "I’m not a person with disability"],
          ].map(([k, t, s]) => (
            <button key={k} onClick={() => set({ disability: k })} className={cn("rounded-[12px] border p-3 text-left", pp.disability === k ? "border-[#075EE8] bg-[#F5F9FF]" : "border-[#E6E9EF] bg-white")}>
              <span className="flex items-center justify-between text-[14px] font-bold text-[#292C31]">
                {t} <Radio on={pp.disability === k} />
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-[#696B6F]">{s}</span>
            </button>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {pp.disability === "yes" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-3 overflow-hidden">
              <button onClick={() => set({ sheet: "disType" })} className="flex h-16 items-center justify-between rounded-[12px] border border-[#E6E9EF] bg-white px-3 text-left">
                <span>
                  <span className="block text-[11px] text-[#696B6F]">Disability type</span>
                  <span className="block text-[15px] font-medium text-[#292C31]">{pp.disType}</span>
                </span>
                <ChevronDown className="size-5 text-[#075EE8]" />
              </button>
              <Field id="disPct" label="Disability percentage" suffix={<span className="text-[15px] text-[#696B6F]">%</span>} />
              <p className="mt-1 text-center text-[13px] font-bold text-[#292C31]">Upload disability documents</p>
              {["front side", "back side (optional)"].map((s) => (
                <button key={s} onClick={() => set({ [`up_${s}`]: true })} className="flex items-center gap-3 rounded-[12px] border border-[#E6E9EF] bg-white p-3 text-left">
                  <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#F0F4F9]">{pp[`up_${s}`] ? <Check className="size-4 text-[#0F7033]" /> : <Upload className="size-4" />}</span>
                  <span>
                    <span className="block text-[13px]">
                      <span className="font-medium text-[#075EE8]">{pp[`up_${s}`] ? "Uploaded" : "Upload"}</span> {s}
                    </span>
                    <span className="block text-[11px] text-[#696B6F]">Only jpg, png, gif or pdf with max size of 5 MB</span>
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ),
    footer: (pp) => (
      <div className="flex flex-col gap-3">
        <CheckBox on={pp.agree2} onClick={() => set({ agree2: !pp.agree2 })}>
          I agree to the terms and conditions for the new SIM{" "}
          <span
            role="link"
            onClick={(e) => {
              e.stopPropagation();
              set({ sheet: "tc2" });
            }}
            className="font-medium text-[#075EE8]"
          >
            View T&amp;C
          </span>
        </CheckBox>
        <Btn className="w-full" disabled={!pp.agree2} onClick={() => go("kycOtp")}>
          Submit &amp; Proceed
        </Btn>
      </div>
    ),
  },
  kycOtp: {
    kind: "sheet",
    under: "disability",
    stage: 2,
    body: () => (
      <div className="flex flex-col gap-4">
        <Title title="Confirm KYC Details" sub={<>6-digit OTP sent to <b className="text-[#292C31]">XXXXXX9898</b></>} />
        <OtpBoxes id="kycOtp" />
        <ResendOtp />
        <Safe text="Your information stays safe with Airtel" />
      </div>
    ),
    footer: (pp) => (
      <Btn className="w-full" disabled={pp.kycOtp.length !== 6} onClick={() => go("success")}>
        Verify
      </Btn>
    ),
    suggestion: () => "444444",
  },
  success: {
    kind: "page",
    stage: 3,
    body: (pp) => <Success esim={pp.sim === "esim"} />,
    footer: () => (
      <Btn className="w-full" onClick={() => store.set({ pp: null })}>
        Done
      </Btn>
    ),
  },
};

function ResendOtp() {
  const [t, setT] = useState(30);
  useEffect(() => {
    if (t <= 0) return;
    const id = setTimeout(() => setT(t - 1), 1000);
    return () => clearTimeout(id);
  }, [t]);
  return (
    <button disabled={t > 0} onClick={() => setT(30)} className="mx-auto text-[12px] font-medium text-[#075EE8] disabled:text-[#696B6F]">
      {t > 0 ? `Resend OTP in 0:${String(t).padStart(2, "0")}` : "Resend OTP ↻"}
    </button>
  );
}

function EidFetch({ stage }: { stage: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <AnimatePresence mode="wait">
        <motion.img key={stage === "copied" ? "c" : "f"} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={pic(stage === "copied" ? "eid-copied" : "eid-fetch")} alt="" className="size-[110px] mix-blend-multiply" />
      </AnimatePresence>
      {stage === "idle" && (
        <>
          <p className="text-[16px] font-bold text-[#292C31]">Tap to fetch EID</p>
          <p className="text-[12px] text-[#696B6F]">EID is unique ID inside your phone that activates your eSIM.</p>
          <p className="flex items-center gap-1 text-[11px] text-[#3E4146]">
            <img src={pic("airtel-safe")} alt="" className="size-4 mix-blend-multiply" /> Used only for eSIM setup. Not stored after KYC
          </p>
        </>
      )}
      {stage === "fetching" && (
        <>
          <p className="flex items-center gap-2 text-[16px] font-bold text-[#292C31]">
            <Loader2 className="size-4 animate-spin" /> Fetching EID number...
          </p>
          <p className="text-[12px] text-[#696B6F]">Do not close the app or press back</p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-[#E6E9EF]">
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5 }} className="h-full bg-[#0F7033]" />
          </div>
        </>
      )}
      {stage === "copied" && (
        <>
          <p className="text-[16px] font-bold text-[#292C31]">EID number copied</p>
          <p className="text-[12px] text-[#696B6F]">Paste it in next step</p>
        </>
      )}
    </div>
  );
}

function Success({ esim }: { esim: boolean }) {
  const steps = esim
    ? [
        ["Connect to a Wi-Fi or hotspot", "Keep the eSIM enabled handset connected to Wi-FI or hotspot"],
        ["Adding eSIM to device", "Tap the ‘Finish Setting Up Mobile Service’ alert. Or go to Device Settings > Mobile Data > Add eSIM."],
        ["Restart the device", "For smooth activation, restart your phone."],
      ]
    : [
        ["Receive your SIM", "Your SIM will be delivered to your doorstep."],
        ["Start SIM activation", "Once the SIM is delivered, you will receive an SMS with an activation link on 9876543211. Open the link to start SIM activation."],
        ["Insert SIM in the device", "SIM will be active in 15 mins"],
      ];
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.img initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} src={pic("tick")} alt="" className="size-[72px] mix-blend-multiply" />
      <div className="text-center">
        <p className="text-[16px] font-bold text-[#292C31]">Your {esim ? "eSIM" : "postpaid"} order has been placed!</p>
        <p className="mt-1 text-[12px] text-[#696B6F]">
          Request ID: <span className="text-[#075EE8]">1234567890</span>
        </p>
        <p className="text-[12px] text-[#696B6F]">Get ready to experience fast lane tech</p>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[1.76px] text-[#3E4146]">What happens next</p>
      <div className={cn("w-full rounded-[16px] p-4", CARD)}>
        {steps.map(([t, d], k) => (
          <div key={t} className="relative flex gap-3 pb-4 last:pb-0">
            {k < steps.length - 1 && <span className="absolute left-[9px] top-6 h-[calc(100%-20px)] w-px bg-[#CDD3DD]" />}
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", k === 0 ? "bg-[#075EE8] text-white" : "bg-[#E6E9EF] text-[#3E4146]")}>{k + 1}</span>
            <span>
              <span className="block text-[13px] font-bold text-[#292C31]">{t}</span>
              <span className="mt-0.5 block text-[12px] leading-[18px] text-[#696B6F]">{d}</span>
              {k === 0 && !esim && <span className="mt-1.5 inline-block rounded bg-[#075EE8] px-1.5 py-0.5 text-[11px] font-semibold text-white">Estimated delivery: 31 Jan 2026</span>}
            </span>
          </div>
        ))}
      </div>
      <div className={cn("flex w-full items-center gap-3 rounded-[16px] p-4", CARD)}>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-[#292C31]">Track your order</p>
          <p className="text-[12px] text-[#696B6F]">Check the progress of your order from here.</p>
          <button className="mt-2 h-8 rounded-[8px] border border-[#292C31] px-4 text-[12px] font-medium">Track Now</button>
        </div>
        <img src={pic("store")} alt="" className="size-20 mix-blend-multiply" />
      </div>
    </div>
  );
}

/* ---------------- special full screens ---------------- */

function SmsCompose({ pp }: { pp: PP }) {
  const body = `PORT ${pp.portNumber || "9876543210"}`;
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#E6E9EF] px-4 pb-3 pt-4">
        <span className="w-14" />
        <p className="text-[15px] font-semibold">New Message</p>
        <button onClick={back} className="w-14 text-right text-[15px] text-[#075EE8]">
          Cancel
        </button>
      </div>
      <p className="border-b border-[#E6E9EF] px-4 py-2.5 text-[14px] text-[#696B6F]">
        To: <span className="text-[#075EE8]">1900</span>
      </p>
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#E6E9EF] text-[18px] text-[#696B6F]">+</span>
        <div className="flex flex-1 items-center rounded-full border border-[#CDD3DD] py-1.5 pl-3 pr-1 text-[15px]">
          <span className="flex-1">{body}</span>
          <button
            aria-label="Send"
            onClick={() => {
              set({ smsSent: true });
              go("portCode", { portCode: "" });
            }}
            className="flex size-7 items-center justify-center rounded-full bg-[#0A84FF] text-white"
          >
            ↑
          </button>
        </div>
      </div>
      <Keyboard kind="text" />
    </div>
  );
}

function UpiPin({ pp }: { pp: PP }) {
  const [state, setState] = useState<"pin" | "paying" | "done">("pin");
  const submit = () => {
    if (pp.upi.length !== 4) return;
    setState("paying");
    setTimeout(() => setState("done"), 1300);
    setTimeout(() => go("kycIntro", { upi: "" }), 2300);
  };
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 pt-3">
        <button onClick={back} className="text-[13px] font-semibold text-[#3E4146]">
          CANCEL
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between bg-[#F2F4F7] px-4 py-2 text-[11px] text-[#3E4146]">
        <span>
          Bank of Baroda
          <br />
          XXXX0796
        </span>
        <span className="text-[16px] font-extrabold italic text-[#5F6368]">UPI</span>
      </div>
      <div className="flex justify-between bg-[#E6E9EF] px-4 py-1.5 text-[12px]">
        <span>To:</span>
        <span>Postpaid</span>
      </div>
      <div className="flex justify-between bg-[#E6E9EF] px-4 pb-2 text-[12px]">
        <span>Paying:</span>
        <span className="font-semibold">₹200.00</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {state === "pin" && (
          <>
            <p className="text-[12px] font-semibold tracking-wide text-[#3E4146]">ENTER 4-DIGIT UPI PIN</p>
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn("size-3.5 rounded-full border-2 border-[#3E4146]", pp.upi.length > i && "bg-[#3E4146]")} />
              ))}
            </div>
            <p className="mx-4 rounded-[8px] bg-[#FFF0B8] px-3 py-2 text-center text-[11px] text-[#8F4C00]">
              You are <b>PAYING ₹200</b> from your account to Postpaid
            </p>
          </>
        )}
        {state === "paying" && (
          <p className="flex items-center gap-2 text-[14px] font-semibold">
            <Loader2 className="size-5 animate-spin" /> Processing payment…
          </p>
        )}
        {state === "done" && (
          <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2 text-[15px] font-bold text-[#0F7033]">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#D1EFDC]">
              <Check className="size-6" strokeWidth={3} />
            </span>
            ₹200 paid successfully
          </motion.p>
        )}
      </div>
      {state === "pin" && (
        <div className="grid grid-cols-3 border-t border-[#E6E9EF] pb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "submit"].map((k) => (
            <button key={k} onClick={() => (k === "submit" ? submit() : type(k))} className="flex h-14 items-center justify-center text-[22px] active:bg-[#F0F4F9]">
              {k === "del" ? <Delete className="size-6" strokeWidth={1.5} /> : k === "submit" ? <span className={cn("text-[13px] font-bold", pp.upi.length === 4 ? "text-[#075EE8]" : "text-[#A0A2A4]")}>SUBMIT</span> : k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CameraKyc({ pp }: { pp: PP }) {
  const shot: string = pp.shot;
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (shot === "ready") {
      const t = setTimeout(() => set({ shot: "recording" }), 1400);
      return () => clearTimeout(t);
    }
    if (shot === "recording") {
      setSec(0);
      const t = setInterval(() => setSec((s) => (s >= 8 ? s : s + 1)), 1000);
      const done = setTimeout(() => set({ shot: "video" }), 8200);
      return () => {
        clearInterval(t);
        clearTimeout(done);
      };
    }
  }, [shot]);
  const photo = shot === "photo" || shot === "video" || shot === "recording";
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button aria-label="Back" onClick={back}>
          <ChevronLeft className="size-6" />
        </button>
        <span className="flex size-6 items-center justify-center rounded-full border border-[#292C31] text-[12px] font-bold">?</span>
      </div>
      <div className="relative flex-1 overflow-hidden bg-[#3A3A3A]">
        {photo && <img src={pic("selfie-photo")} alt="" className="absolute inset-0 size-full object-cover" />}
        {!photo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <motion.div
              animate={{ borderColor: shot === "ready" ? "#22C55E" : "#FFFFFF" }}
              className="size-[62%] max-h-[260px] max-w-[260px] rounded-full border-[3px]"
              style={{ aspectRatio: "1", background: "repeating-conic-gradient(#d9d9d9 0% 25%, #ffffff 0% 50%) 50% / 24px 24px" }}
            />
            <p className="px-8 text-center text-[12px] leading-[18px] text-white">{shot === "ready" ? "All set! Starting video capture…" : "Position your face in the centre. Tap the camera button to click your selfie."}</p>
          </div>
        )}
        {shot === "recording" && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/40 px-4 py-2 text-[12px] text-white">
            <span className="size-2 animate-pulse rounded-full bg-[#FD2F36]" /> 0:0{sec}
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full bg-[#075EE8] transition-all duration-1000" style={{ width: `${(sec / 8) * 100}%` }} />
            </div>
            0:08
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-3 px-4 pb-6 pt-3">
        <Safe text="Your information stays safe with Airtel" />
        {shot === "idle" && (
          <button aria-label="Take selfie" onClick={() => set({ shot: "photo" })} className="flex size-14 items-center justify-center rounded-full bg-black text-white active:scale-95">
            <Camera className="size-6" />
          </button>
        )}
        {shot === "photo" && (
          <div className="flex w-full gap-3">
            <Btn variant="light" onClick={() => set({ shot: "idle" })}>
              Retake
            </Btn>
            <Btn className="flex-1" onClick={() => set({ shot: "ready" })}>
              Proceed to record video
            </Btn>
          </div>
        )}
        {(shot === "ready" || shot === "recording") && <p className="text-[12px] text-[#696B6F]">Recording… keep your face in the frame</p>}
        {shot === "video" && (
          <div className="flex w-full gap-3">
            <Btn variant="light" onClick={() => set({ shot: "idle" })}>
              Retake
            </Btn>
            <Btn className="flex-1" onClick={() => go("disability")}>
              Submit &amp; Proceed <ArrowRight className="size-4" />
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- overlay sheets (info) ---------------- */

const INFO_SHEETS: Record<string, { title: string; body: React.ReactNode; cta: string; img?: string; onCta?: () => void }> = {
  howPort: {
    title: "How does porting work?",
    body: (
      <div className={cn("rounded-[12px] p-3 text-[12px] leading-[18px]", CARD)}>
        <p className="font-bold text-[#292C31]">1. Generate your porting code</p>
        <p className="text-[#696B6F]">We'll help you request a UPC (Unique Porting Code) for your number.</p>
        <p className="mt-3 font-bold text-[#292C31]">2. Enter the code</p>
        <p className="text-[#696B6F]">Once you get the UPC via SMS, enter it to continue.</p>
      </div>
    ),
    cta: "Got it",
  },
  whatEsim: {
    title: "What is eSIM",
    img: "esim-sim",
    body: (
      <div className={cn("rounded-[12px] p-3 text-[12px] leading-[18px] text-[#3E4146]", CARD)}>
        <p>An eSIM is a digital SIM built into your phone, no physical card needed.</p>
        <p className="mt-2">To activate it, we need your EID, a unique 32-digit number that identifies your phone's eSIM.</p>
        <p className="mt-2">We'll fetch it automatically, no need to find it yourself.</p>
      </div>
    ),
    cta: "Fetch EID number",
    onCta: () => go("eid", { sim: "esim", eidStage: "idle" }),
  },
  benefits: {
    title: "₹449 /month + GST",
    body: (
      <div className="flex flex-col gap-3 text-[13px]">
        <p className="text-[11px] font-bold uppercase tracking-[1.76px] text-[#3E4146]">Plan benefits</p>
        {[
          ["Unlimited data", "Applicable for all family SIMs"],
          ["100 SMS per day", ""],
          ["Unlimited calls (local & STD roaming)", ""],
          ["Google One - 100 GB Cloud Storage", "6 months"],
          ["Adobe Express Premium", "for 12 months"],
          ["Airtel Xstream Play", "3 months"],
          ["Hellotunes", "Lifetime"],
        ].map(([t, s]) => (
          <p key={t} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-[#0F7033]" />
            <span>
              <span className="font-semibold text-[#292C31]">{t}</span>
              {s && <span className="block text-[11px] text-[#696B6F]">{s}</span>}
            </span>
          </p>
        ))}
      </div>
    ),
    cta: "Done",
  },
  tc: {
    title: "Terms & Conditions",
    body: (
      <div className={cn("rounded-[12px] p-3 text-[11px] leading-[17px] text-[#3E4146]", CARD)}>
        <p>a) I hereby confirm that I am the bona fide user of this Airtel Mobile connection.</p>
        <p className="mt-2">b) I am voluntarily using Aadhaar-based authentication for re-verification of my Airtel connection.</p>
        <p className="mt-2">c) I consent to using my Aadhaar number or Virtual-ID, verified by OTP on my Aadhaar-linked mobile number by UIDAI, to share KYC details with Airtel.</p>
        <p className="mt-2">d) I consent to Airtel sharing the details I provide for internal purposes and as required by designated Government offices/agencies.</p>
        <p className="mt-2">e) I understand that Airtel may disconnect the number if any declaration is found false.</p>
      </div>
    ),
    cta: "Got it",
  },
  tc2: {
    title: "Terms & Conditions",
    body: (
      <div className={cn("rounded-[12px] p-3 text-[11px] leading-[17px] text-[#3E4146]", CARD)}>
        <p>1. I give my consent to Airtel for sharing POI/POA details provided by me for internal purposes & with respect to any request from designated Government offices/agencies.</p>
        <p className="mt-2">2. I/We have understood the tariffs and related conditions on which services will be provided inside and outside India.</p>
        <p className="mt-2">3. I/We also undertake to pay the charges for the services subscribed.</p>
        <p className="mt-2">4. Mobile Number Portability (MNP), if applicable - I/We have read and understood the terms and conditions regarding MNP.</p>
      </div>
    ),
    cta: "Got it",
  },
  addresses: {
    title: "Where should we deliver?",
    body: (
      <div className="flex flex-col gap-2 text-[13px]">
        {[
          ["Sushant Lok", "B 446, sushant lok, gurgaon, 112001", true],
          ["Bharti Airtel Limited", "Plot 16, sector 18, Gurgaon, shahpur, Haryana 122008", false],
        ].map(([t, a, on]) => (
          <div key={t as string} className={cn("flex items-start gap-3 rounded-[12px] border p-3", on ? "border-[#075EE8] bg-[#F5F9FF]" : "border-[#E6E9EF]")}>
            <Radio on={on as boolean} />
            <span>
              <span className="block font-bold text-[#292C31]">{t as string}</span>
              <span className="block text-[12px] text-[#696B6F]">{a as string}</span>
            </span>
          </div>
        ))}
        <p className="mt-1 text-center text-[13px] font-medium text-[#075EE8]">+ Add New Address</p>
      </div>
    ),
    cta: "Confirm Your Address",
  },
  mobileEdit: {
    title: "Contact number",
    body: <p className="text-center text-[13px] text-[#696B6F]">We’ll send delivery updates to this number. Go back to change it.</p>,
    cta: "Got it",
  },
  disType: {
    title: "Disability type",
    body: <DisTypeList />,
    cta: "Done",
  },
};

function DisTypeList() {
  const pp = usePP();
  return (
    <div className="flex flex-col">
      {["Leprosy Cured Persons", "Locomotor Disability", "Low Vision", "Hearing Impairment", "Speech and Language Disability"].map((t) => (
        <button key={t} onClick={() => set({ disType: t, sheet: null })} className="flex items-center justify-between border-b border-[#E6E9EF] py-3 text-left text-[14px]">
          {t} <Radio on={pp.disType === t} />
        </button>
      ))}
    </div>
  );
}

function QuickPay() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-[16px] font-bold text-[#292C31]">Quick Pay</p>
      <div className={cn("rounded-[12px] p-3", CARD)}>
        <div className="flex justify-between text-[13px]">
          <span className="text-[#3E4146]">Amount Payable</span>
          <span className="font-bold">₹200</span>
        </div>
        <div className="mt-1 flex justify-between text-[11px]">
          <span className="text-[#696B6F]">Postpaid• 10101010101010</span>
          <span className="font-medium text-[#075EE8]">View Details</span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-[#E6E9EF] pt-3 text-[13px] font-semibold">
          <img src={pic("lg-paytm")} alt="" className="h-5 w-9 object-contain" /> Paytm UPI
        </div>
        <p className="mt-2 flex items-center gap-1.5 rounded-[8px] bg-[#E6F0FF] px-2 py-1.5 text-[11px] text-[#04388B]">
          <Info className="size-3.5" /> You will be redirected to Paytm
        </p>
      </div>
      <div className="flex gap-3">
        <Btn variant="light" className="flex-1" onClick={() => set({ sheet: null })}>
          More Options
        </Btn>
        <Btn className="flex-1" onClick={() => go("upi", { upi: "" })}>
          Pay ₹200
        </Btn>
      </div>
    </div>
  );
}

/* ---------------- journey scene (leading pane on the inner display) ---------------- */

function Scene({ pp, compact }: { pp: PP; compact?: boolean }) {
  const stage = STEPS[pp.step]?.stage ?? 0;
  const steps = ["Share your details", "Make your payment", "Complete your KYC & activate"];
  const summary = [
    pp.kind && ["Connection", pp.kind === "prepaid" ? "Prepaid" : "Postpaid · ₹449/month"],
    pp.mobile.length === 10 && ["Contact", pp.mobile],
    pp.history.includes("address") && ["Deliver to", "B 446, sushant lok, gurgaon"],
    pp.conn && ["Number", pp.conn === "port" ? `Port ${pp.portNumber || ""}`.trim() : pp.newNumber || "New number"],
    pp.sim && ["SIM", pp.sim === "esim" ? "eSIM on this device" : "Physical SIM · by 26 Nov"],
    stage >= 2 && ["Payment", "₹200 paid via Paytm UPI"],
  ].filter(Boolean) as [string, string][];
  return (
    <div className={cn("relative flex h-full flex-col overflow-hidden", !compact && "bg-[linear-gradient(160deg,#FFF6E5_0%,#F3F8E8_40%,#E7F1FF_100%)]")}>
      <div className="relative px-5 pt-4">
        <p className="max-w-[60%] text-[24px] font-bold leading-[30px] text-[#292C31]">
          Your new Airtel SIM, <span className="text-[#E32121]">just 3 steps away</span>
        </p>
        <img src={pic("hero-rider")} alt="" className="absolute -right-2 top-0 w-[200px]" />
      </div>
      <div className="relative z-10 mt-6 flex flex-col gap-3 px-5">
        {steps.map((s, k) => {
          const done = stage > k;
          const now = stage === k;
          return (
            <div key={s} className="flex items-center gap-3">
              <span className={cn("flex size-6 items-center justify-center rounded-full text-[12px] font-bold transition-colors", done ? "bg-[#0F7033] text-white" : now ? "bg-[#075EE8] text-white" : "bg-white text-[#696B6F] ring-1 ring-[#CDD3DD]")}>
                {done ? <Check className="size-3.5" strokeWidth={3} /> : k + 1}
              </span>
              <span className={cn("text-[14px]", now ? "font-bold text-[#292C31]" : done ? "text-[#0F7033]" : "text-[#696B6F]")}>{s}</span>
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="relative z-10 mx-5 mt-6 rounded-[16px] border border-white/80 bg-white/70 p-4 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-[1.76px] text-[#3E4146]">Your order</p>
          {summary.length === 0 && <p className="mt-2 text-[13px] text-[#696B6F]">Pick a connection type to begin.</p>}
          <AnimatePresence initial={false}>
            {summary.map(([a, b]) => (
              <motion.div key={a} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2.5 flex justify-between gap-3 text-[13px]">
                <span className="text-[#696B6F]">{a}</span>
                <span className="truncate text-right font-semibold text-[#292C31]">{b}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {!compact && (
        <div className="mt-auto px-5 pb-6">
          <Safe />
        </div>
      )}
    </div>
  );
}

/* ---------------- flow shell ---------------- */

export function PostpaidFlow({ ghost }: { ghost?: boolean }) {
  const pp = usePP();
  useHardwareKeys(!ghost);
  if (!pp) return null;
  const step = STEPS[pp.step] ?? STEPS.intro;
  const kbField = pp.focus ? FIELDS[pp.focus] : null;
  const suggestion = step.suggestion?.(pp);
  const keyboard = kbField && kbField.key !== "upi" && <Keyboard kind={kbField.kb} suggestion={suggestion} onSuggestion={() => suggestion && set({ [kbField.key]: suggestion })} />;
  const special = pp.step === "sms" ? <SmsCompose pp={pp} /> : pp.step === "upi" ? <UpiPin pp={pp} /> : pp.step === "camera" ? <CameraKyc pp={pp} /> : null;

  const Header = (
    <div className="flex h-12 shrink-0 items-center px-3">
      <button aria-label="Back" onClick={back} className="rounded-full p-1.5 hover:bg-black/5">
        <ChevronLeft className="size-6" />
      </button>
    </div>
  );
  const content = (pageStep: Step, isSheet: boolean) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">{pageStep.body(pp)}</div>
      {pageStep.footer && <div className={cn("shrink-0 px-4 pb-4 pt-3", isSheet ? "" : "border-t border-[#E6E9EF] bg-white")}>{pageStep.footer(pp)}</div>}
    </div>
  );

  const infoSheet = pp.sheet && pp.sheet !== "quickPay" ? INFO_SHEETS[pp.sheet] : null;
  const overlay = (
    <AnimatePresence>
      {pp.sheet && (
        <>
          <motion.button key="scrim" aria-label="Close" onClick={() => set({ sheet: null })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[40] bg-black/45" />
          <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }} className="absolute inset-x-0 bottom-0 z-[41] flex max-h-[88%] flex-col">
            <button aria-label="Close" onClick={() => set({ sheet: null })} className="mx-auto mb-3 flex size-8 items-center justify-center rounded-full bg-white shadow">
              <X className="size-4" />
            </button>
            <div className="no-scrollbar flex flex-col gap-4 overflow-y-auto rounded-t-[24px] bg-white px-4 pb-6 pt-5">
              {pp.sheet === "quickPay" ? (
                <QuickPay />
              ) : (
                infoSheet && (
                  <>
                    {infoSheet.img && <img src={pic(infoSheet.img)} alt="" className="mx-auto size-[100px] mix-blend-multiply" />}
                    <p className="text-center text-[16px] font-bold text-[#292C31]">{infoSheet.title}</p>
                    {infoSheet.body}
                    <Btn className="w-full" onClick={() => (infoSheet.onCta ? infoSheet.onCta() : set({ sheet: null }))}>
                      {infoSheet.cta}
                    </Btn>
                  </>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Phone: page, or a bottom sheet over its page, with the keyboard at the bottom.
  const pageStep = step.kind === "sheet" ? STEPS[step.under ?? "intro"] : step;
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {special ? (
        special
      ) : (
        <>
          <div className={cn("relative flex min-h-0 flex-1 flex-col", pageStep === STEPS.intro && "bg-[linear-gradient(160deg,#FFF6E5_0%,#F3F8E8_40%,#E7F1FF_100%)]")}>
            {Header}
            {pageStep === STEPS.intro && (
              <div className="h-[230px] shrink-0">
                <Scene pp={pp} compact />
              </div>
            )}
            {content(pageStep, false)}
            <AnimatePresence>
              {step.kind === "sheet" && (
                <>
                  <motion.div key="dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-black/45" onClick={back} />
                  <motion.div key={pp.step} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }} className="absolute inset-x-0 bottom-0 z-30 flex max-h-[92%] flex-col">
                    <button aria-label="Close" onClick={back} className="mx-auto mb-3 flex size-8 items-center justify-center rounded-full bg-white shadow">
                      <X className="size-4" />
                    </button>
                    <div className="flex min-h-0 flex-col rounded-t-[24px] bg-white pt-3">{content(step, true)}</div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {keyboard}
        </>
      )}
      {overlay}
    </div>
  );
}

/** Inner display: leading pane (scene) + trailing pane (form). Rendered by Home with pane geometry. */
export function PostpaidSplit({ leadW, trailX, trailW, ghost }: { leadW: number; trailX: number; trailW: number; ghost?: boolean }) {
  const pp = usePP();
  useHardwareKeys(!ghost);
  if (!pp) return null;
  const step = STEPS[pp.step] ?? STEPS.intro;
  const kbField = pp.focus ? FIELDS[pp.focus] : null;
  const suggestion = step.suggestion?.(pp);
  const special = pp.step === "sms" ? <SmsCompose pp={pp} /> : pp.step === "upi" ? <UpiPin pp={pp} /> : pp.step === "camera" ? <CameraKyc pp={pp} /> : null;
  const infoSheet = pp.sheet && pp.sheet !== "quickPay" ? INFO_SHEETS[pp.sheet] : null;
  return (
    <>
      <div className="absolute inset-y-0 left-0 border-r border-[#E6E9EF]" style={{ width: leadW }}>
        <div className="flex h-12 items-center px-3 pt-2">
          <button aria-label="Close Postpaid" onClick={() => store.set({ pp: null })} className="flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-3 text-[13px] font-medium hover:bg-black/5">
            <ChevronLeft className="size-5" /> Manage
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-12">
          <Scene pp={pp} />
        </div>
      </div>
      <div className="absolute inset-y-0 flex flex-col overflow-hidden bg-white" style={{ left: trailX, width: trailW }}>
        {special ?? (
          <>
            <div className="flex h-12 shrink-0 items-center px-3 pt-2">
              <button aria-label="Back" onClick={back} className="rounded-full p-1.5 hover:bg-black/5">
                <ChevronLeft className="size-6" />
              </button>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={pp.step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }} className="flex min-h-0 flex-1 flex-col">
                <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-1">{step.body(pp)}</div>
                {step.footer && <div className="shrink-0 px-5 pb-4 pt-3">{step.footer(pp)}</div>}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              {kbField && kbField.key !== "upi" && (
                <motion.div initial={{ y: 280 }} animate={{ y: 0 }} exit={{ y: 280 }} transition={{ type: "spring", stiffness: 420, damping: 40 }}>
                  <Keyboard kind={kbField.kb} suggestion={suggestion} onSuggestion={() => suggestion && set({ [kbField.key]: suggestion })} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <AnimatePresence>
          {pp.sheet && (
            <>
              <motion.button key="scrim" aria-label="Close" onClick={() => set({ sheet: null })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[40] bg-black/45" />
              <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }} className="absolute inset-x-0 bottom-0 z-[41] flex max-h-[88%] flex-col">
                <button aria-label="Close" onClick={() => set({ sheet: null })} className="mx-auto mb-3 flex size-8 items-center justify-center rounded-full bg-white shadow">
                  <X className="size-4" />
                </button>
                <div className="no-scrollbar flex flex-col gap-4 overflow-y-auto rounded-t-[24px] bg-white px-4 pb-6 pt-5">
                  {pp.sheet === "quickPay" ? (
                    <QuickPay />
                  ) : (
                    infoSheet && (
                      <>
                        {infoSheet.img && <img src={pic(infoSheet.img)} alt="" className="mx-auto size-[100px] mix-blend-multiply" />}
                        <p className="text-center text-[16px] font-bold text-[#292C31]">{infoSheet.title}</p>
                        {infoSheet.body}
                        <Btn className="w-full" onClick={() => (infoSheet.onCta ? infoSheet.onCta() : set({ sheet: null }))}>
                          {infoSheet.cta}
                        </Btn>
                      </>
                    )
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

