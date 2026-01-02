"use client";

import { Header } from "@/components/layout/header";
import { TaxCalculator } from "@/components/features/tax-calculator";
import { useLanguage } from "@/components/providers/language-provider";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="main-container">
        <TaxCalculator />
      </main>
      <footer className="site-footer">
        <div className="site-footer__container">
          <p className="site-footer__copyright">{t.footerCopyright}</p>
        </div>
      </footer>
    </>
  );
}
