import type { TaxConfig, TaxBracket } from "@/types/tax";
import type { Language } from "@/config/translations";

/**
 * Bangladesh Income Tax Rates Configuration
 *
 * This is the single source of truth for tax calculations.
 * Update this configuration when tax rates change.
 *
 * Note: Brackets are cumulative. Each bracket's upperLimit represents
 * the total income threshold (not the bracket size).
 *
 * Current rates are for Fiscal Year 2024-2025
 *
 * Rate Structure:
 * - First BDT 350,000: 0% (Tax-free)
 * - Next BDT 100,000: 5%
 * - Next BDT 400,000: 10%
 * - Next BDT 500,000: 15%
 * - Next BDT 500,000: 20%
 * - Next BDT 2,000,000: 25%
 * - Remaining balance: 30%
 */
export const TAX_CONFIG: TaxConfig = {
  fiscalYear: "2024-2025",
  currency: "BDT",
  brackets: [
    {
      upperLimit: 350000,
      rate: 0,
      description: "First BDT 350,000 (Tax-free)",
    },
    {
      upperLimit: 450000,
      rate: 5,
      description: "Next BDT 100,000",
    },
    {
      upperLimit: 850000,
      rate: 10,
      description: "Next BDT 400,000",
    },
    {
      upperLimit: 1350000,
      rate: 15,
      description: "Next BDT 500,000",
    },
    {
      upperLimit: 1850000,
      rate: 20,
      description: "Next BDT 500,000",
    },
    {
      upperLimit: 3850000,
      rate: 25,
      description: "Next BDT 2,000,000",
    },
    {
      upperLimit: null,
      rate: 30,
      description: "Remaining balance",
    },
  ],
};

/**
 * Localized tax bracket descriptions
 */
export const TAX_BRACKETS_LOCALIZED: Record<Language, TaxBracket[]> = {
  en: [
    {
      upperLimit: 350000,
      rate: 0,
      description: "First BDT 3,50,000 (Tax-free)",
    },
    {
      upperLimit: 450000,
      rate: 5,
      description: "Next BDT 1,00,000",
    },
    {
      upperLimit: 850000,
      rate: 10,
      description: "Next BDT 4,00,000",
    },
    {
      upperLimit: 1350000,
      rate: 15,
      description: "Next BDT 5,00,000",
    },
    {
      upperLimit: 1850000,
      rate: 20,
      description: "Next BDT 5,00,000",
    },
    {
      upperLimit: 3850000,
      rate: 25,
      description: "Next BDT 20,00,000",
    },
    {
      upperLimit: null,
      rate: 30,
      description: "Remaining balance",
    },
  ],
  bn: [
    {
      upperLimit: 350000,
      rate: 0,
      description: "প্রথম ৳৩,৫০,০০০ (করমুক্ত)",
    },
    {
      upperLimit: 450000,
      rate: 5,
      description: "পরবর্তী ৳১,০০,০০০",
    },
    {
      upperLimit: 850000,
      rate: 10,
      description: "পরবর্তী ৳৪,০০,০০০",
    },
    {
      upperLimit: 1350000,
      rate: 15,
      description: "পরবর্তী ৳৫,০০,০০০",
    },
    {
      upperLimit: 1850000,
      rate: 20,
      description: "পরবর্তী ৳৫,০০,০০০",
    },
    {
      upperLimit: 3850000,
      rate: 25,
      description: "পরবর্তী ৳২০,০০,০০০",
    },
    {
      upperLimit: null,
      rate: 30,
      description: "অবশিষ্ট আয়",
    },
  ],
};

/**
 * Format a number as BDT currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
