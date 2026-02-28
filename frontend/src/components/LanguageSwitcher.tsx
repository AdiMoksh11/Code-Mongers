"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Minimal styles are handled via globals.css; this component focuses on behavior + markup

type GoogleTranslateOptions = {
  pageLanguage: string;
  includedLanguages?: string;
};

type GoogleTranslateAPI = {
  translate: {
    TranslateElement: new (
      options: GoogleTranslateOptions,
      elementId: string
    ) => void;
  };
};

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: GoogleTranslateAPI;
  }
}

const LANG_MAP: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  pa: "ਪੰਜਾਬੀ",
  ml: "മലയാളം",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  ur: "اردو",
  sa: "संस्कृतम्",
  ne: "नेपाली",
  bho: "भोजपुरी",
  mai: "मैथिली",
  gom: "कोंकणी",
  doi: "डोगरी",
  "mni-Mtei": "ꯃꯤꯇꯩꯂꯣꯟ",
};

// Persist user's choice to avoid unexpected defaults on reload
const STORAGE_KEY = "credexa_lang";

function setGoogTransCookie(code: string) {
  try {
    const value = `/auto/${code}`;
    // Set for current host
    document.cookie = `googtrans=${value}; path=/; max-age=31536000`;
    // Best-effort set with explicit domain (may be ignored on some hosts)
    if (typeof window !== "undefined") {
      document.cookie = `googtrans=${value}; domain=${window.location.hostname}; path=/; max-age=31536000`;
    }
  } catch {
    // ignore cookie set errors
  }
}

function clearGoogTransCookie() {
  try {
    const past = "Thu, 01 Jan 1970 00:00:00 GMT";
    // Clear for current host
    document.cookie = `googtrans=; expires=${past}; path=/`;
    document.cookie = `googtransOpt=; expires=${past}; path=/`;
    document.cookie = `googtransOptDefault=; expires=${past}; path=/`;
    // Clear with explicit domain variations
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      document.cookie = `googtrans=; expires=${past}; path=/; domain=${host}`;
      document.cookie = `googtransOpt=; expires=${past}; path=/; domain=${host}`;
      document.cookie = `googtransOptDefault=; expires=${past}; path=/; domain=${host}`;
      if (!host.startsWith(".")) {
        document.cookie = `googtrans=; expires=${past}; path=/; domain=.${host}`;
        document.cookie = `googtransOpt=; expires=${past}; path=/; domain=.${host}`;
        document.cookie = `googtransOptDefault=; expires=${past}; path=/; domain=.${host}`;
      }
    }
  } catch {
    // ignore cookie clear errors
  }
}

function getPreferredLang(): string {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANG_MAP[saved]) return saved;
  } catch {
    // ignore
  }
  // Default to English if no saved preference to avoid unexpected cookie defaults
  return "en";
}

