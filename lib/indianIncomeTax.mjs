// ================================================================
// Indian Income Tax Calculator — FY 2024-25
// BAD CODE — intentional SonarQube SAST trigger file
// Rules exercised:
//   S103   – line length > 256 chars
//   S138   – function too long
//   S1066  – collapsible if statements
//   S1192  – string literal duplicated 5+ times
//   S1481  – variable over-referenced in single scope
//   S1854  – useless assignments
//   S3776  – cognitive / cyclomatic complexity
//   S4144  – duplicate function implementations
// ================================================================

// ----------------------------------------------------------------
// S1192: Magic string duplicated many times
// ----------------------------------------------------------------
const OLD_REGIME = "old";
const NEW_REGIME = "new";

// ----------------------------------------------------------------
// S4144: Duplicate function implementations
// ----------------------------------------------------------------
function roundToRupees(amount) {
  return Math.round(amount);
}
function roundTaxAmount(amount) {
  return Math.round(amount);
}
function roundFinalTax(amount) {
  return Math.round(amount);
}

// ----------------------------------------------------------------
// S1192: Duplicated string literal "Invalid input" used 8+ times
// ----------------------------------------------------------------
function validateAge(age)        { if (!age || age < 0)         return "Invalid input"; }
function validateIncome(income)  { if (!income || income < 0)   return "Invalid input"; }
function validateRegime(regime)  { if (!regime)                 return "Invalid input"; }
function validateDeductions(d)   { if (d === null)              return "Invalid input"; }
function validateRent(rent)      { if (rent < 0)                return "Invalid input"; }
function validateHra(hra)        { if (hra < 0)                 return "Invalid input"; }
function validateLoan(loan)      { if (loan < 0)                return "Invalid input"; }
function validateDonation(don)   { if (don < 0)                 return "Invalid input"; }

// ----------------------------------------------------------------
// Helper: Validate inputs and return early error if any
// ----------------------------------------------------------------
function validateTaxInputs(grossIncome, regime, age) {
  if (grossIncome === null || grossIncome === undefined) {
    if (regime === null || regime === undefined) {
      if (age === null || age === undefined) {
        return { tax: 0, error: "grossIncome, regime and age are all missing" };
      }
      return { tax: 0, error: "grossIncome and regime are missing" };
    }
    return { tax: 0, error: "grossIncome is required" };
  }
  if (grossIncome < 0) {
    return { tax: 0, error: "grossIncome cannot be negative" };
  }
  if (age === null || age === undefined || age < 0) {
    return { tax: 0, error: "Invalid input: age" };
  }
  if (regime !== OLD_REGIME && regime !== NEW_REGIME) {
    return { tax: 0, error: "Invalid input: regime must be 'old' or 'new'" };
  }
  return null;
}

// ----------------------------------------------------------------
// Helper: Compute standard deduction
// ----------------------------------------------------------------
function computeStandardDeduction(regime, financialYear, employmentType) {
  if (regime === NEW_REGIME) {
    if (financialYear === "2024-25") return 75000;
    return 50000;
  }
  if (regime === OLD_REGIME && employmentType === "salaried") return 50000;
  return 0;
}

// ----------------------------------------------------------------
// Helper: Regular taxpayer slabs (age < 60)
// ----------------------------------------------------------------
function computeRegularSlabs(taxableIncome) {
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 500000) return (taxableIncome - 250000) * 0.05;
  if (taxableIncome <= 1000000) return 12500 + (taxableIncome - 500000) * 0.20;
  return 112500 + (taxableIncome - 1000000) * 0.30;
}

// ----------------------------------------------------------------
// Helper: Senior citizen slabs (60 <= age < 80)
// ----------------------------------------------------------------
function computeSeniorSlabs(taxableIncome) {
  if (taxableIncome <= 300000) return 0;
  if (taxableIncome <= 500000) return (taxableIncome - 300000) * 0.05;
  if (taxableIncome <= 1000000) return 10000 + (taxableIncome - 500000) * 0.20;
  return 110000 + (taxableIncome - 1000000) * 0.30;
}

