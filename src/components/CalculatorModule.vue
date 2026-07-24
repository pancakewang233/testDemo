<template>
  <div class="calculator-module">
    <el-card class="calculator-card" shadow="hover">
      <div slot="header" class="calculator-header">
        <span>函数计算器</span>
        <span class="calculator-hint">输入表达式后提交计算</span>
      </div>

      <div  
        class="calculator-display"  
        aria-live="polite"
        :aria-label="expression ? '当前表达式：' + expression : '表达式为空，请输入表达式'"
      >
        {{ expression || '请输入表达式' }}  
      </div>
    
      <div class="calculator-keyboard">
        <el-button      
          v-for="key in functionKeys"        
          :key="`function-${key.token}`"
          size="small"
          @click="appendKey(key.token)"
        >
          {{ key.label }}  
        </el-button>
        <el-button
          v-for="token in numberKeys"
          :key="`number-${token}`"
          size="small"
          @click="appendKey(token)"
        >
          {{ token }}
        </el-button>
        <el-button size="small" @click="backspaceExpression">退格</el-button>    
        <el-button size="small" @click="clearAll">清空</el-button>
        <el-button
          type="primary"
          class="submit-button"
          size="small"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="submitExpression"
        >
          提交计算
        </el-button>
      </div>

      <el-alert
        v-if="resultText"
        class="calculator-message"
        type="success"
        :closable="false"
        title="计算结果"
        :description="resultText"
        show-icon
      />
      <el-alert
        v-if="requestError"
        class="calculator-message"
        type="error"
        :closable="false"
        title="计算失败"
        :description="requestError"
        show-icon
      />
    </el-card>
  </div>  
</template>
  
<script>
const calculatorExpression = require('../utils/calculatorExpression');

const API_URL = '/api/calculator/expressions';
const REQUEST_FIELD = 'expression';

export default {
  name: 'CalculatorModule',
  data() {
    return {
      expression: '',
      resultText: '',
      requestError: '',
      isSubmitting: false,
      functionKeys: [
        { label: 'ln', token: 'ln(' },
        { label: 'log', token: 'log(' },
        { label: 'xʸ', token: '^' },
        { label: '√', token: 'sqrt(' },
        { label: 'eˣ', token: 'exp(' },
        { label: 'sin', token: 'sin(' },
        { label: 'cos', token: 'cos(' },
        { label: 'tan', token: 'tan(' },
        { label: 'abs', token: 'abs(' },
        { label: 'round', token: 'round(' },
      ],
      numberKeys: [7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '.', '(', ')'],
    };
  },
  methods: {
    clearFeedback() {
      this.resultText = '';
      this.requestError = '';
    },
    appendKey(token) {
      this.expression = calculatorExpression.appendToken(this.expression, token);
      this.clearFeedback();
    },
    backspaceExpression() {
      this.expression = calculatorExpression.backspace(this.expression);
      this.clearFeedback();
    },
    clearAll() {
      this.expression = calculatorExpression.clearExpression(this.expression);
      this.clearFeedback();
    },
    async submitExpression() {
      const expression = calculatorExpression.getSubmittableExpression(this.expression);

      if (!expression) {
        this.$message.warning('请先输入表达式');
        return;
      }

      this.isSubmitting = true;
      this.clearFeedback();

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calculatorExpression.createRequestBody(expression, REQUEST_FIELD)),
        });
        this.resultText = await calculatorExpression.readCalculatorResponse(response);
      } catch (error) {
        this.requestError = error && error.message ? error.message : '请求失败';
        this.$message.error(this.requestError);
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.calculator-module {
  max-width: 820px;
  margin: 0 auto;
}

.calculator-card {
  border-radius: 8px;
}

.calculator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.calculator-hint {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}

.calculator-display {
  min-height: 64px;
  padding: 16px;
  overflow-x: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  color: #303133;
  font-family: Consolas, Monaco, monospace;
  font-size: 22px;
  line-height: 32px;
  text-align: right;
  white-space: nowrap;
}

.calculator-keyboard {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.calculator-keyboard .el-button {
  margin: 0;
}

.submit-button {
  grid-column: span 3;
}

.calculator-message {
  margin-top: 16px;
  white-space: pre-wrap;
}

@media (max-width: 560px) {
  .calculator-keyboard {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .submit-button {
    grid-column: span 3;
  }
}
</style>
