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

test('validateRegistration accepts amount lower than previous threshold', async () => {
  await assert.doesNotReject(() => runMiddleware(validateRegistration, {
    body: { fullName: 'John Doe', idno: '123456789012', amount: 100 }
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

test('validateIdnoParam accepts 12-digit numeric IDNO', async () => {
  await assert.doesNotReject(() => runMiddleware(validateIdnoParam, {
    params: { idno: '123456789012' }
  }));
});

test('validateIdnoParam rejects non-digit IDNO values', async () => {
  await assert.rejects(() => runMiddleware(validateIdnoParam, {
    params: { idno: '1234ABCD9012' }
  }));
});
