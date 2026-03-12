import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLogin,
  validateRegistration,
  validateCommissionUpdate,
  validateWindowParam,
  validateIdnoParam
} from '../middleware/validate.js';

function runMiddleware(middleware, req) {
  return new Promise((resolve, reject) => {
    try {
      middleware(req, {}, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

test('validateLogin accepts valid credentials', async () => {
  await assert.doesNotReject(() => runMiddleware(validateLogin, {
    body: { email: 'user@example.com', password: 'password123' }
  }));
});

test('validateLogin rejects invalid email', async () => {
  await assert.rejects(() => runMiddleware(validateLogin, {
    body: { email: 'not-an-email', password: 'password123' }
  }));
});

test('validateRegistration rejects amount lower than 1000', async () => {
  await assert.rejects(() => runMiddleware(validateRegistration, {
    body: { fullName: 'John Doe', idno: 'FIN12345', amount: 999 }
  }));
});

test('validateCommissionUpdate accepts non-negative numbers', async () => {
  await assert.doesNotReject(() => runMiddleware(validateCommissionUpdate, {
    body: { commissionPerPerson: 20 }
  }));
});

test('validateWindowParam rejects invalid period', async () => {
  await assert.rejects(() => runMiddleware(validateWindowParam, {
    params: { window: 'yearly' }
  }));
});

test('validateIdnoParam accepts alphanumeric IDNO', async () => {
  await assert.doesNotReject(() => runMiddleware(validateIdnoParam, {
    params: { idno: 'FIN-12345' }
  }));
});

test('validateIdnoParam rejects unsupported symbols', async () => {
  await assert.rejects(() => runMiddleware(validateIdnoParam, {
    params: { idno: 'FIN@123' }
  }));
});
