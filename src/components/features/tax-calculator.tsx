"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Banknote,
  FileText,
  Wallet,
  Building,
  Stethoscope,
  Car,
  ShieldCheck,
  Receipt,
  Target,
  Percent,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { calculateTax } from "@/lib/tax-calculator";
import { TAX_CONFIG, TAX_BRACKETS_LOCALIZED } from "@/config/tax-rates";
import {
  formatCurrencyLocalized,
  formatNumberLocalized,
  toBanglaNumber,
} from "@/config/translations";
import { useLanguage } from "@/components/providers/language-provider";
import type { TaxCalculationResult } from "@/types/tax";

interface SalaryStructure {
  basic: number;
  houseRent: number;
  medical: number;
  conveyance: number;
  others: number;
}

interface InvestmentItem {
  id: string;
  name: string;
  nameBn: string;
  amount: number;
  rebateRate: number; // 0, 15, or 100
  limit: number | null; // null means no limit
  category: string;
  categoryBn: string;
}

const INITIAL_SALARY_STRUCTURE: SalaryStructure = {
  basic: 0,
  houseRent: 0,
  medical: 0,
  conveyance: 0,
  others: 0,
};

const INVESTMENT_TYPES: InvestmentItem[] = [
  {
    id: "life-insurance",
    name: "Life Insurance Premium",
    nameBn: "জীবন বীমা প্রিমিয়াম",
    amount: 0,
    rebateRate: 100,
    limit: 50000,
    category: "100% Rebate",
    categoryBn: "১০০% রিবেট",
  },
  {
    id: "dps-savings",
    name: "DPS/Savings Certificate",
    nameBn: "ডিপিএস/সঞ্চয় সার্টিফিকেট",
    amount: 0,
    rebateRate: 100,
    limit: 100000,
    category: "100% Rebate",
    categoryBn: "১০০% রিবেট",
  },
  {
    id: "provident-fund",
    name: "Provident Fund",
    nameBn: "প্রভিডেন্ট ফান্ড",
    amount: 0,
    rebateRate: 100,
    limit: null,
    category: "100% Rebate",
    categoryBn: "১০০% রিবেট",
  },
  {
    id: "stock-market",
    name: "Stock Market Investment",
    nameBn: "স্টক মার্কেট বিনিয়োগ",
    amount: 0,
    rebateRate: 15,
    limit: null,
    category: "15% Rebate",
    categoryBn: "১৫% রিবেট",
  },
  {
    id: "donation-zakat",
    name: "Donation (Zakat Fund)",
    nameBn: "দান (জাকাত ফান্ড)",
    amount: 0,
    rebateRate: 15,
    limit: null,
    category: "15% Rebate",
    categoryBn: "১৫% রিবেট",
  },
];