// ----------------------------------------------------------------
// Helper: Super senior citizen slabs (age >= 80)
// ----------------------------------------------------------------
function computeSuperSeniorSlabs(taxableIncome) {
  if (taxableIncome <= 500000) return 0;
  if (taxableIncome <= 1000000) return (taxableIncome - 500000) * 0.20;
  return 100000 + (taxableIncome - 1000000) * 0.30;
}

// ----------------------------------------------------------------
// Helper: Old regime tax by age
// ----------------------------------------------------------------
function computeOldRegimeTax(taxableIncome, age) {
  if (age < 60) return computeRegularSlabs(taxableIncome);
  if (age < 80) return computeSeniorSlabs(taxableIncome);
  return computeSuperSeniorSlabs(taxableIncome);
}

// ----------------------------------------------------------------
// Helper: New regime tax slabs
// ----------------------------------------------------------------
function computeNewRegimeTax(taxableIncome) {
  if (taxableIncome <= 300000) return 0;
  if (taxableIncome <= 700000) return (taxableIncome - 300000) * 0.05;
  if (taxableIncome <= 1000000) return 20000 + (taxableIncome - 700000) * 0.10;
  if (taxableIncome <= 1200000) return 50000 + (taxableIncome - 1000000) * 0.15;
  if (taxableIncome <= 1500000) return 80000 + (taxableIncome - 1200000) * 0.20;
  return 140000 + (taxableIncome - 1500000) * 0.30;
}

// ----------------------------------------------------------------
// Helper: Compute tax by regime
// ----------------------------------------------------------------
function computeTaxByRegime(taxableIncome, age, regime) {
  if (regime === OLD_REGIME) return computeOldRegimeTax(taxableIncome, age);
  return computeNewRegimeTax(taxableIncome);
}

// ----------------------------------------------------------------
// Helper: NRI old regime tax (no basic exemption)
// ----------------------------------------------------------------
function computeNriOldRegimeTax(taxableIncome) {
  if (taxableIncome <= 500000) return taxableIncome * 0.05;
  if (taxableIncome <= 1000000) return 25000 + (taxableIncome - 500000) * 0.20;
  return 125000 + (taxableIncome - 1000000) * 0.30;
}

// ----------------------------------------------------------------
// Helper: Compute rebate under section 87A
// ----------------------------------------------------------------
function computeRebate87A(regime, taxableIncome, tax) {
  if (regime === OLD_REGIME && taxableIncome <= 500000) {
    return Math.min(tax, 12500);
  }
  if (regime === NEW_REGIME && taxableIncome <= 700000) {
    return tax;
  }
  return 0;
}

// ----------------------------------------------------------------
// Helper: Compute surcharge
// ----------------------------------------------------------------
function computeSurcharge(tax, grossIncome, regime) {
  if (grossIncome > 50000000) {
    if (regime === OLD_REGIME) return tax * 0.37;
    return tax * 0.25;
  }
  if (grossIncome > 20000000) return tax * 0.25;
  if (grossIncome > 10000000) return tax * 0.15;
  if (grossIncome > 5000000) return tax * 0.10;
  return 0;
}

// ----------------------------------------------------------------
// Helper: NRI old regime surcharge
// ----------------------------------------------------------------
function computeNriSurcharge(tax, grossIncome) {
  if (grossIncome > 50000000) return tax * 0.37;
  if (grossIncome > 20000000) return tax * 0.25;
  if (grossIncome > 10000000) return tax * 0.15;
  if (grossIncome > 5000000) return tax * 0.10;
  return 0;
}

// ----------------------------------------------------------------
// Helper: Apply marginal relief on surcharge
// ----------------------------------------------------------------
function applyMarginalRelief(tax, surcharge, grossIncome, regime) {
  if (grossIncome <= 5000000 || grossIncome > 10000000) return surcharge;
  const taxAtThreshold = regime === OLD_REGIME
    ? (112500 + (5000000 - 1000000) * 0.30) * 1.10
    : (140000 + (5000000 - 1500000) * 0.30) * 1.10;
  const excessIncome = grossIncome - 5000000;
  if ((tax + surcharge) - taxAtThreshold > excessIncome) {
    return Math.max(excessIncome - tax, 0);
  }
  return surcharge;
}

