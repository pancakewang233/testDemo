const assert = require('assert');
const {
  appendToken,
  backspace,
  clearExpression,
  getSubmittableExpression,
  formatCalculatorResponse,
} = require('../src/utils/calculatorExpression');

assert.strictEqual(appendToken('', 'ln('), 'ln(');
assert.strictEqual(appendToken('', 0), '0');
assert.strictEqual(appendToken('ln(2)', '^'), 'ln(2)^');
assert.strictEqual(appendToken('ln(2)^', '3'), 'ln(2)^3');
assert.strictEqual(backspace('ln(2)^3'), 'ln(2)^');
assert.strictEqual(backspace(''), '');
assert.strictEqual(clearExpression('ln(2)'), '');
assert.strictEqual(getSubmittableExpression('  ln(2)  '), 'ln(2)');
assert.strictEqual(getSubmittableExpression('   '), '');
assert.strictEqual(getSubmittableExpression(0), '0');
assert.strictEqual(formatCalculatorResponse({ result: 8 }), '8');
assert.strictEqual(formatCalculatorResponse({ value: 8 }), '{\n  "value": 8\n}');

console.log('calculator expression tests passed');
