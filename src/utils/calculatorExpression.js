function appendToken(expression, token) {
  return String(expression == null ? '' : expression) + String(token == null ? '' : token);
}

function backspace(expression) {
  return String(expression || '').slice(0, -1);
}

function clearExpression() {
  return '';
}

function getSubmittableExpression(expression) {
  return String(expression == null ? '' : expression).trim();
}

function createRequestBody(expression, field) {
  return { [field]: getSubmittableExpression(expression) };
}

function formatCalculatorResponse(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'result')) {
    return String(payload.result);
  }

  return JSON.stringify(payload, null, 2);
}

async function readCalculatorResponse(response) {
  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error(`请求失败（HTTP ${response.status}）`);
    }

    throw new Error('响应格式错误');
  }

  if (!response.ok) {
    throw new Error(payload && payload.message ? payload.message : `请求失败（HTTP ${response.status}）`);
  }

  return formatCalculatorResponse(payload);
}

module.exports = {
  appendToken,
  backspace,
  clearExpression,
  getSubmittableExpression,
  createRequestBody,
  formatCalculatorResponse,
  readCalculatorResponse,
};