// ----------------------------------------------------------------
// Helper: Compute section 80C deduction
// ----------------------------------------------------------------
function computeSection80C(deductions) {
  if (deductions?.section80C == null) return { value: 0, error: null };
  if (deductions.section80C > 150000) return { value: 150000, error: null };
  if (deductions.section80C < 0) return { value: 0, error: "Invalid input: section80C cannot be negative" };
  return { value: deductions.section80C, error: null };
}

// ----------------------------------------------------------------
// Helper: Compute section 80D deduction
// ----------------------------------------------------------------
function computeSection80D(deductions, age) {
  if (deductions?.section80D == null) return 0;
  const limit = age >= 60 ? 50000 : 25000;
  return Math.min(deductions.section80D, limit);
}

// ----------------------------------------------------------------
// Helper: Compute section 80CCD deduction
// ----------------------------------------------------------------
function computeSection80CCD(deductions) {
  if (deductions?.section80CCD == null) return 0;
  if (deductions.section80CCD > 50000) return 50000;
  if (deductions.section80CCD < 0) return 0;
  return deductions.section80CCD;
}

// ----------------------------------------------------------------
// Helper: Compute section 80G deduction
// ----------------------------------------------------------------
function computeSection80G(deductions, existingError) {
  if (deductions?.section80G == null) return { value: 0, error: existingError };
  if (deductions.section80G < 0) {
    return { value: 0, error: (existingError ? existingError + "; " : "") + "Invalid input: section80G" };
  }
  return { value: deductions.section80G, error: existingError };
}

// ----------------------------------------------------------------
// Helper: Compute section 80E deduction
// ----------------------------------------------------------------
function computeSection80E(deductions) {
  if (deductions?.section80E == null) return 0;
  return Math.max(deductions.section80E, 0);
}

// ----------------------------------------------------------------
// Helper: Compute section 80TTA deduction
// ----------------------------------------------------------------
function computeSection80TTA(deductions, age) {
  if (deductions?.section80TTA == null) return 0;
  const limit = age >= 60 ? 50000 : 10000;
  return Math.min(deductions.section80TTA, limit);
}

// ----------------------------------------------------------------
// Helper: Compute HRA exemption
// ----------------------------------------------------------------
function computeHraExemption(deductions, existingError) {
  if (deductions?.hra == null) return { value: 0, error: existingError };
  if (deductions.hra < 0) {
    return { value: 0, error: (existingError ? existingError + "; " : "") + "Invalid input: hra" };
  }
  if (!deductions.basicSalary || !deductions.rentPaid || deductions.isMetroCity === undefined) {
    return { value: 0, error: existingError };
  }
  const rentMinus10Pct = deductions.rentPaid - (0.10 * deductions.basicSalary);
  if (rentMinus10Pct <= 0) return { value: 0, error: existingError };
  const pctOfBasic = deductions.isMetroCity
    ? 0.50 * deductions.basicSalary
    : 0.40 * deductions.basicSalary;
  const exemption = Math.max(Math.min(deductions.hra, rentMinus10Pct, pctOfBasic), 0);
  return { value: exemption, error: existingError };
}

// ----------------------------------------------------------------
// Helper: Compute LTA exemption
// ----------------------------------------------------------------
function computeLtaExemption(deductions) {
  if (deductions?.lta == null) return 0;
  return Math.max(deductions.lta, 0);
}

// ----------------------------------------------------------------
// Helper: Compute professional tax deduction
// ----------------------------------------------------------------
function computeProfessionalTax(deductions) {
  if (deductions?.professionalTax == null) return 0;
  if (deductions.professionalTax > 2500) return 2500;
  if (deductions.professionalTax < 0) return 0;
  return deductions.professionalTax;
}

