"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Calculator, ChevronDown, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateTax } from "@/lib/tax-calculator";
import { TAX_CONFIG, TAX_BRACKETS_LOCALIZED } from "@/config/tax-rates";
import {
  formatCurrencyLocalized,
  formatNumberLocalized,
  toBanglaNumber,
} from "@/config/translations";
import { useLanguage } from "@/components/providers/language-provider";
import type { TaxCalculationResult } from "@/types/tax";
import { cn } from "@/lib/utils";

interface SalaryBreakdown {
  basic: string;
  houseRent: string;
  medical: string;
  conveyance: string;
  others: string;
}

interface Investment {
  id: number;
  name: string;
  amount: string;
  rebateRate: number;
  limit: number | null;
  category: string;
}

const INITIAL_BREAKDOWN: SalaryBreakdown = {
  basic: "",
  houseRent: "",
  medical: "",
  conveyance: "",
  others: "",
};

const INITIAL_INVESTMENTS: Investment[] = [
  { id: 1, name: "Life Insurance Premium", amount: "", rebateRate: 100, limit: 50000, category: "100% Rebate" },
  { id: 2, name: "DPS/Savings Certificate", amount: "", rebateRate: 100, limit: 100000, category: "100% Rebate" },
  { id: 3, name: "Provident Fund", amount: "", rebateRate: 100, limit: null, category: "100% Rebate" },
  { id: 4, name: "Stock Market Investment", amount: "", rebateRate: 15, limit: null, category: "15% Rebate" },
  { id: 5, name: "Donation (Zakat Fund)", amount: "", rebateRate: 15, limit: null, category: "15% Rebate" },
];

const TAX_EXEMPTIONS = {
  houseRent: { limit: 300000, percentOfBasic: 0.5 },
  medical: { limit: 120000, percentOfBasic: 0.1 },
  conveyance: { limit: 30000 },
};

