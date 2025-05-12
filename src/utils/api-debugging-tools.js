/**
 * API调试工具集
 * 用于诊断Link AI API调用问题
 */

/**
 * 调试函数 - 打印API调用详情
 * @param {string} appCode - 应用代码
 * @param {any} content - 原始请求内容
 * @param {object} requestBody - 完整的请求体
 */
export function debugApiRequest(appCode, content, requestBody) {
  console.group("🔍 API请求调试");
  console.log("应用代码:", appCode);
  console.log("原始内容类型:", typeof content);
  
  // 处理不同类型的内容显示
  if (typeof content === 'string') {
    if (content.length > 100) {
      console.log("原始内容(截取):", content.substring(0, 100) + "...");
    } else {
      console.log("原始内容:", content);
    }
  } else if (content === null) {
    console.log("原始内容: null");
  } else if (content === undefined) {
    console.log("原始内容: undefined");
  } else {
    try {
      console.log("原始内容(对象):", content);
    } catch (err) {
      console.log("原始内容: [无法显示]");
    }
  }
  
  // 处理消息内容显示
  const messageContent = requestBody.messages[0].content;
  console.log("处理后内容类型:", typeof messageContent);
  if (typeof messageContent === 'string') {
    console.log("内容长度:", messageContent.length);
    if (messageContent.length > 100) {
      console.log("处理后内容(截取):", messageContent.substring(0, 100) + "...");
    } else {
      console.log("处理后内容:", messageContent);
    }
  } else {
    console.log("处理后内容:", messageContent);
  }
  
  try {
    const requestStr = JSON.stringify(requestBody);
    console.log("请求体长度:", requestStr.length);
    console.log("完整请求体(截取):", requestStr.substring(0, 200) + (requestStr.length > 200 ? "..." : ""));
  } catch (err) {
    console.log("请求体序列化失败:", err.message);
  }
  
  console.groupEnd();
  
  return {
    appCode,
    contentType: typeof content,
    contentLength: typeof content === 'string' ? content.length : 'n/a',
    messageContentLength: typeof messageContent === 'string' ? messageContent.length : 'n/a',
    requestBodySize: JSON.stringify(requestBody).length
  };
}

/**
 * 确保API请求内容有效
 * @param {any} content - 原始内容
 * @returns {string} - 处理后的内容
 */
export function processContent(content) {
  // 处理空值
  if (content === undefined || content === null) {
    console.warn("⚠️ 警告: API请求内容为空，使用默认内容");
    return "默认查询"; 
  }
  
  // 处理字符串 
  if (typeof content === "string") {
    // 移除可能导致问题的控制字符
    const cleaned = content
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
      .trim();
      
    if (cleaned.length === 0) {
      console.warn("⚠️ 警告: API请求内容为空字符串，使用默认内容");
      return "默认查询";
    }
    
    // 限制长度，防止过大请求
    if (cleaned.length > 10000) {
      console.warn(`⚠️ 警告: 内容过长(${cleaned.length}字符)，已截断`);
      return cleaned.substring(0, 10000) + "...";
    }
    
    return cleaned;
  }
  
  // 处理对象
  try {
    // 如果是文件内容或患者信息对象，特殊处理以提取有用信息
    if (typeof content === 'object' && content !== null) {
      // 检测是否为患者信息对象
      if (content.hospitalNumber || content.patientInfo || content.age || 
          content.gender || content.diseaseType) {
        
        const query = {
          type: "医疗记录分析",
          patientInfo: content.patientInfo || content,
          request: "请解析此病历中的信息，提取关键数据"
        };
        
        const jsonString = JSON.stringify(query);
        console.log("✅ 已转换患者信息对象:", jsonString.substring(0, 100) + "...");
        return jsonString;
      }
    }
    
    // 一般对象处理
    const jsonStr = JSON.stringify(content);
    if (jsonStr === "{}" || jsonStr === "[]") {
      console.warn("⚠️ 警告: API请求内容为空对象/数组，使用默认内容");
      return "默认查询";
    }
    
    // 限制长度
    if (jsonStr.length > 10000) {
      console.warn(`⚠️ 警告: 序列化内容过长(${jsonStr.length}字符)，已截断`);
      return jsonStr.substring(0, 10000) + "...";
    }
    
    return jsonStr;
  } catch (err) {
    console.error("❌ 内容JSON转换失败:", err);
    return "默认查询";
  }
}

