/**
 * 数据格式转换工具
 * 用于处理API返回的复杂数据结构，使其可以在React组件中正确显示
 */

/**
 * 将任何值转换为可显示的字符串
 * @param {any} value - 输入值（可能是对象、数组或其他类型）
 * @param {boolean} [useNewlines=true] - 是否在返回文本中使用换行符
 * @returns {string} - 格式化后的字符串
 */
export const formatValue = (value, useNewlines = true) => {
  // 处理null或undefined
  if (value === null || value === undefined) {
    return "";
  }
  
  // 处理字符串直接返回
  if (typeof value === 'string') {
    return value;
  }
  
  // 处理数组 - 转为逗号分隔的字符串
  if (Array.isArray(value)) {
    return value.map(item => formatValue(item, false)).join(', ');
  }
  
  // 处理对象 - 转为格式化文本
  if (typeof value === 'object') {
    try {
      const entries = Object.entries(value);
      
      // 如果是空对象，返回空字符串
      if (entries.length === 0) {
        return "";
      }
      
      // 根据需要使用换行符或逗号
      const separator = useNewlines ? '\n' : '; ';
      
      return entries
        .map(([key, val]) => `${key}: ${formatValue(val, false)}`)
        .join(separator);
    } catch (err) {
      console.error('格式化对象错误:', err);
      return JSON.stringify(value);
    }
  }
  
  // 其他类型直接转字符串
  return String(value);
};

/**
 * 确保对象中的所有值都是字符串
 * @param {object} data - 输入对象
 * @returns {object} - 所有值都转换为字符串的新对象
 */
export const ensureStringValues = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const result = {};
  
  Object.entries(data).forEach(([key, value]) => {
    result[key] = formatValue(value);
  });
  
  return result;
};

/**
 * 递归处理嵌套对象，使其可以安全地用于React表单
 * @param {object} data - 输入对象
 * @returns {object} - 处理后的对象
 */
export const prepareForForm = (data) => {
  if (!data) return {};
  
  const result = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // 特殊处理表单中需要嵌套对象的情况
    if (key === 'patientInfo' && typeof value === 'object') {
      result[key] = prepareForForm(value);
    } else {
      result[key] = formatValue(value);
    }
  });
  
  return result;
};

/**
 * 格式化实验室测试结果
 * 对检验结果对象进行特殊处理，生成更易读的格式
 * @param {object|string} labTests - 检验结果数据
 * @returns {string} - 格式化后的文本
 */
export const formatLabTests = (labTests) => {
  // 如果已经是字符串，直接返回
  if (typeof labTests === 'string') {
    return labTests;
  }
  
  // 如果是null或undefined，返回空字符串
  if (labTests === null || labTests === undefined) {
    return "";
  }
  
  // 如果是对象，格式化为结构化文本
  if (typeof labTests === 'object' && !Array.isArray(labTests)) {
    const sections = [];
    
    Object.entries(labTests).forEach(([category, tests]) => {
      sections.push(`【${category}】`);
      
      if (typeof tests === 'string') {
        sections.push(tests);
      } else if (typeof tests === 'object') {
        Object.entries(tests).forEach(([testName, result]) => {
          sections.push(`${testName}: ${result}`);
        });
      }
    });
    
    return sections.join('\n');
  }
  
  // 如果是数组，格式化为列表
  if (Array.isArray(labTests)) {
    return labTests.map(item => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object') {
        return formatValue(item, false);
      }
      return String(item);
    }).join('\n');
  }
  
  // 其他情况直接转字符串
  return String(labTests);
};

/**
 * 安全地获取复杂对象中的嵌套属性
 * @param {object} obj - 要检查的对象
 * @param {string} path - 属性路径，如 "patient.name"
 * @param {any} defaultValue - 如果路径不存在，返回的默认值
 * @returns {any} - 找到的属性值或默认值
 */
export const getNestedValue = (obj, path, defaultValue = "") => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    
    current = current[key];
  }
  
  return current === undefined || current === null ? defaultValue : current;
};

export default {
  formatValue,
  ensureStringValues,
  prepareForForm,
  formatLabTests,
  getNestedValue
};