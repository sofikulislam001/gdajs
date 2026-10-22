"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallApp() {
  const { tr } = useLang();
  const [ev, setEv] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const h = (e: Event) => {
      e.preventDefault();
      setEv(e as BIPEvent);
    };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", h);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  if (installed) {
    return <div className="px-4 py-3.5"><p className="font-semibold">{tr("অ্যাপ ইনস্টল করা আছে ✓", "App installed ✓")}</p></div>;
  }

  async function install() {
    if (!ev) return;
    await ev.prompt();
    setEv(null);
  }

  return (
    <div className="space-y-2 px-4 py-3.5">
      <p className="font-semibold">{tr("হোম স্ক্রিনে অ্যাপ হিসেবে যোগ করুন", "Add to your home screen")}</p>
      {ev ? (
        <button onClick={install} className="btn btn-primary">{tr("অ্যাপ ইনস্টল করুন", "Install app")}</button>
      ) : ios ? (
        <p className="text-sm text-muted">{tr("Safari-তে শেয়ার (⬆️) বোতাম চেপে “Add to Home Screen” বেছে নিন।", "In Safari tap Share (⬆️), then “Add to Home Screen”.")}</p>
      ) : (
        <p className="text-sm text-muted">{tr("ব্রাউজারের মেনু (⋮) থেকে “Install app” বা “Add to Home screen” বেছে নিন।", "From the browser menu (⋮) choose “Install app” or “Add to Home screen”.")}</p>
      )}
    </div>
  );
}
