const assert = require('assert');
const fs = require('fs');
const {
  appendToken,
  backspace,
  clearExpression,
  getSubmittableExpression,
  formatCalculatorResponse,
  createRequestBody,
  readCalculatorResponse,
} = require('../src/utils/calculatorExpression');

async function run() {
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
  assert.deepStrictEqual(createRequestBody('  sin(0) + sqrt(9)  ', 'expression'), { expression: 'sin(0) + sqrt(9)' });
  assert.strictEqual(formatCalculatorResponse({ result: 8 }), '8');
  assert.strictEqual(formatCalculatorResponse({ value: 8 }), '{\n  "value": 8\n}');

  assert.strictEqual(await readCalculatorResponse({
    ok: true,
    status: 200,
    json: async () => ({ result: 8 }),
  }), '8');
  await assert.rejects(readCalculatorResponse({
    ok: false,
    status: 400,
    json: async () => ({ message: '表达式不合法' }),
  }), { message: '表达式不合法' });
  await assert.rejects(readCalculatorResponse({
    ok: false,
    status: 500,
    json: async () => null,
  }), { message: '请求失败（HTTP 500）' });
  await assert.rejects(readCalculatorResponse({
    ok: true,
    status: 200,
    json: async () => { throw new Error('invalid json'); },
  }), { message: '响应格式错误' });
  await assert.rejects(readCalculatorResponse({
    ok: false,
    status: 502,
    json: async () => { throw new Error('invalid json'); },
  }), { message: '请求失败（HTTP 502）' });

  const calculatorModuleSource = fs.readFileSync(require.resolve('../src/components/CalculatorModule.vue'), 'utf8');
  assert.ok(calculatorModuleSource.includes("{{ expression || '请输入表达式' }}"));
  assert.ok(calculatorModuleSource.includes('表达式为空，请输入表达式'));
  assert.ok(calculatorModuleSource.includes('readCalculatorResponse(response)'));

  console.log('calculator expression tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
