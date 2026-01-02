export type Language = "en" | "bn";

export interface Translations {
  // Header
  menu: string;
  taxCalculator: string;

  // Calculator
  calculateYourTax: string;
  yourMonthlySalary: string;
  perMonth: string;
  enterGrossMonthlySalary: string;
  iKnowMyBreakdown: string;
  iOnlyKnowTotal: string;
  enterMonthlyComponents: string;
  basicSalary: string;
  houseRentAllowance: string;
  medicalAllowance: string;
  conveyanceAllowance: string;
  otherAllowances: string;
  monthly: string;
  clear: string;
  calculateTax: string;

  // Results
  yourTaxSummary: string;
  monthlyTax: string;
  yearlyTax: string;
  effectiveRate: string;
  howTaxCalculated: string;
  basedOnAnnualIncome: string;
  incomeSlab: string;
  amount: string;
  rate: string;
  tax: string;
  totalYearlyTax: string;

  // Tax Rates
  taxRates: string;
  yearlyIncome: string;
  taxRate: string;
  taxFree: string;
  taxRateSourceLabel: string;
  taxRateSourceValue: string;

  // Footer
  disclaimer: string;
  footerCopyright: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    menu: "Menu",
    taxCalculator: "Tax Calculator",

    // Calculator
    calculateYourTax: "Calculate Your Tax",
    yourMonthlySalary: "Your Basic Salary",
    perMonth: "per month",
    enterGrossMonthlySalary: "Basic Salary = Gross Salary - Allowances",
    iKnowMyBreakdown: "I know my salary breakdown",
    iOnlyKnowTotal: "I only know my total salary",
    enterMonthlyComponents: "Enter your monthly salary components (per month)",
    basicSalary: "Basic Salary",
    houseRentAllowance: "House Rent Allowance",
    medicalAllowance: "Medical Allowance",
    conveyanceAllowance: "Conveyance Allowance",
    otherAllowances: "Other Allowances",
    monthly: "monthly",
    clear: "Clear",
    calculateTax: "Calculate Tax",

    // Results
    yourTaxSummary: "Your Tax Summary",
    monthlyTax: "Monthly Tax",
    yearlyTax: "Yearly Tax",
    effectiveRate: "Effective Rate",
    howTaxCalculated: "How Your Tax is Calculated",
    basedOnAnnualIncome: "Based on annual taxable income of",
    incomeSlab: "Income Slab",
    amount: "Amount",
    rate: "Rate",
    tax: "Tax",
    totalYearlyTax: "Total Yearly Tax",

    // Tax Rates
    taxRates: "Tax Rates",
    yearlyIncome: "Yearly Income (BDT)",
    taxRate: "Tax Rate",
    taxFree: "Tax-free",
    taxRateSourceLabel: "Source:",
    taxRateSourceValue: "NBR Tax Guidelines 2025-26, p 8-9",

    // Footer
    disclaimer:
      "Disclaimer: This calculator provides estimates only. Please consult a tax professional for accurate tax advice.",
    footerCopyright: "How Big Is That?",
  },
  bn: {
    // Header
    menu: "মেনু",
    taxCalculator: "কর ক্যালকুলেটর",

    // Calculator
    calculateYourTax: "আপনার আয়কর হিসাব করুন",
    yourMonthlySalary: "আপনার মূল বেতন",
    perMonth: "প্রতি মাসে",
    enterGrossMonthlySalary: "মূল বেতন = মোট বেতন - বিভিন্ন খাতে প্রাপ্ত টাকার পরিমাণ",
    iKnowMyBreakdown: "আমি আমার বেতনের ব্রেকডাউন জানি",
    iOnlyKnowTotal: "আমি শুধু মোট বেতন জানি",
    enterMonthlyComponents: "আপনার মাসিক বেতনের বিভিন্ন খাতে প্রাপ্ত টাকার পরিমাণ লিখুন (প্রতি মাসে)",
    basicSalary: "মূল বেতন",
    houseRentAllowance: "বাড়ি ভাড়া ভাতা",
    medicalAllowance: "চিকিৎসা ভাতা",
    conveyanceAllowance: "যাতায়াত ভাতা",
    otherAllowances: "অন্যান্য ভাতা",
    monthly: "মাসিক",
    clear: "মুছুন",
    calculateTax: "কর হিসাব করুন",

    // Results
    yourTaxSummary: "আপনার কর সারাংশ",
    monthlyTax: "মাসিক কর",
    yearlyTax: "বার্ষিক কর",
    effectiveRate: "কার্যকর হার",
    howTaxCalculated: "আপনার কর কিভাবে হিসাব করা হয়েছে",
    basedOnAnnualIncome: "বার্ষিক করযোগ্য আয়ের উপর ভিত্তি করে",
    incomeSlab: "আয়ের স্তর",
    amount: "পরিমাণ",
    rate: "হার",
    tax: "কর",
    totalYearlyTax: "মোট বার্ষিক কর",

    // Tax Rates
    taxRates: "কর হার",
    yearlyIncome: "বার্ষিক আয় (টাকা)",
    taxRate: "কর হার",
    taxFree: "করমুক্ত",
    taxRateSourceLabel: "সূত্র:",
    taxRateSourceValue: "এনবিআর আয়কর নির্দেশিকা ২০২৫-২৬, পৃষ্ঠা ৮-৯",

    // Footer
    disclaimer:
      "দ্রষ্টব্য: এই ক্যালকুলেটর শুধুমাত্র আনুমানিক হিসাব দেয়। সঠিক কর পরামর্শের জন্য একজন কর বিশেষজ্ঞের সাথে যোগাযোগ করুন।",
    footerCopyright: "How Big Is That?",
  },
};

// Bangla number formatting
export function toBanglaNumber(num: number | string): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (digit) => banglaDigits[parseInt(digit)]);
}

// Format currency based on language
export function formatCurrencyLocalized(
  amount: number,
  language: Language
): string {
  const formatted = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (language === "bn") {
    return `৳${toBanglaNumber(formatted)}`;
  }
  return `BDT ${formatted}`;
}

// Format number based on language
export function formatNumberLocalized(
  amount: number,
  language: Language
): string {
  const formatted = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (language === "bn") {
    return toBanglaNumber(formatted);
  }
  return formatted;
}

