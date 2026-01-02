import { TAX_CONFIG } from "@/config/tax-rates";
import type {
  TaxCalculationResult,
  TaxBreakdownItem,
  TaxConfig,
} from "@/types/tax";

/**
 * Calculate income tax based on the configured tax brackets
 *
 * @param annualIncome - The total annual taxable income in BDT
 * @param config - Optional tax configuration (defaults to current config)
 * @returns Tax calculation result with breakdown
 */
export function calculateTax(
  annualIncome: number,
  config: TaxConfig = TAX_CONFIG
): TaxCalculationResult {
  // Handle edge cases
  if (annualIncome <= 0) {
    return {
      annualIncome: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: [],
    };
  }

  const breakdown: TaxBreakdownItem[] = [];
  let remainingIncome = annualIncome;
  let previousLimit = 0;
  let totalTax = 0;

  for (const bracket of config.brackets) {
    if (remainingIncome <= 0) break;

    // Calculate the size of this bracket
    const bracketSize =
      bracket.upperLimit === null
        ? remainingIncome
        : bracket.upperLimit - previousLimit;

    // Calculate taxable amount in this bracket
    const taxableInThisBracket = Math.min(remainingIncome, bracketSize);

    // Calculate tax for this bracket
    const taxForBracket = (taxableInThisBracket * bracket.rate) / 100;

    // Only add to breakdown if there's taxable income in this bracket
    if (taxableInThisBracket > 0) {
      breakdown.push({
        bracket: bracket.description,
        taxableAmount: taxableInThisBracket,
        rate: bracket.rate,
        tax: taxForBracket,
      });
    }

    totalTax += taxForBracket;
    remainingIncome -= taxableInThisBracket;
    previousLimit = bracket.upperLimit ?? previousLimit;
  }

  // Calculate effective tax rate
  const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

  return {
    annualIncome,
    totalTax: Math.round(totalTax),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
  };
}

