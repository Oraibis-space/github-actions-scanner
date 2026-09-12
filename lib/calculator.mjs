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

function appendError(existing, message) {
  return (existing ? existing + '; ' : '') + message;
}

function applyRounding(value, roundingMode) {
  if (roundingMode === 'ceil') {
    return Math.ceil(value);
  }
  if (roundingMode === 'floor') {
    return Math.floor(value);
  }
  if (roundingMode === 'truncate') {
    return Math.trunc(value);
  }
  return Math.round(value);
}

function applyFloatPrecision(result, precision) {
  if (precision > 0 && precision <= 20) {
    return parseFloat(result.toFixed(precision));
  }
  if (precision > 20) {
    return parseFloat(result.toFixed(20));
  }
  return Math.round(result);
}

function handleNullOperands(a, b, operation) {
  if (a !== null && a !== undefined) {
    return { a, b: (b === null || b === undefined) ? 0 : b, error: null, earlyReturn: null };
  }
  if (b !== null && b !== undefined) {
    return { a: 0, b, error: null, earlyReturn: null };
  }
  let error = 'both operands are null';
  if (operation === 'divide') {
    if (a === b) {
      error = 'cannot divide null by null';
    }
    return { a, b, error, earlyReturn: { result: NaN, error } };
  }
  if (operation === 'multiply') {
    error = 'cannot multiply null by null';
  }
  return { a, b, error, earlyReturn: { result: NaN, error } };
}

function computeAdd(a, b, mode, precision) {
  if (mode === 'integer') {
    return { result: Math.trunc(a) + Math.trunc(b), error: null };
  }
  if (mode === 'float') {
    return { result: applyFloatPrecision(parseFloat(a) + parseFloat(b), precision), error: null };
  }
  if (mode === 'bigint') {
    try {
      return { result: Number(BigInt(Math.trunc(a)) + BigInt(Math.trunc(b))), error: null };
    } catch (e) {
      return { result: NaN, error: 'bigint conversion failed: ' + e.message, earlyReturn: true };
    }
  }
  return { result: a + b, error: null };
}

function computeSubtract(a, b, mode, precision) {
  if (mode === 'integer') {
    return { result: Math.trunc(a) - Math.trunc(b), error: null };
  }
  if (mode === 'float') {
    return { result: applyFloatPrecision(parseFloat(a) - parseFloat(b), precision), error: null };
  }
  if (mode === 'bigint') {
    try {
      return { result: Number(BigInt(Math.trunc(a)) - BigInt(Math.trunc(b))), error: null };
    } catch (e) {
      return { result: NaN, error: 'bigint conversion failed: ' + e.message, earlyReturn: true };
    }
  }
  return { result: a - b, error: null };
}

function computeMultiply(a, b, mode, precision) {
  if (a === 0 || b === 0) {
    return { result: 0, error: null };
  }
  if (mode === 'integer') {
    return { result: Math.trunc(a) * Math.trunc(b), error: null };
  }
  if (mode === 'float') {
    let result = parseFloat(a) * parseFloat(b);
    if (precision > 0) {
      result = parseFloat(result.toFixed(Math.min(precision, 20)));
    }
    return { result, error: null };
  }
  return { result: a * b, error: null };
}

function computeDivideByZero(a) {
  if (a === 0) {
    return { result: NaN, error: '0/0 is indeterminate' };
  }
  if (a > 0) {
    return { result: Infinity, error: 'division by zero (positive infinity)' };
  }
  return { result: -Infinity, error: 'division by zero (negative infinity)' };
}

function computeDivide(a, b, mode, precision, roundingMode) {
  if (b === 0) {
    return computeDivideByZero(a);
  }
  if (mode === 'integer') {
    return { result: Math.trunc(Math.trunc(a) / Math.trunc(b)), error: null };
  }
  if (mode === 'float') {
    let result = parseFloat(a) / parseFloat(b);
    if (precision > 0 && precision <= 20) {
      result = parseFloat(result.toFixed(precision));
    } else {
      result = applyRounding(result, roundingMode);
    }
    return { result, error: null };
  }
  return { result: a / b, error: null };
}

function computeModulo(a, b) {
  if (b === 0) {
    return { result: NaN, error: 'modulo by zero', earlyReturn: true };
  }
  if (a < 0 && b < 0) {
    return { result: -(Math.abs(a) % Math.abs(b)), error: null };
  }
  if (a < 0) {
    return { result: -((-a) % b), error: null };
  }
  return { result: a % b, error: null };
}

function computePower(a, b, precision) {
  if (a < 0 && !Number.isInteger(b)) {
    return { result: NaN, error: 'negative base with fractional exponent yields NaN' };
  }
  if (a === 0 && b < 0) {
    return { result: Infinity, error: 'zero base with negative exponent yields Infinity' };
  }
  if (b === 0) {
    return { result: 1, error: null };
  }
  if (b === 1) {
    return { result: a, error: null };
  }
  let result = Math.pow(a, b);
  if (precision > 0 && precision <= 20) {
    result = parseFloat(result.toFixed(precision));
  }
  return { result, error: null };
}

