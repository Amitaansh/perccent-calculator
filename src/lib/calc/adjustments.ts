export interface AdjustmentParams {
  inflationEnabled: boolean;
  inflationRate: number; // e.g. 6 for 6% p.a.
  terEnabled: boolean;
  terRate: number; // e.g. 1 for 1% p.a.
  exitLoadEnabled: boolean;
  exitLoadRate: number; // e.g. 1 for 1%
  exitLoadLockInMonths: number; // e.g. 12 months
  ltcgEnabled: boolean;
  ltcgExemption: number; // e.g. 125000 (FY25-26 rules)
  ltcgRate: number; // e.g. 12.5 for 12.5%
}

export const defaultAdjustments: AdjustmentParams = {
  inflationEnabled: false,
  inflationRate: 6,
  terEnabled: false,
  terRate: 1.5,
  exitLoadEnabled: false,
  exitLoadRate: 1.0,
  exitLoadLockInMonths: 12,
  ltcgEnabled: false,
  ltcgExemption: 125000,
  ltcgRate: 12.5
};

/**
 * Calculates exit load on a series of contributions at maturity.
 * Uses FIFO basis.
 *
 * @param contributionValues Array of final compounded values of each contribution at maturity
 * @param tenureMonths Total months of the investment
 * @param lockInMonths Lock in period in months
 * @param exitLoadRate Exit load as percentage (e.g. 1 for 1%)
 * @returns Total exit load paid
 */
export function calculateExitLoad(
  contributionValues: number[],
  tenureMonths: number,
  lockInMonths: number,
  exitLoadRate: number
): number {
  let exitLoadPaid = 0;
  const numContributions = contributionValues.length;
  
  for (let i = 0; i < numContributions; i++) {
    // Month index of contribution is i + 1 (1-indexed)
    const contributionMonth = i + 1;
    const monthsHeld = tenureMonths - contributionMonth + 1;
    
    if (monthsHeld < lockInMonths) {
      exitLoadPaid += contributionValues[i] * (exitLoadRate / 100);
    }
  }
  
  return exitLoadPaid;
}

/**
 * Calculates LTCG tax based on total gains.
 *
 * @param gains Total gains (Maturity Value after exit load - Invested)
 * @param exemption Exemption amount (e.g. 125000)
 * @param taxRate Tax rate percentage (e.g. 12.5)
 * @returns Total tax paid
 */
export function calculateLTCG(
  gains: number,
  exemption: number = 125000,
  taxRate: number = 12.5
): number {
  if (gains <= exemption) return 0;
  return (gains - exemption) * (taxRate / 100);
}

/**
 * Adjusts a nominal value for inflation to get the real value.
 * Formula: real = nominal / (1 + inflation)^years
 *
 * @param nominalValue Nominal value
 * @param inflationRate Inflation rate percentage (e.g. 6 for 6%)
 * @param years Number of years
 * @returns Real value
 */
export function getRealValue(
  nominalValue: number,
  inflationRate: number,
  years: number
): number {
  return nominalValue / Math.pow(1 + inflationRate / 100, years);
}
