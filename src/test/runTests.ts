import { runBusinessLogicTests } from './businessLogic.test';

console.log('====================================================');
console.log('   FOODBRIDGE AI — AUTOMATED TEST SUITE EXECUTION   ');
console.log('====================================================\n');

const { passed, failed, results } = runBusinessLogicTests();

results.forEach((r, idx) => {
  if (r.passed) {
    console.log(`[PASS] ${r.name}`);
  } else {
    console.error(`[FAIL] ${r.name} - Error: ${r.error}`);
  }
});

console.log('\n----------------------------------------------------');
console.log(`Total Scenarios Tested: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('----------------------------------------------------');

if (failed > 0) {
  console.error('❌ Test suite failed!');
  process.exit(1);
} else {
  console.log('✅ All 20 business logic and safety checks passed successfully!\n');
  process.exit(0);
}