function setPreferredLang(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
  setGoogTransCookie(code);
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>("EN".toLowerCase());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appliedRef = useRef(false);

  const updateCurrent = useCallback(() => setCurrentCode(getPreferredLang()), []);

  // Try to get the hidden Google select
  const getGoogleSelect = useCallback((): HTMLSelectElement | null => {
    const el = document.querySelector(
      "#google_translate_element select, .goog-te-combo"
    ) as HTMLSelectElement | null;
    return el;
  }, []);

  // Apply language to the Google widget select
  const applyLanguageToGoogle = useCallback(
    (code: string) => {
      const select = getGoogleSelect();
      if (!select) return false;
      if (select.value !== code) {
        select.value = code;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("input", { bubbles: true }));
      }
      setTimeout(updateCurrent, 120);
      return true;
    },
    [getGoogleSelect, updateCurrent]
  );

  // Load google translate script once and initialize with preferred language
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Proactively clear any stale translation cookie to avoid unwanted defaults
    clearGoogTransCookie();

    // Ensure default preference is set to English before the widget loads
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved && LANG_MAP[saved] ? saved : "en";
    try { localStorage.setItem(STORAGE_KEY, initial); } catch {}
    setGoogTransCookie(initial);

    window.googleTranslateElementInit = () => {
      try {
        const Ctor = window.google?.translate?.TranslateElement;
        if (Ctor) {
          new Ctor(
            {
              pageLanguage: "en",
              includedLanguages:
                "en,hi,bn,ta,te,mr,gu,kn,pa,ml,or,as,ur,sa,ne,bho,mai,gom,doi,mni-Mtei",
            },
            "google_translate_element"
          );
        }
      } catch {
        // no-op if google is not ready yet
      }
      // Enforce preferred language (default to English) on init
      const preferred = getPreferredLang();
      setPreferredLang(preferred);
      setCurrentCode(preferred);
      // also try to apply to the widget select shortly after init
      setTimeout(() => {
        applyLanguageToGoogle(preferred);
      }, 100);
    };

    // inject script if not already present
    const existing = document.querySelector(
      'script[src*="translate.google.com/translate_a/element.js"]'
    );
    if (!existing) {
      const s = document.createElement("script");
      s.type = "text/javascript";
      s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.head.appendChild(s);
    }

    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => {
      document.removeEventListener("click", onDocClick);
    };
  }, [applyLanguageToGoogle, getGoogleSelect]);

  // On mount and whenever the widget renders, re-apply preferred language
  useEffect(() => {
    let tries = 0;
    const maxTries = 25; // ~5s with 200ms interval
    const interval = setInterval(() => {
      const preferred = getPreferredLang();
      setPreferredLang(preferred);
      const ok = applyLanguageToGoogle(preferred);
      const select = getGoogleSelect();
      const matched = !!select && select.value === preferred;
      if ((ok && matched) || ++tries >= maxTries) {
        appliedRef.current = matched;
        clearInterval(interval);
      }
    }, 200);

    const onPageShow = () => {
      // Re-apply when the page is shown from bfcache or reload
      setTimeout(() => {
        const preferred = getPreferredLang();
        setPreferredLang(preferred);
        const ensure = setInterval(() => {
          const ok = applyLanguageToGoogle(preferred);
          const select = getGoogleSelect();
          if ((ok && select && select.value === preferred)) {
            clearInterval(ensure);
          }
        }, 150);
        setTimeout(() => clearInterval(ensure), 3000);
      }, 150);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          const preferred = getPreferredLang();
          setPreferredLang(preferred);
          const ensure = setInterval(() => {
            const ok = applyLanguageToGoogle(preferred);
            const select = getGoogleSelect();
            if ((ok && select && select.value === preferred)) {
              clearInterval(ensure);
            }
          }, 150);
          setTimeout(() => clearInterval(ensure), 3000);
        }, 150);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [applyLanguageToGoogle]);

  const changeLanguage = useCallback(
    (code: string) => {
      setPreferredLang(code);
      const googleSelect = getGoogleSelect();
      if (googleSelect) {
        googleSelect.value = code;
        googleSelect.dispatchEvent(new Event("change", { bubbles: true }));
        googleSelect.dispatchEvent(new Event("input", { bubbles: true }));
        // update after small delay for widget to apply
        setTimeout(updateCurrent, 150);
        setOpen(false);
        setCurrentCode(code);
      } else {
        // Fallback: update state and widget will catch up when ready
        setCurrentCode(code);
        let attempts = 0;
        const maxAttempts = 20;
        const t = setInterval(() => {
          if (applyLanguageToGoogle(code) || ++attempts >= maxAttempts) {
            clearInterval(t);
          }
        }, 150);
      }
    },
    [getGoogleSelect, updateCurrent, applyLanguageToGoogle]
  );

  const displayCode = (code: string) => code.split("-")[0].toUpperCase();

  return (
    <div className="relative notranslate" translate="no" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 w-auto px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors notranslate"
        translate="no"
      >
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded notranslate" translate="no">
          {displayCode(currentCode)}
        </span>
        <svg
          className="w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 z-[9999] max-h-80 overflow-y-auto pointer-events-auto notranslate" translate="no">
          {Object.entries(LANG_MAP).map(([code, name]) => {
            const selected = currentCode === code;
            return (
              <div
                key={code}
                role="button"
                onClick={() => changeLanguage(code)}
                className={`flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer ${
                  selected ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                }`}
                data-lang-code={code}
                translate="no"
              >
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded w-12 text-center notranslate" translate="no">
                  {displayCode(code)}
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 ml-3 notranslate" translate="no">
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden Google widget host */}
      <div id="google_translate_element" className="hidden" />
    </div>
  );
}
