// DebugTool.jsx - 将此文件添加到您的项目中

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Space, Collapse, Tag, Typography, Divider } from 'antd';
import { BugOutlined, ApiOutlined, FileTextOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// 调试工具组件
const DebugTool = ({ apiService }) => {
  const [apiLogs, setApiLogs] = useState([]);
  const [testMessage, setTestMessage] = useState('');
  const [mockData, setMockData] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({ size: 0, keys: [] });
  
  // 模拟数据
  const mockResponses = {
    patientInfo: {
      hospitalNumber: "ZY202411056",
      age: "62",
      gender: "男",
      diseaseType: "降结肠腺癌",
      pathology: "降结肠腺癌，中-低分化，浸润至浆膜层",
      labTests: "血常规：WBC 7.2×10^9/L，RBC 3.8×10^12/L",
      examinations: "腹部增强CT：降结肠见5.6×4.2cm肿块",
      geneticTests: "KRAS基因：12号密码子突变（G12D）"
    },
    recommendations: {
      treatmentPlan: "基于患者KRAS基因突变和无明确转移情况，建议行肿瘤根治术，术后采用FOLFOX方案辅助化疗6个月。由于KRAS突变状态，不推荐使用抗EGFR靶向药物。",
      prognosis: "患者为III期降结肠腺癌，KRAS突变。手术联合化疗后5年生存率约50-60%。需定期随访监测复发转移。",
      nutritionPlan: "手术前后均需高蛋白、易消化饮食，每日蛋白质摄入≥1.2g/kg体重。化疗期间注意补充维生素B族，保持充分水分摄入，少量多餐。避免刺激性食物。"
    }
  };
  
  // 初始化
  useEffect(() => {
    setMockData(mockResponses);
    
    // 覆盖控制台日志记录以捕获API相关日志
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      
      // 只捕获API相关日志
      const logString = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if (logString.includes('API') || logString.includes('api') || logString.includes('缓存')) {
        setApiLogs(prev => [...prev, { type: 'log', message: logString, time: new Date().toISOString() }]);
      }
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      
      const errorString = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setApiLogs(prev => [...prev, { type: 'error', message: errorString, time: new Date().toISOString() }]);
    };
    
    // 清理函数
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);
  
  // 检查API配置
  const checkApiConfig = () => {
    const apiKey = import.meta.env.VITE_LINK_AI_API_KEY;
    const parserAppCode = import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE;
    const recommendationAppCode = import.meta.env.VITE_TREATMENT_RECOMMENDATION_APP_CODE;
    
    setTestMessage(`
API配置信息:
- API密钥: ${apiKey ? '已配置' + (apiKey.length > 5 ? ` (${apiKey.substring(0, 3)}...)` : '') : '未配置'}
- 解析器应用代码: ${parserAppCode || '未配置'}
- 推荐生成器应用代码: ${recommendationAppCode || '未配置'}
- 环境: ${import.meta.env.MODE}
- 测试模式: ${import.meta.env.VITE_TEST_MODE === 'true' ? '启用' : '禁用'}
    `);
  };
  
  // 测试API调用
  const testApiCall = async () => {
    setTestMessage('测试API调用中...');
    
    try {
      if (typeof apiService?.callLinkAIAPI !== 'function') {
        throw new Error('API服务未正确加载或callLinkAIAPI函数不可用');
      }
      
      const appCode = import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE || "zAgFDEkr";
      const testQuery = "测试查询";
      
      const result = await apiService.callLinkAIAPI(appCode, testQuery, {
        timeout: 10000,
        useCache: true
      });
      
      setTestMessage(`API调用成功!\n结果: ${result ? result.substring(0, 100) + '...' : '无数据'}`);
    } catch (error) {
      setTestMessage(`API调用失败: ${error.message}`);
    }
  };
  
  // 检查API缓存
  const checkApiCache = () => {
    try {
      if (typeof apiService?.debugCache !== 'function') {
        throw new Error('API服务未正确加载或debugCache函数不可用');
      }
      
      const cacheStatus = apiService.debugCache();
      setCacheInfo(cacheStatus);
      setTestMessage(`缓存检查成功: ${cacheStatus.size}个项目`);
    } catch (error) {
      setTestMessage(`缓存检查失败: ${error.message}`);
    }
  };
  
  // 测试模拟数据
  const testMockData = () => {
    setTestMessage(JSON.stringify(mockData, null, 2));
  };
  
  // 清除日志
  const clearLogs = () => {
    setApiLogs([]);
    setTestMessage('');
  };
  
  return (
    <Card title={<div><BugOutlined /> 调试工具</div>} style={{ marginBottom: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button icon={<ApiOutlined />} onClick={checkApiConfig}>检查API配置</Button>
          <Button icon={<ApiOutlined />} onClick={testApiCall}>测试API调用</Button>
          <Button icon={<DatabaseOutlined />} onClick={checkApiCache}>检查缓存</Button>
          <Button icon={<FileTextOutlined />} onClick={testMockData}>查看模拟数据</Button>
          <Button danger onClick={clearLogs}>清除日志</Button>
        </div>
        
        {testMessage && (
          <TextArea 
            value={testMessage} 
            readOnly 
            rows={5} 
            style={{ marginTop: '10px' }}
          />
        )}
        
        <Divider orientation="left">缓存状态</Divider>
        <div>
          <Text strong>缓存大小: </Text>
          <Tag color="blue">{cacheInfo.size} 项</Tag>
        </div>
        
        {cacheInfo.keys?.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <Text strong>缓存键:</Text>
            <div style={{ marginTop: '5px' }}>
              {cacheInfo.keys.map((key, index) => (
                <Tag key={index} style={{ marginBottom: '5px' }}>{key}</Tag>
              ))}
            </div>
          </div>
        )}
        
        <Divider orientation="left">API日志</Divider>
        <Collapse>
          <Panel header={`API日志 (${apiLogs.length})`} key="1">
            {apiLogs.length > 0 ? (
              apiLogs.map((log, index) => (
                <div key={index} style={{ 
                  marginBottom: '5px', 
                  padding: '5px', 
                  backgroundColor: log.type === 'error' ? '#fff1f0' : '#f6ffed',
                  borderLeft: `3px solid ${log.type === 'error' ? '#ff4d4f' : '#52c41a'}`
                }}>
                  <Text type={log.type === 'error' ? 'danger' : 'success'} style={{ fontSize: '12px' }}>
                    [{new Date(log.time).toLocaleTimeString()}]
                  </Text>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {log.message}
                  </div>
                </div>
              ))
            ) : (
              <Text type="secondary">暂无API日志</Text>
            )}
          </Panel>
        </Collapse>
      </Space>
    </Card>
  );
};

export default DebugTool;