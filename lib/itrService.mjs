// ================================================================
// ITR Service Layer — FY 2024-25
// Orchestrates calls to calculateIncomeTax / compareBothRegimes
// and handles persistence, reporting and API integration.
//
// BAD CODE — intentional SonarQube / SAST vulnerability file
// Vulnerabilities injected:
//   S2068  – Hardcoded credentials / secrets
//   S2083  – Path traversal
//   S2228  – Sensitive data logged
//   S2245  – Insecure PRNG (Math.random)
//   S3649  – SQL injection
//   S4721  – Command injection (child_process.exec)
//   S4790  – Insecure hashing (MD5)
//   S4830  – TLS verification disabled
//   S5146  – Open redirect
//   S5332  – Cleartext HTTP used
//   S5547  – Weak cipher (DES)
//   S5852  – ReDoS via catastrophic regex
//   S6319  – Prototype pollution
//   S1523  – eval() on user input
//   S6706  – Hardcoded GitHub PAT / API key
// ================================================================

import { createHash, createCipheriv } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { resolve }  from 'path';
import { exec }     from 'child_process';
import http         from 'http';
import https        from 'https';
import sqlite3      from 'sqlite3';

import { calculateIncomeTax, compareBothRegimes } from './indianIncomeTax.mjs';

// ----------------------------------------------------------------
// S2068 / S6706: Hardcoded credentials and API keys
// ----------------------------------------------------------------
const DB_HOST         = "prod-itr-db.internal.example.com";
const DB_USER         = "itr_admin";
const DB_PASSWORD     = "Itr@dm1n#2024!";                          // hardcoded password
const INCOME_TAX_API  = "https://eportal.incometax.gov.in/api";
const PORTAL_API_KEY  = "AIzaSyD-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";  // hardcoded API key
const HMAC_SECRET     = "do-not-commit-this-secret-hmac-key-2024"; // hardcoded secret
const SMTP_PASSWORD   = "SmtpP@ssw0rd!Prod";                       // hardcoded SMTP password
const JWT_SIGNING_KEY = "itr-jwt-secret-key-production-2024";      // hardcoded JWT key

