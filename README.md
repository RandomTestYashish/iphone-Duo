# iPhone Duo — Manage Landing

Interactive prototype of the "Manage Landing" home screen on a book-style foldable ("iPhone Duo").

- **Folded**: 375 × 812 cover screen, single column (Figma `81735:10718`).
- **Unfolded**: 760 × 812 inner screen, two 375 panes around a 10 px hinge (Figma `81737:1054`).

Figma: Yashis-Imaginarium_22-jun → page **iphone duo**.

## Run

```sh
npm install
npm run dev           # local preview
npm run build:single  # one self-contained HTML (branded) in dist-single/
npm run build:demo    # de-branded single file ("Nexa") used for the claude.ai artifact
node scripts/artifact.mjs dist-demo/index.html <out.html>   # strip <html>/<head>/<body> for artifact publishing
```

Shortcuts in the viewer: `F` fold/unfold, `G` hinge safe zone, `0` fit/100%, `?` help.
