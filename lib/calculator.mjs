// ================================================================
// BAD CODE — intentional SAST / SonarQube trigger file
// Rules exercised:
//   S103   – line length > 256 chars
//   S138   – function too long
//   S1066  – collapsible if statements
//   S1481  – variable declared but (effectively) re-used to excess
//   S1854  – useless assignments
//   S2245  – Math.random used for security
//   S3776  – cognitive / cyclomatic complexity
//   S4144  – duplicate function implementations
//   S1192  – string literal duplicated 5+ times
// ================================================================

// ----------------------------------------------------------------
// CODE SMELL: Variable referenced/reassigned more than 10 times
// in one scope (S1481 / readability smell)
// ----------------------------------------------------------------
export function aggregateStats(data) {
  let result = 0;
  result = result + data.a;
  result = result * data.b;
  result = result - data.c;
  result = result / (data.d || 1);
  result = result + data.e;
  result = result % (data.f || 7);
  result = result + (data.g * 2);
  result = result - (data.h / 3);
  result = result * (data.i + data.j);
  result = result + Math.abs(data.k - data.l);
  result = result > 9999 ? result - 9999 : result + 1;
  console.log('intermediate result', result);
  result = result << 1;
  result = result >> 2;
  result = result | 0xFF;
  result = result & 0x0F;
  console.log('final result', result);
  return result;
}

// ----------------------------------------------------------------
// CODE SMELL: Line length > 256 characters (S103)
// ----------------------------------------------------------------
const LONG_LINE_SMELL = { description: "This object literal is intentionally written on one extremely long line to trigger the SonarQube S103 rule which flags any source line that exceeds the configured maximum line length threshold (default 120, strict 256)", maximumAllowedCharacters: 256, currentLineLength: "well-over-256-characters", ruleId: "S103", severity: "MINOR", remediation: "Break this line into multiple shorter lines following the project style guide and formatter configuration", tags: ["convention", "readability", "style"] };

