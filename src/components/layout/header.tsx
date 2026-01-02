"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLanguage } from "@/components/providers/language-provider";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="site-header">
      <div className="site-header__container">
        <div className="site-header__logo">
          <Image
            src="/Assets/logo/HBT-Logo.svg"
            alt="HisabBuddy Tax Logo"
            width={36}
            height={36}
            className="site-header__logo-image"
          />
        </div>

        <div className="site-header__actions">
          <LanguageToggle />
          <ThemeToggle />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="site-header__menu-btn"
                aria-label="Open menu"
              >
                <MenuIcon className="site-header__menu-icon" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="site-header__sheet">
              <SheetHeader>
                <SheetTitle>{t.menu}</SheetTitle>
              </SheetHeader>
              <nav className="site-header__nav">
                <a href="/" className="site-header__nav-link">
                  {t.taxCalculator}
                </a>
                {/* More menu items will be added here as tools are added */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
