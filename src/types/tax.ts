/**
 * Represents a single tax bracket with its threshold and rate
 */
export interface TaxBracket {
  /** Upper limit of this bracket in BDT (null for the last bracket) */
  upperLimit: number | null;
  /** Tax rate as a percentage (e.g., 5 for 5%) */
  rate: number;
  /** Human-readable description of this bracket */
  description: string;
}

/**
 * Represents the complete tax configuration for a fiscal year
 */
export interface TaxConfig {
  /** Fiscal year identifier (e.g., "2024-2025") */
  fiscalYear: string;
  /** Array of tax brackets in ascending order of income */
  brackets: TaxBracket[];
  /** Currency code */
  currency: string;
}

/**
 * Result of a tax calculation showing breakdown by bracket
 */
export interface TaxCalculationResult {
  /** Total annual taxable income */
  annualIncome: number;
  /** Total tax payable */
  totalTax: number;
  /** Effective tax rate as a percentage */
  effectiveRate: number;
  /** Breakdown of tax by each bracket */
  breakdown: TaxBreakdownItem[];
}

/**
 * Tax calculation breakdown for a single bracket
 */
export interface TaxBreakdownItem {
  /** Description of the bracket */
  bracket: string;
  /** Income amount taxed in this bracket */
  taxableAmount: number;
  /** Tax rate applied */
  rate: number;
  /** Tax amount for this bracket */
  tax: number;
}