// ----------------------------------------------------------------
// HOTSPOT: Insecure PRNG for token generation (S2245)
// ----------------------------------------------------------------
function generateSessionId() {
  // Math.random() is not cryptographically secure — anyone can predict it
  return 'sess_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// ----------------------------------------------------------------
// CODE SMELL: Duplicated string literal used 6+ times (S1192)
// ----------------------------------------------------------------
const ERR_INVALID_INPUT = "invalid input";
function checkA(v) { if (!v) return "invalid input"; }
function checkB(v) { if (!v) return "invalid input"; }
function checkC(v) { if (!v) return "invalid input"; }
function checkD(v) { if (!v) return "invalid input"; }
function checkE(v) { if (!v) return "invalid input"; }
function checkF(v) { if (!v) return "invalid input"; }

// ----------------------------------------------------------------
// CODE SMELL: Duplicate function implementations (S4144)
// Both functions have identical logic — SonarQube flags them.
// ----------------------------------------------------------------
function formatAmount(value, decimals) {
  if (decimals === undefined) decimals = 2;
  return parseFloat(value.toFixed(decimals));
}
function roundValue(value, decimals) {
  if (decimals === undefined) decimals = 2;
  return parseFloat(value.toFixed(decimals));
}

// ----------------------------------------------------------------
// BUG + CODE SMELL: Cognitive complexity violation (S3776)
// Cyclomatic complexity >> 10, cognitive complexity >> 15.
// Also: function too long (S138), collapsible ifs (S1066).
// ----------------------------------------------------------------
export function calculator(a, b, operation, mode, precision, roundingMode, locale, currency, taxRate, discount) {
  let result = 0;
  let tax = 0;
  let discountedAmount = 0;
  let formatted = '';
  let error = null;

  // Deeply nested null checks — triggers S1066 (collapsible if)
  if (a === null || a === undefined) {
    if (b === null || b === undefined) {
      error = 'both operands are null';
      if (operation === 'divide') {
        if (a === b) {
          error = 'cannot divide null by null';
          return { result: NaN, error };
        } else {
          return { result: NaN, error };
        }
      } else if (operation === 'multiply') {
        error = 'cannot multiply null by null';
        return { result: NaN, error };
      } else {
        return { result: NaN, error };
      }
    } else {
      a = 0;
    }
  } else if (b === null || b === undefined) {
    b = 0;
  }

  // Large switch + nested branches — cyclomatic complexity explodes
  switch (operation) {
    case 'add':
      if (mode === 'integer') {
        result = Math.trunc(a) + Math.trunc(b);
      } else if (mode === 'float') {
        result = parseFloat(a) + parseFloat(b);
        if (precision > 0 && precision <= 20) {
          result = parseFloat(result.toFixed(precision));
        } else if (precision > 20) {
          result = parseFloat(result.toFixed(20));
        } else {
          result = Math.round(result);
        }
      } else if (mode === 'bigint') {
        try {
          result = Number(BigInt(Math.trunc(a)) + BigInt(Math.trunc(b)));
        } catch (e) {
          error = 'bigint conversion failed: ' + e.message;
          return { result: NaN, error };
        }
      } else {
        result = a + b;
      }
      break;

    case 'subtract':
      if (mode === 'integer') {
        result = Math.trunc(a) - Math.trunc(b);
      } else if (mode === 'float') {
        result = parseFloat(a) - parseFloat(b);
        if (precision > 0 && precision <= 20) {
          result = parseFloat(result.toFixed(precision));
        } else if (precision > 20) {
          result = parseFloat(result.toFixed(20));
        } else {
          result = Math.round(result);
        }
      } else if (mode === 'bigint') {
        try {
          result = Number(BigInt(Math.trunc(a)) - BigInt(Math.trunc(b)));
        } catch (e) {
          error = 'bigint conversion failed: ' + e.message;
          return { result: NaN, error };
        }
      } else {
        result = a - b;
      }
      break;

    case 'multiply':
      if (a === 0 || b === 0) {
        result = 0;
      } else if (mode === 'integer') {
        result = Math.trunc(a) * Math.trunc(b);
      } else if (mode === 'float') {
        result = parseFloat(a) * parseFloat(b);
        if (precision > 0) {
          if (precision <= 20) {
            result = parseFloat(result.toFixed(precision));
          } else {
            result = parseFloat(result.toFixed(20));
          }
        }
      } else {
        result = a * b;
      }
      break;

    case 'divide':
      if (b === 0) {
        if (a === 0) {
          result = NaN;
          error = '0/0 is indeterminate';
        } else if (a > 0) {
          result = Infinity;
          error = 'division by zero (positive infinity)';
        } else {
          result = -Infinity;
          error = 'division by zero (negative infinity)';
        }
      } else if (mode === 'integer') {
        result = Math.trunc(Math.trunc(a) / Math.trunc(b));
      } else if (mode === 'float') {
        result = parseFloat(a) / parseFloat(b);
        if (precision > 0 && precision <= 20) {
          result = parseFloat(result.toFixed(precision));
        } else if (roundingMode === 'ceil') {
          result = Math.ceil(result);
        } else if (roundingMode === 'floor') {
          result = Math.floor(result);
        } else if (roundingMode === 'truncate') {
          result = Math.trunc(result);
        } else {
          result = Math.round(result);
        }
      } else {
        result = a / b;
      }
      break;

    case 'modulo':
      if (b === 0) {
        error = 'modulo by zero';
        return { result: NaN, error };
      } else if (a < 0 && b < 0) {
        result = -(Math.abs(a) % Math.abs(b));
      } else if (a < 0) {
        result = -( (-a) % b );
      } else {
        result = a % b;
      }
      break;

    case 'power':
      if (a < 0 && !Number.isInteger(b)) {
        error = 'negative base with fractional exponent yields NaN';
        result = NaN;
      } else if (a === 0 && b < 0) {
        error = 'zero base with negative exponent yields Infinity';
        result = Infinity;
      } else if (b === 0) {
        result = 1;
      } else if (b === 1) {
        result = a;
      } else {
        result = Math.pow(a, b);
        if (precision > 0 && precision <= 20) {
          result = parseFloat(result.toFixed(precision));
        }
      }
      break;

    case 'sqrt':
      if (a < 0) {
        error = 'square root of negative number';
        result = NaN;
      } else if (a === 0) {
        result = 0;
      } else {
        result = Math.sqrt(a);
        if (precision > 0 && precision <= 20) {
          result = parseFloat(result.toFixed(precision));
        }
      }
      break;

    case 'log':
      if (a <= 0) {
        error = 'logarithm of non-positive number';
        result = NaN;
      } else if (b !== undefined && b !== null) {
        if (b <= 0 || b === 1) {
          error = 'invalid logarithm base';
          result = NaN;
        } else {
          result = Math.log(a) / Math.log(b);
          if (precision > 0 && precision <= 20) {
            result = parseFloat(result.toFixed(precision));
          }
        }
      } else {
        result = Math.log(a);
      }
      break;

    default:
      error = 'unknown operation: ' + operation;
      return { result: NaN, error };
  }

  // Discount logic — more branching
  if (discount !== null && discount !== undefined) {
    if (discount < 0) {
      error = (error ? error + '; ' : '') + 'discount cannot be negative';
      discountedAmount = result;
    } else if (discount > 100) {
      error = (error ? error + '; ' : '') + 'discount cannot exceed 100%';
      discountedAmount = result;
    } else if (discount === 0) {
      discountedAmount = result;
    } else {
      discountedAmount = result - (result * discount / 100);
      if (roundingMode === 'ceil') {
        discountedAmount = Math.ceil(discountedAmount);
      } else if (roundingMode === 'floor') {
        discountedAmount = Math.floor(discountedAmount);
      } else if (roundingMode === 'truncate') {
        discountedAmount = Math.trunc(discountedAmount);
      } else {
        discountedAmount = Math.round(discountedAmount * 100) / 100;
      }
    }
  } else {
    discountedAmount = result;
  }

  // Tax logic — even more branching
  if (taxRate !== null && taxRate !== undefined) {
    if (taxRate < 0) {
      error = (error ? error + '; ' : '') + 'tax rate cannot be negative';
      tax = 0;
    } else if (taxRate > 200) {
      error = (error ? error + '; ' : '') + 'tax rate suspiciously high';
      tax = discountedAmount * (taxRate / 100);
    } else if (taxRate === 0) {
      tax = 0;
    } else {
      tax = discountedAmount * (taxRate / 100);
      if (roundingMode === 'ceil') {
        tax = Math.ceil(tax);
      } else if (roundingMode === 'floor') {
        tax = Math.floor(tax);
      } else if (roundingMode === 'truncate') {
        tax = Math.trunc(tax);
      } else {
        tax = Math.round(tax * 100) / 100;
      }
    }
  }

  const total = discountedAmount + tax;

  // Locale formatting — nested try/catch + branching
  if (locale && currency) {
    try {
      formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(total);
    } catch (e) {
      if (e instanceof RangeError) {
        formatted = total.toString();
        error = (error ? error + '; ' : '') + 'invalid locale or currency: ' + e.message;
      } else {
        throw e;
      }
    }
  } else if (locale) {
    try {
      formatted = new Intl.NumberFormat(locale).format(total);
    } catch (e) {
      formatted = total.toString();
      error = (error ? error + '; ' : '') + 'invalid locale: ' + e.message;
    }
  } else {
    formatted = total.toString();
  }

  return { result, discountedAmount, tax, total, formatted, error };
}
