import * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { home } from "@/assets/home";
import { cn } from "@/utils";
import { Arrow, CARD, ClipTag, SectionTitle, StatusBar, useDragScroll } from "./ui";
import { Detail, DetailPanel, Drawer, SearchOverlay, Toast, type DetailSpec } from "./Overlays";
import { store, useStore, type Pack } from "@/store";
import { askUsScreen, familyScreen, financeScreen, type TabCtx, type TabScreen } from "./Tabs";

/**
 * "Manage Landing" on iPhone Duo, following Apple's HIG "Designing for iPhone Duo":
 *
 *  outer    closed, outer display (compact width). Wider and shorter than other iPhones, so the
 *           status bar, toolbar and tab bar sit on a vertical rail on the trailing edge.
 *  open     inner display, landscape, fully open (regular width). Split view: a leading pane
 *           (primary — your account) and a trailing pane (secondary — discover, or the detail of
 *           whatever you tap). Controls stay on the trailing-edge rail; pane controls sit on their pane.
 *  book     inner display partially folded. Panes become equal and keep clear of the folding region.
 *  portrait inner display in portrait: enough height for standard horizontal bars.
 *
 * Sections are fluid (no fixed widths), so the same components fill every pose.
 */

export type Mode = "outer" | "open" | "book" | "portrait";
export type Ctx = { open: (d: DetailSpec) => void; toast: (t: string) => void; pack: Pack | null };
export type { Pack };

/** Estimated from the HIG diagrams — Apple publishes the poses, not point sizes. */
export const SIZES: Record<Mode, { w: number; h: number }> = {
  outer: { w: 488, h: 680 },
  open: { w: 976, h: 680 },
  book: { w: 976, h: 680 },
  portrait: { w: 680, h: 976 },
};
export const RAIL = 64;
export const FOLD = 26; // folding region excluded at the centre when partially folded

const BRAND = __DEMO__ ? "svc-brand" : "svc-logo.png";

/* ---------------- Atoms ---------------- */

function GridTile({ label, img, tag, onClick }: { label: string; img: string; tag?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("relative flex h-[112px] min-w-0 flex-col items-center overflow-visible rounded-[16px] pt-4 transition-transform hover:-translate-y-0.5 active:scale-[0.96]", CARD)}>
      <span className="absolute inset-x-0 bottom-0 h-[60px] overflow-hidden rounded-b-[16px]">
        <img src={home(img)} alt="" draggable={false} className="absolute bottom-0 left-1/2 h-[60px] w-[101px] max-w-none -translate-x-1/2 object-cover" />
      </span>
      {tag && (
        <div className="absolute left-1/2 top-[-5px] -translate-x-1/2">
          <ClipTag size="sm">{tag}</ClipTag>
        </div>
      )}
      <p className="relative w-full px-3 text-center text-[12px] font-semibold leading-[14px] text-[#292C31]">{label}</p>
    </button>
  );
}

function IconAction({ label, icon, highlight, onClick }: { label: string; icon?: string; highlight?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex min-w-0 flex-col items-center gap-2 active:scale-95">
      <span className="relative size-[60px] drop-shadow-[0_5px_2.81px_rgba(143,165,227,0.2)] transition-transform group-hover:-translate-y-0.5">
        <span className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F0F4F9]" />
        <span className="absolute left-1/2 top-1/2 size-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[linear-gradient(180deg,#F0F4F9,#FFFFFF)]" />
        {highlight && (
          <span className="absolute left-1/2 top-1/2 size-[60px] -translate-x-1/2 -translate-y-1/2 -scale-y-100">
            <img src={home("ms-hl-last.svg")} alt="" className="absolute inset-0 size-full" />
            <img src={home("ms-hl-flourish.svg")} alt="" className="absolute left-[-2px] top-[-2px] size-16 max-w-none animate-[spin_6s_linear_infinite]" />
          </span>
        )}
        {icon ? (
          <img src={home(icon)} alt="" className="absolute left-1/2 top-1/2 size-[21px] -translate-x-1/2 -translate-y-1/2" />
        ) : (
          <span className="absolute left-1/2 top-1/2 grid size-4 -translate-x-1/2 -translate-y-1/2 grid-cols-2 gap-[3.4px]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="border-[1.2px] border-black" />
            ))}
          </span>
        )}
      </span>
      <span className="w-[74px] text-center text-[11px] font-medium leading-[14px] text-[#292C31]">{label}</span>
    </button>
  );
}

function BrandMark({ className }: { className?: string }) {
  if (BRAND !== "svc-brand") return <img src={home(BRAND)} alt="" className={cn("rounded-full object-cover", className)} />;
  return <span className={cn("flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#FC5252,#E32121)] text-[20px] font-extrabold italic text-white", className)}>N</span>;
}

/* ---------------- Sections (fluid) ---------------- */

const TABS = [
  { label: "All", icon: "cat-all-home.svg", w: 24.64, h: 25.6 },
  { label: "Prepaid", icon: "cat-prepaid.svg", w: 26.67, h: 26.67 },
  { label: "Postpaid", icon: "cat-postpaid.svg", w: 21.33, h: 28, tag: true },
  { label: "Wi-Fi", icon: "cat-wifi.svg", w: 25.5, h: 28 },
  { label: "Digital TV", icon: "cat-tv.svg", w: 28, h: 28 },
];

