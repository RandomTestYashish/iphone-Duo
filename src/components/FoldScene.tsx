import { Home, SIZES } from "./Home";

/**
 * iPhone Duo open / close transition as a real 3D hinge.
 *  - Only the cover half moves; the half with the rear cameras stays put.
 *  - The cover swings about the hinge (CSS rotateY with perspective). Its front face is the left
 *    half of the inner display; its back face is the outer display, which lands on top when closed.
 *  - The display turning away blurs and darkens, most at its far edge; each face is sharp when it
 *    faces the viewer flat and ramps between flat and 90°.
 *
 * `p` is 0 (closed) … 1 (open). Hinge angle = 180·p degrees.
 */

const B = 10; // bezel
const { w: IW, h: IH } = SIZES.open;
const HW = IW / 2;
const R = 50; // outer corner radius
const PW = HW + B; // panel width (half device)
const PH = IH + 2 * B;

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

function Body({ children, side, body, closed }: { children: React.ReactNode; side: "left" | "right"; body: string; closed?: boolean }) {
  // Rounded on the far edge, square on the hinge edge.
  const far = closed ? 46 : R;
  const r = side === "left" ? `${far}px 4px 4px ${far}px` : `4px ${far}px ${far}px 4px`;
  const ri = side === "left" ? `${far - 3}px 2px 2px ${far - 3}px` : `2px ${far - 3}px ${far - 3}px 2px`;
  const rs = side === "left" ? `${far - B}px 0 0 ${far - B}px` : `0 ${far - B}px ${far - B}px 0`;
  return (
    <div className="absolute inset-0 p-[3px]" style={{ background: body, borderRadius: r }}>
      <div className="h-full w-full bg-black" style={{ borderRadius: ri, padding: side === "left" ? `${B - 3}px 0 ${B - 3}px ${B - 3}px` : `${B - 3}px ${B - 3}px ${B - 3}px 0` }}>
        <div className="relative h-full w-full overflow-hidden bg-white" style={{ borderRadius: rs }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FoldScene({ p, body, edge }: { p: number; body: string; edge: string }) {
  const angle = 180 * (1 - p); // 0 open … 180 closed
  const theta = (angle * Math.PI) / 180;
  const innerMotion = smooth(theta / (Math.PI / 2));
  const outerMotion = smooth((Math.PI - theta) / (Math.PI / 2));
  const blur = (m: number) => `blur(${(8 * m).toFixed(2)}px)`;
  const lightFront = Math.max(0, Math.cos(theta)); // how flat the front faces the viewer
  const lightBack = Math.max(0, -Math.cos(theta));

  return (
    <div className="relative" style={{ width: IW + 2 * B, height: PH, perspective: 2600, perspectiveOrigin: `${PW}px 50%` }}>
      {/* Fixed half: inner display, right half */}
      <div className="absolute top-0" style={{ left: PW, width: PW, height: PH }}>
        <Body side="right" body={body}>
          <div className="absolute top-0" style={{ left: -HW, width: IW, height: IH, filter: `brightness(${(0.6 + 0.4 * p).toFixed(3)})` }}>
            <Home mode="open" showRegions={false} ghost />
          </div>
          {/* shadow of the cover as it comes down */}
          <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(to right, rgba(0,0,0,${(0.35 * Math.sin(theta) * (angle > 90 ? 1 : 0.4)).toFixed(3)}), rgba(0,0,0,0) 70%)` }} />
        </Body>
      </div>

      {/* Moving cover: rotates about the hinge (its right edge) */}
      <div className="absolute left-0 top-0" style={{ width: PW, height: PH, transformOrigin: "100% 50%", transformStyle: "preserve-3d", transform: `rotateY(${angle.toFixed(2)}deg)` }}>
        {/* front face: inner display, left half */}
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <Body side="left" body={body}>
            <div className="absolute left-0 top-0" style={{ width: IW, height: IH, filter: blur(innerMotion) }}>
              <Home mode="open" showRegions={false} ghost />
            </div>
            <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(to left, rgba(0,0,0,0) 15%, rgba(0,0,0,${Math.min(0.85, innerMotion * 0.9).toFixed(3)}))` }} />
          </Body>
          <div className="pointer-events-none absolute inset-0 rounded-l-[50px]" style={{ background: `rgba(255,255,255,${(0.08 * (1 - lightFront)).toFixed(3)})` }} />
        </div>
        {/* back face: outer display (hinge on its left edge when closed) */}
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <Body side="right" body={body} closed>
            <div className="absolute left-0 top-0" style={{ width: SIZES.outer.w, height: SIZES.outer.h, filter: blur(outerMotion) }}>
              <Home mode="outer" showRegions={false} ghost />
            </div>
            <span className="absolute right-[14px] top-[14px] size-[36px] rounded-full bg-black" />
            <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(to right, rgba(0,0,0,0) 15%, rgba(0,0,0,${Math.min(0.85, outerMotion * 0.9).toFixed(3)}))` }} />
          </Body>
          <div className="pointer-events-none absolute inset-0 rounded-r-[46px]" style={{ background: `rgba(255,255,255,${(0.08 * (1 - lightBack)).toFixed(3)})` }} />
        </div>
      </div>

      {/* hinge spine */}
      <div className="absolute top-[6px] rounded-full" style={{ left: PW - 3, width: 6, height: PH - 12, background: `linear-gradient(90deg, ${edge}, rgba(255,255,255,0.5), ${edge})`, opacity: 0.7 }} />
    </div>
  );
}

/** Scene width/height and where the visible device sits, so the viewer can keep it centred. */
export const FOLD_SCENE = { w: IW + 2 * B, h: PH, half: PW };
