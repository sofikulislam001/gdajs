export type Lang = "bn" | "en";

let current: Lang = "bn";

/** ক্লায়েন্টে বর্তমান ভাষা (সার্ভারে সবসময় বাংলা) */
export function getLang(): Lang {
  return current;
}

export function setCurrentLang(l: Lang) {
  current = l;
}
