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
        <footer className="page-footer">
          <p>{t.disclaimer}</p>
        </footer>
      </main>
    </>
  );
}