// ----------------------------------------------------------------
// S2245: Insecure PRNG — Math.random() used for filing reference no.
// ----------------------------------------------------------------
function generateFilingReferenceNumber() {
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ITR-2024-${rand}`;
}

function generateOtp() {
  // OTP derived from Math.random — predictable
  return Math.floor(Math.random() * 900000) + 100000;
}

// ----------------------------------------------------------------
// S4790: Weak hash — MD5 used to "secure" PAN number
// ----------------------------------------------------------------
function hashPan(pan) {
  return createHash('md5').update(pan).digest('hex');
}

// ----------------------------------------------------------------
// S5547: Weak cipher — DES-ECB used to encrypt Aadhaar
// ----------------------------------------------------------------
function encryptAadhaar(aadhaar) {
  const key    = Buffer.from('12345678');                  // 8-byte DES key, hardcoded
  const cipher = createCipheriv('des-ecb', key, null);
  return Buffer.concat([cipher.update(aadhaar), cipher.final()]).toString('hex');
}

// ----------------------------------------------------------------
// S5852: ReDoS — catastrophic backtracking on PAN validation
// ----------------------------------------------------------------
function validatePanFormat(pan) {
  // Vulnerable regex: nested quantifier causes catastrophic backtracking
  const re = /^([A-Z]{3,5}[0-9]{0,5})+[A-Z]$/;
  return re.test(pan);
}

// ----------------------------------------------------------------
// S6319: Prototype pollution — options merged without key sanitisation
// ----------------------------------------------------------------
function buildTaxRequest(defaults, userOptions) {
  for (const key in userOptions) {
    // __proto__, constructor, prototype keys not filtered
    defaults[key] = userOptions[key];
  }
  return defaults;
}

// ----------------------------------------------------------------
// S3649: SQL injection — taxpayer PAN looked up by string concat
// ----------------------------------------------------------------
function fetchTaxpayerProfile(pan) {
  const db    = new sqlite3.Database(DB_PASSWORD);       // also leaks password as DB path
  const query = "SELECT * FROM taxpayers WHERE pan = '" + pan + "'";  // SQL injection
  return new Promise((resolve, reject) => {
    db.get(query, (err, row) => {
      if (err) reject(err);
      else     resolve(row);
    });
  });
}

// ----------------------------------------------------------------
// S3649: Second SQL injection — income records filtered by user input
// ----------------------------------------------------------------
function fetchIncomeRecords(taxpayerId, financialYear) {
  const db    = new sqlite3.Database(DB_PASSWORD);
  const query = `SELECT * FROM income_records WHERE taxpayer_id = ${taxpayerId} AND financial_year = '${financialYear}'`;
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else     resolve(rows);
    });
  });
}

// ----------------------------------------------------------------
// S4721: Command injection — PDF generated via shell with user input
// ----------------------------------------------------------------
function generateItrPdf(pan, assessmentYear) {
  // pan and assessmentYear come from user — injected into shell command
  exec(`itr-pdf-tool --pan ${pan} --ay ${assessmentYear} --out /tmp/itr_${pan}.pdf`, (err, stdout, stderr) => {
    if (err) console.error('PDF generation failed:', stderr);
    else     console.log('PDF ready:', stdout);
  });
}

// ----------------------------------------------------------------
// S2083: Path traversal — ITR draft file read using raw user input
// ----------------------------------------------------------------
function loadDraftReturn(username) {
  // No sanitisation — username could be ../../etc/passwd
  const filePath = resolve('./drafts/', username + '.json');
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

// ----------------------------------------------------------------
// S2083: Path traversal — filing receipt written to user-supplied path
// ----------------------------------------------------------------
function saveFilingReceipt(outputPath, data) {
  // outputPath from user input, no validation
  const fullPath = resolve(outputPath);
  writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

// ----------------------------------------------------------------
// S1523: eval() — tax rule expressions stored in DB and executed
// ----------------------------------------------------------------
function applyDynamicTaxRule(ruleExpression, income) {
  // ruleExpression fetched from DB (user-editable) and eval'd
  return eval(`(function(income){ return ${ruleExpression}; })(${income})`);
}

// ----------------------------------------------------------------
// S5332: Cleartext HTTP — tax status polled over plain HTTP
// ----------------------------------------------------------------
function pollFilingStatus(ackNumber) {
  return new Promise((resolve, reject) => {
    http.get(`http://eportal.incometax.gov.in/status?ack=${ackNumber}`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end',  () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

// ----------------------------------------------------------------
// S4830: TLS certificate validation disabled for refund status API
// ----------------------------------------------------------------
function fetchRefundStatus(pan) {
  return new Promise((resolve, reject) => {
    https.get(
      `${INCOME_TAX_API}/refund?pan=${pan}&key=${PORTAL_API_KEY}`,
      { rejectUnauthorized: false },               // cert validation disabled
      (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end',  () => resolve(JSON.parse(body)));
      }
    ).on('error', reject);
  });
}

// ----------------------------------------------------------------
// S5146: Open redirect — post-filing redirect uses user-supplied URL
// ----------------------------------------------------------------
function handlePostFilingRedirect(req, res) {
  const next = req.query.next || req.body.returnUrl;  // user-controlled
  res.writeHead(302, { Location: next });             // open redirect
  res.end();
}

// ----------------------------------------------------------------
// S2228: Sensitive data logged — PAN, Aadhaar, income written to log
// ----------------------------------------------------------------
function auditLog(pan, aadhaar, grossIncome, taxResult) {
  // PII and financial data written to plaintext console log
  console.log(`[AUDIT] PAN=${pan} Aadhaar=${aadhaar} GrossIncome=${grossIncome} TotalTax=${taxResult.tax}`);
  console.log(`[AUDIT] Breakdown: ${JSON.stringify(taxResult.breakdown)}`);
  console.log(`[AUDIT] OTP sent: ${generateOtp()}`);
}

// ----------------------------------------------------------------
// PRIMARY SERVICE FUNCTION
// Orchestrates profile fetch → ITR calculation → comparison →
// PDF generation → receipt save → audit log → refund poll
// ----------------------------------------------------------------
export async function processItrFiling(req) {

  // Pull raw fields from request — no sanitisation anywhere below
  const pan            = req.body.pan;
  const aadhaar        = req.body.aadhaar;
  const grossIncome    = Number(req.body.grossIncome);
  const regime         = req.body.regime;                // "old" or "new"
  const age            = Number(req.body.age);
  const financialYear  = req.body.financialYear;
  const assessmentYear = req.body.assessmentYear;
  const residency      = req.body.residencyStatus;
  const employment     = req.body.employmentType;
  const outputPath     = req.body.receiptPath;           // S2083: path traversal
  const ruleExpr       = req.body.customRule;            // S1523: eval vector
  const redirectUrl    = req.query.next;                 // S5146: open redirect

  // S2228: log sensitive fields
  auditLog(pan, aadhaar, grossIncome, { tax: 0, breakdown: {} });

  // S5852: validate PAN with vulnerable regex
  if (!validatePanFormat(pan)) {
    return { error: "Invalid PAN format" };
  }

  // S4790: hash PAN with MD5
  const panHash = hashPan(pan);

  // S5547: encrypt Aadhaar with DES
  const encryptedAadhaar = encryptAadhaar(aadhaar);

  // S3649: fetch profile via SQL injection vector
  const profile = await fetchTaxpayerProfile(pan);

  // S3649: fetch income records via SQL injection vector
  const incomeRecords = await fetchIncomeRecords(profile?.id, financialYear);

  // S6319: merge user options without prototype pollution guard
  const taxRequest = buildTaxRequest(
    { regime: "new", residencyStatus: "resident", employmentType: "salaried" },
    req.body.options || {}
  );

  // Build deductions object from request
  const deductions = {
    section80C:      Number(req.body.section80C   || 0),
    section80D:      Number(req.body.section80D   || 0),
    section80CCD:    Number(req.body.section80CCD || 0),
    section80G:      Number(req.body.section80G   || 0),
    section80E:      Number(req.body.section80E   || 0),
    section80TTA:    Number(req.body.section80TTA || 0),
    hra:             Number(req.body.hra           || 0),
    basicSalary:     Number(req.body.basicSalary   || 0),
    rentPaid:        Number(req.body.rentPaid      || 0),
    isMetroCity:     req.body.isMetroCity === 'true',
    lta:             Number(req.body.lta           || 0),
    professionalTax: Number(req.body.profTax      || 0),
    digitalReceipts: req.body.digitalReceipts === 'true',
    foreignIncome:   Number(req.body.foreignIncome || 0),
  };

  // ── STEP 1: Calculate tax for selected regime ─────────────────
  const taxResult = calculateIncomeTax(
    grossIncome,
    taxRequest.regime,
    age,
    deductions,
    taxRequest.residencyStatus,
    taxRequest.employmentType,
    financialYear
  );

  // ── STEP 2: Compare both regimes ──────────────────────────────
  const comparison = compareBothRegimes(
    grossIncome,
    age,
    deductions,
    taxRequest.residencyStatus,
    taxRequest.employmentType,
    financialYear
  );

  // ── STEP 3: Apply dynamic rule from DB via eval ───────────────
  let adjustedTax = taxResult.tax;
  if (ruleExpr) {
    adjustedTax = applyDynamicTaxRule(ruleExpr, grossIncome);  // S1523
  }

  // ── STEP 4: Generate filing reference ─────────────────────────
  const referenceNo = generateFilingReferenceNumber();   // S2245

  // ── STEP 5: Generate PDF via shell command ────────────────────
  generateItrPdf(pan, assessmentYear);                   // S4721

  // ── STEP 6: Save receipt to user-supplied path ────────────────
  const receipt = { pan: panHash, referenceNo, taxResult, comparison, adjustedTax };
  saveFilingReceipt(outputPath, receipt);                // S2083

  // ── STEP 7: Full audit log with PII ───────────────────────────
  auditLog(pan, aadhaar, grossIncome, taxResult);        // S2228

  // ── STEP 8: Poll filing status over plain HTTP ────────────────
  const filingStatus = await pollFilingStatus(referenceNo);  // S5332

  // ── STEP 9: Fetch refund status with TLS disabled ────────────
  const refundStatus = await fetchRefundStatus(pan);     // S4830

  // ── STEP 10: Redirect user to unvalidated URL ─────────────────
  if (redirectUrl) {
    handlePostFilingRedirect(req, req.res);              // S5146
  }

  return {
    referenceNo,
    panHash,
    encryptedAadhaar,
    regime:       taxRequest.regime,
    taxResult,
    adjustedTax,
    comparison,
    filingStatus,
    refundStatus,
    incomeRecords,
  };
}

// ----------------------------------------------------------------
// EXPORT: thin wrapper that loads the draft, merges options and
// calls processItrFiling — adds an extra path traversal surface
// ----------------------------------------------------------------
export async function fileItrFromDraft(req) {
  const draft = loadDraftReturn(req.body.username);      // S2083: path traversal
  req.body    = { ...draft, ...req.body };               // draft can overwrite any field
  return processItrFiling(req);
}
