# Perccent Unified Financial Calculator

A single, unified financial calculator web app covering SIP, Lumpsum, Step-up SIP, SWP, and EMI. Built with TypeScript, React, Next.js App Router, and pure Vanilla CSS.

Live at Vercel: [perccent-calculator.vercel.app](https://perccent-calculator.vercel.app)

---

## 1. Rate Conversion Formulations

Every calculation mode resolves periodic rates based on a compounding cadence and conversion method:

### Effective Rate Method (Default)
The effective annual interest rate \(r\) represents the actual annual yield. The monthly rate \(i\) is derived as:
\[i = (1 + r)^{1/m} - 1\]
where \(m\) is the compounding periods per year:
- Monthly compounding: \(m = 12\)
- Quarterly compounding: \(m = 4\)
- Annually compounding: \(m = 1\)
- Daily compounding: \(m = 365\)

To run a monthly simulation loop when compounding cadence drives a different period, we compute the equivalent monthly rate \(i_m\):
\[i_m = (1 + i)^{m/12} - 1\]
This guarantees the mathematical invariant:
\[(1 + i_m)^{12} = 1 + r \quad (\pm 1\times 10^{-9})\]

### Nominal Rate Method
The nominal annual interest rate \(r\) is divided simply by the number of compounding periods:
\[i = \frac{r}{m}\]
The equivalent monthly rate \(i_m\) for simulation loops is:
\[i_m = \left(1 + \frac{r}{m}\right)^{m/12} - 1\]

---

## 2. Calculation Engines

### 2.1 SIP & Step-up SIP
- **Closed Form** (flat SIP, annuity-due):
  \[FV = P \times \frac{(1 + i)^n - 1}{i} \times (1 + i)\]
  *(For ordinary annuity, drop the trailing \(1 + i\))*
- **Iterative Engine** (required when step-up, inflation, TER, exit load, or tax is enabled):
  For each month \(t = 1\) to \(n\):
  - **Annuity-due (begin-of-period)**: Balance is credited at start of month before compounding.
  - **Ordinary annuity (end-of-period)**: Balance compounds first, then contribution is credited.
  - **Step-up**: Escalates monthly contribution \(P\) by \(stepUpPct\) every 12 months (starts at month 13, 25, ...).

### 2.2 Lumpsum
- Single contribution \(P\) compounded over \(n\) periods:
  \[FV = P \times (1 + i)^n\]

### 2.3 SWP (Systematic Withdrawal Plan)
- **Iterative simulation**:
  For each month \(t = 1\) to \(n\):
  - **Begin-of-period**: Withdrawal \(W\) is deducted first, then outstanding balance compounds.
  - **End-of-period**: Outstanding balance compounds first, then withdrawal \(W\) is deducted.
  - If balance falls below \(W\), the withdrawal is capped at the remaining balance, and the corpus is depleted (balance = 0).
- **Longevity Solver**: Computes exactly which month the corpus drops to 0, or flags it as "never depletes" if growth \(\ge\) withdrawal.
- **Sustainable Withdrawal Solver**: Employs binary search to find the maximum monthly withdrawal \(W\) that sustains the corpus without depletion.

### 2.4 EMI (Loan Installment)
- **Reducing Balance Method** (Default):
  \[EMI = P \times \frac{R(1+R)^N}{(1+R)^N - 1}\]
  where \(R\) is the resolved monthly interest rate, and \(N\) is the total number of installments.
- **Flat Rate Method**:
  \[\text{Flat Interest} = P \times \frac{r}{100} \times \text{years}\]
  \[EMI = \frac{P + \text{FlatInterest}}{N}\]
- **Effective-rate gap solver**: Uses binary search to find the equivalent reducing interest rate that yields the same flat EMI, calculating the transparency rate gap.

---

## 3. Real-world Adjustment Layers

Layers are applied sequentially in the following order:
\[\text{TER} \longrightarrow \text{Growth} \longrightarrow \text{Exit Load (FIFO)} \longrightarrow \text{LTCG Tax} \longrightarrow \text{Inflation-Deflation}\]

1. **TER (Expense Ratio)**: Reduces the annual expected return before rate conversion:
   \[r_{\text{net}} = r - \text{TER}\]
2. **Exit Load**: Applies a one-time haircut percentage on the redemption value of any contributions held for less than the lock-in period (FIFO basis).
3. **LTCG Tax**: Deducts 12.5% tax on capital gains exceeding the ₹1.25L annual exemption at maturity.
4. **Inflation**: Deflates display figures to reflect purchasing power:
   \[\text{Real Value} = \frac{\text{Nominal Value}}{(1 + \text{inflation})^{\text{years}}}\]

---

## 4. Technical Architecture

- `/src/lib/calc/` - Standalone, framework-free TS module.
  - `rates.ts`: Rate methods and compounding conversions.
  - `adjustments.ts`: Adjustment layers (TER, Exit Load, LTCG, Inflation).
  - `sip.ts`: SIP and Step-up calculations.
  - `lumpsum.ts`: Lumpsum growth.
  - `swp.ts`: SWP depletion and solvers.
  - `emi.ts`: EMI schedules, prepayments, and rate gap solver.
- `/src/components/` - Custom UI elements (SVG Charts, Sliders, Tables, Math disclosures).
- `/src/utils/urlState.ts` - URL state serialization for deep-linking.

---

## 5. Development and Testing

Run unit tests via Node's native test runner (zero package configuration):
```bash
npm test
```

Run local development server:
```bash
npm run dev
```

Build production bundle:
```bash
npm run build
```