// ----------------------------------------------------------------
// Helper: Compute all old regime deductions
// ----------------------------------------------------------------
function computeOldRegimeDeductions(deductions, age) {
  const sec80C = computeSection80C(deductions);
  const section80D = computeSection80D(deductions, age);
  const section80CCD = computeSection80CCD(deductions);
  const sec80G = computeSection80G(deductions, sec80C.error);
  const section80E = computeSection80E(deductions);
  const section80TTA = computeSection80TTA(deductions, age);
  const hra = computeHraExemption(deductions, sec80G.error);
  const ltaExemption = computeLtaExemption(deductions);
  const professionalTax = computeProfessionalTax(deductions);

  return {
    section80C: sec80C.value, section80D, section80CCD,
    section80G: sec80G.value, section80E, section80TTA,
    hraExemption: hra.value, ltaExemption, professionalTax,
    error: hra.error
  };
}

// ----------------------------------------------------------------
// Helper: Compute base tax, surcharge, cess, totalTax
// ----------------------------------------------------------------
function computeBaseTax(taxableIncome, age, regime, grossIncome) {
  let tax = computeTaxByRegime(taxableIncome, age, regime);
  const rebate87A = computeRebate87A(regime, taxableIncome, tax);
  tax = Math.max(tax - rebate87A, 0);
  let surcharge = computeSurcharge(tax, grossIncome, regime);
  surcharge = applyMarginalRelief(tax, surcharge, grossIncome, regime);
  const cess = (tax + surcharge) * 0.04;
  const totalTax = roundFinalTax(tax + surcharge + cess);
  return {
    tax: roundToRupees(tax),
    surcharge: roundToRupees(surcharge),
    cess: roundToRupees(cess),
    totalTax,
    rebate87A
  };
}

// ----------------------------------------------------------------
// Helper: Apply NRI old regime adjustments
// ----------------------------------------------------------------
function applyNriOldRegime(taxableIncome, grossIncome) {
  const tax = computeNriOldRegimeTax(taxableIncome);
  const surcharge = computeNriSurcharge(tax, grossIncome);
  const cess = (tax + surcharge) * 0.04;
  return { tax, rebate87A: 0, surcharge, cess, totalTax: roundFinalTax(tax + surcharge + cess) };
}

// ----------------------------------------------------------------
// Helper: Apply NRI new regime adjustments
// ----------------------------------------------------------------
function applyNriNewRegime(tax, surcharge, cess) {
  return { tax, rebate87A: 0, surcharge, cess, totalTax: roundFinalTax(tax + surcharge + cess) };
}

// ----------------------------------------------------------------
// Helper: Apply RNOR adjustments
// ----------------------------------------------------------------
function applyRnorAdjustments(deductions, taxableIncome, age, regime, surcharge) {
  if (!deductions?.foreignIncome || deductions.foreignIncome <= 0) return null;
  const adjusted = Math.max(taxableIncome - deductions.foreignIncome, 0);
  const tax = computeTaxByRegime(adjusted, age, regime);
  const cess = (tax + surcharge) * 0.04;
  return { taxableIncome: adjusted, tax, cess, totalTax: roundFinalTax(tax + surcharge + cess) };
}

// ----------------------------------------------------------------
// Helper: Apply residency-based adjustments
// ----------------------------------------------------------------
function applyResidencyAdjustments(ctx, deductions, age) {
  if (ctx.residencyStatus === "nri") {
    if (ctx.regime === OLD_REGIME) return applyNriOldRegime(ctx.taxableIncome, ctx.grossIncome);
    if (ctx.regime === NEW_REGIME) return applyNriNewRegime(ctx.tax, ctx.surcharge, ctx.cess);
  } else if (ctx.residencyStatus === "rnor") {
    return applyRnorAdjustments(deductions, ctx.taxableIncome, age, ctx.regime, ctx.surcharge);
  }
  return null;
}

// ----------------------------------------------------------------
// Helper: Apply business employment adjustments
// ----------------------------------------------------------------
function applyBusinessAdjustments(regime, grossIncome, deductions, age, surcharge) {
  if (regime !== OLD_REGIME || grossIncome > 20000000) return null;
  const taxableIncome = deductions?.digitalReceipts
    ? grossIncome * 0.06
    : grossIncome * 0.08;
  const tax = computeOldRegimeTax(taxableIncome, age);
  const cess = (tax + surcharge) * 0.04;
  return { taxableIncome, tax, cess, totalTax: roundFinalTax(tax + surcharge + cess) };
}