function CategoryTabs({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const ref = useDragScroll<HTMLDivElement>();
  return (
    <div ref={ref} className="no-scrollbar flex justify-between gap-2 overflow-x-auto px-4 pb-[14px] pt-1">
      {TABS.map((c) => {
        const active = tab === c.label;
        return (
          <button key={c.label} onClick={() => setTab(c.label)} className="flex w-16 shrink-0 flex-col items-center gap-2">
            <span className={cn("relative size-16 overflow-hidden rounded-[16px] transition-colors", active ? "bg-[#CDD3DD]" : "bg-[#F0F4F9] hover:bg-[#E6E9EF]")}>
              {active && (
                <motion.span layoutId="tab-bg" className="absolute inset-0" transition={{ type: "spring", stiffness: 500, damping: 40 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <img key={i} src={home("cat-all-bg.svg")} alt="" className="absolute left-[0.94px] top-[0.94px] size-[62px]" />
                  ))}
                  <img src={home("cat-all-bg2.svg")} alt="" className="absolute left-[0.94px] top-[0.94px] size-[62px]" />
                </motion.span>
              )}
              {c.tag && (
                <>
                  <img src={home("cat-postpaid-tag.svg")} alt="" className="absolute left-[0.26px] top-[46.17px] h-[17.835px] w-[63.487px]" />
                  <span className="absolute left-[32.5px] top-[47.88px] -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold italic leading-[12px] text-[#04388B]">Unlimited</span>
                </>
              )}
              <img src={home(c.icon)} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: c.w, height: c.h }} />
            </span>
            <span className="flex h-7 flex-col items-center justify-start gap-2">
              <span className={cn("whitespace-nowrap text-[12px] leading-[14px] text-[#292C31]", active ? "font-bold" : "font-normal")}>{c.label}</span>
              {active && <motion.span layoutId="tab-line" className="h-[2px] w-8 rounded-full bg-[linear-gradient(0deg,#FC5252,#E32121)]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PackStatus({ ctx }: { ctx: Ctx }) {
  const p = ctx.pack;
  return (
    <div className="bg-[#F0F4F9] px-4 pb-4 pt-[22px]">
      <div className="flex flex-col gap-4">
        <div className={cn("relative flex flex-col items-center gap-5 rounded-[16px] px-4 pb-6 pt-5 drop-shadow-[0_4px_6px_rgba(0,0,0,0.04)]", CARD)}>
          <div className="absolute left-1/2 top-[-7px] -translate-x-1/2">
            <ClipTag size="lg" tone={p ? "green" : "red"}>{p ? "Pack Active" : "Pack Status"}</ClipTag>
          </div>
          <div className="flex w-full items-center gap-4">
            <div className="flex flex-1 items-center gap-1">
              <span className="relative size-4">
                {__DEMO__ ? <span className="absolute left-[3px] top-[3px] size-[10px] rounded-full bg-[#FD2F36]" /> : <img src={home("nba-prepaid.svg")} alt="" className="absolute left-[1.33px] top-[1.33px] size-[13.33px]" />}
              </span>
              <p className="text-[12px] font-semibold leading-[14px] text-[#FD2F36]">Prepaid</p>
            </div>
            <p className="flex-1 text-right text-[12px] font-semibold leading-[14px] text-[#292C31]">9876543210</p>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={p ? "on" : "off"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex w-full flex-col gap-1 pb-2 pt-1 text-center text-[14px]">
              {p ? (
                <>
                  <p className="font-bold leading-4 text-[#0F7033]">Your ₹{p.price} pack is active</p>
                  <p className="font-medium leading-5 text-[#3E4146]">
                    {p.data} · valid till {p.till}. Enjoy uninterrupted service.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold leading-4 text-[#292C31]">Your ₹399 pack is expiring today</p>
                  <p className="font-medium leading-5 text-[#3E4146]">Recharge now to avoid service interruption and continue enjoying your benefits.</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => ctx.open({ kind: "recharge", tab: "all" })} className="flex h-10 flex-1 items-center justify-center rounded-[12px] border border-[#E6E9EF] bg-white px-3 text-[14px] font-medium leading-4 text-[#485B76] hover:bg-[#F7F9FC] active:bg-[#F0F4F9]">
            Explore Packs
          </button>
          <button onClick={() => ctx.open({ kind: "recharge", tab: "popular" })} className="flex h-10 flex-1 items-center justify-center rounded-[12px] border border-black bg-black px-1 text-[14px] font-medium leading-4 text-white hover:bg-[#292C31] active:bg-[#3E4146]">
            {p ? "Recharge Again" : "Recharge Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MyServices({ ctx }: { ctx: Ctx }) {
  const [show, setShow] = useState(false);
  return (
    <div className="px-4">
      <SectionTitle>my services</SectionTitle>
      <div className="mt-[14px] grid grid-cols-2 gap-2">
        <button
          onClick={() => ctx.open({ kind: "info", title: "5 Services", body: "Prepaid, Postpaid, Wi-Fi, DTH and Airtel Payments Bank are linked to this account. Your prepaid pack expires in 1 day.", cta: "View details" })}
          className={cn("relative h-[72px] min-w-0 overflow-hidden rounded-full text-left hover:brightness-[0.98] active:scale-[0.98]", CARD)}
        >
          <BrandMark className="absolute left-[9px] top-[9px] size-[52px]" />
          <p className="absolute left-[68px] right-3 top-4 truncate text-[13px] font-bold leading-[18px] text-black">5 Services</p>
          <span className="absolute left-[70px] right-4 top-[34px] h-[26px] overflow-hidden">
            <span className="mt-1 inline-flex animate-marquee whitespace-nowrap text-[12px] leading-[18px] text-[#DA9802]">
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className="pr-6">
                  Prepaid expiring in 1 day
                </span>
              ))}
            </span>
          </span>
        </button>
        <button
          onClick={() => {
            setShow((s) => !s);
            if (!show) ctx.toast("Balance shown · tap again to hide");
          }}
          className={cn("relative h-[72px] min-w-0 rounded-full text-left hover:brightness-[0.98] active:scale-[0.98]", CARD)}
          aria-label="Airtel Payments Bank balance"
        >
          <img src={home("svc-bank-circle.svg")} alt="" className="absolute left-[9px] top-[9px] size-[52px]" />
          {__DEMO__ ? <BrandMark className="absolute left-5 top-5 size-[31px] text-[13px]" /> : <img src={home("svc-bank.png")} alt="" className="absolute left-5 top-5 size-[31px] object-cover" />}
          <p className="absolute left-[68px] right-3 top-4 text-[13px] font-bold leading-[18px] text-black">XXX9929</p>
          <p className="absolute left-[68px] top-9 text-[13px] leading-[18px] text-[#656565]">₹</p>
          {show ? (
            <span className="absolute left-[80px] top-9 text-[13px] font-semibold leading-[18px] text-[#292C31]">12,480.50</span>
          ) : (
            <span className="absolute left-[80px] top-[39px] flex">
              {[0, 1, 2, 3].map((i) => (
                <img key={i} src={home("svc-asterisk.svg")} alt="" className="size-3" />
              ))}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

const BUY = [
  { l: "Insta EMI Card", i: "buy-emi.png", d: "Shop now, pay later with no-cost EMIs on 1,000+ brands." },
  { l: "Gold Loan", i: "buy-gold.png", d: "Instant loans against your gold at low interest, disbursed in 30 minutes." },
  { l: "Credit Card", i: "buy-credit.png", d: "Lifetime-free credit card with up to 25% cashback on bills and recharges." },
  { l: "Fixed Deposit", i: "buy-fd.png", d: "Earn up to 7.5% p.a. with deposits starting at ₹1,000." },
  { l: "Refer Wi-Fi", i: "buy-referwifi.png", tag: "₹300 off", d: "Refer a friend to Wi-Fi and get ₹300 off on your next bill." },
  { l: "Postpaid", i: "buy-postpaid.png", d: "Unlimited 5G, family add-ons and OTTs, starting at ₹449/month." },
  { l: "IPTV", i: "buy-iptv.png", d: "350+ TV channels and 20+ OTTs on your Wi-Fi." },
  { l: "Bundle your services", i: "buy-bundle.png", d: "Combine mobile, Wi-Fi and DTH under one bill and save more." },
  { l: "New Prepaid", i: "buy-prepaid.png", d: "Get a new prepaid SIM delivered to your door in 60 minutes." },
];

/** Columns follow the available width; on wide panes an even count (HIG: grids divide cleanly). */
function BuyProducts({ ctx, cols }: { ctx: Ctx; cols: number }) {
  return (
    <div className="flex flex-col gap-4 px-4">
      <SectionTitle action={<button onClick={() => ctx.toast("All Airtel products")} className="-mt-1 flex h-5 items-center text-[14px] font-medium leading-4 text-[#075EE8] hover:underline">View all</button>}>Buy Airtel products</SectionTitle>
      <div className="grid gap-x-4 gap-y-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {(cols === 4 ? BUY.slice(0, 8) : BUY).map((t) => (
          <GridTile key={t.l} label={t.l} img={t.i} tag={t.tag} onClick={() => ctx.open({ kind: "info", title: t.l, body: t.d, img: t.i, cta: "Get started" })} />
        ))}
      </div>
    </div>
  );
}

function ManageServices({ ctx }: { ctx: Ctx }) {
  const items = [
    { l: "Recharge", i: "ms-recharge.svg", hl: true },
    { l: "Pay Bills", i: "ms-paybill.svg" },
    { l: "Claim OTTs & More", i: "ms-claim.svg" },
    { l: "International Roaming", i: "ms-roaming.svg" },
    { l: "My Wi-Fi", i: "ms-wifi.svg" },
    { l: "Upgrade to Postpaid", i: "ms-upgrade.svg" },
    { l: "Manage Family", i: "ms-family.svg" },
    { l: "More", i: undefined },
  ];
  return (
    <div className="flex flex-col gap-4 px-4">
      <SectionTitle>Manage services</SectionTitle>
      <div className="grid grid-cols-4 justify-items-center gap-y-4">
        {items.map((a) => (
          <IconAction key={a.l} label={a.l} icon={a.i} highlight={"hl" in a} onClick={() => (a.l === "Recharge" ? ctx.open({ kind: "recharge", tab: "popular" }) : ctx.open({ kind: "info", title: a.l, body: `Manage “${a.l}” for 9876543210.`, cta: "Continue" }))} />
        ))}
      </div>
    </div>
  );
}

function Explore({ ctx }: { ctx: Ctx }) {
  const go = (t: string, d: string) => ctx.open({ kind: "info", title: t, body: d, cta: "Explore" });
  const tile = "relative h-[119px] min-w-0 overflow-hidden rounded-[16px] text-left transition-transform hover:-translate-y-0.5 active:scale-[0.96]";
  return (
    <div className="flex flex-col gap-4 px-4">
      <SectionTitle>Explore Airtel products</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => go("Fast Lane Postpaid", "Priority 5G network, faster customer care and premium OTTs.")} className={tile} style={{ backgroundImage: "linear-gradient(138.15deg, #E80000 4.33%, #FF4100 100%)" }}>
          <img src={home("ex-postpaid-bg.svg")} alt="" className="absolute right-0 top-0 h-[119px] w-[109px] max-w-none" />
          <img src={home("ex-fastlane.png")} alt="" className="absolute right-[18px] top-2 h-[34px] w-[31px] object-contain object-bottom" />
          <p className="absolute left-3 top-[73px] text-[11px] font-semibold leading-4 text-white">Fast Lane<br />Postpaid</p>
          <Arrow src="ex-arrow.svg" size={18} className="absolute bottom-[13px] right-[10px]" />
        </button>
        <button onClick={() => go("Prepaid SIM", "Get a new prepaid SIM with unlimited 5G, delivered in 60 minutes.")} className={tile} style={{ backgroundImage: "linear-gradient(138.64deg, #B41E65 4.84%, #E43387 98.16%)" }}>
          <img src={home("ex-prepaid-c1.svg")} alt="" className="absolute right-[-16px] top-[-30px] size-24 max-w-none" />
          <img src={home("ex-prepaid-c2.svg")} alt="" className="absolute right-[-3px] top-[-16px] size-[69px] max-w-none" />
          <img src={home("ex-sim.png")} alt="" className="absolute right-[10px] top-[6px] h-[37px] w-[44.6px] object-cover" />
          <p className="absolute left-3 top-[74px] text-[11px] font-semibold leading-4 text-white">Prepaid<br />SIM</p>
          <Arrow src="ex-arrow.svg" size={18} className="absolute bottom-[13px] right-[10px]" />
        </button>
        <button onClick={() => go("Expert Wi-Fi", "Mesh Wi-Fi with whole-home coverage, set up by an expert.")} className={cn(tile, "bg-[linear-gradient(180deg,#413982,#5B5493)]")}>
          <img src={home("ex-wifi-bg.svg")} alt="" className="absolute right-0 top-0 h-[119px] w-[109px] max-w-none" />
          <img src={home("ex-wifi.png")} alt="" className="absolute right-[11px] top-[6px] size-[37px] object-cover opacity-[0.89]" />
          <p className="absolute left-3 top-[74px] text-[11px] font-semibold leading-4 text-white">Expert<br />Wi-Fi</p>
          <Arrow src="ex-arrow.svg" size={18} className="absolute bottom-[12px] right-[10px]" />
        </button>
      </div>
    </div>
  );
}

function Curated({ ctx }: { ctx: Ctx }) {
  const ref = useDragScroll<HTMLDivElement>();
  const [i, setI] = useState(0);
  const items = [
    { src: "cur-1.png", t: "Refer Wi-Fi", d: "Get ₹300 off on your next bill when a friend gets Wi-Fi." },
    { src: "cur-2.png", t: "Special offer", d: "A curated offer, picked for you." },
  ];
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle className="px-4">curated for you</SectionTitle>
      <div ref={ref} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / 323))} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4">
        {items.map((c) => (
          <button key={c.src} onClick={() => ctx.open({ kind: "info", title: c.t, body: c.d, img: c.src, cta: "Refer now" })} className="shrink-0 snap-start active:scale-[0.99]">
            <img src={home(c.src)} alt="" draggable={false} className="h-[182px] w-[303px] rounded-[16px] object-cover" />
          </button>
        ))}
        <span className="w-px shrink-0" />
      </div>
      <div className="-mt-1 flex justify-center gap-1.5">
        {items.map((_, k) => (
          <span key={k} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-4 bg-[#292C31]" : "w-1.5 bg-[#CDD3DD]")} />
        ))}
      </div>
    </div>
  );
}

function TilesRow({ ctx }: { ctx: Ctx }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4">
      <GridTile label="Call Manager" img="tile-callmgr.png" onClick={() => ctx.open({ kind: "info", title: "Call Manager", body: "Block spam, set call forwarding and manage caller tunes.", img: "tile-callmgr.png", cta: "Open" })} />
      <GridTile label="Rewards & OTTs" img="tile-rewards.png" onClick={() => ctx.open({ kind: "info", title: "Rewards & OTTs", body: "Claim OTT subscriptions and rewards included with your pack.", img: "tile-rewards.png", cta: "Claim" })} />
      <GridTile label="Refer & Get ₹300" img="tile-refer.png" onClick={() => ctx.open({ kind: "info", title: "Refer & Get ₹300", body: "Invite friends and get ₹300 for every successful referral.", img: "tile-refer.png", cta: "Invite now" })} />
    </div>
  );
}

function RechargeOthers({ ctx }: { ctx: Ctx }) {
  return (
    <div className="px-1">
      <SectionTitle className="px-4" tracking={2.76}>
        Recharge for others
      </SectionTitle>
      <div className="relative mx-auto mt-[6px] aspect-[371/185] w-full max-w-[420px]">
        <img src={home("rfo.jpg")} alt="Box Office Pack ₹200 · 3 GB/day for 3 days ₹39" className="size-full object-cover" />
        <button aria-label="Box Office Pack ₹200" onClick={() => ctx.open({ kind: "recharge", tab: "others", preset: 200 })} className="absolute left-[4.6%] top-[7.5%] h-[84%] w-[43%] rounded-[16px] hover:bg-white/10 active:bg-black/10" />
        <button aria-label="3 GB/day for 3 days ₹39" onClick={() => ctx.open({ kind: "recharge", tab: "others", preset: 39 })} className="absolute left-[52%] top-[7.5%] h-[84%] w-[43%] rounded-[16px] hover:bg-white/10 active:bg-black/10" />
      </div>
    </div>
  );
}

function MightLike({ ctx }: { ctx: Ctx }) {
  const ref = useDragScroll<HTMLDivElement>();
  const items = [
    { src: "like-1.png", t: "Get a free SIM!", d: "Add a loved one to your family plan." },
    { src: "like-2.png", t: "Save ₹1200/year", d: "Combine services, save money." },
    { src: "like-3.png", t: "Special offer", d: "Picked for you." },
  ];
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle className="px-5">you might like</SectionTitle>
      <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto px-5">
        {items.map((c) => (
          <button key={c.src} onClick={() => ctx.open({ kind: "info", title: c.t, body: c.d, img: c.src, cta: "Get yours" })} className="h-[240px] w-[160px] shrink-0 overflow-hidden rounded-[16px] transition-transform hover:-translate-y-0.5 active:scale-[0.98]">
            <img src={home(c.src)} alt="" draggable={false} className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Fresh({ ctx }: { ctx: Ctx }) {
  const cards = [
    { src: "fresh-1.png", t: "Get ₹100 back", d: "Pay bills via UPI and get ₹100 cashback." },
    { src: "fresh-2.png", t: "Watch CN Classics", d: "Add CN Classics on channel 445 for ₹59/month." },
    { src: "fresh-3.png", t: "Your Safety Report is ready", d: "See spam calls and fraud links blocked this month." },
  ];
  const [active, setActive] = useState(1);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % 3), 4200);
    return () => clearInterval(t);
  }, [paused]);
  const order = [(active + 2) % 3, active, (active + 1) % 3];
  return (
    <div className="flex flex-col gap-4" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <SectionTitle className="px-4">featuring fresh</SectionTitle>
      <div className="flex h-[306px] items-center justify-center gap-4 overflow-hidden">
        {order.map((k) => {
          const isActive = k === active;
          return (
            <motion.button
              layout
              key={cards[k].src}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              onClick={() => (isActive ? ctx.open({ kind: "info", title: cards[k].t, body: cards[k].d, img: cards[k].src, cta: "Add now" }) : setActive(k))}
              className="shrink-0"
              style={{ width: isActive ? 300 : 264, height: isActive ? 306 : 274 }}
            >
              <img src={home(cards[k].src)} alt={cards[k].t} draggable={false} className="size-full" />
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-center gap-1.5">
        {cards.map((_, k) => (
          <button key={k} aria-label={`Show card ${k + 1}`} onClick={() => setActive(k)} className={cn("h-1.5 rounded-full transition-all", k === active ? "w-4 bg-[#292C31]" : "w-1.5 bg-[#CDD3DD]")} />
        ))}
      </div>
    </div>
  );
}

function Claim({ ctx }: { ctx: Ctx }) {
  const ref = useDragScroll<HTMLDivElement>();
  const [claimed, setClaimed] = useState<string[]>([]);
  const cards = [
    { logo: "show-adobe.png", t: "Adobe Express", d: ["12 months for FREE", "worth ₹4000"] },
    { logo: "show-netflix.png", t: "Netflix", d: ["1 month FREE", "worth ₹999"] },
    { logo: "show-third.png", t: "More benefits", d: ["New benefits every month"] },
  ];
  return (
    <div className="relative h-[374px] w-full overflow-hidden">
      {/* HIG: a background can span the full width while scrolling content stays inset */}
      <img src={home("show-bg.png")} alt="" className="absolute inset-0 size-full object-cover object-left" />
      <p className="absolute left-[22px] top-[63px] text-[42px] font-bold leading-[50px] tracking-[-0.63px] text-white">Claim</p>
      <p className="absolute left-[25px] top-[117px] text-[12px] font-bold uppercase leading-normal tracking-[4px] text-white">your benefits</p>
      <div ref={ref} className="no-scrollbar absolute bottom-6 left-0 right-0 flex gap-3 overflow-x-auto px-4">
        {cards.map((c) => {
          const done = claimed.includes(c.t);
          return (
            <button
              key={c.t}
              onClick={() => {
                if (done) return;
                setClaimed((x) => [...x, c.t]);
                ctx.toast(`${c.t} claimed — check your email`);
              }}
              className="flex h-[180px] w-[158px] shrink-0 flex-col items-start gap-3 rounded-[16px] border border-white bg-white/10 p-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.04)] backdrop-blur-[2px] transition-colors hover:bg-white/20"
            >
              <img src={home(c.logo)} alt="" draggable={false} className="size-12 rounded-[4px] object-cover" />
              <span className="flex w-full flex-col gap-3">
                <span className="flex flex-col gap-1 text-white">
                  <span className="text-[14px] font-bold leading-5">{c.t}</span>
                  <span className="text-[12px] leading-[18px]">
                    {c.d.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[11px] font-bold uppercase leading-[14px] text-white">{done ? "Claimed ✓" : "Claim now"}</span>
                  {!done && <Arrow src="show-arrow.svg" size={16} />}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Controls ---------------- */

const NAV = [
  { l: "Manage", i: "bn-manage.svg" },
  { l: "Finance", i: "bn-finance.svg" },
  { l: "Family", i: "bn-family.svg" },
  { l: "Ask Us", i: "bn-askus.svg" },
];

function NavIcon({ n, k }: { n: (typeof NAV)[number]; k: number }) {
  return k === 0 && __DEMO__ ? <BrandMark className="size-[21px] text-[11px]" /> : <img src={home(n.i)} alt="" className="size-[21px]" />;
}

/** Horizontal bars (inner display in portrait) — the original Bottom Nav_Refresh ✅. */
function BottomNav({ nav, setNav, hidden }: { nav: string; setNav: (n: string) => void; hidden: boolean }) {
  return (
    <motion.nav animate={{ y: hidden ? 110 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 40 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[152px]">
      <div className="absolute bottom-0 h-[120px] w-full bg-[linear-gradient(180deg,rgba(247,249,252,0)_10%,#F7F9FC_38.17%,#F7F9FC_80.42%)]" />
      <div className="pointer-events-auto absolute left-1/2 top-16 h-16 w-[343px] -translate-x-1/2 rounded-full border border-[#E6F0FF] bg-white shadow-[0_6px_20px_rgba(41,44,49,0.06)]">
        <div className="relative flex h-16 items-center gap-[34px] px-8 py-1">
          {NAV.map((n, k) => {
            const active = nav === n.l;
            return (
              <button key={n.l} onClick={() => setNav(n.l)} className="relative flex size-11 shrink-0 flex-col items-center justify-center">
                {active && <motion.span layoutId="nav-pill" className="absolute left-[-28px] top-[-7px] h-14 w-[100px] rounded-full border border-[#E6F0FF] bg-[#FBFCFD]" />}
                <span className="relative flex size-8 items-center justify-center">
                  <NavIcon n={n} k={k} />
                </span>
                <span className={cn("relative whitespace-nowrap text-[10px] leading-3", active ? "font-bold text-[#FD2F36]" : "font-normal text-[#292C31]")}>{n.l}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

/**
 * Vertical controls on the trailing edge (HIG "Vertical controls"), top to bottom:
 * Dynamic Island / camera · status bar · toolbar (primary navigation first) · tab bar.
 */
function Rail({ nav, setNav, toolbar }: { nav: string; setNav: (n: string) => void; toolbar: { label: string; icon: React.ReactNode; onClick: () => void; tone?: "pill" }[] }) {
  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-[64px] flex-col items-center pb-5 pt-[64px]">
      {/* status bar, vertical */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[13px] font-semibold text-black">9:41</span>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10.5" fill="none" stroke="#000" strokeWidth="1.6" strokeDasharray="22 4 2 4 2 4 2 4" />
          <path d="M12 9.6c1.5 0 2.8.6 3.8 1.5l.8-.9a6.6 6.6 0 0 0-9.2 0l.8.9c1-.9 2.3-1.5 3.8-1.5Zm0 2.3c.9 0 1.6.3 2.2.9l.8-.9a4.4 4.4 0 0 0-6 0l.8.9c.6-.6 1.3-.9 2.2-.9Zm0 2.2c.4 0 .7.1 1 .4L12 15.6l-1-1.1c.3-.3.6-.4 1-.4Z" fill="#000" />
        </svg>
      </div>
      {/* toolbar */}
      <div className="mt-4 flex flex-col gap-2">
        {toolbar.map((t) => (
          <button key={t.label} title={t.label} aria-label={t.label} onClick={t.onClick} className={cn("flex size-11 items-center justify-center rounded-full text-[#292C31] active:scale-95", t.tone === "pill" ? "border border-[#E6E9EF] bg-[#F0F4F9]" : "border border-white bg-[linear-gradient(180deg,#FFFFFF,#F3F5F8)] shadow-[0_2px_8px_rgba(41,44,49,0.10)] hover:bg-[#F0F4F9]")}>
            {t.icon}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      {/* tab bar, vertical */}
      <div className="flex flex-col gap-1 rounded-full border border-[#E6F0FF] bg-white p-1 shadow-[0_4px_14px_rgba(41,44,49,0.10)]">
        {NAV.map((n, k) => {
          const active = nav === n.l;
          return (
            <button key={n.l} title={n.l} aria-label={n.l} onClick={() => setNav(n.l)} className="relative flex size-11 items-center justify-center rounded-full">
              {active && <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-full bg-[#F0F4F9]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">
                <NavIcon n={n} k={k} />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

const MenuIcon = () => <img src={home("nav-menu.svg")} alt="" className="h-[11.42px] w-[17.2px]" />;

/* ---------------- Screen ---------------- */

export function Home({ mode, showRegions, ghost }: { mode: Mode; showRegions: boolean; ghost?: boolean }) {
  const tab = useStore((s) => s.tab);
  const nav = useStore((s) => s.nav);
  const detail = useStore((s) => s.detail);
  const pack = useStore((s) => s.pack);
  const setTab = (t: string) => store.set({ tab: t });
  const setNav = (n: string) => {
    store.setRatio(0);
    store.set({ nav: n, detail: null });
  };
  const setDetail = (d: DetailSpec | null) => store.set({ detail: d });
  const setPack = (p: Pack) => store.set({ pack: p });
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [toastMsg, setToast] = useState<{ id: number; t: string } | null>(null);
  const [navHidden, setNavHidden] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);

  const toast = (t: string) => setToast({ id: Date.now(), t });
  const ctx: Ctx = { open: setDetail, toast, pack };
  const inner = mode === "open" || mode === "book";
  const { w } = SIZES[mode];
  // Pane geometry on the inner display (landscape). Fully open: narrower leading pane.
  // Partially folded: both panes match the two halves and avoid the folding region.
  const lead = mode === "book" ? w / 2 - FOLD / 2 : w / 2;
  const trailX = mode === "book" ? w / 2 + FOLD / 2 : w / 2 + 1;
  const trailW = w - RAIL - trailX;

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = store.get().ratio * (el.scrollHeight - el.clientHeight);
  }, [mode]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const y = el.scrollTop;
    if (!ghost) store.setRatio(y / Math.max(1, el.scrollHeight - el.clientHeight));
    if (Math.abs(y - lastY.current) > 8) {
      setNavHidden(y > lastY.current && y > 120);
      lastY.current = y;
    }
  };
  const changeTab = (t: string) => {
    setTab(t);
    if (t !== "All") toast(`Showing ${t} services`);
  };

  // Toolbar items. Top of the vertical axis is reserved for primary navigation (Close / Back).
  // Rail toolbar keeps only primary navigation (Close). Menu, Search and Scan QR sit on the top row (Top Nav ✅).
  const toolbar = detail && inner ? [{ label: "Close", icon: <X className="size-5" />, onClick: () => setDetail(null) }] : [];
  const topBar = (
    <header className="flex h-[69px] shrink-0 items-center px-5">
      <button aria-label="Open menu" onClick={() => setMenu(true)} className="rounded-full p-1 hover:bg-black/5">
        <span className="flex size-8 items-center justify-center">
          <MenuIcon />
        </span>
      </button>
      <div className="flex-1" />
      <button aria-label="Search" onClick={() => setSearch(true)} className="rounded-full p-1 hover:bg-black/5">
        <span className="flex size-8 items-center justify-center">
          <img src={home("nav-search.svg")} alt="" className="size-[26.67px]" />
        </span>
      </button>
      <button aria-label="Scan QR" onClick={() => toast("Camera opens to scan a QR code")} className="ml-1 active:opacity-70">
        <img src={home("nav-scanqr.png")} alt="" className="h-10 w-[100px] object-contain" />
      </button>
    </header>
  );

  const manage = nav === "Manage";
  const primary = (
    <>
      <PackStatus ctx={ctx} />
      <MyServices ctx={ctx} />
      <ManageServices ctx={ctx} />
    </>
  );
  const discover = (cols: number) => (
    <>
      <BuyProducts ctx={ctx} cols={cols} />
      <Explore ctx={ctx} />
      <Curated ctx={ctx} />
      <TilesRow ctx={ctx} />
      <RechargeOthers ctx={ctx} />
      <MightLike ctx={ctx} />
      <Fresh ctx={ctx} />
      <Claim ctx={ctx} />
    </>
  );

  // Finance / Family / Ask Us: each tab gives a top, a primary part and a secondary part.
  const tabCtx: TabCtx = { open: setDetail, toast, menu: () => setMenu(true) };
  const other: TabScreen | null = manage ? null : nav === "Finance" ? financeScreen(tabCtx) : nav === "Family" ? familyScreen(tabCtx) : askUsScreen(tabCtx);
  const sTop = other ? other.top : (
    <>
      {topBar}
      <CategoryTabs tab={tab} setTab={changeTab} />
    </>
  );
  const sPrimary = other ? other.primary : primary;
  const sSecondary = other ? other.secondary : discover(3);
  const fab = other?.fab;

  let body: React.ReactNode;
  if (mode === "outer") {
    // Closed: compact width, single column, controls on the trailing rail.
    body = (
      <>
        <div key={nav} ref={scroller} onScroll={onScroll} className={cn("no-scrollbar absolute inset-y-0 left-0 overflow-y-auto overflow-x-hidden pt-[6px]", fab ? "pb-24" : "pb-10")} style={{ right: RAIL }}>
          {sTop}
          <div className="flex flex-col gap-8">
            {sPrimary}
            {sSecondary}
          </div>
        </div>
        {fab && <div className="absolute bottom-6 z-20 flex justify-center" style={{ left: 0, right: RAIL }}>{fab}</div>}
      </>
    );
  } else if (inner) {
    body = (
      <>
        {/* Leading pane (primary). Its own controls sit at the top of the pane, like Mail's list. */}
        <div key={nav} className={cn("no-scrollbar absolute inset-y-0 left-0 overflow-y-auto overflow-x-hidden border-r border-[#E6E9EF] bg-white", fab ? "pb-24" : "pb-10")} style={{ width: lead }}>
          <div className="pt-[6px]">{sTop}</div>
          <div className="flex flex-col gap-8">{sPrimary}</div>
        </div>
        {fab && <div className="absolute bottom-6 left-0 z-20 flex justify-center" style={{ width: lead }}>{fab}</div>}
        {/* Trailing pane (secondary), or the detail of what was tapped. */}
        <div key={nav} ref={scroller} onScroll={onScroll} className="no-scrollbar absolute inset-y-0 overflow-y-auto overflow-x-hidden bg-white pb-10 pt-[30px]" style={{ left: trailX, width: trailW }}>
          <div className="flex flex-col gap-8">{sSecondary}</div>
        </div>
      </>
    );
  } else {
    // Inner display in portrait: horizontal bars.
    body = (
      <>
      <div key={nav} ref={scroller} onScroll={onScroll} className="no-scrollbar absolute inset-0 overflow-y-auto overflow-x-hidden pb-[150px] pt-[44px]">
        {other ? (
          <>
            {sTop}
            <div className="flex flex-col gap-8">
              {sPrimary}
              {sSecondary}
            </div>
          </>
        ) : (
          <>
            {topBar}
            <CategoryTabs tab={tab} setTab={changeTab} />
            <PackStatus ctx={ctx} />
            <div className="mt-8">
              <MyServices ctx={ctx} />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-2">
              <div className="flex min-w-0 flex-col gap-8">
                <ManageServices ctx={ctx} />
                <Explore ctx={ctx} />
                <TilesRow ctx={ctx} />
              </div>
              <div className="flex min-w-0 flex-col gap-8">
                <BuyProducts ctx={ctx} cols={3} />
                <Curated ctx={ctx} />
                <RechargeOthers ctx={ctx} />
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-8">
              <MightLike ctx={ctx} />
              <Fresh ctx={ctx} />
              <Claim ctx={ctx} />
            </div>
          </>
        )}
      </div>
      {fab && !navHidden && <div className="absolute inset-x-0 bottom-[116px] z-20 flex justify-center">{fab}</div>}
      </>
    );
  }

  return (
    <div data-screen className={cn("relative h-full w-full overflow-hidden bg-white", ghost && "pointer-events-none")} {...(ghost ? { inert: "" } : {})}>
      {body}

      {mode === "portrait" ? (
        <>
          <StatusBar className="absolute inset-x-0 top-0 z-30 bg-white/90 backdrop-blur" />
          <BottomNav nav={nav} setNav={setNav} hidden={navHidden && !detail} />
        </>
      ) : (
        <Rail nav={nav} setNav={setNav} toolbar={toolbar} />
      )}

      {/* Folding region: kept clear when partially folded */}
      {mode === "book" && <div className="pointer-events-none absolute inset-y-0 z-[35] bg-[linear-gradient(90deg,#EEF1F5,#E2E6EC_50%,#EEF1F5)]" style={{ left: w / 2 - FOLD / 2, width: FOLD }} />}

      {showRegions && <Regions mode={mode} />}

      <DetailPanel open={!!detail} pane={inner ? { left: trailX, width: trailW } : null} onClose={() => setDetail(null)}>
        {detail && (
          <Detail
            spec={detail}
            onClose={() => setDetail(null)}
            onRecharged={(p) => {
              setPack(p);
              toast(`Recharge of ₹${p.price} successful`);
            }}
            toast={toast}
            hideClose={inner}
          />
        )}
      </DetailPanel>
      <Drawer open={menu} onClose={() => setMenu(false)} toast={toast} open2={(d) => { setMenu(false); setTimeout(() => setDetail(d), 220); }} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} onPick={(d) => { setSearch(false); setDetail(d); }} />
      <Toast msg={toastMsg} onDone={() => setToast(null)} area={inner ? { left: trailX, width: trailW } : null} bottom={mode === "portrait" ? 104 : 24} />
    </div>
  );
}

/** Overlay of the HIG reserved regions and control areas for the current pose. */
function Regions({ mode }: { mode: Mode }) {
  const { w } = SIZES[mode];
  const tag = "absolute rounded bg-[#075EE8] px-1.5 py-0.5 text-[10px] font-semibold text-white";
  return (
    <div className="pointer-events-none absolute inset-0 z-[90]">
      {mode !== "portrait" && (
        <div className="absolute inset-y-0 right-0 border-l border-dashed border-[#075EE8] bg-[#075EE8]/[0.07]" style={{ width: RAIL }}>
          <span className={cn(tag, "bottom-[260px] right-[3px] [writing-mode:vertical-rl]")}>Controls on the vertical axis</span>
        </div>
      )}
      {mode === "outer" && (
        <div className="absolute right-[10px] top-[10px] size-[44px] rounded-full border-2 border-dashed border-[#FD2F36] bg-[#FD2F36]/10">
          <span className={cn(tag, "right-[50px] top-3 whitespace-nowrap bg-[#FD2F36]")}>Outer camera region</span>
        </div>
      )}
      {mode === "open" && (
        <div className="absolute inset-y-0 border-x border-dashed border-[#A0A2A4]" style={{ left: w / 2 - 13, width: 26 }}>
          <span className={cn(tag, "left-1/2 top-1/2 -translate-x-1/2 whitespace-nowrap bg-[#696B6F]")}>Hinge · pane split</span>
        </div>
      )}
      {mode === "book" && (
        <div className="absolute inset-y-0 border-x border-dashed border-[#FD2F36] bg-[#FD2F36]/10" style={{ left: w / 2 - FOLD / 2, width: FOLD }}>
          <span className={cn(tag, "left-1/2 top-1/2 -translate-x-1/2 whitespace-nowrap bg-[#FD2F36]")}>Folding region</span>
        </div>
      )}
      {(mode === "open" || mode === "book") && (
        <>
          <span className={cn(tag, "left-3 top-[6px]")}>Leading pane · primary</span>
          <span className={cn(tag, "top-[6px]")} style={{ left: (mode === "book" ? w / 2 + FOLD / 2 : w / 2) + 12 }}>
            Trailing pane · secondary
          </span>
        </>
      )}
      {mode === "portrait" && <span className={cn(tag, "left-1/2 top-[48px] -translate-x-1/2")}>Inner display in portrait · horizontal bars</span>}
    </div>
  );
}
