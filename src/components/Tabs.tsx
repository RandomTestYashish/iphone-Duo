import * as React from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronRight, Minus, MoreHorizontal, Plus, ScanLine } from "lucide-react";
import { home } from "@/assets/home";
import { cn } from "@/utils";
import { CARD, SectionTitle, useDragScroll } from "./ui";
import type { DetailSpec } from "./Overlays";

/**
 * Finance, Family and Ask Us tabs, rebuilt as Gen4 widgets in code from Figma
 * Yashis-Imaginarium_22-jun · page "iphone duo":
 *   FINANCE 81784:18335 · Family 81788:45991 · Ask Us 81788:46562
 * Only artwork (logos, icons, illustrations) comes from the Figma export; text, cards, lists and
 * buttons are live and fluid, so every widget fills the pane it sits in.
 * Each screen is split into a primary part (leading pane on the inner display) and a secondary part
 * (trailing pane), per the iPhone Duo HIG.
 */

const arts = import.meta.glob<string>("../assets/art/*.{png,jpg}", { eager: true, import: "default" });
const fin = import.meta.glob<string>("../assets/fin/*.svg", { eager: true, import: "default" });
const art = (n: string) => arts[`../assets/art/${n}`];
const finA = (n: string) => fin[`../assets/fin/${n}`];

export type TabCtx = { open: (d: DetailSpec) => void; toast: (t: string) => void; menu: () => void };
export type TabScreen = { top: React.ReactNode; tabs?: React.ReactNode; primary: React.ReactNode; secondary: React.ReactNode; fab?: React.ReactNode };

const info = (c: TabCtx, title: string, body: string, cta = "Continue", img?: string): (() => void) => () => c.open({ kind: "info", title, body, cta, img });

/* ---------------- shared atoms (Gen4) ---------------- */

function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="Open menu" onClick={onClick} className="rounded-full p-1 hover:bg-black/5">
      <span className="flex size-8 items-center justify-center">
        <img src={home("nav-menu.svg")} alt="" className="h-[11.42px] w-[17.2px]" />
      </span>
    </button>
  );
}

function Head({ title, action, onAction, right }: { title: string; action?: string; onAction?: () => void; right?: React.ReactNode }) {
  return (
    <SectionTitle
      className="px-4"
      action={
        right ??
        (action && (
          <button onClick={onAction} className="-mt-1 flex h-5 items-center text-[14px] font-medium leading-4 text-[#075EE8] hover:underline">
            {action}
          </button>
        ))
      }
    >
      {title}
    </SectionTitle>
  );
}

/** Horizontal carousel with snap, touch and mouse drag. */
function Carousel({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  const ref = useDragScroll<HTMLDivElement>();
  return (
    <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4" style={{ gap }}>
      {children}
      <span className="w-px shrink-0" />
    </div>
  );
}

/** Icon-action ✅: 60px elevated circle in a 64px ring, 11px label, optional count notifier. */
function IconAct({ label, icon, badge, onClick }: { label: string; icon: string; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative flex min-w-0 flex-col items-center gap-2 active:scale-95">
      <span className="relative size-[60px] drop-shadow-[0_5px_2.81px_rgba(143,165,227,0.2)] transition-transform group-hover:-translate-y-0.5">
        <span className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F0F4F9]" />
        <span className="absolute left-1/2 top-1/2 size-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[linear-gradient(180deg,#F0F4F9,#FFFFFF)]" />
        <img src={art(icon)} alt="" className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply" />
      </span>
      {badge !== undefined && (
        <span className="absolute right-[calc(50%-34px)] top-1 flex h-4 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#075EE8] px-1 text-[11px] font-bold leading-3 text-white">{badge}</span>
      )}
      <span className="w-[74px] text-center text-[11px] font-medium leading-[14px] text-[#292C31]">{label}</span>
    </button>
  );
}

/** Illustrative grid tile: title on top, 101×60 art at the bottom. Fluid width. */
function ArtTile({ label, img, onClick }: { label: string; img: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("relative flex h-[112px] min-w-0 flex-col items-center overflow-hidden rounded-[16px] pt-4 transition-transform hover:-translate-y-0.5 active:scale-[0.96]", CARD)}>
      <img src={art(img)} alt="" draggable={false} className="absolute bottom-0 left-1/2 h-[60px] w-[101px] max-w-none -translate-x-1/2 object-cover" />
      <p className="relative w-full px-3 text-center text-[12px] font-semibold leading-[14px] text-[#292C31]">{label}</p>
    </button>
  );
}