function computeSqrt(a, precision) {
  if (a < 0) {
    return { result: NaN, error: 'square root of negative number' };
  }
  if (a === 0) {
    return { result: 0, error: null };
  }
  let result = Math.sqrt(a);
  if (precision > 0 && precision <= 20) {
    result = parseFloat(result.toFixed(precision));
  }
  return { result, error: null };
}

function computeLog(a, b, precision) {
  if (a <= 0) {
    return { result: NaN, error: 'logarithm of non-positive number' };
  }
  if (b === undefined || b === null) {
    return { result: Math.log(a), error: null };
  }
  if (b <= 0 || b === 1) {
    return { result: NaN, error: 'invalid logarithm base' };
  }
  let result = Math.log(a) / Math.log(b);
  if (precision > 0 && precision <= 20) {
    result = parseFloat(result.toFixed(precision));
  }
  return { result, error: null };
}

function computeOperation(a, b, operation, mode, precision, roundingMode) {
  switch (operation) {
    case 'add':
      return computeAdd(a, b, mode, precision);
    case 'subtract':
      return computeSubtract(a, b, mode, precision);
    case 'multiply':
      return computeMultiply(a, b, mode, precision);
    case 'divide':
      return computeDivide(a, b, mode, precision, roundingMode);
    case 'modulo':
      return computeModulo(a, b);
    case 'power':
      return computePower(a, b, precision);
    case 'sqrt':
      return computeSqrt(a, precision);
    case 'log':
      return computeLog(a, b, precision);
    default:
      return { result: NaN, error: 'unknown operation: ' + operation, earlyReturn: true };
  }
}

function calcDiscount(result, discount, roundingMode) {
  if (discount === null || discount === undefined || discount === 0) {
    return { discountedAmount: result, error: null };
  }
  if (discount < 0) {
    return { discountedAmount: result, error: 'discount cannot be negative' };
  }
  if (discount > 100) {
    return { discountedAmount: result, error: 'discount cannot exceed 100%' };
  }
  let discountedAmount = result - (result * discount / 100);
  if (roundingMode === 'ceil' || roundingMode === 'floor' || roundingMode === 'truncate') {
    discountedAmount = applyRounding(discountedAmount, roundingMode);
  } else {
    discountedAmount = Math.round(discountedAmount * 100) / 100;
  }
  return { discountedAmount, error: null };
}

function calcTax(discountedAmount, taxRate, roundingMode) {
  if (taxRate === null || taxRate === undefined || taxRate === 0) {
    return { tax: 0, error: null };
  }
  if (taxRate < 0) {
    return { tax: 0, error: 'tax rate cannot be negative' };
  }
  if (taxRate > 200) {
    return { tax: discountedAmount * (taxRate / 100), error: 'tax rate suspiciously high' };
  }
  let tax = discountedAmount * (taxRate / 100);
  if (roundingMode === 'ceil' || roundingMode === 'floor' || roundingMode === 'truncate') {
    tax = applyRounding(tax, roundingMode);
  } else {
    tax = Math.round(tax * 100) / 100;
  }
  return { tax, error: null };
}

function formatTotal(total, locale, currency) {
  if (locale && currency) {
    try {
      return { formatted: new Intl.NumberFormat(locale, { style: 'currency', currency }).format(total), error: null };
    } catch (e) {
      if (e instanceof RangeError) {
        return { formatted: total.toString(), error: 'invalid locale or currency: ' + e.message };
      }
      throw e;
    }
  }
  if (locale) {
    try {
      return { formatted: new Intl.NumberFormat(locale).format(total), error: null };
    } catch (e) {
      return { formatted: total.toString(), error: 'invalid locale: ' + e.message };
    }
  }
  return { formatted: total.toString(), error: null };
}

export function calculator(a, b, operation, mode, precision, roundingMode, locale, currency, taxRate, discount) {
  const nullCheck = handleNullOperands(a, b, operation);
  if (nullCheck.earlyReturn) {
    return nullCheck.earlyReturn;
  }
  a = nullCheck.a;
  b = nullCheck.b;
  let error = nullCheck.error;

  const opResult = computeOperation(a, b, operation, mode, precision, roundingMode);
  if (opResult.earlyReturn) {
    return { result: opResult.result, error: opResult.error };
  }
  if (opResult.error) {
    error = opResult.error;
  }
  const result = opResult.result;

  const discountResult = calcDiscount(result, discount, roundingMode);
  if (discountResult.error) {
    error = appendError(error, discountResult.error);
  }
  const discountedAmount = discountResult.discountedAmount;

  const taxResult = calcTax(discountedAmount, taxRate, roundingMode);
  if (taxResult.error) {
    error = appendError(error, taxResult.error);
  }
  const tax = taxResult.tax;

  const total = discountedAmount + tax;

  const fmtResult = formatTotal(total, locale, currency);
  if (fmtResult.error) {
    error = appendError(error, fmtResult.error);
  }

  return { result, discountedAmount, tax, total, formatted: fmtResult.formatted, error };
}
