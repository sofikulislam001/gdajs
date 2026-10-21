"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useState } from "react";

import { setCurrentLang, type Lang } from "./langState";

export type { Lang };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** tr("বাংলা", "English") — বর্তমান ভাষার লেখা ফেরত দেয় */
  tr: (b: string, e: string) => string;
};

const LangContext = createContext<Ctx>({ lang: "bn", setLang: () => {}, tr: (b) => b });

const KEY = "gajs-lang";
const SIZE_KEY = "gajs-textsize";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "en" || saved === "bn") {
        setCurrentLang(saved);
        setLangState(saved);
        document.documentElement.lang = saved;
      }
      const size = localStorage.getItem(SIZE_KEY);
      if (size) document.documentElement.style.fontSize = size === "large" ? "112.5%" : size === "xlarge" ? "125%" : "";
    } catch {
      /* ব্রাউজার স্টোরেজ বন্ধ থাকলে ডিফল্ট বাংলা */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setCurrentLang(l);
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const tr = useCallback((b: string, e: string) => (lang === "en" ? e : b), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, tr }}>
      {/* ভাষা বদলালে পুরো পাতা নতুন করে আঁকা হয়, যাতে সব সংখ্যা/তারিখও বদলায় */}
      <Fragment key={lang}>{children}</Fragment>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/** সার্ভার পাতাতেও ব্যবহারযোগ্য: <T bn="হোম" en="Home" /> */
export function T({ bn, en }: { bn: string; en: string }) {
  const { lang } = useLang();
  return <>{lang === "en" ? en : bn}</>;
}

export function setTextSize(size: "normal" | "large" | "xlarge") {
  document.documentElement.style.fontSize = size === "large" ? "112.5%" : size === "xlarge" ? "125%" : "";
  try {
    localStorage.setItem(SIZE_KEY, size);
  } catch {
    /* ignore */
  }
}

export function getTextSize(): "normal" | "large" | "xlarge" {
  try {
    const s = localStorage.getItem(SIZE_KEY);
    return s === "large" || s === "xlarge" ? s : "normal";
  } catch {
    return "normal";
  }
}