function PrimaryButton({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("flex h-10 items-center justify-center gap-1 rounded-[12px] bg-black px-3 text-[14px] font-medium leading-4 text-white hover:bg-[#292C31] active:scale-[0.98]", className)}>
      {children}
    </button>
  );
}

/** List_Refresh ✅ card: rows separated by hairlines. */
function ListCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-4 overflow-hidden rounded-[16px] [&>*+*]:border-t [&>*+*]:border-[#E6E9EF]", CARD, className)}>{children}</div>;
}

function Row({ title, sub, lead, right, onClick, bold }: { title: React.ReactNode; sub?: React.ReactNode; lead?: React.ReactNode; right?: React.ReactNode; onClick: () => void; bold?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-[14px] text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]">
      {lead}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-[14px] leading-5 text-[#292C31]", bold && "font-bold")}>{title}</span>
        {sub && <span className="text-[12px] leading-[18px] text-[#696B6F]">{sub}</span>}
      </span>
      {right ?? <ChevronRight className="size-5 shrink-0 text-[#292C31]" strokeWidth={1.6} />}
    </button>
  );
}

function NotListed({ c }: { c: TabCtx }) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <span className="text-[12px] font-semibold uppercase leading-[14px] text-[#696B6F]">Issue not listed</span>
      <button onClick={() => c.toast("Opening chat…")} className="text-[14px] font-medium leading-4 text-[#075EE8] hover:underline">
        Chat Now
      </button>
    </div>
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
  const ref = useDragScroll<HTMLDivElement>();
  return (
    <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-[14px] pt-1">
      {FIN_TABS.map((t) => {
        const active = tab === t.l;
        return (
          <button key={t.l} onClick={() => { setTab(t.l); if (t.l !== "All") c.toast(`Showing ${t.l}`); }} className="flex w-16 shrink-0 flex-col items-center gap-2">
            <span className={cn("ct-scale relative size-16 overflow-hidden rounded-[16px]", active ? "bg-[#CDD3DD]" : "bg-[#F0F4F9] hover:bg-[#E6E9EF]")}>
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
            <span className="ct-label flex h-7 flex-col items-center gap-2">
              <span className={cn("whitespace-nowrap text-[12px] leading-[14px] text-[#292C31]", active ? "font-bold" : "font-normal")}>{t.l}</span>
              {active && <motion.span layoutId="fin-line" className="h-[2px] w-8 rounded-full bg-[linear-gradient(0deg,#FC5252,#E32121)]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ServicePill({ logo, title, sub, w, onClick }: { logo: string; title: string; sub: React.ReactNode; w: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: w }} className={cn("flex shrink-0 snap-start items-center gap-3 rounded-full px-4 py-4 text-left hover:brightness-[0.98] active:scale-[0.98]", CARD)}>
      <img src={art(logo)} alt="" className="size-10 shrink-0 rounded-full" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[16px] font-bold leading-[18px] text-black">{title}</span>
        <span className="truncate text-[12px] leading-[18px] text-[#3E4146]">{sub}</span>
      </span>
      <ChevronRight className="size-5 shrink-0" strokeWidth={1.6} />
    </button>
  );
}

function BillCard({ c, num, status, tone, amount }: { c: TabCtx; num: string; status: string; tone: string; amount: string }) {
  return (
    <div className={cn("flex w-[300px] shrink-0 snap-start flex-col gap-3 rounded-[16px] p-4", CARD)}>
      <div className="flex items-center gap-3">
        <img src={art("lg-axis.png")} alt="" className="size-10 rounded-full" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold leading-5 text-[#3E4146]">Airtel Axis Credit card</p>
          <p className="text-[12px] leading-4 text-[#696B6F]">···· {num}</p>
        </div>
      </div>
      <div className="h-px bg-[#E6E9EF]" />
      <div className="flex items-center justify-between">
        <span className="text-[12px] leading-4" style={{ color: tone }}>{status}</span>
        <button onClick={info(c, "Airtel Axis Credit card", `${status}. Pay ${amount} now to avoid late fees.`, `Pay ${amount}`)} className="h-7 rounded-[8px] bg-black px-3 text-[12px] font-medium text-white hover:bg-[#292C31]">
          Pay {amount}
        </button>
      </div>
    </div>
  );
}

export function financeScreen(c: TabCtx): TabScreen {
  const top = (
    <>
      <header className="flex h-[69px] shrink-0 items-center gap-2 px-5">
        <MenuButton onClick={c.menu} />
        <div className="flex-1" />
        <button onClick={info(c, "Credit Score · 812", "Your score is Excellent. Paying card dues on time keeps it above 800.", "View report")} className="flex items-center gap-1 rounded-full border border-[#E6E9EF] bg-[#F0F4F9] p-2 hover:bg-[#E6E9EF]">
          <span className="rounded-full bg-[#075EE8] px-2 py-1 text-[10px] font-bold leading-3 text-white">812</span>
          <span className="pr-1 text-[12px] font-semibold italic leading-[14px] text-black">Credit Score</span>
        </button>
        <button aria-label="Scan QR" onClick={() => c.toast("Camera opens to scan a QR code")} className="flex size-10 items-center justify-center rounded-full border border-[#E6E9EF] bg-[#F0F4F9] hover:bg-[#E6E9EF]">
          <img src={home("nav-qr.png")} alt="" className="size-5 mix-blend-multiply" />
        </button>
      </header>
    </>
  );
  const tabs = <FinanceTabs c={c} />;

  const primary = (
    <>
      {/* Next Best Action_Refresh ✅ on the blue-grey band */}
      <div className="bg-[#F0F4F9] px-4 py-4">
        <div className="relative flex h-[174px] overflow-hidden rounded-[16px] border border-[#E6E9EF]" style={{ backgroundImage: "linear-gradient(116deg, #D4E6FF 6%, #FFFBDA 99.6%)" }}>
          <img src={art("banner-art.jpg")} alt="" className="h-full w-[128px] shrink-0 object-cover" />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-3 text-center">
            <div>
              <p className="text-[16px] leading-[29px] text-[#3E4146]">Europe Trip?</p>
              <p className="text-[20px] font-bold leading-6 text-[#292C31]">
                Get Instant loan
                <br />
                up to ₹2 lakh
              </p>
            </div>
            <PrimaryButton className="w-[160px]" onClick={info(c, "Instant Loan", "Get an instant loan of up to ₹2 lakh for your Europe trip. Money in your account in 2 minutes.", "Check eligibility")}>
              Get It Now
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* UPI & Bills */}
      <div className="flex flex-col gap-4 px-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="shrink-0 text-[11px] font-bold uppercase leading-[12px] tracking-[1.76px] text-[#3E4146]">UPI &amp; Bills</p>
              <span className="flex min-w-0 items-center gap-0.5 rounded-full bg-[#F2F4F7] px-2">
                <img src={art("upi-logo.png")} alt="" className="size-6 shrink-0 mix-blend-multiply" />
                <span className="truncate text-[11px] leading-[14px] text-[#292C31]">UPI ID:rameshwaramvenu@airtel</span>
              </span>
            </div>
            <p className="mt-1 text-[12px] font-light leading-[18px] text-[#696B6F]">Powered by Airtel Payments Bank</p>
          </div>
          <button aria-label="UPI settings" onClick={info(c, "UPI settings", "Manage UPI ID, linked accounts and UPI PIN.")} className="rounded-full p-0.5 hover:bg-black/5">
            <img src={art("ic-settings.png")} alt="" className="size-6 mix-blend-multiply" />
          </button>
        </div>
        <div className="grid grid-cols-4 justify-items-center">
          <IconAct label="Pay anyone" icon="ic-contacts.png" onClick={info(c, "Pay anyone", "Pay any UPI ID, phone number or contact.", "Pay")} />
          <IconAct label="Check Balance" icon="ic-rupee.png" onClick={() => c.toast("Balance: ₹12,480.50")} />
          <IconAct label="Bill & Recharges" icon="ic-bill.png" badge={21} onClick={() => c.open({ kind: "recharge", tab: "popular" })} />
          <IconAct label="Transaction History" icon="ic-history.png" onClick={info(c, "Transaction History", "Your last 30 days of UPI payments and transfers.", "View all")} />
        </div>
      </div>

      {/* My services */}
      <div className="flex flex-col gap-4">
        <Head title="My services" />
        <Carousel>
          <ServicePill w={244} logo="lg-airtelmoney.png" title="Personal Loan" sub={<>₹ 5,00,000 · <span className="text-[#0F7033]">No dues</span></>} onClick={info(c, "Personal Loan", "₹5,00,000 sanctioned · No dues. Next EMI date: 5 Dec.", "View loan")} />
          <ServicePill w={280} logo="lg-cibil.png" title="Credit Score" sub={<><b className="text-[#8F4C00]">605</b> · <span className="text-[#075EE8]">Improve your score</span></>} onClick={info(c, "Credit Score · 605", "Improve your score: pay overdue EMIs and keep card usage under 30%.", "See tips")} />
          <ServicePill w={280} logo="lg-axis.png" title="Axis Credit Card" sub={<>₹ 5,233 · <span className="text-[#CA262B]">EMI overdue</span></>} onClick={info(c, "Axis Credit Card", "₹5,233 EMI is overdue. Pay now to avoid late fees.", "Pay ₹5,233")} />
        </Carousel>
      </div>

      {/* Credit score_Refresh ✅ */}
      <div className="flex flex-col gap-4">
        <Head title="Check credit score" />
        <div className={cn("mx-4 flex items-center gap-4 rounded-[16px] p-4", CARD)}>
          <img src={art("credit-gauge.png")} alt="Credit score 605" className="size-20 shrink-0 mix-blend-multiply" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold leading-5 text-[#292C31]">Your score may have changed</p>
            <p className="mt-0.5 text-[12px] leading-[18px] text-[#696B6F]">Refresh to check your latest score &amp; personalised insights.</p>
            <button onClick={() => c.toast("Credit score refreshed · 612 (+7)")} className="mt-1 text-[14px] font-medium leading-5 text-[#075EE8] hover:underline">
              Refresh Now
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const secondary = (
    <>
      <div className="flex flex-col gap-4">
        <Head title="Explore products" action="View all" onAction={() => c.toast("All finance products")} />
        <div className="grid grid-cols-3 gap-4 px-4">
          {["Personal Loan", "Insta EMI Card", "Credit Card", "Fixed Deposit", "Gold Loan", "Bank Account"].map((l, k) => (
            <ArtTile key={l} label={l} img={`ex-${k}.png`} onClick={info(c, l, `Explore ${l} options picked for you.`, "Apply now")} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Head title="Bills and recharges" action="View All" onAction={() => c.toast("All bills and recharges")} />
        <Carousel>
          <BillCard c={c} num="4566" status="Overdue by 2 days" tone="#CA262B" amount="₹24,890" />
          <BillCard c={c} num="8812" status="Due in 5 days" tone="#8F4C00" amount="₹6,420" />
        </Carousel>
        <div className="grid grid-cols-3 gap-4 px-4">
          <ArtTile label="Mobile Recharge" img="bt-0.png" onClick={() => c.open({ kind: "recharge", tab: "popular" })} />
          <ArtTile label="FASTag Recharge" img="bt-1.png" onClick={info(c, "FASTag Recharge", "NETC FASTag **** 0987 · Balance ₹240.", "Recharge")} />
          <ArtTile label="Electricity Bill" img="bt-2.png" onClick={info(c, "Electricity Bill", "BSES Rajdhani · ₹1,284 due on 3 Dec.", "Pay bill")} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Head title="Curated for you" />
        <div className="px-4">
          <button onClick={info(c, "Gold Loan", "Get up to ₹2 crore against your gold at 0.79% per month.", "Apply now")} className="block w-full max-w-[300px] overflow-hidden rounded-[16px] active:scale-[0.99]">
            <img src={art("cur-1.jpg")} alt="Get Gold Loan up to ₹2 Crore" className="w-full" />
          </button>
        </div>
      </div>
    </>
  );

  const fab = (
    <button onClick={() => c.toast("Camera opens to scan any QR")} className="flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(180deg,#2F7CF6,#075EE8)] px-6 text-[14px] font-bold italic text-white shadow-[0_8px_20px_rgba(7,94,232,0.35)] active:scale-95">
      <ScanLine className="size-5" strokeWidth={2} /> Scan any QR
    </button>
  );
  return { top, tabs, primary, secondary, fab };
}

/* ================= FAMILY ================= */

const MEMBERS = [
  { n: "Poornima (You)", s: "₹ 349 • 5G unlimited data • 1 additional pack", d: "₹349 · 5G unlimited data · 1 additional pack. Valid till 18 Dec.", a: "av-1.png" },
  { n: "Harshit", s: "₹ 199 smart pack", d: "₹199 smart pack · expired on 21 May. Repeat the recharge to keep calls and data running.", a: "av-2.png", due: true },
  { n: "Gurgaon Home", s: "₹ 3999 plan • VIP • 1 Gbps", d: "₹3999 plan · VIP · 1 Gbps Wi-Fi. Next bill on 1 Dec.", a: "av-3.png" },
];

function StatusCard({ c, title, sub, cta, onCta }: { c: TabCtx; title: string; sub: string; cta: string; onCta?: () => void }) {
  return (
    <div className={cn("flex w-[304px] shrink-0 snap-start flex-col items-center gap-4 rounded-[16px] p-4", CARD)}>
      <img src={art("art-bill.png")} alt="" className="size-[88px] mix-blend-multiply" />
      <div className="text-center">
        <p className="text-[16px] font-bold leading-5 text-[#292C31]">{title}</p>
        <p className="mt-1 text-[14px] leading-5 text-[#696B6F]">{sub}</p>
      </div>
      <PrimaryButton className="w-full" onClick={onCta ?? (() => c.open({ kind: "recharge", tab: "popular" }))}>
        {cta}
      </PrimaryButton>
    </div>
  );
}

function OfferCard({ c, save, desc, from }: { c: TabCtx; save: string; desc: string; from: string }) {
  return (
    <div className="relative h-[182px] w-[303px] shrink-0 snap-start overflow-hidden rounded-[16px] border border-[#E6E9EF]" style={{ background: "linear-gradient(135deg,#E9F1FF 0%,#F7FAFF 60%,#EEF3FF 100%)" }}>
      <img src={art("offer-art.png")} alt="" className="absolute bottom-1 right-4 h-[122px] w-[76px] mix-blend-multiply" style={{ maskImage: "radial-gradient(closest-side, #000 72%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent)" }} />
      <div className="relative flex h-full w-[200px] flex-col justify-between p-3">
        <div>
          <p className="text-[26px] font-extrabold italic leading-7 text-[#0B3B9C]">Save {save}</p>
          <p className="text-[12px] font-bold italic uppercase leading-4 text-[#0B3B9C]">Every year</p>
          <p className="mt-2 text-[12px] leading-[18px] text-[#3E4146]">
            {desc} <b className="italic">{from}</b>
          </p>
        </div>
        <button onClick={info(c, `Save ${save} every year`, `${desc} ${from}.`, "Add now")} className="flex h-8 w-fit items-center gap-1 rounded-[8px] bg-black px-3 text-[14px] font-medium text-white hover:bg-[#292C31]">
          Add Now <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Progress() {
  return (
    <div className="px-1">
      <div className="relative mx-3 h-6">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#E6E9EF]" />
        <div className="absolute left-0 top-1/2 h-2 w-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#E32121,#FC5252)]" />
        {[true, true, false].map((done, k) => (
          <span key={k} className={cn("absolute top-0 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white", done ? "bg-[#E32121]" : "bg-[#E6E9EF]")} style={{ left: `${k * 50}%` }}>
            {done && <Check className="size-3 text-white" strokeWidth={3} />}
          </span>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] leading-[18px]">
        <span className="font-semibold text-[#3E4146]">Raised</span>
        <span className="font-semibold text-[#3E4146]">In progress</span>
        <span className="text-[#696B6F]">Resolved</span>
      </div>
    </div>
  );
}

export function familyScreen(c: TabCtx): TabScreen {
  const member = (k: number) => info(c, MEMBERS[k].n, MEMBERS[k].d, MEMBERS[k].due ? "Repeat Recharge" : "Manage");
  const addMember = info(c, "Add member", "Invite a family member to share your plan. They'll get an SMS to join.", "Send invite");
  const top = (
    <header className="flex h-[69px] shrink-0 items-center bg-[#F4FAFB] px-5">
      <MenuButton onClick={c.menu} />
    </header>
  );
  const heroSpots = [
    { x: 112, y: 22, w: 76, h: 100, label: "Poornima (you)", on: member(0) },
    { x: 70, y: 186, w: 86, h: 100, label: "Harshit", on: member(1) },
    { x: 200, y: 208, w: 118, h: 100, label: "014547154467_dsl", on: member(2) },
    { x: 210, y: 4, w: 150, h: 96, label: "Get Free 1 Month of IPTV", on: info(c, "Free IPTV for 1 month", "Add IPTV to your home Wi-Fi and watch 350+ channels free for a month.", "Claim offer") },
    { x: 135, y: 110, w: 110, h: 90, label: "My Home", on: info(c, "My Home", "3 connections · 2 mobiles and 1 Wi-Fi. One bill for everyone.", "View bill") },
  ];
  const primary = (
    <>
      {/* My Home map (illustration) on the hero gradient; the gradient fills wider panes */}
      <div className="-mb-8 flex justify-center" style={{ background: "linear-gradient(180deg,#F4FAFB,#F7FBFE 50%,#F7F9FE)" }}>
        <div className="relative w-[375px] max-w-full" style={{ aspectRatio: "375 / 361" }}>
          <img src={art("hero.jpg")} alt="My Home: Poornima, Harshit and the home Wi-Fi" className="absolute inset-0 size-full" />
          {heroSpots.map((s) => (
            <button key={s.label} aria-label={s.label} onClick={s.on} className="absolute rounded-full hover:bg-black/[0.03]" style={{ left: `${(s.x / 375) * 100}%`, top: `${(s.y / 361) * 100}%`, width: `${(s.w / 375) * 100}%`, height: `${(s.h / 361) * 100}%` }} />
          ))}
        </div>
      </div>
      {/* Bottom Sheet ✅: title + members strip */}
      <div className="relative -mt-6 rounded-t-[24px] bg-white px-5 pt-6">
        <div className="text-center">
          <p className="text-[18px] font-bold leading-[22px] text-black">My Family</p>
          <p className="mt-1 text-[14px] leading-5 text-[#3E4146]">Manage everyone’s recharges and bills</p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <button onClick={member(0)} className="flex" aria-label="Family members">
            {["P", "H"].map((l, k) => (
              <span key={l} className={cn("flex size-[58px] items-center justify-center rounded-full border-[1.5px] border-[#9CBFF6] bg-[#E6F0FF] text-[24px] text-[#292C31]", k > 0 && "-ml-[18px]")}>
                {l}
              </span>
            ))}
          </button>
          <PrimaryButton className="h-14 w-[160px] rounded-[16px]" onClick={addMember}>
            <Plus className="size-5" /> Add member
          </PrimaryButton>
        </div>
      </div>
      <Carousel gap={16}>
        <StatusCard c={c} title="₹199 pack expired on 21 May" sub="Prepaid •7787878787" cta="Repeat Recharge" onCta={() => c.open({ kind: "recharge", tab: "others", preset: 39 })} />
        <StatusCard c={c} title="₹349 pack expires in 3 days" sub="Prepaid •9876543210" cta="Recharge Now" />
      </Carousel>
      <div className="flex flex-col gap-4">
        <Head
          title="Family members"
          right={
            <button aria-label="More options" onClick={() => c.toast("Manage family members")} className="-mt-1">
              <MoreHorizontal className="size-4" />
            </button>
          }
        />
        <ListCard>
          {MEMBERS.map((m, k) => (
            <Row
              key={m.n}
              onClick={member(k)}
              lead={<img src={art(m.a)} alt="" className="size-10 shrink-0 self-start rounded-full" />}
              title={
                <span className="flex items-center gap-2">
                  <b className="flex-1">{m.n}</b>
                  {m.due && <span className="rounded-[4px] border border-[#FEACAF] bg-[#FFD5D7] px-1.5 text-[12px] font-semibold leading-[18px] text-[#981C20]">Action Due</span>}
                </span>
              }
              sub={m.s}
              right={<ChevronRight className="size-5 shrink-0 text-[#075EE8]" strokeWidth={1.8} />}
            />
          ))}
        </ListCard>
      </div>
    </>
  );
  const secondary = (
    <>
      <div className="flex flex-col gap-4">
        <Head title="Offers for you" />
        <Carousel gap={18}>
          <OfferCard c={c} save="₹1200" desc="Add a postpaid connection to your plan Starting at" from="₹349/month" />
          <OfferCard c={c} save="₹600" desc="Add a DTH connection to your plan Starting at" from="₹199/month" />
        </Carousel>
      </div>
      <div className="flex flex-col gap-4">
        <Head title="Service requests" action="View all" onAction={() => c.toast("All service requests")} />
        <div className={cn("mx-4 flex flex-col gap-4 rounded-[16px] px-4 pb-4 pt-6", CARD)}>
          <div className="flex items-center justify-between text-[12px] font-semibold leading-[14px]">
            <span className="flex items-center gap-1 text-[#FD2F36]">
              <img src={art("svc-wifi.png")} alt="" className="size-4 mix-blend-multiply" /> Wi-Fi
            </span>
            <span className="text-[#292C31]">014547154467_dsl</span>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-bold leading-4 text-[#292C31]">We’re working on your connection</p>
            <p className="mt-1 text-[14px] leading-5 text-[#3E4146]">
              Assigned to Amit • Expected by <b>6:00 PM</b>
            </p>
          </div>
          <Progress />
        </div>
        <div className="flex justify-center px-8">
          <PrimaryButton className="w-full max-w-[279px]" onClick={info(c, "Wi-Fi connection request", "Assigned to Amit · expected by 6:00 PM today. You'll get an SMS when it's done.", "Call technician")}>
            Track Request
          </PrimaryButton>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Head title="Need more help" />
        <button onClick={info(c, "Raise a request", "Tell us what's wrong and we'll help fix it.", "Raise request")} className={cn("mx-4 flex items-center gap-2 rounded-[16px] px-3 py-2 text-left hover:brightness-[0.98]", CARD)}>
          <img src={art("art-help.png")} alt="" className="size-14 shrink-0 mix-blend-multiply" />
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold leading-5 text-[#292C31]">Having an issue?</span>
            <span className="block text-[12px] leading-[18px] text-[#696B6F]">Raise a request and we’ll help fix it</span>
          </span>
          <ChevronRight className="size-6 shrink-0" strokeWidth={1.4} />
        </button>
      </div>
      <div className={cn("mx-4 flex flex-col items-center gap-4 rounded-[16px] p-4", CARD)}>
        <img src={art("art-setup.png")} alt="" className="size-[90px] mix-blend-multiply" />
        <div className="text-center">
          <p className="text-[16px] font-bold leading-5 text-[#292C31]">Setup your family</p>
          <p className="mt-1 text-[14px] leading-5 text-[#696B6F]">Manage all connections, bills and get support for them at one place</p>
        </div>
        <PrimaryButton className="w-full" onClick={addMember}>
          Add family member
        </PrimaryButton>
      </div>
    </>
  );
  return { top, primary, secondary };
}

/* ================= ASK US ================= */

const CATEGORIES = [
  { t: "Billing and payments", icon: "ic-bill.png", items: ["Facing issue with recent recharge", "View recent bill details", "Download recharge receipt", "Download Bill", "Service still inactive after payment"] },
  { t: "Manage account & shift requests", icon: "ic-acct.png", items: ["Shift my Wi-Fi connection", "Change registered address", "Update email or alternate number", "Transfer ownership"] },
  { t: "Network related", icon: "ic-net.png", items: ["Slow internet speed", "No network in my area", "Calls dropping frequently", "5G not showing"] },
  { t: "Pack and plan related", icon: "ic-plan.png", items: ["Change my plan", "Pack benefits not received", "Add a data booster", "Compare plans"] },
];

function Accordion({ c }: { c: TabCtx }) {
  const [open, setOpen] = useState<string | null>(CATEGORIES[0].t);
  return (
    <div className="flex flex-col gap-4">
      <Head title="Help by category" />
      {CATEGORIES.map((g) => {
        const isOpen = open === g.t;
        return (
          <div key={g.t} className={cn("mx-4 overflow-hidden rounded-[16px]", CARD)}>
            <button onClick={() => setOpen(isOpen ? null : g.t)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-4 text-left">
              <img src={art(g.icon)} alt="" className="size-11 shrink-0 rounded-full mix-blend-multiply" />
              <span className="flex-1 text-[14px] font-bold leading-[18px] text-[#292C31]">{g.t}</span>
              {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  {g.items.map((it) => (
                    <button key={it} onClick={info(c, it, "Here's what you can do. If this doesn't fix it, chat with us and we'll sort it out.", "Chat with us")} className="flex w-full items-center border-t border-[#E6E9EF] bg-[#F7F8FA] px-4 py-[15px] text-left hover:bg-[#F0F2F5]">
                      <span className="flex-1 text-[14px] leading-5 text-[#292C31]">{it}</span>
                      <ChevronRight className="size-5" strokeWidth={1.6} />
                    </button>
                  ))}
                  <NotListed c={c} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function RequestTile({ label, img, w, h, onClick }: { label: string; img: string; w: number; h: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex h-[78px] min-w-0 items-center justify-between gap-2 rounded-[16px] px-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]", CARD)}>
      <span className="text-[14px] leading-[18px] text-[#292C31]">{label}</span>
      <img src={art(img)} alt="" className="shrink-0 mix-blend-multiply" style={{ width: w, height: h }} />
    </button>
  );
}

export function askUsScreen(c: TabCtx): TabScreen {
  const faq = ["Trouble connecting to internet", "Need help with 5G connection", "Facing issue with SIM card", "Experiencing poor call quality", "View transaction history"];
  const ask = (t: string, b: string, cta = "Raise request") => info(c, t, b, cta);
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
    <>
      <div className="flex flex-col gap-8 bg-[#F0F4F9] py-4">
        <div className="flex flex-col gap-4">
          <Head title="Raise a request" />
          <div className="grid grid-cols-2 gap-4 px-4">
            <RequestTile label="Network related" img="rq-net.png" w={44} h={35} onClick={ask("Network related", "Tell us where and when the network drops. We'll check towers near you.")} />
            <RequestTile label="DND related" img="rq-dnd.png" w={44} h={32} onClick={ask("DND related", "Block promotional calls and SMS on 9876543210.", "Activate DND")} />
            <RequestTile label="Bill & payments" img="rq-bill.png" w={44} h={44} onClick={ask("Bill & payments", "Questions about a charge, refund or payment.")} />
            <RequestTile label="Plan related" img="rq-plan.png" w={49} h={49} onClick={ask("Plan related", "Change, compare or fix a plan.")} />
          </div>
          <button onClick={() => c.toast("Calling 121…")} className={cn("mx-4 flex h-[104px] items-center gap-3 rounded-[16px] px-4 text-left hover:brightness-[0.98]", CARD)}>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold leading-5 text-[#292C31]">Speak with our advisor</span>
              <span className="mt-1 block text-[14px] leading-5 text-[#3E4146]">Tap and call us for instant support.</span>
            </span>
            <img src={art("rq-advisor.png")} alt="" className="size-[66px] shrink-0 mix-blend-multiply" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <Head title="Track request" />
          <ListCard>
            <Row title="No active requests" onClick={() => c.toast("No active requests")} />
          </ListCard>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Head title="Support for frequent queries" />
        <ListCard>
          {faq.map((q) => (
            <Row key={q} title={q} onClick={info(c, q, "Here are the quickest fixes. Still stuck? Chat with us.", "Chat with us")} />
          ))}
          <NotListed c={c} />
        </ListCard>
      </div>
    </>
  );
  const secondary = (
    <>
      <div className="flex flex-col gap-4">
        <Head title="Help by services" />
        <ListCard>
          {[
            { t: "Mummy • 0987654321", s: "Prepaid", i: "hs-1.png", d: "Prepaid · ₹299 pack valid till 2 Dec." },
            { t: "Nikki_5G • 0987654321_wifi", s: "Wi-Fi", i: "hs-2.png", d: "Wi-Fi · 100 Mbps · all systems normal." },
            { t: "12345678978273-001", s: "Digital TV", i: "hs-3.png", d: "Digital TV · HD pack active." },
          ].map((r) => (
            <Row key={r.t} bold title={r.t} sub={r.s} lead={<img src={art(r.i)} alt="" className="size-11 shrink-0 rounded-full mix-blend-multiply" />} onClick={info(c, r.t, r.d, "Get help")} />
          ))}
        </ListCard>
      </div>
      <Accordion c={c} />
      <div className="flex flex-col gap-4">
        <Head title="Need more help?" />
        <ListCard>
          <Row bold title="24×7 support" sub="Talk to us in your language" lead={<img src={art("nd-1.png")} alt="" className="h-12 w-[60px] shrink-0 object-contain mix-blend-multiply" />} onClick={() => c.toast("Calling 121 in your language…")} />
          <Row bold title="Find a nearby store" lead={<img src={art("nd-2.png")} alt="" className="h-12 w-[60px] shrink-0 object-contain mix-blend-multiply" />} onClick={info(c, "Nearest store", "Airtel Store, Sector 29, Gurgaon · 1.2 km · open till 9 PM.", "Get directions")} />
        </ListCard>
      </div>
    </>
  );
  return { top, primary, secondary };
}
