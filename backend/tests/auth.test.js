import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChangeRegistrationMobileBody } from '../src/modules/auth/auth.validation.js';

function runValidation(body) {
  const req = { body };
  let captured = null;
  const next = (err) => {
    captured = err;
    return err;
  };
  validateChangeRegistrationMobileBody(req, {}, next);
  return { req, error: captured };
}

test('validateChangeRegistrationMobileBody requires both numbers', () => {
  const { error } = runValidation({});
  assert.ok(error, 'expected a validation error');
  assert.equal(error.code, 'VALIDATION_ERROR');
});

test('validateChangeRegistrationMobileBody rejects an invalid new number', () => {
  const { error } = runValidation({ oldMobile: '+251912345678', newMobile: 'abc' });
  assert.ok(error, 'expected a validation error');
  assert.equal(error.code, 'INVALID_MOBILE_NUMBER');
});

test('validateChangeRegistrationMobileBody normalizes valid numbers', () => {
  const { req, error } = runValidation({ oldMobile: '0912345678', newMobile: '0712345678' });
  assert.equal(error, undefined, 'expected no validation error');
  assert.equal(req.body.oldMobile, '+251912345678');
  assert.equal(req.body.newMobile, '+251712345678');
});

test('validateChangeRegistrationMobileBody accepts landline numbers', () => {
  const { req, error } = runValidation({ oldMobile: '+251912345678', newMobile: '0111234567' });
  assert.equal(error, undefined, 'expected no validation error');
  assert.equal(req.body.newMobile, '+251111234567');
});
