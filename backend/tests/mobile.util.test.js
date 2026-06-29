import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMobileNumber,
  isValidEthiopianMobile,
  getMobileLookupCandidates,
  resolveMobileForStorage,
} from '../src/utils/mobile.util.js';

test('normalizeMobileNumber converts local format to +251', () => {
  assert.equal(normalizeMobileNumber('0912345678'), '+251912345678');
  assert.equal(normalizeMobileNumber('912345678'), '+251912345678');
  assert.equal(normalizeMobileNumber('+251912345678'), '+251912345678');
  assert.equal(normalizeMobileNumber('251912345678'), '+251912345678');
});

test('getMobileLookupCandidates includes legacy and international variants', () => {
  const candidates = getMobileLookupCandidates('0912345678');
  assert.ok(candidates.includes('0912345678'));
  assert.ok(candidates.includes('+251912345678'));
  assert.ok(candidates.includes('251912345678'));
});

test('resolveMobileForStorage rejects invalid numbers', () => {
  assert.throws(() => resolveMobileForStorage('12345'), /valid Ethiopian mobile number/);
});

test('isValidEthiopianMobile accepts common input formats', () => {
  assert.equal(isValidEthiopianMobile('0911223344'), true);
  assert.equal(isValidEthiopianMobile('+251911223344'), true);
});
