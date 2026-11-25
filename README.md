# iPhone Duo — Manage Landing

Interactive prototype of the "Manage Landing" home screen on a book-style foldable ("iPhone Duo").

Follows Apple's HIG "Designing for iPhone Duo" (four poses; point sizes estimated from the HIG diagrams):

- **Closed** (outer display, 488 × 680): compact width, status bar / toolbar / tab bar on a vertical rail on the trailing edge, camera in the top trailing corner.
- **Open** (inner display, 976 × 680): split view. Leading pane = account (primary), trailing pane = Discover or the detail you tapped. Controls on the trailing rail, Close at the top of the toolbar.
- **Book** (partially folded): equal panes that keep clear of the 26 pt folding region.
- **Portrait** (inner display, 680 × 976): standard horizontal bars, two even columns.

Figma: Yashis-Imaginarium_22-jun → page **iphone duo**.

## Run

```sh
npm install
npm run dev           # local preview
npm run build:single  # one self-contained HTML (branded) in dist-single/
npm run build:demo    # de-branded single file ("Nexa") used for the claude.ai artifact
node scripts/artifact.mjs dist-demo/index.html <out.html>   # strip <html>/<head>/<body> for artifact publishing
```

Shortcuts in the viewer: `1`–`4` poses, `F` close/open, `G` reserved regions, `0` fit/100%, `?` HIG notes.
