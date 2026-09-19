/**
 * services/ngoRegistryService.js
 * 
 * PRODUCTION NOTE:
 * In a live production deployment, this mock verification module would be replaced
 * by integration with an official authorized government API or NGO directory
 * (such as India's NGO DARPAN portal / MCA21 API).
 * 
 * To ensure safe architecture:
 * - We isolate all lookup and comparison logic in this single service module.
 * - Under no circumstances do we scrape or call unauthorized third-party websites.
 */

const { NgoRegistry } = require('../models');

/**
 * Normalizes an arbitrary text string by trimming whitespace,
 * converting to lower case, and stripping non-alphanumeric punctuation.
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes a state name for comparison.
 */
function normalizeState(state) {
  return normalizeString(state);
}

/**
 * Verifies submitted NGO details against the mock registry.
 *
 * Rules:
 * a. Normalizes inputs (uppercase registration number, trimmed/clean names and states).
 * b. Looks up registration number in mock registry.
 * c. If not found -> status "rejected" (or "pending" manual review) with clear explanation.
 * d. If found but name/state doesn't match or status is Inactive -> "rejected" (Verification Failed) with reason.
 * e. If found and details match & status is Active -> "verified".
 *
 * @param {Object} details
 * @param {string} details.registrationNumber
 * @param {string} details.ngoName
 * @param {string} [details.registrationType]
 * @param {string} [details.state]
 * @returns {Promise<{ isVerified: boolean, verificationStatus: 'verified' | 'rejected' | 'pending', reason: string, registryRecord: Object | null }>}
 */
async function verifyWithRegistry({ registrationNumber, ngoName, registrationType, state }) {
  if (!registrationNumber || !registrationNumber.trim()) {
    return {
      isVerified: false,
      verificationStatus: 'rejected',
      reason: 'Registration number is missing or empty.',
      registryRecord: null,
    };
  }

  // 1. Normalize registration number: uppercase, remove spaces
  const cleanRegNo = registrationNumber.trim().toUpperCase().replace(/\s+/g, '');

  // 2. Query registry
  const record = await NgoRegistry.findOne({
    where: { registrationNumber: cleanRegNo },
  });

  // Rule c: If not found in registry
  if (!record) {
    return {
      isVerified: false,
      verificationStatus: 'rejected',
      reason: `Registration number "${cleanRegNo}" not found in the official NGO registry.`,
      registryRecord: null,
    };
  }

  // Rule d (1): If registry status is Inactive
  if (record.status !== 'Active') {
    return {
      isVerified: false,
      verificationStatus: 'rejected',
      reason: `Verification Failed: Registration number "${cleanRegNo}" is marked as ${record.status} in the official registry.`,
      registryRecord: record,
    };
  }

  // Rule d (2): Compare NGO Name (case-insensitive, ignoring extra spaces and punctuation)
  const normInputName = normalizeString(ngoName);
  const normRegistryName = normalizeString(record.ngoName);

  if (normInputName !== normRegistryName) {
    return {
      isVerified: false,
      verificationStatus: 'rejected',
      reason: `Verification Failed: Registered organization name "${record.ngoName}" does not match provided name "${ngoName}".`,
      registryRecord: record,
    };
  }

  // Rule d (3): Compare State if provided
  if (state && state.trim()) {
    const normInputState = normalizeState(state);
    const normRegistryState = normalizeState(record.state);

    if (normInputState !== normRegistryState) {
      return {
        isVerified: false,
        verificationStatus: 'rejected',
        reason: `Verification Failed: Registered state "${record.state}" does not match provided state "${state}".`,
        registryRecord: record,
      };
    }
  }

  // Rule e: Everything matched and active -> Verified!
  return {
    isVerified: true,
    verificationStatus: 'verified',
    reason: `Verified successfully against official NGO registry (${record.ngoName}, ${record.registrationType}, ${record.state}).`,
    registryRecord: record,
  };
}

module.exports = {
  verifyWithRegistry,
  normalizeString,
};
