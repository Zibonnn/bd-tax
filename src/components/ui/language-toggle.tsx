"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

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
      <span className="language-toggle__text">
        {language === "en" ? "বাং" : "EN"}
      </span>
    </Button>
  );
}

