import React, { useState } from 'react';
import { Button, Input, Select, Card, Typography, Spin, Collapse, message, Divider, Switch, Alert } from 'antd';
import axios from 'axios';
import { CopyOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const LinkAIDebugger = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_LINK_AI_API_KEY || '');
  const [appCode, setAppCode] = useState(import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE || '');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [showResponse, setShowResponse] = useState('json');
  const [useCORS, setUseCORS] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [useCustomEndpoint, setUseCustomEndpoint] = useState(false);

  // 预设的应用代码
  const presetAppCodes = [
    { label: '病历解析', value: import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE || '' },
    { label: '治疗建议', value: import.meta.env.VITE_TREATMENT_RECOMMENDATION_APP_CODE || '' }
  ];

  // 测试查询示例
  const queryExamples = [
    {
      title: '病历解析示例',
      content: `患者基本信息：
住院号：ZY202501230
年龄：65岁
性别：女
疾病：升结肠腺癌
病理情况：升结肠腺癌，中分化，浸润至浆膜下层
基因检测：KRAS野生型, BRAFV600E, ALK、HER2阳性`
    },
    {
      title: '治疗建议示例',
      content: `{
  "hospitalNumber": "ZY202501230",
  "age": "65岁",
  "gender": "女",
  "diseaseType": "升结肠腺癌",
  "pathology": "升结肠腺癌，中分化，浸润至浆膜下层",
  "geneticTests": "KRAS野生型, BRAFV600E, ALK、HER2阳性"
}`
    }
  ];

  // API请求函数
  const callAPI = async () => {
    if (!apiKey) {
      message.error('请输入API密钥');
      return;
    }
    if (!appCode) {
      message.error('请输入应用代码');
      return;
    }
    if (!query.trim()) {
      message.error('请输入查询内容');
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);
    setRawResponse(null);

    try {
      const endpoint = useCustomEndpoint && customEndpoint 
        ? customEndpoint 
        : 'https://api.link-ai.tech/v1/chat/memory/completions';
      
      // 构建请求配置
      const requestConfig = {
        method: 'post',
        url: endpoint,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          app_code: appCode,
          messages: [
            { role: "user", content: query }
          ],
          stream: false
        },
        timeout: 30000
      };

      // 使用代理服务器绕过CORS，如果启用了该选项
      if (useCORS) {
        requestConfig.url = `https://cors-anywhere.herokuapp.com/${endpoint}`;
        requestConfig.headers['X-Requested-With'] = 'XMLHttpRequest';
      }

      console.log('发送API请求:', requestConfig.url);
      console.log('请求参数:', JSON.stringify(requestConfig.data, null, 2));

      const response = await axios(requestConfig);
      
      console.log('API响应:', response);
      setRawResponse(response.data);

      // 尝试提取内容
      if (response.data) {
        if (response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
          setResponse(response.data.choices[0].message.content);
        } else if (response.data.error) {
          setError(`API错误: ${response.data.error.message} (代码: ${response.data.error.code})`);
        } else {
          setResponse(JSON.stringify(response.data, null, 2));
        }
      } else {
        setError('API返回空响应');
      }
    } catch (err) {
      console.error('API调用错误:', err);
      
      let errorMessage = '调用API时发生错误';
      
      if (err.response) {
        // 服务器返回了错误状态码
        errorMessage = `服务器错误 (${err.response.status}): ${JSON.stringify(err.response.data)}`;
      } else if (err.request) {
        // 请求已发送但未收到响应
        errorMessage = '未收到服务器响应，请检查网络连接或API终端地址';
      } else {
        // 请求设置时出错
        errorMessage = `请求错误: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 复制内容到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        message.success('复制成功');
      },
      () => {
        message.error('复制失败');
      }
    );
  };

  // 使用示例查询
  const useExample = (example) => {
    setQuery(example.content);
    
    // 根据示例自动选择应用代码
    if (example.title.includes('病历解析')) {
      setAppCode(presetAppCodes[0].value);
    } else if (example.title.includes('治疗建议')) {
      setAppCode(presetAppCodes[1].value);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title={<Title level={3}>Link AI API 调试工具</Title>}>
        <Alert
          message="API调试说明"
          description={
            <ul>
              <li>本工具用于直接测试Link AI API，可以帮助你调试API请求和响应</li>
              <li>先检查API密钥和应用代码是否正确</li>
              <li>如果遇到CORS问题，可以尝试启用CORS代理（需要首先访问 <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank">CORS Anywhere</a> 申请临时访问权限）</li>
              <li>可以使用示例查询快速测试不同场景</li>
              <li>错误码429通常表示请求过于频繁，建议间隔一段时间再试</li>
            </ul>
          }
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '20px' }}
        />
        
        <div style={{ marginBottom: '20px' }}>
          <Text strong>API密钥:</Text>
          <Input.Password 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder="输入Link AI API密钥" 
            style={{ marginTop: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Text strong>应用代码:</Text>
          <Select 
            value={appCode} 
            onChange={setAppCode} 
            style={{ width: '100%', marginTop: '8px' }}
            placeholder="选择或输入应用代码"
            allowClear
          >
            {presetAppCodes.map((code, index) => (
              <Option key={index} value={code.value}>{code.label} ({code.value})</Option>
            ))}
          </Select>
        </div>
        
        <Collapse ghost style={{ marginBottom: '20px' }}>
          <Panel header="高级设置" key="1">
            <div style={{ marginBottom: '16px' }}>
              <Switch 
                checked={useCustomEndpoint} 
                onChange={setUseCustomEndpoint} 
                style={{ marginRight: '8px' }}
              />
              <Text>使用自定义API终端</Text>
              {useCustomEndpoint && (
                <Input 
                  value={customEndpoint} 
                  onChange={(e) => setCustomEndpoint(e.target.value)} 
                  placeholder="自定义API终端地址"
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            
            <div>
              <Switch 
                checked={useCORS} 
                onChange={setUseCORS} 
                style={{ marginRight: '8px' }}
              />
              <Text>使用CORS代理（解决跨域问题）</Text>
            </div>
          </Panel>
        </Collapse>

        <div style={{ marginBottom: '20px' }}>
          <Text strong>查询内容:</Text>
          <TextArea 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="输入查询内容" 
            rows={8}
            style={{ marginTop: '8px' }}
          />
          
          <div style={{ marginTop: '10px' }}>
            <Text>示例查询:</Text>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              {queryExamples.map((example, index) => (
                <Button key={index} onClick={() => useExample(example)}>
                  {example.title}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <Button type="primary" onClick={callAPI} loading={loading} size="large">
            发送请求
          </Button>
        </div>

        {loading && <div style={{ textAlign: 'center', margin: '20px 0' }}><Spin tip="请求中..." /></div>}

        {error && (
          <Alert 
            message="错误" 
            description={error} 
            type="error" 
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {(response || rawResponse) && (
          <>
            <Divider orientation="left">响应结果</Divider>
            
            <div style={{ marginBottom: '20px' }}>
              <Select 
                value={showResponse} 
                onChange={setShowResponse} 
                style={{ width: '200px', marginBottom: '10px' }}
              >
                <Option value="json">格式化JSON</Option>
                <Option value="raw">原始响应</Option>
                <Option value="text">提取文本</Option>
              </Select>
              
              <Button 
                icon={<CopyOutlined />} 
                onClick={() => copyToClipboard(
                  showResponse === 'raw' 
                    ? JSON.stringify(rawResponse, null, 2) 
                    : showResponse === 'text' 
                      ? response 
                      : JSON.stringify(response, null, 2)
                )}
                style={{ marginLeft: '10px' }}
              >
                复制
              </Button>
            </div>
            
            <Card>
              {showResponse === 'raw' && rawResponse && (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              )}
              
              {showResponse === 'text' && response && (
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {response}
                </div>
              )}
              
              {showResponse === 'json' && response && (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {typeof response === 'string' && response.startsWith('{') 
                    ? JSON.stringify(JSON.parse(response), null, 2) 
                    : typeof response === 'object' 
                      ? JSON.stringify(response, null, 2) 
                      : response}
                </pre>
              )}
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default LinkAIDebugger;