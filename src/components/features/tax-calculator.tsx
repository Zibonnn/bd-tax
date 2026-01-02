"use client";

import { useState, useCallback, useMemo } from "react";
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

interface SalaryBreakdown {
  basic: string;
  houseRent: string;
  medical: string;
  conveyance: string;
  others: string;
}

const INITIAL_BREAKDOWN: SalaryBreakdown = {
  basic: "",
  houseRent: "",
  medical: "",
  conveyance: "",
  others: "",
};

export function TaxCalculator() {
  const { language, t } = useLanguage();
  const [monthlySalary, setMonthlySalary] = useState<string>("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState<SalaryBreakdown>(INITIAL_BREAKDOWN);
  const [result, setResult] = useState<TaxCalculationResult | null>(null);

  // Parse numeric value from string
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, "")) || 0;
  };

  // Calculate annual taxable income from inputs
  const calculateAnnualTaxableIncome = useCallback((): number => {
    if (showBreakdown) {
      const basic = parseNumber(breakdown.basic);
      const houseRent = parseNumber(breakdown.houseRent);
      const medical = parseNumber(breakdown.medical);
      const conveyance = parseNumber(breakdown.conveyance);
      const others = parseNumber(breakdown.others);

      // Annual amounts
      const annualBasic = basic * 12;
      const annualHouseRent = houseRent * 12;
      const annualMedical = medical * 12;
      const annualConveyance = conveyance * 12;
      const annualOthers = others * 12;

      // Tax exemptions (simplified Bangladesh rules)
      const houseRentExemption = Math.min(
        annualHouseRent,
        annualBasic * 0.5,
        300000
      );
      const medicalExemption = Math.min(
        annualMedical,
        annualBasic * 0.1,
        120000
      );
      const conveyanceExemption = Math.min(annualConveyance, 30000);

      const totalAnnualIncome =
        annualBasic + annualHouseRent + annualMedical + annualConveyance + annualOthers;

      const taxableIncome =
        totalAnnualIncome -
        houseRentExemption -
        medicalExemption -
        conveyanceExemption;

      return Math.max(0, taxableIncome);
    } else {
      return parseNumber(monthlySalary) * 12;
    }
  }, [showBreakdown, breakdown, monthlySalary]);

  const handleCalculate = useCallback(() => {
    const annualTaxableIncome = calculateAnnualTaxableIncome();
    const calculationResult = calculateTax(annualTaxableIncome);
    setResult(calculationResult);
  }, [calculateAnnualTaxableIncome]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setter(value);
  };

  const handleBreakdownChange = (
    field: keyof SalaryBreakdown,
    value: string
  ) => {
    setBreakdown((prev) => ({
      ...prev,
      [field]: value.replace(/[^\d,]/g, ""),
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCalculate();
    }
  };

  const handleClear = () => {
    setMonthlySalary("");
    setBreakdown(INITIAL_BREAKDOWN);
    setResult(null);
  };

  const toggleBreakdown = () => {
    setShowBreakdown((prev) => !prev);
    setResult(null);
  };

  const monthlyTax = useMemo(() => {
    if (result && result.totalTax > 0) {
      return Math.round(result.totalTax / 12);
    }
    return 0;
  }, [result]);

  const formatRate = (rate: number): string => {
    if (language === "bn") {
      return `${toBanglaNumber(rate)}%`;
    }
    return `${rate}%`;
  };

  const localizedBrackets = TAX_BRACKETS_LOCALIZED[language];

  return (
    <div className="tax-calculator">
      <Card className="tax-calculator__input-card">
        <CardHeader>
          <CardTitle className="tax-calculator__card-title">
            {t.calculateYourTax}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="tax-calculator__form">
            {!showBreakdown ? (
              <div className="tax-calculator__field">
                <Label htmlFor="salary" className="tax-calculator__label">
                  {t.yourMonthlySalary} ({t.perMonth})
                </Label>
                <Input
                  id="salary"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 50,000"
                  value={monthlySalary}
                  onChange={(e) => handleInputChange(e, setMonthlySalary)}
                  onKeyDown={handleKeyDown}
                  className="tax-calculator__input"
                />
                <span className="tax-calculator__field-hint">
                  {t.enterGrossMonthlySalary}
                </span>
              </div>
            ) : (
              <div className="tax-calculator__breakdown-fields">
                <p className="tax-calculator__breakdown-hint">
                  {t.enterMonthlyComponents}
                </p>
                <div className="tax-calculator__field">
                  <Label htmlFor="basic" className="tax-calculator__label">
                    {t.basicSalary} ({t.monthly})
                  </Label>
                  <Input
                    id="basic"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 30,000"
                    value={breakdown.basic}
                    onChange={(e) =>
                      handleBreakdownChange("basic", e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="tax-calculator__input"
                  />
                </div>
                <div className="tax-calculator__field">
                  <Label htmlFor="houseRent" className="tax-calculator__label">
                    {t.houseRentAllowance} ({t.monthly})
                  </Label>
                  <Input
                    id="houseRent"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 15,000"
                    value={breakdown.houseRent}
                    onChange={(e) =>
                      handleBreakdownChange("houseRent", e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="tax-calculator__input"
                  />
                </div>
                <div className="tax-calculator__field">
                  <Label htmlFor="medical" className="tax-calculator__label">
                    {t.medicalAllowance} ({t.monthly})
                  </Label>
                  <Input
                    id="medical"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 3,000"
                    value={breakdown.medical}
                    onChange={(e) =>
                      handleBreakdownChange("medical", e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="tax-calculator__input"
                  />
                </div>
                <div className="tax-calculator__field">
                  <Label htmlFor="conveyance" className="tax-calculator__label">
                    {t.conveyanceAllowance} ({t.monthly})
                  </Label>
                  <Input
                    id="conveyance"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 2,500"
                    value={breakdown.conveyance}
                    onChange={(e) =>
                      handleBreakdownChange("conveyance", e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="tax-calculator__input"
                  />
                </div>
                <div className="tax-calculator__field">
                  <Label htmlFor="others" className="tax-calculator__label">
                    {t.otherAllowances} ({t.monthly})
                  </Label>
                  <Input
                    id="others"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 5,000"
                    value={breakdown.others}
                    onChange={(e) =>
                      handleBreakdownChange("others", e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="tax-calculator__input"
                  />
                </div>
              </div>
            )}

            <div className="tax-calculator__footer">
              <button
                type="button"
                onClick={toggleBreakdown}
                className="tax-calculator__toggle-link"
              >
                {showBreakdown ? t.iOnlyKnowTotal : t.iKnowMyBreakdown}
              </button>

              <div className="tax-calculator__actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="tax-calculator__btn tax-calculator__btn--clear"
                >
                  {t.clear}
                </Button>
                <Button
                  type="button"
                  onClick={handleCalculate}
                  className="tax-calculator__btn"
                >
                  {t.calculateTax}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && result.annualIncome > 0 && (
        <Card className="tax-calculator__result-card">
          <CardHeader>
            <CardTitle className="tax-calculator__card-title">
              {t.yourTaxSummary}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tax-calculator__summary">
              <div className="tax-calculator__summary-item tax-calculator__summary-item--highlight">
                <span className="tax-calculator__summary-label">
                  {t.monthlyTax}
                </span>
                <span className="tax-calculator__summary-value">
                  {formatCurrencyLocalized(monthlyTax, language)}
                </span>
              </div>
              <div className="tax-calculator__summary-item">
                <span className="tax-calculator__summary-label">
                  {t.yearlyTax}
                </span>
                <span className="tax-calculator__summary-value">
                  {formatCurrencyLocalized(result.totalTax, language)}
                </span>
              </div>
              <div className="tax-calculator__summary-item">
                <span className="tax-calculator__summary-label">
                  {t.effectiveRate}
                </span>
                <span className="tax-calculator__summary-value">
                  {formatRate(result.effectiveRate)}
                </span>
              </div>
            </div>

            {result.breakdown.length > 0 && (
              <div className="tax-calculator__breakdown">
                <h3 className="tax-calculator__breakdown-title">
                  {t.howTaxCalculated}
                </h3>
                <p className="tax-calculator__breakdown-note">
                  {t.basedOnAnnualIncome} {formatCurrencyLocalized(result.annualIncome, language)}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.incomeSlab}</TableHead>
                      <TableHead className="text-right">{t.amount}</TableHead>
                      <TableHead className="text-right">{t.rate}</TableHead>
                      <TableHead className="text-right">{t.tax}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.breakdown.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {localizedBrackets[index]?.description || item.bracket}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumberLocalized(item.taxableAmount, language)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatRate(item.rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumberLocalized(item.tax, language)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>{t.totalYearlyTax}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyLocalized(result.totalTax, language)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="tax-calculator__rates-card">
        <CardHeader>
          <CardTitle className="tax-calculator__card-title">
            {t.taxRates} ({TAX_CONFIG.fiscalYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.yearlyIncome}</TableHead>
                <TableHead className="text-right">{t.taxRate}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localizedBrackets.map((bracket, index) => (
                <TableRow key={index}>
                  <TableCell>{bracket.description}</TableCell>
                  <TableCell className="text-right">
                    {bracket.rate === 0 ? t.taxFree : formatRate(bracket.rate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
