import * as React from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Minus, Plus, ScanLine } from "lucide-react";
import { cn } from "@/utils";
import type { DetailSpec } from "./Overlays";

/**
 * Finance, Family and Ask Us tabs, from Figma Yashis-Imaginarium_22-jun · page "iphone duo":
 *   FINANCE 81784:18335 · Family 81788:45991 · Ask Us 81788:46562
 * Illustrated sections are 2× exports of the Figma frames with tap targets laid over them;
 * lists and accordions are live code. Each screen is split into a primary part (leading pane
 * on the inner display) and a secondary part (trailing pane), per the iPhone Duo HIG.
 */

const shots = import.meta.glob<string>("../assets/screens/*.{jpg,png}", { eager: true, import: "default" });
const fin = import.meta.glob<string>("../assets/fin/*.{svg,png}", { eager: true, import: "default" });
const shot = (n: string) => shots[`../assets/screens/${n}`];
const finA = (n: string) => fin[`../assets/fin/${n}`];

export type TabCtx = {
  open: (d: DetailSpec) => void;
  toast: (t: string) => void;
  menu: () => void;
};
export type TabScreen = { top: React.ReactNode; primary: React.ReactNode; secondary: React.ReactNode; fab?: React.ReactNode };

type Spot = { x: number; y: number; w: number; h: number; label: string; on: () => void; round?: boolean };

