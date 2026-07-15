const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const {
  appendToken,
  backspace,
  clearExpression,
  getSubmittableExpression,
  formatCalculatorResponse,
  createRequestBody,
  readCalculatorResponse,
} = require('../src/utils/calculatorExpression');

let mockFetch;

function loadCalculatorModule() {
  const calculatorModuleSource = fs.readFileSync(require.resolve('../src/components/CalculatorModule.vue'), 'utf8');
  const scriptMatch = calculatorModuleSource.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'CalculatorModule.vue must contain a script block');

  const componentModule = { exports: {} };
  vm.runInNewContext(scriptMatch[1].replace('export default', 'module.exports ='), {
    module: componentModule,
    exports: componentModule.exports,
    require(request) {
      if (request === '../utils/calculatorExpression') {
        return require('../src/utils/calculatorExpression');
      }

      throw new Error(`Unexpected CalculatorModule dependency: ${request}`);
    },
    fetch: (...args) => mockFetch(...args),
  });

  return componentModule.exports;
}

function createCalculatorInstance(componentOptions) {
  const messages = { warnings: [], errors: [] };
  const instance = componentOptions.data();

  instance.$message = {
    warning(message) {
      messages.warnings.push(message);
    },
    error(message) {
      messages.errors.push(message);
    },
  };
  Object.keys(componentOptions.methods).forEach((methodName) => {
    instance[methodName] = componentOptions.methods[methodName].bind(instance);
  });

  return { instance, messages };
}

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

  const calculatorModule = loadCalculatorModule();
  const requestCalls = [];
  mockFetch = async (url, options) => {
    requestCalls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({ result: 8 }),
    };
  };
  const successfulRequest = createCalculatorInstance(calculatorModule);
  successfulRequest.instance.expression = 'ln(2)';
  await successfulRequest.instance.submitExpression();
  assert.strictEqual(requestCalls.length, 1);
  assert.strictEqual(requestCalls[0].url, '/api/calculator/expressions');
  assert.strictEqual(requestCalls[0].options.method, 'POST');
  assert.deepStrictEqual(JSON.parse(requestCalls[0].options.body), { expression: 'ln(2)' });
  assert.strictEqual(successfulRequest.instance.resultText, '8');
  assert.strictEqual(successfulRequest.instance.requestError, '');
  assert.strictEqual(successfulRequest.instance.isSubmitting, false);
  assert.deepStrictEqual(successfulRequest.messages.errors, []);

  mockFetch = async () => { throw new Error('网络不可用'); };
  const networkFailure = createCalculatorInstance(calculatorModule);
  networkFailure.instance.expression = '2^3';
  await networkFailure.instance.submitExpression();
  assert.strictEqual(networkFailure.instance.expression, '2^3');
  assert.strictEqual(networkFailure.instance.requestError, '网络不可用');
  assert.strictEqual(networkFailure.instance.isSubmitting, false);
  assert.deepStrictEqual(networkFailure.messages.errors, ['网络不可用']);

  let emptyExpressionFetchCalls = 0;
  mockFetch = async () => {
    emptyExpressionFetchCalls += 1;
  };
  const emptyExpression = createCalculatorInstance(calculatorModule);
  emptyExpression.instance.expression = '   ';
  await emptyExpression.instance.submitExpression();
  assert.strictEqual(emptyExpressionFetchCalls, 0);
  assert.deepStrictEqual(emptyExpression.messages.warnings, ['请先输入表达式']);

  console.log('calculator expression tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
