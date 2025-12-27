// Test Sequencer - Control test execution order
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Order: Unit → Integration → E2E
    const copyTests = Array.from(tests);
    return copyTests.sort((testA, testB) => {
      const priority = {
        'unit': 1,
        'integration': 2,
        'e2e': 3
      };

      const getPriority = (testPath) => {
        if (testPath.includes('/unit/')) return priority.unit;
        if (testPath.includes('/integration/')) return priority.integration;
        if (testPath.includes('/e2e/')) return priority.e2e;
        return 999;
      };

      return getPriority(testA.path) - getPriority(testB.path);
    });
  }
}

module.exports = CustomSequencer;
