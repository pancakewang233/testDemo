function appendToken(expression, token) {
  return String(expression || '') + String(token || '');
}

function backspace(expression) {
  return String(expression || '').slice(0, -1);
}

function clearExpression() {
  return '';
}

function getSubmittableExpression(expression) {
  return String(expression || '').trim();
}

function formatCalculatorResponse(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'result')) {
    return String(payload.result);
  }

  return JSON.stringify(payload, null, 2);
}

module.exports = {
  appendToken,
  backspace,
  clearExpression,
  getSubmittableExpression,
  formatCalculatorResponse,
};