export function TaxCalculator() {
  const { language, t } = useLanguage();
  const [grossIncome, setGrossIncome] = useState<number>(75000);
  const [inputMode, setInputMode] = useState<"monthly" | "yearly">("monthly");
  const [showRebate, setShowRebate] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure>(INITIAL_SALARY_STRUCTURE);
  const [investments, setInvestments] = useState<InvestmentItem[]>(INVESTMENT_TYPES);
  const [activeStep, setActiveStep] = useState(1);
  const [showTaxRates, setShowTaxRates] = useState(false);
  const [basicSalaryManuallySet, setBasicSalaryManuallySet] = useState(false);

  // Parse numeric value from string
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, "")) || 0;
  };

  // Handle mode change (monthly/yearly)
  const handleModeChange = (mode: "monthly" | "yearly") => {
    if (mode === inputMode) return;
    setInputMode(mode);

    const multiplier = mode === "yearly" ? 12 : 1 / 12;
    setGrossIncome(Math.round(grossIncome * multiplier));
    setSalaryStructure((prev) => ({
      basic: Math.round(prev.basic * multiplier),
      houseRent: Math.round(prev.houseRent * multiplier),
      medical: Math.round(prev.medical * multiplier),
      conveyance: Math.round(prev.conveyance * multiplier),
      others: Math.round(prev.others * multiplier),
    }));
    setInvestments((prev) =>
      prev.map((inv) => ({
        ...inv,
        amount: Math.round(inv.amount * multiplier),
      }))
    );
    setBasicSalaryManuallySet(false); // Reset manual flag on mode change
  };

  // Auto-update basic salary when other fields change (only if not manually set)
  useEffect(() => {
    if (basicSalaryManuallySet) return;
    
    const monthlyGross = inputMode === "monthly" ? grossIncome : grossIncome / 12;
    const monthlyOthers = salaryStructure.houseRent + salaryStructure.medical + salaryStructure.conveyance + salaryStructure.others;
    const calculatedBasic = Math.max(0, monthlyGross - monthlyOthers);
    
    // Auto-update basic salary
    if (Math.abs(salaryStructure.basic - calculatedBasic) > 1) {
      setSalaryStructure((prev) => ({ ...prev, basic: calculatedBasic }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grossIncome, inputMode, salaryStructure.houseRent, salaryStructure.medical, salaryStructure.conveyance, salaryStructure.others, basicSalaryManuallySet]);

  // Real-time calculation
  const calculation = useMemo(() => {
    // Calculate annual amounts
    const annualGross = inputMode === "monthly" ? grossIncome * 12 : grossIncome;
    const annualBasic = inputMode === "monthly" ? salaryStructure.basic * 12 : salaryStructure.basic;
    const annualHouseRent = inputMode === "monthly" ? salaryStructure.houseRent * 12 : salaryStructure.houseRent;
    const annualMedical = inputMode === "monthly" ? salaryStructure.medical * 12 : salaryStructure.medical;
    const annualConveyance = inputMode === "monthly" ? salaryStructure.conveyance * 12 : salaryStructure.conveyance;
    const annualOthers = inputMode === "monthly" ? salaryStructure.others * 12 : salaryStructure.others;

    // Use actual input values if provided, otherwise estimate
    // Check if user has entered any values
    const hasUserInput = annualBasic > 0 || annualHouseRent > 0 || annualMedical > 0 || annualConveyance > 0 || annualOthers > 0;
    
    // If user provided input, use it; otherwise estimate
    const finalBasic = hasUserInput && annualBasic > 0 ? annualBasic : (annualGross * 0.6);
    const finalHouseRent = hasUserInput && annualHouseRent > 0 ? annualHouseRent : (annualGross * 0.25);
    const finalMedical = hasUserInput && annualMedical > 0 ? annualMedical : (annualGross * 0.1);
    const finalConveyance = hasUserInput && annualConveyance > 0 ? annualConveyance : (annualGross * 0.05);

    // Calculate exemptions
    const exemptHR = Math.min(finalHouseRent, finalBasic * 0.5, 300000);
    const exemptMed = Math.min(finalMedical, finalBasic * 0.1, 120000);
    const exemptConv = Math.min(finalConveyance, 30000);

    const totalExemptions = exemptHR + exemptMed + exemptConv;
    const taxableIncome = Math.max(0, annualGross - totalExemptions);

    // Calculate tax
    const taxResult = calculateTax(taxableIncome);
    let grossTax = taxResult.totalTax;

    // Calculate investment rebates
    let totalRebate = 0;
    const rebateBreakdown: Array<{
      name: string;
      amount: number;
      rebate: number;
      rate: number;
    }> = [];

    if (showRebate) {
      investments.forEach((inv) => {
        const annualAmount = inputMode === "monthly" ? inv.amount * 12 : inv.amount;
        if (annualAmount > 0 && inv.rebateRate > 0) {
          let eligibleAmount = annualAmount;

          // Apply limit if exists
          if (inv.limit !== null) {
            eligibleAmount = Math.min(annualAmount, inv.limit);
          }

          // Calculate rebate
          let rebate = 0;
          if (inv.rebateRate === 100) {
            // 100% rebate means full amount deducted from tax
            rebate = eligibleAmount;
          } else {
            // Percentage rebate (e.g., 15%)
            rebate = eligibleAmount * (inv.rebateRate / 100);
          }

          totalRebate += rebate;
          rebateBreakdown.push({
            name: language === "bn" ? inv.nameBn : inv.name,
            amount: eligibleAmount,
            rebate: rebate,
            rate: inv.rebateRate,
          });
        }
      });
    }

    const finalAnnualTax = Math.max(0, grossTax - totalRebate);
    const finalAnnualNet = annualGross - finalAnnualTax;

    const divisor = inputMode === "monthly" ? 12 : 1;

    return {
      annualGross,
      finalAnnualTax,
      finalAnnualNet,
      effectiveRate: annualGross > 0 ? (finalAnnualTax / annualGross) * 100 : 0,
      display: {
        gross: annualGross / divisor,
        exemptions: totalExemptions / divisor,
        taxable: taxableIncome / divisor,
        basic: finalBasic / divisor,
        exemptionDetails: {
          hr: exemptHR / divisor,
          med: exemptMed / divisor,
          conv: exemptConv / divisor,
        },
        grossTax: grossTax / divisor,
        rebate: totalRebate / divisor,
        rebateBreakdown: rebateBreakdown.map((item) => ({
          ...item,
          amount: item.amount / divisor,
          rebate: item.rebate / divisor,
        })),
        netPay: finalAnnualNet / divisor,
        payableTax: finalAnnualTax / divisor,
        breakdown: taxResult.breakdown.map((item) => ({
          ...item,
          taxableAmount: item.taxableAmount / divisor,
          tax: item.tax / divisor,
        })),
      },
      secondary: {
        netPay: inputMode === "monthly" ? finalAnnualNet : finalAnnualNet / 12,
        label: inputMode === "monthly" ? "Annual" : "Monthly",
      },
    };
  }, [grossIncome, inputMode, salaryStructure, investments, showRebate, language]);

  const formatRate = (rate: number): string => {
    const rounded = Math.round(rate * 100) / 100;
    if (language === "bn") {
      return `${toBanglaNumber(rounded.toFixed(2))}%`;
    }
    return `${rounded.toFixed(2)}%`;
  };

  const localizedBrackets = TAX_BRACKETS_LOCALIZED[language];

  const formatMoney = (amount: number): string => {
    return formatCurrencyLocalized(amount, language);
  };

  // Helper to handle numeric input - always accepts English digits only
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: number) => void
  ) => {
    // Remove all non-English digits (0-9) and commas
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (rawValue === "" || !isNaN(Number(rawValue))) {
      setter(rawValue === "" ? 0 : Number(rawValue));
    }
  };

  return (
    <div className="tax-calculator-new">
      {/* Header Section */}
      <header className="tax-calculator-new__header">
        <div className="tax-calculator-new__header-top">
          <div className="tax-calculator-new__header-left">
            <div className="tax-calculator-new__icon-wrapper">
              <Calculator className="tax-calculator-new__icon" />
            </div>
            <div>
              <h1 className="tax-calculator-new__title">
                {t.calculateYourTax}
                <span className="tax-calculator-new__badge">
                  {t.fiscalYear}
                </span>
              </h1>
              <p className="tax-calculator-new__subtitle">
                {language === "bn" ? "তিনটি সহজ ধাপে আপনার আয়কর হিসাব করুন" : "Calculate your income tax in three simple steps"}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="tax-calculator-new__steps">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`tax-calculator-new__step ${activeStep === step ? "tax-calculator-new__step--active" : ""}`}
              >
                <div className="tax-calculator-new__step-number">{step}</div>
                <span className="tax-calculator-new__step-label">
                  {step === 1
                    ? language === "bn"
                      ? "আয়"
                      : "Income"
                    : step === 2
                    ? language === "bn"
                      ? "কাঠামো"
                      : "Structure"
                    : language === "bn"
                    ? "ফলাফল"
                    : "Results"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="tax-calculator-new__stats">
          <div className="tax-calculator-new__stat-card">
            <div className="tax-calculator-new__stat-content">
              <p className="tax-calculator-new__stat-label">
                {language === "bn" ? "করমুক্ত সীমা" : "Tax-free Limit"}
              </p>
              <p className="tax-calculator-new__stat-value">
                {formatCurrencyLocalized(350000, language)}
              </p>
            </div>
            <ShieldCheck className="tax-calculator-new__stat-icon" />
          </div>
          <div className="tax-calculator-new__stat-card">
            <div className="tax-calculator-new__stat-content">
              <p className="tax-calculator-new__stat-label">
                {language === "bn" ? "সর্বোচ্চ বিনিয়োগ রিবেট" : "Max Investment Rebate"}
              </p>
              <p className="tax-calculator-new__stat-value">{formatRate(15)}</p>
            </div>
            <Wallet className="tax-calculator-new__stat-icon" />
          </div>
          <div className="tax-calculator-new__stat-card">
            <div className="tax-calculator-new__stat-content">
              <p className="tax-calculator-new__stat-label">
                {language === "bn" ? "বাড়ি ভাড়া ছাড়" : "House Rent Exemption"}
              </p>
              <p className="tax-calculator-new__stat-value">
                {language === "bn" ? "মূল বেতনের ৫০%" : "50% of Basic"}
              </p>
            </div>
            <Building className="tax-calculator-new__stat-icon" />
          </div>
        </div>
      </header>

      <main className="tax-calculator-new__main">
        {/* LEFT COLUMN: Input Section */}
        <section className="tax-calculator-new__left">
          {/* Step 1: Income Card */}
          <Card
            className={`tax-calculator-new__step-card ${
              activeStep === 1 ? "tax-calculator-new__step-card--active" : ""
            }`}
          >
            <CardHeader>
              <div className="tax-calculator-new__step-header">
                <div className="tax-calculator-new__step-header-left">
                  <div
                    className={`tax-calculator-new__step-icon-wrapper ${
                      activeStep === 1 ? "tax-calculator-new__step-icon-wrapper--active" : ""
                    }`}
                  >
                    <Banknote
                      className={`tax-calculator-new__step-icon ${
                        activeStep === 1 ? "tax-calculator-new__step-icon--active" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <CardTitle className="tax-calculator-new__step-title">
                      {language === "bn" ? "ধাপ ১: আপনার আয় লিখুন" : "Step 1: Enter Your Income"}
                    </CardTitle>
                    <p className="tax-calculator-new__step-description">
                      {language === "bn" ? "আপনার মোট বেতন দিয়ে শুরু করুন" : "Start with your gross salary"}
                    </p>
                  </div>
                </div>
                <div className="tax-calculator-new__mode-toggle">
                  <span className="tax-calculator-new__mode-label">
                    {language === "bn" ? "দেখুন:" : "View as:"}
                  </span>
                  <div className="tax-calculator-new__toggle-group">
                    <Button
                      type="button"
                      variant={inputMode === "monthly" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleModeChange("monthly")}
                      className="tax-calculator-new__toggle-btn"
                    >
                      {language === "bn" ? "মাসিক" : "Monthly"}
                    </Button>
                    <Button
                      type="button"
                      variant={inputMode === "yearly" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleModeChange("yearly")}
                      className="tax-calculator-new__toggle-btn"
                    >
                      {language === "bn" ? "বার্ষিক" : "Yearly"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="tax-calculator-new__income-input-wrapper">
                <Label
                  htmlFor="grossIncome"
                  className="tax-calculator-new__income-label"
                >
                  {inputMode === "monthly"
                    ? language === "bn"
                      ? "মোট মাসিক বেতন"
                      : "Gross Monthly Salary"
                    : language === "bn"
                    ? "মোট বার্ষিক বেতন"
                    : "Gross Annual Salary"}
                </Label>
                <div className="tax-calculator-new__income-input-container">
                  <span className="tax-calculator-new__currency-symbol">৳</span>
                  <Input
                    id="grossIncome"
                    type="text"
                    inputMode="numeric"
                    value={grossIncome.toLocaleString("en-BD")}
                    onChange={(e) => handleNumericInput(e, setGrossIncome)}
                    className="tax-calculator-new__income-input"
                  />
                  <span className="tax-calculator-new__income-suffix">
                    {inputMode === "monthly"
                      ? language === "bn"
                        ? "প্রতি মাসে"
                        : "per month"
                      : language === "bn"
                      ? "প্রতি বছর"
                      : "per year"}
                  </span>
                </div>
              </div>

              {/* Slider */}
              <div className="tax-calculator-new__slider-wrapper">
                <div className="tax-calculator-new__slider-labels">
                  <span>৳ {formatNumberLocalized(0, language)}</span>
                  <span className="tax-calculator-new__slider-label-center">
                    {language === "bn" ? "আয় সামঞ্জস্য করুন" : "Adjust Income"}
                  </span>
                  <span>
                    ৳ {formatNumberLocalized(inputMode === "monthly" ? 300000 : 3600000, language)}+
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={inputMode === "monthly" ? 300000 : 3600000}
                  step={inputMode === "monthly" ? 1000 : 5000}
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(Number(e.target.value))}
                  className="tax-calculator-new__slider"
                />
                <div className="tax-calculator-new__quick-amounts">
                  {[50000, 100000, 150000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setGrossIncome(inputMode === "monthly" ? amt : amt * 12)
                      }
                      className="tax-calculator-new__quick-amount-btn"
                    >
                      ৳ {formatNumberLocalized(amt, language)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Salary Structure */}
          <Card
            className={`tax-calculator-new__step-card ${
              activeStep === 2 ? "tax-calculator-new__step-card--active" : ""
            }`}
          >
            <button
              onClick={() => {
                setShowStructure(!showStructure);
                setActiveStep(2);
              }}
              className="tax-calculator-new__step-toggle"
            >
              <CardHeader>
                <div className="tax-calculator-new__step-header">
                  <div className="tax-calculator-new__step-header-left">
                    <div
                      className={`tax-calculator-new__step-icon-wrapper ${
                        showStructure ? "tax-calculator-new__step-icon-wrapper--active" : ""
                      }`}
                    >
                      <FileText
                        className={`tax-calculator-new__step-icon ${
                          showStructure ? "tax-calculator-new__step-icon--active" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="tax-calculator-new__step-title">
                        {language === "bn"
                          ? "ধাপ ২: বেতন কাঠামো কনফিগার করুন"
                          : "Step 2: Configure Salary Structure"}
                      </CardTitle>
                      <p className="tax-calculator-new__step-description">
                        {language === "bn"
                          ? "ছাড় সর্বাধিক করার জন্য ভাতা সামঞ্জস্য করুন"
                          : "Adjust allowances to maximize exemptions"}
                      </p>
                    </div>
                  </div>
                  <div className="tax-calculator-new__chevron">
                    {showStructure ? (
                      <ChevronUp className="tax-calculator-new__chevron-icon" />
                    ) : (
                      <ChevronDown className="tax-calculator-new__chevron-icon" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {showStructure && (
              <CardContent>
                <div className="tax-calculator-new__structure-content">
                  <p className="tax-calculator-new__structure-hint">
                    {language === "bn"
                      ? "আপনার মাসিক বেতনের বিভিন্ন খাতে প্রাপ্ত টাকার পরিমাণ লিখুন (প্রতি মাসে)"
                      : "Enter your monthly salary components (per month)"}
                  </p>

                  {/* Salary Structure Inputs */}
                  <div className="tax-calculator-new__salary-inputs">
                    <div className="tax-calculator-new__salary-field">
                      <Label htmlFor="basic" className="tax-calculator-new__salary-label">
                        {t.basicSalary} ({t.monthly})
                      </Label>
                      <div className="tax-calculator-new__salary-input-container">
                        <span className="tax-calculator-new__salary-currency">৳</span>
                        <Input
                          id="basic"
                          type="text"
                          inputMode="numeric"
                          value={salaryStructure.basic.toLocaleString("en-BD")}
                          onChange={(e) => {
                            handleNumericInput(e, (val) => {
                              setBasicSalaryManuallySet(true);
                              setSalaryStructure((prev) => ({ ...prev, basic: val }));
                            });
                          }}
                          className="tax-calculator-new__salary-input"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="tax-calculator-new__salary-field">
                      <Label htmlFor="houseRent" className="tax-calculator-new__salary-label">
                        {t.houseRentAllowance} ({t.monthly})
                      </Label>
                      <div className="tax-calculator-new__salary-input-container">
                        <span className="tax-calculator-new__salary-currency">৳</span>
                        <Input
                          id="houseRent"
                          type="text"
                          inputMode="numeric"
                          value={salaryStructure.houseRent.toLocaleString("en-BD")}
                          onChange={(e) => {
                            handleNumericInput(e, (val) => {
                              setBasicSalaryManuallySet(false); // Reset manual flag when other fields change
                              setSalaryStructure((prev) => ({ ...prev, houseRent: val }));
                            });
                          }}
                          className="tax-calculator-new__salary-input"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="tax-calculator-new__salary-field">
                      <Label htmlFor="medical" className="tax-calculator-new__salary-label">
                        {t.medicalAllowance} ({t.monthly})
                      </Label>
                      <div className="tax-calculator-new__salary-input-container">
                        <span className="tax-calculator-new__salary-currency">৳</span>
                        <Input
                          id="medical"
                          type="text"
                          inputMode="numeric"
                          value={salaryStructure.medical.toLocaleString("en-BD")}
                          onChange={(e) => {
                            handleNumericInput(e, (val) => {
                              setBasicSalaryManuallySet(false); // Reset manual flag when other fields change
                              setSalaryStructure((prev) => ({ ...prev, medical: val }));
                            });
                          }}
                          className="tax-calculator-new__salary-input"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="tax-calculator-new__salary-field">
                      <Label htmlFor="conveyance" className="tax-calculator-new__salary-label">
                        {t.conveyanceAllowance} ({t.monthly})
                      </Label>
                      <div className="tax-calculator-new__salary-input-container">
                        <span className="tax-calculator-new__salary-currency">৳</span>
                        <Input
                          id="conveyance"
                          type="text"
                          inputMode="numeric"
                          value={salaryStructure.conveyance.toLocaleString("en-BD")}
                          onChange={(e) => {
                            handleNumericInput(e, (val) => {
                              setBasicSalaryManuallySet(false); // Reset manual flag when other fields change
                              setSalaryStructure((prev) => ({ ...prev, conveyance: val }));
                            });
                          }}
                          className="tax-calculator-new__salary-input"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="tax-calculator-new__salary-field">
                      <Label htmlFor="others" className="tax-calculator-new__salary-label">
                        {t.otherAllowances} ({t.monthly})
                      </Label>
                      <div className="tax-calculator-new__salary-input-container">
                        <span className="tax-calculator-new__salary-currency">৳</span>
                        <Input
                          id="others"
                          type="text"
                          inputMode="numeric"
                          value={salaryStructure.others.toLocaleString("en-BD")}
                          onChange={(e) => {
                            handleNumericInput(e, (val) => {
                              setBasicSalaryManuallySet(false); // Reset manual flag when other fields change
                              setSalaryStructure((prev) => ({ ...prev, others: val }));
                            });
                          }}
                          className="tax-calculator-new__salary-input"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Exemptions Breakdown */}
                  <div className="tax-calculator-new__exemptions">
                    <h3 className="tax-calculator-new__exemptions-title">
                      {language === "bn" ? "আনুমানিক ছাড়" : "Estimated Exemptions"}
                    </h3>
                    <div className="tax-calculator-new__exemptions-grid">
                      <ExemptionCard
                        icon={<Building className="tax-calculator-new__exemption-icon" />}
                        title={language === "bn" ? "বাড়ি ভাড়া" : "House Rent"}
                        amount={calculation.display.exemptionDetails.hr}
                        description={
                          language === "bn"
                            ? "মূল বেতনের ৫০% (সর্বোচ্চ ৳৩ লাখ/বছর)"
                            : "50% of Basic (max ৳3L/year)"
                        }
                      />
                      <ExemptionCard
                        icon={<Stethoscope className="tax-calculator-new__exemption-icon" />}
                        title={language === "bn" ? "চিকিৎসা" : "Medical"}
                        amount={calculation.display.exemptionDetails.med}
                        description={
                          language === "bn"
                            ? "মূল বেতনের ১০% (সর্বোচ্চ ৳১.২ লাখ/বছর)"
                            : "10% of Basic (max ৳1.2L/year)"
                        }
                      />
                      <ExemptionCard
                        icon={<Car className="tax-calculator-new__exemption-icon" />}
                        title={language === "bn" ? "যাতায়াত" : "Conveyance"}
                        amount={calculation.display.exemptionDetails.conv}
                        description={
                          language === "bn"
                            ? "নির্দিষ্ট ৳৩০,০০০/বছর"
                            : "Fixed ৳30,000/year"
                        }
                      />
                    </div>
                  </div>

                  <div className="tax-calculator-new__total-exemption">
                    <span className="tax-calculator-new__total-exemption-label">
                      {language === "bn" ? "মোট করমুক্ত ভাতা" : "Total Tax-free Allowance"}
                    </span>
                    <span className="tax-calculator-new__total-exemption-value">
                      {formatMoney(calculation.display.exemptions)}
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Step 3: Investments & Rebate */}
          <Card
            className={`tax-calculator-new__step-card ${
              activeStep === 3 ? "tax-calculator-new__step-card--active" : ""
            }`}
          >
            <button
              onClick={() => {
                setShowRebate(!showRebate);
                setActiveStep(3);
              }}
              className="tax-calculator-new__step-toggle"
            >
              <CardHeader>
                <div className="tax-calculator-new__step-header">
                  <div className="tax-calculator-new__step-header-left">
                    <div
                      className={`tax-calculator-new__step-icon-wrapper ${
                        showRebate ? "tax-calculator-new__step-icon-wrapper--active" : ""
                      }`}
                    >
                      <Wallet
                        className={`tax-calculator-new__step-icon ${
                          showRebate ? "tax-calculator-new__step-icon--active" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="tax-calculator-new__step-title">
                        {language === "bn"
                          ? "ধাপ ৩: রিবেটের জন্য বিনিয়োগ যোগ করুন"
                          : "Step 3: Add Investments for Rebate"}
                      </CardTitle>
                      <p className="tax-calculator-new__step-description">
                        {language === "bn"
                          ? "স্মার্ট বিনিয়োগের মাধ্যমে কর কমান"
                          : "Reduce tax through smart investments"}
                      </p>
                    </div>
                  </div>
                  <div className="tax-calculator-new__chevron">
                    {showRebate ? (
                      <ChevronUp className="tax-calculator-new__chevron-icon" />
                    ) : (
                      <ChevronDown className="tax-calculator-new__chevron-icon" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {showRebate && (
              <CardContent>
                <div className="tax-calculator-new__rebate-content">
                  <p className="tax-calculator-new__rebate-hint">
                    {language === "bn"
                      ? "আপনার বিভিন্ন ধরনের বিনিয়োগের পরিমাণ লিখুন (প্রতি মাসে)"
                      : "Enter your investment amounts by type (per month)"}
                  </p>

                  <div className="tax-calculator-new__investments-list">
                    {investments.map((inv) => (
                      <div key={inv.id} className="tax-calculator-new__investment-item">
                        <div className="tax-calculator-new__investment-item-header">
                          <div>
                            <Label
                              htmlFor={inv.id}
                              className="tax-calculator-new__investment-item-label"
                            >
                              {language === "bn" ? inv.nameBn : inv.name}
                            </Label>
                            <div className="tax-calculator-new__investment-item-meta">
                              <span className="tax-calculator-new__investment-item-category">
                                {language === "bn" ? inv.categoryBn : inv.category}
                              </span>
                              {inv.limit !== null && (
                                <span className="tax-calculator-new__investment-item-limit">
                                  {language === "bn"
                                    ? `সর্বোচ্চ: ${formatCurrencyLocalized(inv.limit, language)}`
                                    : `Max: ${formatCurrencyLocalized(inv.limit, language)}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="tax-calculator-new__investment-item-input-container">
                          <span className="tax-calculator-new__investment-item-currency">৳</span>
                          <Input
                            id={inv.id}
                            type="text"
                            inputMode="numeric"
                            value={inv.amount.toLocaleString("en-BD")}
                            onChange={(e) => {
                              handleNumericInput(e, (val) =>
                                setInvestments((prev) =>
                                  prev.map((item) =>
                                    item.id === inv.id ? { ...item, amount: val } : item
                                  )
                                )
                              );
                            }}
                            className="tax-calculator-new__investment-item-input"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {calculation.display.rebate > 0 && (
                    <div className="tax-calculator-new__rebate-applied">
                      <div className="tax-calculator-new__rebate-applied-header">
                        <div className="tax-calculator-new__rebate-applied-left">
                          <span className="tax-calculator-new__rebate-applied-label">
                            {language === "bn" ? "মোট কর রিবেট" : "Total Tax Rebate"}
                          </span>
                        </div>
                        <span className="tax-calculator-new__rebate-applied-value">
                          -{formatMoney(calculation.display.rebate)}
                        </span>
                      </div>
                      {calculation.display.rebateBreakdown.length > 0 && (
                        <div className="tax-calculator-new__rebate-breakdown">
                          {calculation.display.rebateBreakdown.map((item, idx) => (
                            <div key={idx} className="tax-calculator-new__rebate-breakdown-item">
                              <span className="tax-calculator-new__rebate-breakdown-name">
                                {item.name}
                              </span>
                              <span className="tax-calculator-new__rebate-breakdown-amount">
                                {formatMoney(item.rebate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </section>

        {/* RIGHT COLUMN: Results */}
        <section className="tax-calculator-new__right">
          <div className="tax-calculator-new__results-sticky">
            <Card className="tax-calculator-new__results-card">
              <CardHeader>
                <div className="tax-calculator-new__results-header">
                  <div className="tax-calculator-new__results-header-left">
                    <Receipt className="tax-calculator-new__results-icon" />
                    <CardTitle className="tax-calculator-new__results-title">
                      {t.yourTaxSummary}
                    </CardTitle>
                  </div>
                  <div className="tax-calculator-new__results-badge">
                    {t.fiscalYear}
                  </div>
                </div>
                <p className="tax-calculator-new__results-subtitle">
                  {language === "bn" ? "আপনার ইনপুটের উপর ভিত্তি করে" : "Based on your inputs"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="tax-calculator-new__results-content">
                  {/* Net Pay Highlight */}
                  <div className="tax-calculator-new__net-pay">
                    <p className="tax-calculator-new__net-pay-label">
                      {language === "bn"
                        ? inputMode === "monthly"
                          ? "আপনার মাসিক হোম টেক"
                          : "আপনার বার্ষিক হোম টেক"
                        : inputMode === "monthly"
                        ? "Your Monthly Take Home"
                        : "Your Annual Take Home"}
                    </p>
                    <div className="tax-calculator-new__net-pay-value">
                      {formatMoney(calculation.display.netPay)}
                    </div>
                    <p className="tax-calculator-new__net-pay-secondary">
                      {language === "bn"
                        ? calculation.secondary.label === "Annual"
                          ? "বার্ষিক সমতুল্য:"
                          : "মাসিক সমতুল্য:"
                        : `${calculation.secondary.label} equivalent:`}{" "}
                      {formatMoney(calculation.secondary.netPay)}
                    </p>
                  </div>

                  {/* Visual Tax Breakdown */}
                  <div className="tax-calculator-new__tax-breakdown">
                    <h3 className="tax-calculator-new__tax-breakdown-title">
                      {language === "bn"
                        ? "আপনার টাকা কোথায় যায়"
                        : "Where Your Money Goes"}
                    </h3>
                    <div className="tax-calculator-new__tax-segments">
                      <TaxSegment
                        label={language === "bn" ? "আপনি যে কর দেন" : "Tax You Pay"}
                        amount={calculation.display.payableTax}
                        percentage={calculation.effectiveRate}
                        icon={<TrendingDown className="tax-calculator-new__tax-segment-icon" />}
                      />
                      <TaxSegment
                        label={language === "bn" ? "আপনি যে টাকা রাখেন" : "Money You Keep"}
                        amount={calculation.display.netPay}
                        percentage={100 - calculation.effectiveRate}
                        icon={<TrendingUp className="tax-calculator-new__tax-segment-icon" />}
                      />
                    </div>
                    <div className="tax-calculator-new__tax-bar">
                      <div
                        className="tax-calculator-new__tax-bar-segment tax-calculator-new__tax-bar-segment--tax"
                        style={{ width: `${calculation.effectiveRate}%` }}
                      />
                      <div
                        className="tax-calculator-new__tax-bar-segment tax-calculator-new__tax-bar-segment--net"
                        style={{ width: `${100 - calculation.effectiveRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="tax-calculator-new__detailed-breakdown">
                    <div className="tax-calculator-new__breakdown-row">
                      <span className="tax-calculator-new__breakdown-label">
                        {language === "bn" ? "মোট আয়" : "Gross Income"}
                      </span>
                      <span className="tax-calculator-new__breakdown-value">
                        {formatMoney(calculation.display.gross)}
                      </span>
                    </div>
                    <div className="tax-calculator-new__breakdown-row">
                      <span className="tax-calculator-new__breakdown-label">
                        {language === "bn" ? "কম: ছাড়" : "Less: Exemptions"}
                      </span>
                      <span className="tax-calculator-new__breakdown-value tax-calculator-new__breakdown-value--positive">
                        -{formatMoney(calculation.display.exemptions)}
                      </span>
                    </div>
                    <div className="tax-calculator-new__breakdown-row tax-calculator-new__breakdown-row--bold">
                      <span className="tax-calculator-new__breakdown-label">
                        {language === "bn" ? "করযোগ্য আয়" : "Taxable Income"}
                      </span>
                      <span className="tax-calculator-new__breakdown-value">
                        {formatMoney(calculation.display.taxable)}
                      </span>
                    </div>

                    {/* Tax Slabs */}
                    <div className="tax-calculator-new__slabs">
                      <h4 className="tax-calculator-new__slabs-title">
                        {language === "bn" ? "প্রয়োগকৃত কর স্ল্যাব" : "Tax Slabs Applied"}
                      </h4>
                      {calculation.display.breakdown
                        .filter((item) => item.taxableAmount > 0)
                        .map((item, idx) => {
                          const localizedBracket = localizedBrackets[idx];
                          const bracketDescription = localizedBracket
                            ? localizedBracket.description.split("(")[0].trim()
                            : item.bracket.split("(")[0].trim();
                          return (
                            <div key={idx} className="tax-calculator-new__slab-item">
                              <div className="tax-calculator-new__slab-left">
                                <div className="tax-calculator-new__slab-dot" />
                                <span className="tax-calculator-new__slab-description">
                                  {bracketDescription}
                                </span>
                                <span className="tax-calculator-new__slab-rate">
                                  ({formatRate(item.rate)})
                                </span>
                              </div>
                            <span
                              className={`tax-calculator-new__slab-tax ${
                                item.tax > 0
                                  ? "tax-calculator-new__slab-tax--active"
                                  : ""
                              }`}
                            >
                              {item.tax > 0 ? formatMoney(item.tax) : language === "bn" ? "মুক্ত" : "Free"}
                            </span>
                            </div>
                          );
                        })}
                    </div>

                    {/* Final Calculation */}
                    <div className="tax-calculator-new__final-calculation">
                      <div className="tax-calculator-new__breakdown-row">
                        <span className="tax-calculator-new__breakdown-label">
                          {language === "bn" ? "মোট কর" : "Gross Tax"}
                        </span>
                        <span className="tax-calculator-new__breakdown-value">
                          {formatMoney(calculation.display.grossTax)}
                        </span>
                      </div>
                      {showRebate && calculation.display.rebate > 0 && (
                        <div className="tax-calculator-new__breakdown-row">
                          <span className="tax-calculator-new__breakdown-label">
                            {language === "bn"
                              ? "কম: বিনিয়োগ রিবেট"
                              : "Less: Investment Rebate"}
                          </span>
                          <span className="tax-calculator-new__breakdown-value tax-calculator-new__breakdown-value--positive">
                            -{formatMoney(calculation.display.rebate)}
                          </span>
                        </div>
                      )}
                      <div className="tax-calculator-new__breakdown-row tax-calculator-new__breakdown-row--final">
                        <span className="tax-calculator-new__breakdown-label">
                          {language === "bn" ? "চূড়ান্ত কর প্রদেয়" : "Final Tax Payable"}
                        </span>
                        <span className="tax-calculator-new__breakdown-value tax-calculator-new__breakdown-value--final">
                          {formatMoney(calculation.display.payableTax)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Effective Rate Badge */}
                <div className="tax-calculator-new__effective-rate">
                  <div className="tax-calculator-new__effective-rate-left">
                    <Target className="tax-calculator-new__effective-rate-icon" />
                    <span className="tax-calculator-new__effective-rate-label">
                      {language === "bn" ? "কার্যকর কর হার" : "Effective Tax Rate"}
                    </span>
                  </div>
                  <div className="tax-calculator-new__effective-rate-right">
                    <div className="tax-calculator-new__effective-rate-value">
                      {formatRate(calculation.effectiveRate)}
                    </div>
                    <div className="tax-calculator-new__effective-rate-hint">
                      {calculation.display.payableTax > 0
                        ? language === "bn"
                          ? "সর্বোচ্চ স্ল্যাবের চেয়ে কম"
                          : "Lower than highest slab"
                        : language === "bn"
                        ? "করমুক্ত সীমার মধ্যে"
                        : "Within tax-free limit"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Text */}
            <div className="tax-calculator-new__help">
              <p className="tax-calculator-new__help-text">
                <Info className="tax-calculator-new__help-icon" />
                {language === "bn"
                  ? "রিয়েল-টাইম পরিবর্তন দেখতে উপরের যেকোনো ইনপুট সামঞ্জস্য করুন"
                  : "Adjust any input above to see real-time changes"}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Tax Rates Card */}
      <Card className="tax-calculator-new__rates-card">
        <CardHeader
          className="tax-calculator-new__rates-header"
          onClick={() => setShowTaxRates(!showTaxRates)}
        >
          <CardTitle className="tax-calculator-new__rates-title">
            {t.taxRates} ({t.fiscalYear})
          </CardTitle>
          <ChevronDown
            className={`tax-calculator-new__rates-chevron ${
              showTaxRates ? "tax-calculator-new__rates-chevron--open" : ""
            }`}
          />
        </CardHeader>
        {showTaxRates && (
          <CardContent>
            <div className="tax-calculator-new__rates-list">
              {localizedBrackets.map((bracket, index) => (
                <div key={index} className="tax-calculator-new__rates-item">
                  <span className="tax-calculator-new__rates-income">
                    {bracket.description}
                  </span>
                  <span className="tax-calculator-new__rates-rate">
                    {bracket.rate === 0 ? t.taxFree : formatRate(bracket.rate)}
                  </span>
                </div>
              ))}
            </div>
            <p className="tax-calculator-new__source">
              <span className="tax-calculator-new__source-label">
                {t.taxRateSourceLabel}
              </span>
              <a
                href="https://nbr.gov.bd/uploads/news-scroller/Nirdeshika_2025-26.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="tax-calculator-new__source-link"
              >
                {t.taxRateSourceValue}
                <ArrowUpRight className="tax-calculator-new__source-icon" />
              </a>
            </p>
          </CardContent>
        )}
      </Card>

      {/* Footer */}
      <footer className="tax-calculator-new__footer">
        <p className="tax-calculator-new__footer-text">{t.disclaimer}</p>
      </footer>
    </div>
  );
}

// Reusable Components
function ExemptionCard({
  icon,
  title,
  amount,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  amount: number;
  description: string;
}) {
  const { language } = useLanguage();
  return (
    <div className="tax-calculator-new__exemption-card">
      <div className="tax-calculator-new__exemption-icon-wrapper">{icon}</div>
      <div className="tax-calculator-new__exemption-header">
        <h4 className="tax-calculator-new__exemption-title">{title}</h4>
        <p className="tax-calculator-new__exemption-description">
          {description}
        </p>
      </div>
      <div className="tax-calculator-new__exemption-value">
        {formatCurrencyLocalized(amount, language)}
      </div>
    </div>
  );
}

function TaxSegment({
  label,
  amount,
  percentage,
  icon,
}: {
  label: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
}) {
  const { language, t } = useLanguage();
  const formatRate = (rate: number): string => {
    if (language === "bn") {
      return `${toBanglaNumber(rate.toFixed(1))}%`;
    }
    return `${rate.toFixed(1)}%`;
  };
  return (
    <div className="tax-calculator-new__tax-segment">
      <div className="tax-calculator-new__tax-segment-left">
        <div className="tax-calculator-new__tax-segment-dot" />
        <span className="tax-calculator-new__tax-segment-label">{label}</span>
        {icon}
      </div>
      <div className="tax-calculator-new__tax-segment-right">
        <div className="tax-calculator-new__tax-segment-amount">
          {formatCurrencyLocalized(amount, language)}
        </div>
        <div className="tax-calculator-new__tax-segment-percentage">
          {formatRate(percentage)}
        </div>
      </div>
    </div>
  );
}
