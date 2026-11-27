import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./App";

// The artifact viewer can re-run this script in the same page when a new version is published.
// Unmount the previous app first so two copies never render on top of each other.
const w = window as unknown as { __duoRoot?: ReactDOM.Root };
w.__duoRoot?.unmount();
const el = document.getElementById("root")!;
el.replaceChildren();
w.__duoRoot = ReactDOM.createRoot(el);
w.__duoRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
