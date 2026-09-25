import http from 'node:http';
import crypto from 'node:crypto';
import { validateEmail } from '../index.mjs';

/**
 * In-memory user store.
 * @type {Map<string, { id: string, username: string, email: string, passwordHash: string, salt: string, createdAt: string }>}
 */
const usersByUsername = new Map();
const usersByEmail = new Map();

/**
 * Hashes a password using PBKDF2 with SHA-512 and a cryptographically secure random salt.
 * @param {string} password
 * @param {string} [existingSalt]
 * @returns {{ hash: string, salt: string }}
 */
export function hashUserPassword(password, existingSalt) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Validates registration input data.
 * @param {object} data
 * @returns {string|null} Error message or null if valid
 */
export function validateRegistrationInput(data) {
  if (!data || typeof data !== 'object') {
    return 'Request body must be a valid JSON object';
  }

  const { username, email, password } = data;

  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    return 'Invalid username: must be 3-30 alphanumeric characters, underscores, or hyphens';
  }

  if (!email || typeof email !== 'string' || !validateEmail(email)) {
    return 'Invalid email address';
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return 'Invalid password: must be at least 8 characters long';
  }

  return null;
}

/**
 * Registers a new user.
 * @param {{ username: string, email: string, password: string }} userData
 * @returns {{ success: boolean, status: number, data?: object, error?: string }}
 */
export function registerUser({ username, email, password }) {
  const validationError = validateRegistrationInput({ username, email, password });
  if (validationError) {
    return { success: false, status: 400, error: validationError };
  }

  const normalizedUsername = username.toLowerCase();
  const normalizedEmail = email.toLowerCase();

  if (usersByUsername.has(normalizedUsername)) {
    return { success: false, status: 409, error: 'Username already exists' };
  }

  if (usersByEmail.has(normalizedEmail)) {
    return { success: false, status: 409, error: 'Email already registered' };
  }

  const { hash, salt } = hashUserPassword(password);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const userRecord = {
    id,
    username,
    email: normalizedEmail,
    passwordHash: hash,
    salt,
    createdAt
  };

  usersByUsername.set(normalizedUsername, userRecord);
  usersByEmail.set(normalizedEmail, userRecord);

  return {
    success: true,
    status: 201,
    data: {
      id,
      username,
      email: normalizedEmail,
      createdAt
    }
  };
}

/**
 * HTTP request handler for the User Registration API.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export function handleUserRegistrationRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && parsedUrl.pathname === '/api/v1/users/register') {
    let rawBody = '';
    const maxBodySize = 1e6; // 1MB payload limit

    req.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > maxBodySize) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const body = JSON.parse(rawBody);
        const result = registerUser(body);

        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        if (result.success) {
          res.end(JSON.stringify({ message: 'User registered successfully', user: result.data }));
        } else {
          res.end(JSON.stringify({ error: result.error }));
        }
      } catch (err) {
        // Return 400 Bad Request if client provided invalid JSON
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed JSON payload', details: err.message }));
      }
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Creates and starts a User Registration REST API HTTP server.
 * @param {number} [port=3000]
 * @returns {http.Server}
 */
export function createRegistrationServer(port = 3000) {
  const server = http.createServer((req, res) => {
    handleUserRegistrationRequest(req, res);
  });

  server.listen(port);
  return server;
}
