import test from 'node:test';
import assert from 'node:assert/strict';
import { mapDatabaseError } from '../utils/errors.js';

test('maps users email unique violation to 409', () => {
  const error = mapDatabaseError({
    code: '23505',
    constraint: 'users_email_key',
    detail: 'Key (email)=(admin@example.com) already exists.'
  });

  assert.equal(error.statusCode, 409);
  assert.equal(error.message, 'This email is already registered.');
});

test('maps registration idno unique violation to readable message', () => {
  const error = mapDatabaseError({
    code: '23505',
    constraint: 'registrations_idno_key',
    detail: 'Key (idno)=(FIN1234) already exists.'
  });

  assert.equal(error.statusCode, 409);
  assert.equal(error.message, 'A registration with this IDNO already exists.');
});
