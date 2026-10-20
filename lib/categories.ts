export type Category = "blood" | "relief" | "education" | "youth" | "health" | "other";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "blood", label: "রক্তদান" },
  { key: "relief", label: "ত্রাণ ও সহায়তা" },
  { key: "education", label: "শিক্ষা" },
  { key: "youth", label: "যুব ও পরিবেশ" },
  { key: "health", label: "স্বাস্থ্য" },
  { key: "other", label: "অন্যান্য" },
];

export function categoryLabel(key: string | null | undefined): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? "অন্যান্য";
}