/**
 * 分析API响应
 * @param {string} responseText - API响应文本
 * @returns {object} 分析结果
 */
export function analyzeApiResponse(responseText) {
  console.group("🔎 API响应分析");
  
  try {
    console.log("响应长度:", responseText ? responseText.length : 0);
    
    if (!responseText) {
      console.warn("⚠️ 响应为空");
      console.groupEnd();
      return { valid: false, error: "空响应" };
    }
    
    // 尝试解析JSON
    let parsed;
    try {
      parsed = JSON.parse(responseText);
      console.log("响应已成功解析为JSON");
    } catch (err) {
      console.error("❌ 响应不是有效JSON:", err.message);
      console.log("原始响应:", responseText.substring(0, 200) + "...");
      console.groupEnd();
      return { valid: false, error: "无效JSON", raw: responseText };
    }
    
    // 检查错误
    if (parsed.error) {
      console.error("❌ API返回错误:", parsed.error);
      console.groupEnd();
      return { 
        valid: false, 
        error: parsed.error,
        errorType: "api_error",
        code: parsed.error.code,
        message: parsed.error.message
      };
    }
    
    // 检查响应格式
    if (!parsed.choices || !Array.isArray(parsed.choices) || parsed.choices.length === 0) {
      console.error("❌ 响应格式不符合预期(缺少choices数组)");
      console.log("完整响应:", parsed);
      console.groupEnd();
      return { 
        valid: false, 
        error: "格式错误", 
        errorType: "format_error",
        response: parsed 
      };
    }
    
    // 检查消息内容
    const message = parsed.choices[0].message;
    if (!message || !message.content) {
      console.error("❌ 响应消息内容缺失");
      console.log("完整响应:", parsed);
      console.groupEnd();
      return { 
        valid: false, 
        error: "内容缺失", 
        errorType: "content_missing",
        response: parsed 
      };
    }
    
    // 有效响应
    console.log("✅ 有效的API响应");
    console.log("响应内容:", message.content.substring(0, 100) + "...");
    
    // 检查是否是JSON字符串
    let contentObj = null;
    try {
      contentObj = JSON.parse(message.content);
      console.log("✅ 内容是有效的JSON对象");
    } catch (err) {
      console.log("内容不是JSON对象(这可能是正常的)");
    }
    
    console.groupEnd();
    return { 
      valid: true, 
      content: message.content,
      contentObject: contentObj,
      responseObject: parsed,
      usage: parsed.usage
    };
  } catch (err) {
    console.error("❌ 响应分析出错:", err);
    console.groupEnd();
    return { valid: false, error: err.message, errorType: "analysis_error" };
  }
}

/**
 * 记录API请求/响应到本地存储，方便调试
 * @param {string} appCode - 应用代码
 * @param {any} request - 请求内容
 * @param {any} response - 响应内容
 */
export function logApiTransaction(appCode, request, response) {
  try {
    // 获取现有日志
    const logsJson = localStorage.getItem('api_debug_logs') || '[]';
    const logs = JSON.parse(logsJson);
    
    // 添加新日志
    logs.push({
      timestamp: new Date().toISOString(),
      appCode,
      request: typeof request === 'string' ? request.substring(0, 500) : JSON.stringify(request).substring(0, 500),
      response: typeof response === 'string' ? response.substring(0, 500) : JSON.stringify(response).substring(0, 500),
      success: response && !response.error
    });
    
    // 保留最近的20条记录
    if (logs.length > 20) {
      logs.shift();
    }
    
    // 保存回本地存储
    localStorage.setItem('api_debug_logs', JSON.stringify(logs));
    
    console.log(`📝 API交互已记录，共${logs.length}条记录`);
  } catch (err) {
    console.error("记录API交互失败:", err);
  }
}

/**
 * 创建API请求体
 * @param {string} appCode - 应用代码
 * @param {any} content - 请求内容
 * @returns {object} 请求体对象
 */
export function createApiRequestBody(appCode, content) {
  // 处理内容
  const processedContent = processContent(content);
  
  // 构建请求体
  const requestBody = {
    app_code: appCode,
    messages: [{
      role: "user",
      content: processedContent
    }],
    stream: false
  };
  
  // 记录调试信息
  debugApiRequest(appCode, content, requestBody);
  
  return requestBody;
}

// 导出完整工具集
export default {
  debugApiRequest,
  processContent,
  analyzeApiResponse,
  logApiTransaction,
  createApiRequestBody
};