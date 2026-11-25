// Figma assets for "Manage Landing" (Yashis-Imaginarium_22-jun, page "iphone duo").
const files = import.meta.glob<string>("./*.{png,svg,jpg}", { eager: true, import: "default" });

/** Resolve a downloaded Figma asset by file name, e.g. home("nav-menu.svg"). */
export function home(name: string): string {
  const url = files[`./${name}`];
  if (!url) throw new Error(`Missing home asset: ${name}`);
  return url;
}
