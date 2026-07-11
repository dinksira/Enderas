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

test('normalizeMobileNumber handles 07/7 and landline numbers', () => {
  assert.equal(normalizeMobileNumber('0712345678'), '+251712345678');
  assert.equal(normalizeMobileNumber('712345678'), '+251712345678');
  assert.equal(normalizeMobileNumber('0111234567'), '+251111234567');
  assert.equal(normalizeMobileNumber('111234567'), '+251111234567');
  assert.equal(normalizeMobileNumber('046123456'), '+25146123456');
});

test('getMobileLookupCandidates includes legacy and international variants', () => {
  const candidates = getMobileLookupCandidates('0912345678');
  assert.ok(candidates.includes('0912345678'));
  assert.ok(candidates.includes('+251912345678'));
  assert.ok(candidates.includes('251912345678'));
});

test('getMobileLookupCandidates recovers landline with trunk prefix', () => {
  const candidates = getMobileLookupCandidates('0111234567');
  assert.ok(candidates.includes('0111234567'));
  assert.ok(candidates.includes('+251111234567'));
});

test('resolveMobileForStorage rejects invalid numbers', () => {
  assert.throws(() => resolveMobileForStorage('12345'), /valid Ethiopian phone number/);
});

test('isValidEthiopianMobile accepts common input formats', () => {
  assert.equal(isValidEthiopianMobile('0911223344'), true);
  assert.equal(isValidEthiopianMobile('+251911223344'), true);
  assert.equal(isValidEthiopianMobile('0111234567'), true);
  assert.equal(isValidEthiopianMobile('046123456'), true);
});
