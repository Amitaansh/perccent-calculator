/**
 * Resolves periodic monthly rate based on compounding cadence and rate method
 *
 * @param annualRate Annual rate as percentage (e.g. 12 for 12%)
 * @param compounding Compounding cadence
 * @param method Rate conversion method
 * @returns Monthly rate as a decimal (e.g. 0.01 for 1% per month)
 */
export function getMonthlyRate(
  annualRate: number,
  compounding: 'monthly' | 'quarterly' | 'annually' | 'daily',
  method: 'effective' | 'nominal'
): number {
  if (annualRate === 0) return 0;
  
  const r = annualRate / 100;
  
  // m is periods per year
  let m = 12;
  if (compounding === 'quarterly') m = 4;
  else if (compounding === 'annually') m = 1;
  else if (compounding === 'daily') m = 365;

  // Rate per compounding period
  let ic = 0;
  if (method === 'effective') {
    ic = Math.pow(1 + r, 1 / m) - 1;
  } else {
    ic = r / m;
  }

  // Equivalent monthly rate (since loops run monthly)
  // (1 + im)^12 = (1 + ic)^m => im = (1 + ic)^(m / 12) - 1
  const im = Math.pow(1 + ic, m / 12) - 1;
  return im;
}

/**
 * Returns a human readable string of the calculation method used.
 */
export function getMethodLabel(
  compounding: 'monthly' | 'quarterly' | 'annually' | 'daily',
  method: 'effective' | 'nominal',
  timing?: 'begin' | 'end'
): string {
  const parts = [];
  parts.push(method === 'effective' ? 'Effective rate' : 'Nominal rate');
  parts.push(`${compounding} compounding`);
  if (timing) {
    parts.push(timing === 'begin' ? 'annuity-due' : 'ordinary annuity');
  }
  return parts.join(' • ');
}
