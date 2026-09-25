import {
  registerUser,
  validateRegistrationInput,
  hashUserPassword,
  handleUserRegistrationRequest
} from '../userRegistration.mjs';

describe('User Registration', () => {
  describe('hashUserPassword', () => {
    it('generates a hash and a salt', () => {
      const { hash, salt } = hashUserPassword('testPassword123');
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(typeof salt).toBe('string');
    });

    it('generates the same hash with the same salt', () => {
      const { hash: hash1, salt } = hashUserPassword('testPassword123');
      const { hash: hash2 } = hashUserPassword('testPassword123', salt);
      expect(hash1).toBe(hash2);
    });
  });

  describe('validateRegistrationInput', () => {
    it('returns error when payload is empty or invalid type', () => {
      expect(validateRegistrationInput(null)).toMatch(/JSON object/);
      expect(validateRegistrationInput('invalid')).toMatch(/JSON object/);
    });

    it('returns error for invalid username', () => {
      expect(validateRegistrationInput({ username: 'ab', email: 'test@example.com', password: 'password123' }))
        .toMatch(/Invalid username/);
    });

    it('returns error for invalid email', () => {
      expect(validateRegistrationInput({ username: 'validUser', email: 'invalid-email', password: 'password123' }))
        .toMatch(/Invalid email/);
    });

    it('returns error for short password', () => {
      expect(validateRegistrationInput({ username: 'validUser', email: 'test@example.com', password: '123' }))
        .toMatch(/Invalid password/);
    });

    it('returns null for valid input', () => {
      expect(validateRegistrationInput({
        username: 'validUser',
        email: 'test@example.com',
        password: 'securePassword123!'
      })).toBeNull();
    });
  });

  describe('registerUser', () => {
    it('successfully registers a new user', () => {
      const res = registerUser({
        username: 'alice',
        email: 'alice@example.com',
        password: 'superSecretPassword'
      });
      expect(res.success).toBe(true);
      expect(res.status).toBe(201);
      expect(res.data.username).toBe('alice');
      expect(res.data.email).toBe('alice@example.com');
      expect(res.data.id).toBeDefined();
    });

    it('rejects duplicate username', () => {
      const res = registerUser({
        username: 'alice',
        email: 'alice_new@example.com',
        password: 'superSecretPassword'
      });
      expect(res.success).toBe(false);
      expect(res.status).toBe(409);
      expect(res.error).toMatch(/Username already exists/);
    });

    it('rejects duplicate email', () => {
      const res = registerUser({
        username: 'alice2',
        email: 'alice@example.com',
        password: 'superSecretPassword'
      });
      expect(res.success).toBe(false);
      expect(res.status).toBe(409);
      expect(res.error).toMatch(/Email already registered/);
    });
  });

  describe('handleUserRegistrationRequest', () => {
    it('returns 404 for unknown endpoints', () => {
      const req = {
        method: 'GET',
        url: '/api/v1/unknown',
        headers: { host: 'localhost' }
      };
      const res = {
        writeHead: jest.fn(),
        end: jest.fn()
      };
      handleUserRegistrationRequest(req, res);
      expect(res.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
    });
  });
});
