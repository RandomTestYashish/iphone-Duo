import { Home, SIZES } from "./Home";

/**
 * iPhone Duo open / close transition, modelled on how the real device is described:
 *  - Only the cover half moves; the half with the rear cameras stays put.
 *  - Screen content uses a fixed front-view projection: it doesn't rotate with the panel. The panel's
 *    edge sweeps around the hinge and reveals content that stays anchored in place (the outer UI stays
 *    aligned with its hinge-side edge).
 *  - The display turning away blurs and darkens, most at its far edge (blur ∝ motion · edge^1.35,
 *    darkening at twice the strength). Inner content is sharp when open and outer content is sharp
 *    when closed; each ramps between flat and 90°.
 *
 * `p` is 0 (closed) … 1 (open). Hinge angle = 180·p degrees.
 */

const B = 10; // bezel
const { w: IW, h: IH } = SIZES.open;
const HW = IW / 2;

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export function FoldScene({ p, body, edge }: { p: number; body: string; edge: string }) {
  const theta = Math.PI * (1 - p); // 0 open … π closed (fold angle)
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const innerMotion = smooth(theta / (Math.PI / 2)); // 0 open → 1 at 90°
  const outerMotion = smooth((Math.PI - theta) / (Math.PI / 2)); // 0 closed → 1 at 90°
  const front = c >= 0; // cover shows the inner display (left of hinge) or its back, the outer display
  const span = HW * Math.abs(c); // projected width of the cover
  const lift = 0.07 * s; // far edge grows a little as it comes towards the viewer
  const hingeX = HW + B; // in scene coordinates (left bezel B)

  // Cover outline (projected), far edge slightly taller.
  const farX = front ? hingeX - span - B * Math.abs(c) : hingeX + span + B * Math.abs(c);
  const farTop = -IH * lift * 0.5;
  const farBot = IH + 2 * B + IH * lift * 0.5;
  const poly = front
    ? `polygon(${farX}px ${farTop}px, ${hingeX}px 0px, ${hingeX}px ${IH + 2 * B}px, ${farX}px ${farBot}px)`
    : `polygon(${hingeX}px 0px, ${farX}px ${farTop}px, ${farX}px ${farBot}px, ${hingeX}px ${IH + 2 * B}px)`;

  const blur = (m: number) => `blur(${(10 * m).toFixed(2)}px)`;
  // darkening gradient from the hinge (none) to the far edge (strongest), pow 1.35, ×2 strength
  const darken = (m: number, dir: "left" | "right") =>
    `linear-gradient(to ${dir}, rgba(0,0,0,0) 20%, rgba(0,0,0,${Math.min(1, m * 1.2).toFixed(3)}) 100%)`;

  return (
    <div className="relative" style={{ width: IW + 2 * B, height: IH + 2 * B }}>
      {/* Fixed half (rear-camera side): inner display, right half */}
      <div className="absolute overflow-hidden" style={{ left: hingeX, top: 0, width: HW + B, height: IH + 2 * B, background: body, borderRadius: "0 54px 54px 0", padding: 3, paddingLeft: 0 }}>
        <div className="h-full w-full overflow-hidden bg-black" style={{ borderRadius: "0 51px 51px 0", padding: `${B - 3}px ${B - 3}px ${B - 3}px 0` }}>
          <div className="relative h-full w-full overflow-hidden rounded-r-[44px] bg-white">
            <div className="absolute top-0" style={{ left: -HW, width: IW, height: IH, filter: `brightness(${(0.55 + 0.45 * p).toFixed(3)})` }}>
              <Home mode="open" showRegions={false} ghost />
            </div>
            {/* shadow the cover casts as it closes over this half */}
            {!front && <div className="absolute inset-y-0 left-0" style={{ width: span + 40, background: `linear-gradient(to right, rgba(0,0,0,${(0.35 * (1 - outerMotion)).toFixed(3)}), rgba(0,0,0,0))` }} />}
          </div>
        </div>
      </div>

      {/* Cover half: projected outline; content fixed in place, clipped by the sweeping edge */}
      <div className="absolute inset-0" style={{ clipPath: poly }}>
        {/* body + bezel of the cover */}
        <div className="absolute" style={{ left: front ? hingeX - HW - B : hingeX, top: farTop, width: HW + B, height: farBot - farTop, background: body, borderRadius: front ? "54px 0 0 54px" : "0 54px 54px 0" }} />
        <div className="absolute bg-black" style={{ left: front ? hingeX - HW - B + 3 : hingeX, top: farTop + 3, width: HW + B - 3, height: farBot - farTop - 6, borderRadius: front ? "51px 0 0 51px" : "0 51px 51px 0" }} />
        {front ? (
          <div className="absolute overflow-hidden rounded-l-[44px] bg-white" style={{ left: B, top: B, width: HW, height: IH }}>
            <div className="absolute left-0 top-0" style={{ width: IW, height: IH, filter: blur(innerMotion) }}>
              <Home mode="open" showRegions={false} ghost />
            </div>
            <div className="absolute inset-0" style={{ background: darken(innerMotion, "left") }} />
          </div>
        ) : (
          <div className="absolute overflow-hidden bg-white" style={{ left: hingeX, top: B, width: HW, height: IH, borderRadius: "4px 44px 44px 4px" }}>
            <div className="absolute left-0 top-0" style={{ width: SIZES.outer.w, height: SIZES.outer.h, filter: blur(outerMotion) }}>
              <Home mode="outer" showRegions={false} ghost />
            </div>
            <span className="absolute right-[14px] top-[14px] size-[36px] rounded-full bg-black" />
            <div className="absolute inset-0" style={{ background: darken(outerMotion, "right") }} />
          </div>
        )}
        {/* light on the moving panel */}
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(${front ? "to left" : "to right"}, rgba(255,255,255,${(0.10 * s).toFixed(3)}), rgba(0,0,0,${(0.12 * s).toFixed(3)}))` }} />
        {/* the far edge: titanium rim catching light */}
        <div className="absolute" style={{ left: front ? farX : farX - 4, top: farTop, width: 4, height: farBot - farTop, background: edge, opacity: 0.9 * s }} />
      </div>

      {/* hinge */}
      <div className="absolute top-0 h-full" style={{ left: hingeX - 3, width: 6, background: `linear-gradient(90deg, ${edge}, rgba(255,255,255,0.4), ${edge})`, opacity: 0.6 }} />
    </div>
  );
}

/** Scene width/height and where the visible device sits, so the viewer can keep it centred. */
export const FOLD_SCENE = { w: IW + 2 * B, h: IH + 2 * B, half: HW + B };
