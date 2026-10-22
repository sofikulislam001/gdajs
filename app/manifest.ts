import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "গোদনাইল আলোকিত যুব শক্তি",
    short_name: "আলোকিত যুব শক্তি",
    description: "আর্তমানবতার সেবায় নিয়োজিত স্বেচ্ছাসেবী অরাজনৈতিক যুব সংগঠন",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f8fc",
    theme_color: "#5a9fd0",
    lang: "bn",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
