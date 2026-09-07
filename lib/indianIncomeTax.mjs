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
// S1481 / S1854: 'tax' variable re-assigned excessively
// S3776 / S138 / S1066: The main calculator — enormous complexity
//
// Parameters:
//   grossIncome       – Annual gross salary in INR
//   regime            – "old" | "new"
//   age               – Taxpayer age (determines slab for old regime)
//   deductions        – Object with all Section-wise deductions
//   residencyStatus   – "resident" | "nri" | "rnor"
//   employmentType    – "salaried" | "self_employed" | "business"
//   financialYear     – "2024-25" | "2023-24"
// ----------------------------------------------------------------
export function calculateIncomeTax(grossIncome, regime, age, deductions, residencyStatus, employmentType, financialYear) {

  // S1854: useless initial assignment immediately overwritten below
  let tax = 0;
  let surcharge = 0;
  let cess = 0;
  let totalTax = 0;
  let taxableIncome = 0;
  let standardDeduction = 0;
  let section80C = 0;
  let section80D = 0;
  let section80CCD = 0;
  let section80G = 0;
  let section80E = 0;
  let section80TTA = 0;
  let hraExemption = 0;
  let ltaExemption = 0;
  let professionalTax = 0;
  let rebate87A = 0;
  let error = null;
  let breakdown = {};

  // ----------------------------------------------------------------
  // S1066: Collapsible null / undefined guards — deeply nested
  // ----------------------------------------------------------------
  if (grossIncome === null || grossIncome === undefined) {
    if (regime === null || regime === undefined) {
      if (age === null || age === undefined) {
        error = "grossIncome, regime and age are all missing";
        return { tax: 0, error };
      } else {
        error = "grossIncome and regime are missing";
        return { tax: 0, error };
      }
    } else {
      error = "grossIncome is required";
      return { tax: 0, error };
    }
  } else if (grossIncome < 0) {
    error = "grossIncome cannot be negative";
    return { tax: 0, error };
  }

  if (age === null || age === undefined || age < 0) {
    error = "Invalid input: age";
    return { tax: 0, error };
  }

  if (regime !== OLD_REGIME && regime !== NEW_REGIME) {
    error = "Invalid input: regime must be 'old' or 'new'";
    return { tax: 0, error };
  }

  // ----------------------------------------------------------------
  // Standard deduction
  // ----------------------------------------------------------------
  if (regime === NEW_REGIME) {
    if (financialYear === "2024-25") {
      standardDeduction = 75000;
    } else if (financialYear === "2023-24") {
      standardDeduction = 50000;
    } else {
      standardDeduction = 50000;
    }
  } else if (regime === OLD_REGIME) {
    if (employmentType === "salaried") {
      standardDeduction = 50000;
    } else if (employmentType === "self_employed") {
      standardDeduction = 0;
    } else {
      standardDeduction = 0;
    }
  }

  taxableIncome = grossIncome - standardDeduction;

  // ----------------------------------------------------------------
  // OLD REGIME: Section-wise deductions
  // ----------------------------------------------------------------
  if (regime === OLD_REGIME) {

    // Section 80C
    if (deductions && deductions.section80C !== null && deductions.section80C !== undefined) {
      if (deductions.section80C > 150000) {
        section80C = 150000;
      } else if (deductions.section80C < 0) {
        error = "Invalid input: section80C cannot be negative";
        section80C = 0;
      } else {
        section80C = deductions.section80C;
      }
    }

    // Section 80D — health insurance premium
    if (deductions && deductions.section80D !== null && deductions.section80D !== undefined) {
      if (age >= 60) {
        if (deductions.section80D > 50000) {
          section80D = 50000;
        } else {
          section80D = deductions.section80D;
        }
      } else {
        if (deductions.section80D > 25000) {
          section80D = 25000;
        } else {
          section80D = deductions.section80D;
        }
      }
    }

    // Section 80CCD(1B) — NPS additional
    if (deductions && deductions.section80CCD !== null && deductions.section80CCD !== undefined) {
      if (deductions.section80CCD > 50000) {
        section80CCD = 50000;
      } else if (deductions.section80CCD < 0) {
        section80CCD = 0;
      } else {
        section80CCD = deductions.section80CCD;
      }
    }

    // Section 80G — donations
    if (deductions && deductions.section80G !== null && deductions.section80G !== undefined) {
      if (deductions.section80G < 0) {
        error = (error ? error + "; " : "") + "Invalid input: section80G";
        section80G = 0;
      } else {
        section80G = deductions.section80G;
      }
    }

    // Section 80E — education loan interest
    if (deductions && deductions.section80E !== null && deductions.section80E !== undefined) {
      if (deductions.section80E < 0) {
        section80E = 0;
      } else {
        section80E = deductions.section80E;  // no upper limit
      }
    }

    // Section 80TTA — savings account interest (< 60 yrs: max 10k; >= 60: under 80TTB)
    if (deductions && deductions.section80TTA !== null && deductions.section80TTA !== undefined) {
      if (age >= 60) {
        if (deductions.section80TTA > 50000) {
          section80TTA = 50000;
        } else {
          section80TTA = deductions.section80TTA;
        }
      } else {
        if (deductions.section80TTA > 10000) {
          section80TTA = 10000;
        } else {
          section80TTA = deductions.section80TTA;
        }
      }
    }

    // HRA exemption — min of three values
    if (deductions && deductions.hra !== null && deductions.hra !== undefined) {
      if (deductions.hra < 0) {
        error = (error ? error + "; " : "") + "Invalid input: hra";
      } else if (deductions.basicSalary && deductions.rentPaid && deductions.isMetroCity !== undefined) {
        const hraReceived    = deductions.hra;
        const rentMinus10Pct = deductions.rentPaid - (0.10 * deductions.basicSalary);
        const pctOfBasic     = deductions.isMetroCity
          ? 0.50 * deductions.basicSalary
          : 0.40 * deductions.basicSalary;
        if (rentMinus10Pct <= 0) {
          hraExemption = 0;
        } else {
          hraExemption = Math.min(hraReceived, rentMinus10Pct, pctOfBasic);
          if (hraExemption < 0) hraExemption = 0;
        }
      }
    }

    // LTA — Leave Travel Allowance (flat cap per block of 2 years)
    if (deductions && deductions.lta !== null && deductions.lta !== undefined) {
      if (deductions.lta < 0) {
        ltaExemption = 0;
      } else {
        ltaExemption = deductions.lta;
      }
    }

    // Professional tax
    if (deductions && deductions.professionalTax !== null && deductions.professionalTax !== undefined) {
      if (deductions.professionalTax > 2500) {
        professionalTax = 2500;
      } else if (deductions.professionalTax < 0) {
        professionalTax = 0;
      } else {
        professionalTax = deductions.professionalTax;
      }
    }

    taxableIncome = taxableIncome
      - section80C
      - section80D
      - section80CCD
      - section80G
      - section80E
      - section80TTA
      - hraExemption
      - ltaExemption
      - professionalTax;

    if (taxableIncome < 0) taxableIncome = 0;
  }

  // ----------------------------------------------------------------
  // S3776: TAX SLAB COMPUTATION — massive nested branching
  // Old regime slabs differ by age (< 60, 60–80, > 80)
  // ----------------------------------------------------------------
  if (regime === OLD_REGIME) {

    if (age < 60) {
      // Regular taxpayer slabs FY 2024-25
      if (taxableIncome <= 250000) {
        tax = 0;
      } else if (taxableIncome <= 500000) {
        tax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 112500 + (taxableIncome - 1000000) * 0.30;
      }
    } else if (age >= 60 && age < 80) {
      // Senior citizen slabs
      if (taxableIncome <= 300000) {
        tax = 0;
      } else if (taxableIncome <= 500000) {
        tax = (taxableIncome - 300000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 10000 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 110000 + (taxableIncome - 1000000) * 0.30;
      }
    } else if (age >= 80) {
      // Super senior citizen slabs
      if (taxableIncome <= 500000) {
        tax = 0;
      } else if (taxableIncome <= 1000000) {
        tax = (taxableIncome - 500000) * 0.20;
      } else {
        tax = 100000 + (taxableIncome - 1000000) * 0.30;
      }
    }

    // 87A rebate — old regime: up to 12500 if taxable income <= 5L
    if (taxableIncome <= 500000) {
      if (tax <= 12500) {
        rebate87A = tax;
      } else {
        rebate87A = 12500;
      }
    }

  } else if (regime === NEW_REGIME) {
    // S103: intentionally long line below
    // New regime slabs FY 2024-25 (post-Budget): 0-3L=0%, 3-7L=5%, 7-10L=10%, 10-12L=15%, 12-15L=20%, >15L=30%
    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 700000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 20000 + (taxableIncome - 700000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      tax = 50000 + (taxableIncome - 1000000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 80000 + (taxableIncome - 1200000) * 0.20;
    } else {
      tax = 140000 + (taxableIncome - 1500000) * 0.30;
    }

    // 87A rebate — new regime: full rebate if taxable income <= 7L
    if (taxableIncome <= 700000) {
      rebate87A = tax;
    } else {
      rebate87A = 0;
    }
  }

  tax = tax - rebate87A;
  if (tax < 0) tax = 0;

  // ----------------------------------------------------------------
  // Surcharge — S3776: more branching on income level + regime
  // ----------------------------------------------------------------
  if (grossIncome > 5000000 && grossIncome <= 10000000) {
    if (regime === OLD_REGIME) {
      surcharge = tax * 0.10;
    } else if (regime === NEW_REGIME) {
      surcharge = tax * 0.10;
    }
  } else if (grossIncome > 10000000 && grossIncome <= 20000000) {
    if (regime === OLD_REGIME) {
      surcharge = tax * 0.15;
    } else if (regime === NEW_REGIME) {
      surcharge = tax * 0.15;
    }
  } else if (grossIncome > 20000000 && grossIncome <= 50000000) {
    if (regime === OLD_REGIME) {
      surcharge = tax * 0.25;
    } else if (regime === NEW_REGIME) {
      surcharge = tax * 0.25;  // capped at 25% in new regime
    }
  } else if (grossIncome > 50000000) {
    if (regime === OLD_REGIME) {
      surcharge = tax * 0.37;
    } else if (regime === NEW_REGIME) {
      surcharge = tax * 0.25;  // new regime surcharge capped at 25%
    }
  } else {
    surcharge = 0;
  }

  // Marginal relief on surcharge
  if (grossIncome > 5000000 && grossIncome <= 10000000) {
    const taxAtThreshold = regime === OLD_REGIME
      ? (112500 + (5000000 - 1000000) * 0.30) * 1.10
      : (140000 + (5000000 - 1500000) * 0.30) * 1.10;
    const excessIncome = grossIncome - 5000000;
    if ((tax + surcharge) - taxAtThreshold > excessIncome) {
      surcharge = excessIncome - tax;
      if (surcharge < 0) surcharge = 0;
    }
  }

  // ----------------------------------------------------------------
  // Health & Education Cess — 4% on (tax + surcharge)
  // ----------------------------------------------------------------
  cess = (tax + surcharge) * 0.04;

  totalTax = roundFinalTax(tax + surcharge + cess);
  tax      = roundToRupees(tax);
  surcharge = roundToRupees(surcharge);
  cess      = roundToRupees(cess);

  // ----------------------------------------------------------------
  // Residency-based adjustments — NRIs don't get 87A rebate or
  // basic exemption limit for old regime
  // ----------------------------------------------------------------
  if (residencyStatus === "nri") {
    if (regime === OLD_REGIME) {
      // NRI — no basic exemption, recompute from 0
      if (taxableIncome <= 500000) {
        tax = taxableIncome * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 25000 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 125000 + (taxableIncome - 1000000) * 0.30;
      }
      rebate87A = 0;
      surcharge = 0;
      if (grossIncome > 5000000 && grossIncome <= 10000000) {
        surcharge = tax * 0.10;
      } else if (grossIncome > 10000000 && grossIncome <= 20000000) {
        surcharge = tax * 0.15;
      } else if (grossIncome > 20000000 && grossIncome <= 50000000) {
        surcharge = tax * 0.25;
      } else if (grossIncome > 50000000) {
        surcharge = tax * 0.37;
      }
      cess = (tax + surcharge) * 0.04;
      totalTax = roundFinalTax(tax + surcharge + cess);
    } else if (regime === NEW_REGIME) {
      // NRI on new regime — same slabs, no rebate 87A
      rebate87A = 0;
      tax = tax + rebate87A;  // S1854: useless re-add after subtracting 0
      totalTax = roundFinalTax(tax + surcharge + cess);
    }
  } else if (residencyStatus === "rnor") {
    // RNOR — resident but not ordinarily resident; foreign income not taxed
    if (deductions && deductions.foreignIncome && deductions.foreignIncome > 0) {
      taxableIncome = taxableIncome - deductions.foreignIncome;
      if (taxableIncome < 0) taxableIncome = 0;
      // Recompute tax on adjusted taxable income
      if (regime === OLD_REGIME) {
        if (age < 60) {
          if (taxableIncome <= 250000) {
            tax = 0;
          } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 250000) * 0.05;
          } else if (taxableIncome <= 1000000) {
            tax = 12500 + (taxableIncome - 500000) * 0.20;
          } else {
            tax = 112500 + (taxableIncome - 1000000) * 0.30;
          }
        } else if (age >= 60 && age < 80) {
          if (taxableIncome <= 300000) {
            tax = 0;
          } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 300000) * 0.05;
          } else if (taxableIncome <= 1000000) {
            tax = 10000 + (taxableIncome - 500000) * 0.20;
          } else {
            tax = 110000 + (taxableIncome - 1000000) * 0.30;
          }
        } else {
          if (taxableIncome <= 500000) {
            tax = 0;
          } else if (taxableIncome <= 1000000) {
            tax = (taxableIncome - 500000) * 0.20;
          } else {
            tax = 100000 + (taxableIncome - 1000000) * 0.30;
          }
        }
      } else if (regime === NEW_REGIME) {
        if (taxableIncome <= 300000) {
          tax = 0;
        } else if (taxableIncome <= 700000) {
          tax = (taxableIncome - 300000) * 0.05;
        } else if (taxableIncome <= 1000000) {
          tax = 20000 + (taxableIncome - 700000) * 0.10;
        } else if (taxableIncome <= 1200000) {
          tax = 50000 + (taxableIncome - 1000000) * 0.15;
        } else if (taxableIncome <= 1500000) {
          tax = 80000 + (taxableIncome - 1200000) * 0.20;
        } else {
          tax = 140000 + (taxableIncome - 1500000) * 0.30;
        }
      }
      cess = (tax + surcharge) * 0.04;
      totalTax = roundFinalTax(tax + surcharge + cess);
    }
  }

  // ----------------------------------------------------------------
  // Employment-type adjustments — business income: presumptive taxation
  // ----------------------------------------------------------------
  if (employmentType === "business") {
    if (regime === OLD_REGIME) {
      if (grossIncome <= 20000000) {
        // Section 44AD: 8% of turnover deemed profit (6% for digital receipts)
        if (deductions && deductions.digitalReceipts) {
          taxableIncome = grossIncome * 0.06;
        } else {
          taxableIncome = grossIncome * 0.08;
        }
        // Recompute tax on presumptive income
        if (age < 60) {
          if (taxableIncome <= 250000) {
            tax = 0;
          } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 250000) * 0.05;
          } else if (taxableIncome <= 1000000) {
            tax = 12500 + (taxableIncome - 500000) * 0.20;
          } else {
            tax = 112500 + (taxableIncome - 1000000) * 0.30;
          }
        } else if (age >= 60 && age < 80) {
          if (taxableIncome <= 300000) {
            tax = 0;
          } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 300000) * 0.05;
          } else if (taxableIncome <= 1000000) {
            tax = 10000 + (taxableIncome - 500000) * 0.20;
          } else {
            tax = 110000 + (taxableIncome - 1000000) * 0.30;
          }
        } else {
          if (taxableIncome <= 500000) {
            tax = 0;
          } else if (taxableIncome <= 1000000) {
            tax = (taxableIncome - 500000) * 0.20;
          } else {
            tax = 100000 + (taxableIncome - 1000000) * 0.30;
          }
        }
        cess = (tax + surcharge) * 0.04;
        totalTax = roundFinalTax(tax + surcharge + cess);
      }
    }
  } else if (employmentType === "self_employed") {
    // Self-employed: Section 44ADA — 50% of gross receipts deemed profit (professions)
    if (regime === OLD_REGIME) {
      if (grossIncome <= 5000000) {
        taxableIncome = grossIncome * 0.50;
        if (age < 60) {
          if (taxableIncome <= 250000) {
            tax = 0;
          } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 250000) * 0.05;
          } else if (taxableIncome <= 1000000) {
            tax = 12500 + (taxableIncome - 500000) * 0.20;
          } else {
            tax = 112500 + (taxableIncome - 1000000) * 0.30;
          }
        } else if (age >= 60 && age < 80) {
          if (taxableIncome <= 300000) {
            tax = 0;
          } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 300000) * 0.05;
          } else if (taxableIncome <= 1000000) {
            tax = 10000 + (taxableIncome - 500000) * 0.20;
          } else {
            tax = 110000 + (taxableIncome - 1000000) * 0.30;
          }
        } else {
          if (taxableIncome <= 500000) {
            tax = 0;
          } else if (taxableIncome <= 1000000) {
            tax = (taxableIncome - 500000) * 0.20;
          } else {
            tax = 100000 + (taxableIncome - 1000000) * 0.30;
          }
        }
        cess = (tax + surcharge) * 0.04;
        totalTax = roundFinalTax(tax + surcharge + cess);
      }
    }
  }

  // ----------------------------------------------------------------
  // Build breakdown object — S1481: 'breakdown' re-assigned many times
  // ----------------------------------------------------------------
  breakdown = {};
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
  breakdown.effectiveRate     = grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(2) + "%" : "0%";
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
