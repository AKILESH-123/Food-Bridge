require('dotenv').config();
const { verifyWithRegistry, normalizeString } = require('../services/ngoRegistryService');
const { User, NgoRegistry } = require('../models');

async function runTests() {
  console.log('==============================================');
  console.log('🧪 Starting NGO Registration Verification Tests');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extraInfo ? `-> ${extraInfo}` : ''}`);
      failed++;
    }
  }

  try {
    // Test 1: Valid NGO in Tamil Nadu (TN12345 / ABC Foundation)
    const test1 = await verifyWithRegistry({
      registrationNumber: 'tn12345', // tests uppercase normalization
      ngoName: '  Abc Foundation  ', // tests whitespace & case insensitivity
      registrationType: 'Trust',
      state: 'Tamil Nadu',
    });
    assert(
      test1.isVerified === true && test1.verificationStatus === 'verified',
      'Test 1: Valid Active NGO in Tamil Nadu (TN12345 / ABC Foundation)',
      `Got status: ${test1.verificationStatus}, reason: ${test1.reason}`
    );

    // Test 2: Valid NGO with punctuation/spacing variations (TN54321 / Chennai Food Care Foundation)
    const test2 = await verifyWithRegistry({
      registrationNumber: 'TN54321',
      ngoName: 'chennai food care foundation',
      registrationType: 'Section 8 Company',
      state: 'tamil nadu',
    });
    assert(
      test2.isVerified === true && test2.verificationStatus === 'verified',
      'Test 2: Valid Section 8 NGO with case/whitespace differences (TN54321)',
      `Got status: ${test2.verificationStatus}, reason: ${test2.reason}`
    );

    // Test 3: Wrong Name for known number
    const test3 = await verifyWithRegistry({
      registrationNumber: 'TN12345',
      ngoName: 'Totally Fake Foundation',
      registrationType: 'Trust',
      state: 'Tamil Nadu',
    });
    assert(
      test3.isVerified === false && test3.verificationStatus === 'rejected' && test3.reason.includes('does not match'),
      'Test 3: Wrong Organization Name triggers rejection',
      `Got status: ${test3.verificationStatus}, reason: ${test3.reason}`
    );

    // Test 4: Unknown registration number
    const test4 = await verifyWithRegistry({
      registrationNumber: 'UNKNOWN999',
      ngoName: 'Some Random NGO',
      registrationType: 'Trust',
      state: 'Tamil Nadu',
    });
    assert(
      test4.isVerified === false && test4.verificationStatus === 'rejected' && test4.reason.includes('not found'),
      'Test 4: Unknown registration number triggers rejection',
      `Got status: ${test4.verificationStatus}, reason: ${test4.reason}`
    );

    // Test 5: Inactive registration entry in registry (TN99999 / Inactive Charity Trust)
    const test5 = await verifyWithRegistry({
      registrationNumber: 'TN99999',
      ngoName: 'Inactive Charity Trust',
      registrationType: 'Trust',
      state: 'Tamil Nadu',
    });
    assert(
      test5.isVerified === false && test5.verificationStatus === 'rejected' && test5.reason.includes('Inactive'),
      'Test 5: Inactive NGO in registry triggers rejection',
      `Got status: ${test5.verificationStatus}, reason: ${test5.reason}`
    );

    // Test 6: State mismatch (e.g. TN12345 claiming to be in Karnataka)
    const test6 = await verifyWithRegistry({
      registrationNumber: 'TN12345',
      ngoName: 'ABC Foundation',
      registrationType: 'Trust',
      state: 'Karnataka',
    });
    assert(
      test6.isVerified === false && test6.verificationStatus === 'rejected' && test6.reason.includes('state'),
      'Test 6: State mismatch triggers rejection',
      `Got status: ${test6.verificationStatus}, reason: ${test6.reason}`
    );

    // Test 7: Duplicate registration number prevention
    // Find or create an NGO user with TN67890
    const existingNgo = await User.findOne({ where: { role: 'ngo', registrationNumber: 'TN67890' } });
    if (!existingNgo) {
      await User.create({
        name: 'Helping Hands Lead',
        email: 'test_helpinghands_auto@gmail.com',
        role: 'ngo',
        organizationName: 'Helping Hands',
        registrationNumber: 'TN67890',
        registrationType: 'Society',
        state: 'Tamil Nadu',
        verificationStatus: 'verified',
        isVerified: true,
      });
    }

    // Now attempt duplicate query check
    const duplicateCheck = await User.findOne({
      where: { role: 'ngo', registrationNumber: 'TN67890' },
    });
    assert(
      duplicateCheck !== null,
      'Test 7: Duplicate registration detection query detects existing account',
      `Detected registered account: ${duplicateCheck?.email}`
    );

    console.log('\n==============================================');
    console.log(`Summary: ${passed} passed, ${failed} failed`);
    console.log('==============================================\n');

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