/** A Figma section export (w×h in points) with tap targets placed in the same coordinates. */
function Shot({ src, w, h, spots = [], className, band }: { src: string; w: number; h: number; spots?: Spot[]; className?: string; band?: string }) {
  if (band)
    return (
      <div className={cn("flex w-full justify-center", className)} style={{ background: band }}>
        <Shot src={src} w={w} h={h} spots={spots} />
      </div>
    );
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: w, maxWidth: "100%", aspectRatio: `${w} / ${h}` }}>
      <img src={shot(src)} alt="" draggable={false} className="absolute inset-0 size-full select-none" />
      {spots.map((s) => (
        <button
          key={s.label}
          aria-label={s.label}
          title={s.label}
          onClick={s.on}
          className={cn("absolute transition-colors hover:bg-black/[0.04] active:bg-black/[0.08]", s.round ? "rounded-full" : "rounded-[14px]")}
          style={{ left: `${(s.x / w) * 100}%`, top: `${(s.y / h) * 100}%`, width: `${(s.w / w) * 100}%`, height: `${(s.h / h) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** Horizontal carousels: the Figma frame clips the next card, so fade the trailing edge. */
const FADE: React.CSSProperties = { maskImage: "linear-gradient(to right, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(to right, #000 82%, transparent)" };

const Pad = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn("flex justify-center px-4", className)}>{children}</div>;
const info = (c: TabCtx, title: string, body: string, cta = "Continue", img?: string): (() => void) => () => c.open({ kind: "info", title, body, cta, img });

function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="Open menu" onClick={onClick} className="rounded-full p-1 hover:bg-black/5">
      <span className="flex size-8 items-center justify-center">
        <svg width="17.2" height="11.42" viewBox="0 0 17.2 11.4222" fill="none" aria-hidden>
          <path d="M0.6 0.6H16.6M0.6 5.71111H7.15952H16.6M0.6 10.8222H7.6" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

/* ================= FINANCE ================= */

const FIN_TABS = [
  { l: "All", i: "cat-all.svg", w: 24.64, h: 25.6 },
  { l: "Loans", i: "cat-loan.svg", w: 28, h: 28 },
  { l: "Bank", i: "cat-bank.svg", w: 28, h: 26 },
  { l: "Cards", i: "cat-card.svg", w: 28, h: 21, tag: "4.7% back" },
  { l: "Investment", i: "cat-invest.svg", w: 25, h: 28 },
  { l: "Bills", i: "cat-bills.svg", w: 25, h: 28 },
  { l: "UPI", i: "cat-upi.svg", w: 22, h: 28 },
];

function FinanceTabs({ c }: { c: TabCtx }) {
  const [tab, setTab] = useState("All");
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-[14px] pt-1">
      {FIN_TABS.map((t) => {
        const active = tab === t.l;
        return (
          <button key={t.l} onClick={() => { setTab(t.l); if (t.l !== "All") c.toast(`Showing ${t.l}`); }} className="flex w-16 shrink-0 flex-col items-center gap-2">
            <span className={cn("relative size-16 overflow-hidden rounded-[16px]", active ? "bg-[#CDD3DD]" : "bg-[#F0F4F9] hover:bg-[#E6E9EF]")}>
              {active && (
                <motion.span layoutId="fin-tab" className="absolute inset-0">
                  {[0, 1, 2, 3].map((i) => (
                    <img key={i} src={finA("cat-bg.svg")} alt="" className="absolute left-[0.94px] top-[0.94px] size-[62px]" />
                  ))}
                  <img src={finA("cat-bg2.svg")} alt="" className="absolute left-[0.94px] top-[0.94px] size-[62px]" />
                </motion.span>
              )}
              {t.tag && (
                <>
                  <img src={finA("cat-tag.svg")} alt="" className="absolute left-[0.26px] top-[46.17px] h-[17.835px] w-[63.487px]" />
                  <span className="absolute left-[32px] top-[47.88px] -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold italic leading-[12px] text-[#04388B]">{t.tag}</span>
                </>
              )}
              <img src={finA(t.i)} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: t.w, height: t.h }} />
            </span>
            <span className="flex h-7 flex-col items-center gap-2">
              <span className={cn("whitespace-nowrap text-[12px] leading-[14px] text-[#292C31]", active ? "font-bold" : "font-normal")}>{t.l}</span>
              {active && <motion.span layoutId="fin-line" className="h-[2px] w-8 rounded-full bg-[linear-gradient(0deg,#FC5252,#E32121)]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function financeScreen(c: TabCtx): TabScreen {
  const top = (
    <>
      <header className="flex h-[69px] shrink-0 items-center px-5">
        <MenuButton onClick={c.menu} />
        <div className="flex-1" />
        <Shot
          src="f-topright.jpg"
          w={175}
          h={40}
          spots={[
            { x: 0, y: 0, w: 125, h: 40, label: "Credit Score 812", on: info(c, "Credit Score · 812", "Your score is Excellent. Paying card dues on time keeps it above 800.", "View report"), round: true },
            { x: 135, y: 0, w: 40, h: 40, label: "Scan QR", on: () => c.toast("Camera opens to scan a QR code"), round: true },
          ]}
        />
      </header>
      <FinanceTabs c={c} />
    </>
  );
  const primary = (
    <>
      <Shot src="f-banner.jpg" w={375} h={206} band="#F0F4F9" spots={[{ x: 162, y: 132, w: 160, h: 40, label: "Get It Now", on: info(c, "Instant Loan", "Get an instant loan of up to ₹2 lakh for your Europe trip. Money in your account in 2 minutes.", "Check eligibility") }]} />
      <Pad>
        <Shot
          src="f-upi.jpg"
          w={343}
          h={158}
          spots={[
            { x: 319, y: 0, w: 24, h: 24, label: "UPI settings", on: info(c, "UPI settings", "Manage UPI ID, linked accounts and UPI PIN.") },
            { x: 0, y: 62, w: 74, h: 96, label: "Pay anyone", on: info(c, "Pay anyone", "Pay any UPI ID, phone number or contact.", "Pay") },
            { x: 90, y: 62, w: 74, h: 96, label: "Check Balance", on: () => c.toast("Balance: ₹12,480.50") },
            { x: 180, y: 62, w: 74, h: 96, label: "Bill & Recharges", on: () => c.open({ kind: "recharge", tab: "popular" }) },
            { x: 269, y: 62, w: 74, h: 96, label: "Transaction History", on: info(c, "Transaction History", "Your last 30 days of UPI payments and transfers.", "View all") },
          ]}
        />
      </Pad>
      <div className="no-scrollbar overflow-x-auto pl-[13px]" style={FADE}>
        <Shot
          src="f-services.jpg"
          w={362}
          h={100}
          spots={[
            { x: 3, y: 28, w: 244, h: 72, label: "Personal Loan", on: info(c, "Personal Loan", "₹5,00,000 sanctioned · No dues. Next EMI date: 5 Dec.", "View loan") },
            { x: 259, y: 28, w: 103, h: 72, label: "Credit Score", on: info(c, "Credit Score · 605", "Improve your score: pay overdue EMIs and keep card usage under 30%.", "See tips") },
          ]}
        />
      </div>
      <Pad>
        <Shot src="f-credit.jpg" w={343} h={146} spots={[{ x: 0, y: 26, w: 343, h: 120, label: "Refresh credit score", on: () => c.toast("Credit score refreshed · 612 (+7)") }]} />
      </Pad>
    </>
  );
  const secondary = (
    <>
      <Pad>
        <Shot
          src="f-explore.jpg"
          w={343}
          h={276}
          spots={[
            { x: 270, y: 0, w: 73, h: 20, label: "View all products", on: () => c.toast("All finance products") },
            ...["Personal Loan", "Insta EMI Card", "Credit Card", "Fixed Deposit", "Gold Loan", "Bank Account"].map((l, k) => ({
              x: (k % 3) * 120,
              y: k < 3 ? 36 : 164,
              w: 103,
              h: 112,
              label: l,
              on: info(c, l, `Explore ${l} options picked for you.`, "Apply now"),
            })),
          ]}
        />
      </Pad>
      <div className="no-scrollbar overflow-x-auto pl-2" style={FADE}>
        <Shot
          src="f-bills.jpg"
          w={367}
          h={156}
          spots={[
            { x: 300, y: 0, w: 60, h: 20, label: "View all bills", on: () => c.toast("All bills and recharges") },
            { x: 8, y: 36, w: 335, h: 120, label: "Airtel Axis Credit card · Pay ₹24,890", on: info(c, "Airtel Axis Credit card", "Overdue by 2 days. Pay ₹24,890 now to avoid late fees.", "Pay ₹24,890") },
          ]}
        />
      </div>
      <div className="no-scrollbar overflow-x-auto pl-2" style={FADE}>
        <Shot
          src="f-tiles.jpg"
          w={367}
          h={112}
          spots={[
            { x: 0, y: 0, w: 103, h: 112, label: "Mobile Recharge", on: () => c.open({ kind: "recharge", tab: "popular" }) },
            { x: 115, y: 0, w: 103, h: 112, label: "FASTag Recharge", on: info(c, "FASTag Recharge", "NETC FASTag **** 0987 · Balance ₹240.", "Recharge") },
            { x: 230, y: 0, w: 103, h: 112, label: "Electricity Bill", on: info(c, "Electricity Bill", "BSES Rajdhani · ₹1,284 due on 3 Dec.", "Pay bill") },
          ]}
        />
      </div>
      <Shot src="f-curated.jpg" w={375} h={342} band="#FFFFFF" spots={[{ x: 16, y: 36, w: 300, h: 306, label: "Get Gold Loan up to ₹2 Crore", on: info(c, "Gold Loan", "Get up to ₹2 crore against your gold at 0.79% per month.", "Apply now") }]} />
    </>
  );
  const fab = (
    <button onClick={() => c.toast("Camera opens to scan any QR")} className="flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(180deg,#2F7CF6,#075EE8)] px-6 text-[14px] font-bold italic text-white shadow-[0_8px_20px_rgba(7,94,232,0.35)] active:scale-95">
      <ScanLine className="size-5" strokeWidth={2} /> Scan any QR
    </button>
  );
  return { top, primary, secondary, fab };
}

/* ================= FAMILY ================= */

const MEMBERS = [
  { n: "Poornima (You)", d: "₹349 · 5G unlimited data · 1 additional pack. Valid till 18 Dec." },
  { n: "Harshit", d: "₹199 smart pack · expired on 21 May. Repeat the recharge to keep calls and data running." },
  { n: "Gurgaon Home", d: "₹3999 plan · VIP · 1 Gbps Wi-Fi. Next bill on 1 Dec." },
];

export function familyScreen(c: TabCtx): TabScreen {
  const member = (k: number) => info(c, MEMBERS[k].n, MEMBERS[k].d, k === 1 ? "Repeat Recharge" : "Manage");
  const top = (
    <header className="flex h-[69px] shrink-0 items-center px-5">
      <MenuButton onClick={c.menu} />
    </header>
  );
  const primary = (
    <>
      <Shot
        src="m-hero.jpg"
        w={375}
        h={361}
        band="linear-gradient(180deg,#F4FAFB,#F7FBFE 50%,#F7F9FE)"
        spots={[
          { x: 112, y: 22, w: 76, h: 100, label: "Poornima (you)", on: member(0), round: true },
          { x: 70, y: 186, w: 86, h: 100, label: "Harshit", on: member(1), round: true },
          { x: 200, y: 208, w: 118, h: 100, label: "014547154467_dsl", on: member(2), round: true },
          { x: 210, y: 4, w: 150, h: 96, label: "Get Free 1 Month of IPTV", on: info(c, "Free IPTV for 1 month", "Add IPTV to your home Wi-Fi and watch 350+ channels free for a month.", "Claim offer") },
          { x: 135, y: 110, w: 110, h: 90, label: "My Home", on: info(c, "My Home", "3 connections · 2 mobiles and 1 Wi-Fi. One bill for everyone.", "View bill") },
        ]}
      />
      <Shot src="m-sheet.jpg" w={375} h={109} band="linear-gradient(180deg,#F7F9FE 0 24px,#FFFFFF 24px)" className="-mt-8" />
      <div className="-mt-8 flex items-center justify-between gap-4 px-5">
        <Shot src="m-avatars.jpg" w={98} h={58} spots={[{ x: 0, y: 0, w: 98, h: 58, label: "Family members", on: member(0), round: true }]} />
        <button onClick={info(c, "Add member", "Invite a family member to share your plan. They'll get an SMS to join.", "Send invite")} className="flex h-14 w-[160px] items-center justify-center gap-2 rounded-[16px] bg-black text-[14px] font-medium text-white hover:bg-[#292C31] active:scale-[0.98]">
          <Plus className="size-5" /> Add member
        </button>
      </div>
      <div className="no-scrollbar overflow-x-auto px-4">
        <Shot src="m-card1.jpg" w={304} h={226} spots={[{ x: 16, y: 166, w: 272, h: 40, label: "Repeat Recharge", on: () => c.open({ kind: "recharge", tab: "others", preset: 39 }) }]} />
      </div>
      <Pad>
        <Shot
          src="m-members.jpg"
          w={343}
          h={324}
          spots={[
            { x: 310, y: 0, w: 33, h: 16, label: "More options", on: () => c.toast("Manage family members") },
            { x: 0, y: 32, w: 343, h: 108, label: MEMBERS[0].n, on: member(0) },
            { x: 0, y: 140, w: 343, h: 92, label: MEMBERS[1].n, on: member(1) },
            { x: 0, y: 232, w: 343, h: 92, label: MEMBERS[2].n, on: member(2) },
          ]}
        />
      </Pad>
    </>
  );
  const secondary = (
    <>
      <div className="no-scrollbar overflow-x-auto pl-4" style={FADE}>
        <Shot src="m-offers.jpg" w={359} h={212} spots={[{ x: 0, y: 30, w: 303, h: 182, label: "Save ₹1200 every year", on: info(c, "Save ₹1200 every year", "Add a postpaid connection to your plan starting at ₹349/month.", "Add now") }]} />
      </div>
      <Pad>
        <Shot
          src="m-service.jpg"
          w={343}
          h={262}
          spots={[
            { x: 290, y: 0, w: 53, h: 16, label: "View all requests", on: () => c.toast("All service requests") },
            { x: 32, y: 222, w: 279, h: 40, label: "Track Request", on: info(c, "Wi-Fi connection request", "Assigned to Amit · expected by 6:00 PM today. You'll get an SMS when it's done.", "Call technician") },
          ]}
        />
      </Pad>
      <Pad>
        <Shot src="m-help.jpg" w={343} h={102} spots={[{ x: 0, y: 30, w: 343, h: 72, label: "Having an issue?", on: info(c, "Raise a request", "Tell us what's wrong and we'll help fix it.", "Raise request") }]} />
      </Pad>
      <Pad>
        <Shot src="m-setup.jpg" w={343} h={264} spots={[{ x: 20, y: 208, w: 303, h: 40, label: "Add family member", on: info(c, "Add member", "Invite a family member to share your plan.", "Send invite") }]} />
      </Pad>
    </>
  );
  return { top, primary, secondary };
}

/* ================= ASK US ================= */

const CATEGORIES = [
  { t: "Billing and payments", icon: "a-ic-bill.png", items: ["Facing issue with recent recharge", "View recent bill details", "Download recharge receipt", "Download Bill", "Service still inactive after payment"] },
  { t: "Manage account & shift requests", icon: "a-ic-acct.png", items: ["Shift my Wi-Fi connection", "Change registered address", "Update email or alternate number", "Transfer ownership"] },
  { t: "Network related", icon: "a-ic-net.png", items: ["Slow internet speed", "No network in my area", "Calls dropping frequently", "5G not showing"] },
  { t: "Pack and plan related", icon: "a-ic-plan.png", items: ["Change my plan", "Pack benefits not received", "Add a data booster", "Compare plans"] },
];

function Accordion({ c }: { c: TabCtx }) {
  const [open, setOpen] = useState<string | null>(CATEGORIES[0].t);
  return (
    <div className="flex flex-col gap-4 px-4">
      <p className="text-[11px] font-bold uppercase leading-[12px] tracking-[1.76px] text-[#696B6F]">Help by category</p>
      {CATEGORIES.map((g) => {
        const isOpen = open === g.t;
        return (
          <div key={g.t} className="overflow-hidden rounded-[16px] border border-[#E6E9EF] bg-[linear-gradient(180deg,#FFFFFF,#F7F8FA)]">
            <button onClick={() => setOpen(isOpen ? null : g.t)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-4 text-left">
              <img src={shot(g.icon)} alt="" className="size-11 shrink-0" />
              <span className="flex-1 text-[14px] font-bold leading-[18px] text-[#292C31]">{g.t}</span>
              {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.22 }}>
                  {g.items.map((it) => (
                    <button key={it} onClick={info(c, it, "Here's what you can do. If this doesn't fix it, chat with us and we'll sort it out.", "Chat with us")} className="flex w-full items-center border-t border-[#E6E9EF] bg-[#F7F8FA] px-4 py-[15px] text-left hover:bg-[#F0F2F5]">
                      <span className="flex-1 text-[14px] leading-5 text-[#292C31]">{it}</span>
                      <ChevronRight className="size-5" />
                    </button>
                  ))}
                  <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-[12px] font-semibold uppercase text-[#696B6F]">Issue not listed</span>
                    <button onClick={() => c.toast("Opening chat…")} className="text-[14px] font-medium text-[#075EE8]">
                      Chat Now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function askUsScreen(c: TabCtx): TabScreen {
  const faq = ["Trouble connecting to internet", "Need help with 5G connection", "Facing issue with SIM card", "Experiencing poor call quality", "View transaction history"];
  const top = (
    <>
      <header className="flex h-[69px] shrink-0 items-center px-5">
        <MenuButton onClick={c.menu} />
      </header>
      <div className="px-4 pb-4 text-center">
        <p className="text-[18px] font-bold leading-[22px] text-[#292C31]">Ask Us</p>
        <p className="mt-1 text-[14px] leading-5 text-[#3E4146]">24×7 support to help you every step of the way</p>
      </div>
    </>
  );
  const primary = (
    <div className="flex flex-col gap-8 bg-[#F0F4F9] pb-4 pt-4">
      <Pad>
        <Shot
          src="a-raise.jpg"
          w={343}
          h={320}
          spots={[
            { x: 0, y: 28, w: 163, h: 78, label: "Network related", on: info(c, "Network related", "Tell us where and when the network drops. We'll check towers near you.", "Raise request") },
            { x: 180, y: 28, w: 163, h: 78, label: "DND related", on: info(c, "DND related", "Block promotional calls and SMS on 9876543210.", "Activate DND") },
            { x: 0, y: 122, w: 163, h: 78, label: "Bill & payments", on: info(c, "Bill & payments", "Questions about a charge, refund or payment.", "Raise request") },
            { x: 180, y: 122, w: 163, h: 78, label: "Plan related", on: info(c, "Plan related", "Change, compare or fix a plan.", "Raise request") },
            { x: 0, y: 216, w: 343, h: 104, label: "Speak with our advisor", on: () => c.toast("Calling 121…") },
          ]}
        />
      </Pad>
      <Pad>
        <Shot src="a-track.jpg" w={343} h={82} spots={[{ x: 0, y: 26, w: 343, h: 56, label: "No active requests", on: () => c.toast("No active requests") }]} />
      </Pad>
      <Pad className="bg-white pt-8">
        <Shot
          src="a-faq.jpg"
          w={343}
          h={342}
          spots={[
            ...faq.map((q, k) => ({ x: 0, y: 30 + k * 52, w: 343, h: 52, label: q, on: info(c, q, "Here are the quickest fixes. Still stuck? Chat with us.", "Chat with us") })),
            { x: 250, y: 292, w: 93, h: 40, label: "Chat Now", on: () => c.toast("Opening chat…") },
          ]}
        />
      </Pad>
    </div>
  );
  const secondary = (
    <>
      <Pad>
        <Shot
          src="a-help-services.jpg"
          w={343}
          h={258}
          spots={[
            { x: 0, y: 30, w: 343, h: 76, label: "Mummy · Prepaid", on: info(c, "Mummy • 0987654321", "Prepaid · ₹299 pack valid till 2 Dec.", "Get help") },
            { x: 0, y: 106, w: 343, h: 76, label: "Nikki_5G · Wi-Fi", on: info(c, "Nikki_5G • 0987654321_wifi", "Wi-Fi · 100 Mbps · all systems normal.", "Get help") },
            { x: 0, y: 182, w: 343, h: 76, label: "Digital TV", on: info(c, "12345678978273-001", "Digital TV · HD pack active.", "Get help") },
          ]}
        />
      </Pad>
      <Accordion c={c} />
      <Pad>
        <Shot
          src="a-need.jpg"
          w={343}
          h={190}
          spots={[
            { x: 0, y: 30, w: 343, h: 80, label: "24×7 support", on: () => c.toast("Calling 121 in your language…") },
            { x: 0, y: 110, w: 343, h: 80, label: "Find a nearby store", on: info(c, "Nearest store", "Airtel Store, Sector 29, Gurgaon · 1.2 km · open till 9 PM.", "Get directions") },
          ]}
        />
      </Pad>
    </>
  );
  return { top, primary, secondary };
}
