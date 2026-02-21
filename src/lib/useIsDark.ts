"use client";

import { useState, useEffect } from "react";

/** Detect dark mode from HTML class or prefers-color-scheme */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const check = () => {
      setIsDark(html.classList.contains("dark") || (mq.matches && !html.classList.contains("light")));
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    mq.addEventListener("change", check);
    return () => { obs.disconnect(); mq.removeEventListener("change", check); };
  }, []);
  return isDark;
}
