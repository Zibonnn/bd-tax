"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

function LanguagesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="language-toggle" disabled>
        <LanguagesIcon className="language-toggle__icon" />
        <span className="language-toggle__text">EN</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="language-toggle"
      aria-label={`Switch to ${language === "en" ? "Bangla" : "English"}`}
    >
      <LanguagesIcon className="language-toggle__icon" />
      <span className="language-toggle__text">
        {language === "en" ? "বাং" : "EN"}
      </span>
    </Button>
  );
}