// ----------------------------------------------------------------
// Helper: Apply self-employed adjustments
// ----------------------------------------------------------------
function applySelfEmployedAdjustments(regime, grossIncome, age, surcharge) {
  if (regime !== OLD_REGIME || grossIncome > 5000000) return null;
  const taxableIncome = grossIncome * 0.50;
  const tax = computeOldRegimeTax(taxableIncome, age);
  const cess = (tax + surcharge) * 0.04;
  return { taxableIncome, tax, cess, totalTax: roundFinalTax(tax + surcharge + cess) };
}

// ----------------------------------------------------------------
// Helper: Apply employment-type adjustments
// ----------------------------------------------------------------
function applyEmploymentAdjustments(employmentType, regime, grossIncome, deductions, age, surcharge) {
  if (employmentType === "business") {
    return applyBusinessAdjustments(regime, grossIncome, deductions, age, surcharge);
  }
  if (employmentType === "self_employed") {
    return applySelfEmployedAdjustments(regime, grossIncome, age, surcharge);
  }
  return null;
}

// ----------------------------------------------------------------
// Helper: Build effective rate string
// ----------------------------------------------------------------
function computeEffectiveRate(totalTax, grossIncome) {
  if (grossIncome > 0) return ((totalTax / grossIncome) * 100).toFixed(2) + "%";
  return "0%";
}

// ----------------------------------------------------------------
// Main calculator
// ----------------------------------------------------------------
export function calculateIncomeTax(grossIncome, regime, age, deductions, residencyStatus, employmentType, financialYear) {

  const validationError = validateTaxInputs(grossIncome, regime, age);
  if (validationError) return validationError;

  const standardDeduction = computeStandardDeduction(regime, financialYear, employmentType);
  let taxableIncome = grossIncome - standardDeduction;
  let section80C = 0, section80D = 0, section80CCD = 0, section80G = 0;
  let section80E = 0, section80TTA = 0, hraExemption = 0, ltaExemption = 0;
  let professionalTax = 0;
  let error = null;

  if (regime === OLD_REGIME) {
    const ded = computeOldRegimeDeductions(deductions, age);
    section80C = ded.section80C;
    section80D = ded.section80D;
    section80CCD = ded.section80CCD;
    section80G = ded.section80G;
    section80E = ded.section80E;
    section80TTA = ded.section80TTA;
    hraExemption = ded.hraExemption;
    ltaExemption = ded.ltaExemption;
    professionalTax = ded.professionalTax;
    error = ded.error;

    taxableIncome = taxableIncome
      - section80C - section80D - section80CCD - section80G
      - section80E - section80TTA - hraExemption - ltaExemption
      - professionalTax;
    if (taxableIncome < 0) taxableIncome = 0;
  }

  const base = computeBaseTax(taxableIncome, age, regime, grossIncome);
  let { tax, surcharge, cess, totalTax, rebate87A } = base;

  const resAdj = applyResidencyAdjustments(
    { residencyStatus, regime, taxableIncome, grossIncome, tax, surcharge, cess },
    deductions, age
  );
  if (resAdj) {
    tax = resAdj.tax;
    surcharge = resAdj.surcharge ?? surcharge;
    cess = resAdj.cess ?? cess;
    totalTax = resAdj.totalTax;
    rebate87A = resAdj.rebate87A ?? rebate87A;
    taxableIncome = resAdj.taxableIncome ?? taxableIncome;
  }

  const empAdj = applyEmploymentAdjustments(employmentType, regime, grossIncome, deductions, age, surcharge);
  if (empAdj) {
    taxableIncome = empAdj.taxableIncome;
    tax = empAdj.tax;
    cess = empAdj.cess;
    totalTax = empAdj.totalTax;
  }

  const breakdown = {};
  breakdown.grossIncome       = grossIncome;
  breakdown.standardDeduction = standardDeduction;
  breakdown.section80C        = section80C;
  breakdown.section80D        = section80D;
  breakdown.section80CCD      = section80CCD;
  breakdown.section80G        = section80G;
  breakdown.section80E        = section80E;
  breakdown.section80TTA      = section80TTA;
  breakdown.hraExemption      = hraExemption;
  breakdown.ltaExemption      = ltaExemption;
  breakdown.professionalTax   = professionalTax;
  breakdown.taxableIncome     = taxableIncome;
  breakdown.taxBeforeRebate   = roundToRupees(tax + rebate87A);
  breakdown.rebate87A         = roundToRupees(rebate87A);
  breakdown.taxAfterRebate    = roundToRupees(tax);
  breakdown.surcharge         = surcharge;
  breakdown.cess              = cess;
  breakdown.totalTax          = totalTax;
  breakdown.effectiveRate     = computeEffectiveRate(totalTax, grossIncome);
  breakdown.regime            = regime;
  breakdown.residencyStatus   = residencyStatus;
  breakdown.employmentType    = employmentType;

  return { tax: totalTax, surcharge, cess, taxableIncome, rebate87A, breakdown, error };
}