export function TaxCalculator() {
  const { language, t } = useLanguage();
  const [display, setDisplay] = useState("75000");
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");
  const [sliders, setSliders] = useState({
    basic: 60,
    houseRent: 25,
    medical: 10,
    conveyance: 5,
  });
  const [investments, setInvestments] = useState<Investment[]>(INITIAL_INVESTMENTS);
  const [isCalculated, setIsCalculated] = useState(false);
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  const [grossTaxBeforeRebates, setGrossTaxBeforeRebates] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isRatesOpen, setIsRatesOpen] = useState<boolean>(false);

  // Parse numeric value from string
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, "")) || 0;
  };

  // Calculate annual taxable income with exemptions
  const calculateAnnualTaxableIncome = useCallback((): number => {
    const income = parseNumber(display);
    const annualGross = mode === "monthly" ? income * 12 : income;

    const basicSalary = annualGross * (sliders.basic / 100);
    const estHouseRent = annualGross * (sliders.houseRent / 100);
    const estMedical = annualGross * (sliders.medical / 100);
    const estConveyance = annualGross * (sliders.conveyance / 100);

    const exemptHR = Math.min(
      estHouseRent,
      basicSalary * TAX_EXEMPTIONS.houseRent.percentOfBasic,
      TAX_EXEMPTIONS.houseRent.limit
    );
    const exemptMed = Math.min(
      estMedical,
      basicSalary * TAX_EXEMPTIONS.medical.percentOfBasic,
      TAX_EXEMPTIONS.medical.limit
    );
    const exemptConv = Math.min(estConveyance, TAX_EXEMPTIONS.conveyance.limit);

    const totalExemptions = exemptHR + exemptMed + exemptConv;
    const taxableIncome = Math.max(0, annualGross - totalExemptions);

    return taxableIncome;
  }, [display, mode, sliders]);

  // Calculate rebates from investments
  const calculateRebates = useCallback((): number => {
    let totalRebate = 0;

    investments.forEach((inv) => {
      const amount = parseNumber(inv.amount);
      const annualAmount = mode === "monthly" ? amount * 12 : amount;

      if (annualAmount > 0) {
        let eligibleAmount = annualAmount;

        if (inv.limit !== null) {
          eligibleAmount = Math.min(annualAmount, inv.limit);
        }

        if (inv.rebateRate === 100) {
          totalRebate += eligibleAmount;
        } else {
          totalRebate += eligibleAmount * (inv.rebateRate / 100);
        }
      }
    });

    return totalRebate;
  }, [investments, mode]);

  const handleCalculate = useCallback(() => {
    const annualTaxableIncome = calculateAnnualTaxableIncome();
    const calculationResult = calculateTax(annualTaxableIncome);
    const rebates = calculateRebates();

    // Store gross tax before rebates
    setGrossTaxBeforeRebates(calculationResult.totalTax);

    // Apply rebates to tax
    const finalTax = Math.max(0, calculationResult.totalTax - rebates);

    setResult({
      ...calculationResult,
      totalTax: finalTax,
    });
    setIsCalculated(true);
  }, [calculateAnnualTaxableIncome, calculateRebates]);

  const handleNumberClick = (num: string) => {
    if (display === "0" || display === "75000") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setSliders({
      basic: 60,
      houseRent: 25,
      medical: 10,
      conveyance: 5,
    });
    setInvestments(INITIAL_INVESTMENTS.map(inv => ({ ...inv, amount: "" })));
    setIsCalculated(false);
    setResult(null);
    setGrossTaxBeforeRebates(0);
  };

  const handleModeChange = (newMode: "monthly" | "yearly") => {
    if (newMode === mode) return;

    const currentValue = parseNumber(display);
    if (newMode === "yearly") {
      setDisplay(String(currentValue * 12));
    } else {
      setDisplay(String(Math.round(currentValue / 12)));
    }

    setMode(newMode);
    // Auto-calculate will trigger due to mode/display change
  };

  // Auto-calculate when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (parseNumber(display) > 0) {
        handleCalculate();
      }
    }, 100); // 100ms debounce to prevent thrashing
    return () => clearTimeout(timer);
  }, [display, sliders, investments, mode, handleCalculate]);

  const handleSliderChange = (key: keyof typeof sliders, value: number) => {
    setSliders((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInvestmentChange = (id: number, value: string) => {
    setInvestments((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, amount: value.replace(/[^\d,]/g, "") } : inv
      )
    );
  };

  const formatMoney = useCallback((amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) return formatCurrencyLocalized(0, language);
    return formatCurrencyLocalized(amount, language);
  }, [language]);

  // Calculate display values for receipt in real-time
  const receiptData = useMemo(() => {
    const income = parseNumber(display);
    if (income <= 0) return null;

    const annualGross = mode === "monthly" ? income * 12 : income;
    const basicSalary = annualGross * (sliders.basic / 100);
    const estHouseRent = annualGross * (sliders.houseRent / 100);
    const estMedical = annualGross * (sliders.medical / 100);
    const estConveyance = annualGross * (sliders.conveyance / 100);

    const exemptHR = Math.min(
      estHouseRent,
      basicSalary * TAX_EXEMPTIONS.houseRent.percentOfBasic,
      TAX_EXEMPTIONS.houseRent.limit
    );
    const exemptMed = Math.min(
      estMedical,
      basicSalary * TAX_EXEMPTIONS.medical.percentOfBasic,
      TAX_EXEMPTIONS.medical.limit
    );
    const exemptConv = Math.min(estConveyance, TAX_EXEMPTIONS.conveyance.limit);

    const totalExemptions = exemptHR + exemptMed + exemptConv;
    const taxableIncome = Math.max(0, annualGross - totalExemptions);

    // Calculate tax in real-time
    const taxCalculation = calculateTax(taxableIncome);
    const grossTax = taxCalculation.totalTax;

    const rebates = calculateRebates();
    const finalTax = Math.max(0, grossTax - rebates);
    const divisor = mode === "monthly" ? 12 : 1;

    return {
      gross: annualGross / divisor,
      exemptions: totalExemptions / divisor,
      taxable: taxableIncome / divisor,
      grossTax: grossTax / divisor,
      rebates: rebates / divisor,
      payableTax: finalTax / divisor,
      netPay: (annualGross - finalTax) / divisor,
      effectiveRate: annualGross > 0 ? (finalTax / annualGross) * 100 : 0,
      breakdown: taxCalculation.breakdown,
      rebateBreakdown: investments
        .filter((inv) => {
          const amount = parseNumber(inv.amount);
          return amount > 0;
        })
        .map((inv) => {
          const amount = parseNumber(inv.amount);
          const annualAmount = mode === "monthly" ? amount * 12 : amount;
          let eligibleAmount = annualAmount;
          if (inv.limit !== null) {
            eligibleAmount = Math.min(annualAmount, inv.limit);
          }
          let rebate = 0;
          if (inv.rebateRate === 100) {
            rebate = eligibleAmount;
          } else {
            rebate = eligibleAmount * (inv.rebateRate / 100);
          }
          return {
            name: inv.name,
            amount: eligibleAmount / divisor,
            rebate: rebate / divisor,
            rate: inv.rebateRate,
          };
        }),
    };
  }, [display, mode, sliders, investments, calculateRebates, language]);

  const formatRate = (rate: number): string => {
    if (language === "bn") {
      return `${toBanglaNumber(rate)}%`;
    }
    return `${rate}%`;
  };

  // Set current time only on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <div className="tax-calculator">
      <div className="tax-calculator__main">
        {/* Calculator Interface */}
        <Card className="tax-calculator__input-card">
          <CardHeader>
            <CardTitle className="tax-calculator__card-title flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              {t.calculateYourTax}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display */}
            <div className="mb-6 w-full">
              <div className="tax-calculator__display font-mono w-full">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  {mode === "monthly" ? "Basic Monthly Salary" : "Basic Annual Salary"}
                </div>
                <div className="text-4xl font-semibold tabular-nums">
                  {formatNumberLocalized(parseNumber(display), language)}
                  <sup className="text-base font-normal ml-1">TAKA</sup>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex justify-center mt-4">
                <div className="tax-calculator__mode-toggle">
                  <button
                    onClick={() => handleModeChange("monthly")}
                    className={cn(
                      "tax-calculator__mode-toggle-btn",
                      mode === "monthly" && "tax-calculator__mode-toggle-btn--active"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => handleModeChange("yearly")}
                    className={cn(
                      "tax-calculator__mode-toggle-btn",
                      mode === "yearly" && "tax-calculator__mode-toggle-btn--active"
                    )}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>

            {/* Number Pad and Salary Mixer */}
            <div className="flex flex-col md:flex-row gap-12 mb-6 w-full">
              {/* Number Pad */}
              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-4 flex-1">
                {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className="tax-calculator__num-pad-btn flex items-center justify-center text-lg"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleNumberClick("0")}
                  className="tax-calculator__num-pad-btn flex items-center justify-center text-lg"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumberClick("00")}
                  className="tax-calculator__num-pad-btn flex items-center justify-center text-lg"
                >
                  00
                </button>
                <button
                  onClick={handleClear}
                  className="tax-calculator__num-pad-btn tax-calculator__clear-btn flex items-center justify-center text-lg"
                >
                  C
                </button>
              </div>

              {/* Salary Mixer */}
              {/* Salary Mixer */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-4">Salary Breakdown</h3>
                <div className="flex flex-col gap-5">
                  {Object.entries(sliders).map(([key, value]) => {
                    // Calculate ball position: value 0 = left (0%), value 80 = right (100%)
                    const percentage = (value / 80) * 100;

                    return (
                      <div key={key} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground capitalize font-medium">
                            {key === "houseRent" ? "House Rent" : key}
                          </span>
                          <span className="font-semibold tabular-nums">{value}%</span>
                        </div>
                        <div className="tax-calculator__slider-container">
                          {/* Track Background is handled by container via CSS */}
                          <div
                            className="tax-calculator__slider-progress"
                            style={{ width: `${percentage}%` }}
                          />
                          <div
                            className="tax-calculator__slider-ball"
                            style={{ left: `${percentage}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="80"
                            value={value}
                            onChange={(e) =>
                              handleSliderChange(key as keyof typeof sliders, parseFloat(e.target.value))
                            }
                            className="tax-calculator__slider-input"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="tax-calculator__note">{t.disclaimer}</p>

        {/* Tax Rates Table */}
        <Card className="tax-calculator__rates-card">
          <CardHeader>
            <div
              className="tax-calculator__rates-header"
              onClick={() => setIsRatesOpen(!isRatesOpen)}
            >
              <CardTitle className="tax-calculator__card-title">
                {t.taxRates}
              </CardTitle>
              <ChevronDown
                className={cn(
                  "tax-calculator__rates-chevron",
                  isRatesOpen && "tax-calculator__rates-chevron--open"
                )}
              />
            </div>
          </CardHeader>
          {isRatesOpen && (
            <CardContent>
              <div className="tax-calculator__rates-list">
                {TAX_BRACKETS_LOCALIZED[language].map((bracket, idx) => (
                  <div key={idx} className="tax-calculator__rates-item">
                    <div className="tax-calculator__rates-income">
                      {bracket.description}
                    </div>
                    <div className="tax-calculator__rates-rate">
                      {bracket.rate === 0 ? t.taxFree : formatRate(bracket.rate)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="tax-calculator__source">
                <span className="tax-calculator__source-label">
                  {t.taxRateSourceLabel}
                </span>
                <a
                  href="https://nbr.gov.bd/uploads/news-scroller/Nirdeshika_2025-26.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tax-calculator__source-link"
                >
                  {t.taxRateSourceValue}
                  <ArrowUpRight className="tax-calculator__source-icon" />
                </a>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Receipt Column */}
      <div className="tax-calculator__sidebar tax-calculator__sidebar--right">
        {receiptData ? (
          <Card className="tax-calculator__result-card">
            <CardContent>
              <div className="tax-receipt text-base space-y-3">
                {/* Receipt Header */}
                <div className="text-center border-b border-dashed border-black dark:border-border pb-3 mb-3">
                  <div className="font-bold text-base">TAX RECEIPT</div>
                  <div className="text-xs text-muted-foreground">FY {TAX_CONFIG.fiscalYear}</div>
                  {currentTime && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {currentTime}
                    </div>
                  )}
                </div>

                {/* Gross Income */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gross {mode === "monthly" ? "Mo." : "Yr."}:
                    </span>
                    <span className="font-semibold">{formatMoney(receiptData.gross)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Exemptions:</span>
                    <span className="font-semibold text-green-600 dark:text-green-500">-{formatMoney(receiptData.exemptions)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black dark:border-border pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Taxable:</span>
                    <span>{formatMoney(receiptData.taxable)}</span>
                  </div>
                </div>

                {/* Tax Slabs */}
                <div className="my-3">
                  <div className="text-xs text-muted-foreground mb-2 text-center uppercase tracking-wider">
                    Tax Slabs
                  </div>
                  {receiptData.breakdown.map((item, idx) => (
                    <div key={idx} className={`flex justify-between text-sm pb-1 ${idx < receiptData.breakdown.length - 1 ? 'border-b border-dashed border-gray-300 dark:border-gray-600 mb-1' : ''}`}>
                      <span className="text-muted-foreground">
                        {item.bracket.replace("First ", "").replace("Next ", "")} ({formatRate(item.rate)})
                      </span>
                      <span className={item.tax > 0 ? "font-semibold" : "text-muted-foreground"}>
                        {item.tax > 0 ? formatMoney(item.tax / (mode === "monthly" ? 12 : 1)) : "-"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-black dark:border-border pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Gross Tax:</span>
                    <span>{formatMoney(receiptData.grossTax)}</span>
                  </div>
                </div>

                {/* Rebates */}
                {receiptData.rebateBreakdown.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-xs text-muted-foreground mb-2 text-center uppercase tracking-wider">
                      Rebates
                    </div>
                    {receiptData.rebateBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground text-sm">
                        <span className="truncate mr-2">{item.name}</span>
                        <span className="font-semibold whitespace-nowrap">
                          -{formatMoney(item.rebate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mt-3 pt-2"></div>

                {/* Net Pay */}
                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Net Take Home:</span>
                    <span className="text-green-600 dark:text-green-500">{formatMoney(receiptData.netPay)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mt-3 pt-3"></div>

                {/* Tax Payable - Prominent Display */}
                <div className="mt-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {mode === "monthly" ? "Monthly" : "Yearly"} Tax Payable
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-500">{formatMoney(receiptData.payableTax)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Rate: {receiptData.effectiveRate.toFixed(2)}%
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <div className="h-px border-t border-dashed border-black dark:border-border mb-2"></div>
                  <div>Updated in Real-time</div>
                  <div className="mt-1 mb-6">Thank you!</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="tax-calculator__empty-card">
            <CardContent>
              <div className="tax-calculator__empty-state">
                <img 
                  src="/Assets/illus/empty_state.svg" 
                  alt="Empty state illustration" 
                  className="tax-calculator__empty-illustration mb-4"
                />
                <h3 className="tax-calculator__empty-title">{t.resultsWillAppearHere}</h3>
                <p className="tax-calculator__empty-text">{t.enterSalaryToCalculate}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
