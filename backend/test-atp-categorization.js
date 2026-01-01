// Test ATP Auto-Categorization
// Run with: node test-atp-categorization.js

const { categorizeATPDocument } = require('./src/utils/atpCategorization');
const path = require('path');

async function testCategorization() {
  console.log('='.repeat(70));
  console.log('ATP DOCUMENT AUTO-CATEGORIZATION TEST');
  console.log('='.repeat(70));
  console.log();

  // Test 1: Software ATP
  console.log('TEST 1: Software ATP Document');
  console.log('-'.repeat(70));
  try {
    const softwareATP = 'XLSmart MW ATP (SW Lincense UG BW UG Modulations) KAL-KB-SBS-0730-KAL-KB-SBS-0389(2) (1).pdf';
    const softwarePath = path.join(__dirname, '..', softwareATP);

    console.log('File:', softwareATP);
    console.log('Path:', softwarePath);
    console.log();

    const result1 = await categorizeATPDocument(softwarePath, softwareATP);

    console.log('Result:');
    console.log('  Category:', result1.category);
    console.log('  Confidence:', (result1.confidence * 100).toFixed(1) + '%');
    console.log('  Software Score:', result1.scores.software);
    console.log('  Hardware Score:', result1.scores.hardware);
    console.log('  Method:', result1.method);
    console.log('  Total Pages:', result1.totalPages);
    console.log();

    // Validate result
    if (result1.category === 'SOFTWARE' && result1.confidence > 0.8) {
      console.log('✅ TEST 1 PASSED: Correctly identified as Software ATP');
    } else {
      console.log('❌ TEST 1 FAILED: Expected SOFTWARE with high confidence');
    }
  } catch (error) {
    console.log('❌ TEST 1 ERROR:', error.message);
  }

  console.log();
  console.log('='.repeat(70));
  console.log();

  // Test 2: Hardware ATP
  console.log('TEST 2: Hardware ATP Document');
  console.log('-'.repeat(70));
  try {
    const hardwareATP = 'XLSmart MW ATP SUM-RI-TBH-0440_SUM-RI-TBH-0640.pdf';
    const hardwarePath = path.join(__dirname, '..', hardwareATP);

    console.log('File:', hardwareATP);
    console.log('Path:', hardwarePath);
    console.log();

    const result2 = await categorizeATPDocument(hardwarePath, hardwareATP);

    console.log('Result:');
    console.log('  Category:', result2.category);
    console.log('  Confidence:', (result2.confidence * 100).toFixed(1) + '%');
    console.log('  Software Score:', result2.scores.software);
    console.log('  Hardware Score:', result2.scores.hardware);
    console.log('  Method:', result2.method);
    console.log('  Total Pages:', result2.totalPages);
    console.log();

    // Validate result
    if (result2.category === 'HARDWARE' && result2.confidence > 0.8) {
      console.log('✅ TEST 2 PASSED: Correctly identified as Hardware ATP');
    } else {
      console.log('❌ TEST 2 FAILED: Expected HARDWARE with high confidence');
    }
  } catch (error) {
    console.log('❌ TEST 2 ERROR:', error.message);
  }

  console.log();
  console.log('='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));
}

// Run tests
testCategorization()
  .then(() => {
    console.log();
    console.log('All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