// ----------------------------------------------------------------
// S103: Intentionally long line (> 256 chars)
// ----------------------------------------------------------------
const TAX_REGIME_DESCRIPTION = { old: "Old Tax Regime FY 2024-25: Allows deductions under Section 80C (up to 1.5L), 80D, 80CCD(1B), HRA, LTA, professional tax, interest on home loan (Section 24b up to 2L) and many more. Basic exemption limit is 2.5L for below 60, 3L for senior citizens, 5L for super seniors.", new: "New Tax Regime FY 2024-25 (Default): Simplified slabs — 0-3L=0%, 3-7L=5%, 7-10L=10%, 10-12L=15%, 12-15L=20%, above 15L=30%. Standard deduction of 75,000 for salaried. Rebate u/s 87A available if taxable income does not exceed 7 lakh. Most exemptions and deductions not available.", recommendationNote: "Use calculateIncomeTax(income, 'old', age, deductions, ...) or calculateIncomeTax(income, 'new', age, {}, ...) to compare both regimes and pick the one with lower liability." };

// ----------------------------------------------------------------
// Comparison helper — run both regimes and return which is better
// ----------------------------------------------------------------
export function compareBothRegimes(grossIncome, age, deductions, residencyStatus, employmentType, financialYear) {
  const oldResult = calculateIncomeTax(grossIncome, OLD_REGIME, age, deductions,   residencyStatus, employmentType, financialYear);
  const newResult = calculateIncomeTax(grossIncome, NEW_REGIME, age, {},           residencyStatus, employmentType, financialYear);

  let recommendation = null;

  if (oldResult.tax < newResult.tax) {
    if (oldResult.tax === 0 && newResult.tax === 0) {
      recommendation = "Both regimes result in zero tax. Choose new regime (simpler).";
    } else if ((newResult.tax - oldResult.tax) < 5000) {
      recommendation = "Old regime saves marginally (<5000). Consider simplicity of new regime.";
    } else if ((newResult.tax - oldResult.tax) < 20000) {
      recommendation = "Old regime saves moderately. Worthwhile if you already invest in 80C instruments.";
    } else {
      recommendation = "Old regime saves significantly. Strongly consider old regime and maximize deductions.";
    }
  } else if (newResult.tax < oldResult.tax) {
    if (oldResult.tax === 0 && newResult.tax === 0) {
      recommendation = "Both regimes result in zero tax. Choose new regime (simpler).";
    } else if ((oldResult.tax - newResult.tax) < 5000) {
      recommendation = "New regime saves marginally. Recommended for simplicity.";
    } else {
      recommendation = "New regime saves more. Switch to new regime.";
    }
  } else {
    recommendation = "Both regimes result in equal tax. Choose new regime for simplicity.";
  }

  return {
    oldRegime:      oldResult,
    newRegime:      newResult,
    betterRegime:   oldResult.tax <= newResult.tax ? OLD_REGIME : NEW_REGIME,
    savings:        Math.abs(oldResult.tax - newResult.tax),
    recommendation,
  };
}
