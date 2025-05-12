import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Upload, message, Tabs, Spin, Typography, Form, Input, Divider } from 'antd';
import { InboxOutlined, BugOutlined } from '@ant-design/icons';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

// 开启测试模式 - 在API调用失败时使用测试数据
const TEST_MODE = true;

// API URL
const API_URL = "https://api.link-ai.tech/v1/chat/completions";

// 环境调试组件
const EnvironmentChecker = () => {
  return (
    <Card title="环境变量检查" style={{ marginBottom: '20px' }}>
      <Paragraph>
        <Text strong>API密钥状态: </Text>
        {import.meta.env.VITE_LINK_AI_API_KEY ? '已设置' : '未设置'}
      </Paragraph>
      <Paragraph>
        <Text strong>解析器应用代码: </Text>
        {import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE || '未设置'}
      </Paragraph>
      <Paragraph>
        <Text strong>推荐生成器应用代码: </Text>
        {import.meta.env.VITE_TREATMENT_RECOMMENDATION_APP_CODE || '未设置'}
      </Paragraph>
      <Paragraph>
        <Text strong>当前环境: </Text>
        {import.meta.env.MODE}
      </Paragraph>
      <Paragraph>
        <Text strong>测试模式: </Text>
        {TEST_MODE ? '启用' : '禁用'}
      </Paragraph>
    </Card>
  );
};

function App() {
  // 状态变量
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [manualInput, setManualInput] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [form] = Form.useForm();

  // 获取环境变量
  const API_KEY = import.meta.env.VITE_LINK_AI_API_KEY || '';
  const PARSER_APP_CODE = import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE || '';
  const RECOMMENDATION_APP_CODE = import.meta.env.VITE_TREATMENT_RECOMMENDATION_APP_CODE || '';

  // 启动时检查环境变量
  useEffect(() => {
    console.log("应用初始化:");
    console.log("- 当前环境:", import.meta.env.MODE);
    console.log("- API密钥状态:", API_KEY ? '已设置' : '未设置');
    console.log("- 解析器应用代码:", PARSER_APP_CODE);
    console.log("- 推荐生成器应用代码:", RECOMMENDATION_APP_CODE);
    console.log("- 测试模式:", TEST_MODE ? '启用' : '禁用');
    
    // 添加快捷键切换调试模式
    const handleKeyDown = (event) => {
      // 按Ctrl+D打开调试模式
      if (event.ctrlKey && event.key === 'd') {
        setDebugMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [API_KEY, PARSER_APP_CODE, RECOMMENDATION_APP_CODE]);

  // 格式化任意值为字符串
  const formatValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return Object.entries(value)
          .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
          .join('\n');
      } catch (err) {
        return JSON.stringify(value);
      }
    }
    return String(value);
  };

  // API调用函数
  const callLinkAIAPI = async (appCode, query) => {
    console.log(`调用Link AI API，应用代码: ${appCode}`);
    
    // 测试模式下，返回模拟数据
    if (TEST_MODE) {
      console.log("测试模式：返回模拟数据");
      if (appCode === RECOMMENDATION_APP_CODE) {
        return JSON.stringify({
          treatmentPlan: "基于患者KRAS基因突变和无明确转移情况，建议行肿瘤根治术，术后采用FOLFOX方案辅助化疗6个月。由于KRAS突变状态，不推荐使用抗EGFR靶向药物。",
          prognosis: "患者为III期降结肠腺癌，KRAS突变。手术联合化疗后5年生存率约50-60%。需定期随访监测复发转移。",
          nutritionPlan: "手术前后均需高蛋白、易消化饮食，每日蛋白质摄入≥1.2g/kg体重。化疗期间注意补充维生素B族，保持充分水分摄入，少量多餐。避免刺激性食物。"
        });
      } else {
        return JSON.stringify({
          hospitalNumber: "ZY202411056",
          age: "62",
          gender: "男",
          diseaseType: "降结肠腺癌",
          pathology: "降结肠腺癌，中-低分化，浸润至浆膜层",
          labTests: {
            血常规: "WBC 7.2×10^9/L，RBC 3.8×10^12/L",
            肝功能: "ALT 32U/L，AST 28U/L",
            肾功能: "BUN 5.2mmol/L，Cr 68μmol/L",
            电解质: "Na+ 141mmol/L，K+ 4.2mmol/L"
          },
          examinations: "腹部增强CT：降结肠见5.6×4.2cm肿块",
          geneticTests: "KRAS基因：12号密码子突变（G12D）"
        });
      }
    }
    
    // 确保内容为字符串
    let processedQuery = query;
    if (typeof query === 'object' && query !== null) {
      try {
        processedQuery = JSON.stringify(query);
        console.log('对象已转换为字符串，长度:', processedQuery.length);
      } catch (err) {
        console.error('查询序列化失败:', err);
        throw new Error('内容处理失败');
      }
    }
    
    console.log(`处理后查询内容类型: ${typeof processedQuery}`);
    console.log(`处理后查询内容长度: ${processedQuery.length}`);
    
    // 创建请求头和请求体
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${API_KEY}`);
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
      "app_code": appCode,
      "messages": [
        {
          "role": "user",
          "content": processedQuery
        }
      ]
    });
    
    console.log('请求体:', raw);
    
    // 请求选项
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };
    
    try {
      // 发送请求
      const response = await fetch(API_URL, requestOptions);
      const responseText = await response.text();
      
      console.log('API原始响应:', responseText);
      
      // 解析响应
      try {
        const responseData = JSON.parse(responseText);
        
        // 检查错误
        if (responseData.error) {
          throw new Error(`API错误: ${responseData.error.message} (${responseData.error.code})`);
        }
        
        // 提取内容
        if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
          return responseData.choices[0].message.content;
        }
        
        throw new Error('无效的API响应格式');
      } catch (parseError) {
        throw new Error(`解析API响应失败: ${parseError.message}`);
      }
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  };

  // API连接测试
  const testApiConnection = async () => {
    setLoading(true);
    
    try {
      if (!API_KEY || !PARSER_APP_CODE) {
        throw new Error('缺少API密钥或应用代码');
      }
      
      // 极简请求
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${API_KEY}`);
      myHeaders.append("Content-Type", "application/json");
      
      const raw = JSON.stringify({
        "app_code": PARSER_APP_CODE,
        "messages": [
          { "role": "user", "content": "测试查询" }
        ]
      });
      
      console.log('测试请求体:', raw);
      
      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };
      
      const response = await fetch(API_URL, requestOptions);
      const responseText = await response.text();
      console.log('API测试响应:', responseText);
      
      setApiTestResult(responseText);
      message.success('API测试完成，请检查结果');
    } catch (error) {
      console.error('API测试失败:', error);
      setApiTestResult(`错误: ${error.message}`);
      message.error('API测试失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 解析JSON辅助函数
  const extractJSONFromText = (text) => {
    try {
      // 尝试直接解析
      return JSON.parse(text);
    } catch (e) {
      console.log('直接解析JSON失败，尝试从文本中提取');
      // 尝试从文本中提取JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('JSON提取后解析失败:', innerError);
        }
      }
      console.error('无法从文本中提取JSON');
      return null;
    }
  };

  // 读取文件内容
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // 处理文件上传
  const handleFileUpload = async (info) => {
    const { status } = info.file;
    
    console.log("文件上传状态:", status);
    
    if (status === 'done') {
      setLoading(true);
      message.loading('正在解析病历文件...');
      
      try {
        // 读取文件内容
        const fileContent = await readFileContent(info.file.originFileObj);
        console.log(`文件长度: ${fileContent.length}`);
        
        // 构建查询
        const query = {
          type: "病历解析请求",
          content: fileContent,
          request: "请解析此病历中的患者基本信息，包括病历号、年龄、性别、疾病类型、病理信息、检验结果、检查结果和基因检测数据"
        };
        
        // 调用Link AI解析病历
        console.log('开始解析病历...');
        const result = await callLinkAIAPI(PARSER_APP_CODE, query);
        
        // 解析返回的JSON
        const parsedInfo = extractJSONFromText(result);
        
        if (parsedInfo) {
          console.log('解析病历成功');
          setPatientInfo(parsedInfo);
          setActiveTab("2");
          message.success('病历解析成功');
        } else {
          message.error('病历解析失败，请尝试手动输入');
          setManualInput(true);
        }
      } catch (error) {
        console.error('文件处理错误:', error);
        message.error('文件处理失败: ' + error.message);
        setManualInput(true);
      } finally {
        setLoading(false);
      }
    } else if (status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 使用测试数据
  const useTestData = () => {
    setLoading(true);
    
    setTimeout(() => {
      setPatientInfo({
        hospitalNumber: "ZY202411056",
        age: "62",
        gender: "男",
        diseaseType: "降结肠腺癌",
        pathology: "降结肠腺癌，中-低分化，浸润至浆膜层",
        labTests: {
          血常规: "WBC 7.2×10^9/L，RBC 3.8×10^12/L",
          肝功能: "ALT 32U/L，AST 28U/L",
          肾功能: "BUN 5.2mmol/L，Cr 68μmol/L",
          电解质: "Na+ 141mmol/L，K+ 4.2mmol/L"
        },
        examinations: "腹部增强CT：降结肠见5.6×4.2cm肿块",
        geneticTests: "KRAS基因：12号密码子突变（G12D）"
      });
      setActiveTab("2");
      message.success('已加载测试数据');
      setLoading(false);
    }, 1000);
  };

  // 手动提交患者信息
  const handleManualSubmit = (values) => {
    setPatientInfo(values);
    setActiveTab("2");
    message.success('患者信息已保存');
  };

  // 生成治疗建议
  const generateRecommendations = async () => {
    if (!patientInfo) {
      message.warning('请先提供患者信息');
      return;
    }
    
    setLoading(true);
    message.loading('正在生成治疗建议...');
    
    try {
      // 构建查询对象
      const query = {
        patient: patientInfo,
        request: "基于患者信息，生成肠癌个性化治疗方案，包括治疗建议、预后评估和营养支持计划"
      };
      
      // 调用Link AI生成治疗建议
      console.log('开始生成治疗建议...');
      const result = await callLinkAIAPI(RECOMMENDATION_APP_CODE, query);
      
      // 解析返回的JSON
      const parsedRecommendations = extractJSONFromText(result);
      
      if (parsedRecommendations) {
        console.log('生成治疗建议成功');
        setRecommendations(parsedRecommendations);
        setActiveTab("3");
        message.success('治疗建议生成成功');
      } else {
        message.error('治疗建议生成失败，请重试');
      }
    } catch (error) {
      console.error('生成建议错误:', error);
      message.error('生成建议失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 上传组件配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76', // 假上传URL
    onChange: handleFileUpload,
    customRequest: ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    }
  };

  // 渲染患者信息展示内容
  const renderPatientInfo = () => {
    if (!patientInfo) return null;
    
    return (
      <Card title="患者基本信息">
        <p><strong>住院号:</strong> {formatValue(patientInfo.hospitalNumber)}</p>
        <p><strong>年龄:</strong> {formatValue(patientInfo.age)}</p>
        <p><strong>性别:</strong> {formatValue(patientInfo.gender)}</p>
        <p><strong>疾病类型:</strong> {formatValue(patientInfo.diseaseType)}</p>
        
        {patientInfo.pathology && (
          <>
            <Divider />
            <Title level={5}>病理信息</Title>
            <p style={{ whiteSpace: 'pre-line' }}>{formatValue(patientInfo.pathology)}</p>
          </>
        )}
        
        {patientInfo.labTests && (
          <>
            <Divider />
            <Title level={5}>检验结果</Title>
            <p style={{ whiteSpace: 'pre-line' }}>{formatValue(patientInfo.labTests)}</p>
          </>
        )}
        
        {patientInfo.examinations && (
          <>
            <Divider />
            <Title level={5}>检查结果</Title>
            <p style={{ whiteSpace: 'pre-line' }}>{formatValue(patientInfo.examinations)}</p>
          </>
        )}
        
        {patientInfo.geneticTests && (
          <>
            <Divider />
            <Title level={5}>基因检测数据</Title>
            <p style={{ whiteSpace: 'pre-line' }}>{formatValue(patientInfo.geneticTests)}</p>
          </>
        )}
        
        <Divider />
        <Button type="primary" onClick={generateRecommendations}>
          生成治疗建议
        </Button>
      </Card>
    );
  };
  
  // 渲染治疗建议内容
  const renderRecommendations = () => {
    if (!recommendations) return null;
    
    return (
      <Card title="肠癌治疗建议">
        <Title level={5}>治疗方案</Title>
        <Paragraph style={{ whiteSpace: 'pre-line' }}>{formatValue(recommendations.treatmentPlan)}</Paragraph>
        
        <Divider />
        <Title level={5}>预后说明</Title>
        <Paragraph style={{ whiteSpace: 'pre-line' }}>{formatValue(recommendations.prognosis)}</Paragraph>
        
        <Divider />
        <Title level={5}>营养方案</Title>
        <Paragraph style={{ whiteSpace: 'pre-line' }}>{formatValue(recommendations.nutritionPlan)}</Paragraph>
        
        <Divider />
        <Text type="secondary">
          注意：以上建议仅供参考，具体治疗方案请遵医嘱。
        </Text>
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: '0 20px' }}>
        <div style={{ color: 'white', fontSize: '20px', lineHeight: '64px', display: 'flex', justifyContent: 'space-between' }}>
          <span>肠癌病情评估系统</span>
          {debugMode && <span style={{ fontSize: '14px', color: '#ff4d4f' }}>调试模式</span>}
        </div>
      </Header>
      
      <Content style={{ padding: '20px' }}>
        {/* 调试面板 */}
        {debugMode && (
          <>
            <EnvironmentChecker />
            <Card title="API调试" style={{ marginBottom: '20px' }}>
              <Button type="primary" onClick={testApiConnection} loading={loading} style={{ marginBottom: '10px' }}>
                测试API连接
              </Button>
              <Button type="default" onClick={useTestData} style={{ marginLeft: '10px', marginBottom: '10px' }}>
                使用测试数据
              </Button>
              {apiTestResult && (
                <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{apiTestResult}</pre>
                </div>
              )}
            </Card>
          </>
        )}
        
        <Spin spinning={loading} tip="处理中...">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 输入患者信息标签页 */}
            <Tabs.TabPane tab="输入患者信息" key="1">
              <Card>
                <Title level={4}>选择输入方式</Title>
                <Button 
                  type={!manualInput ? "primary" : "default"}
                  onClick={() => setManualInput(false)}
                  style={{ marginRight: '10px' }}
                >
                  上传病历文件
                </Button>
                <Button 
                  type={manualInput ? "primary" : "default"}
                  onClick={() => setManualInput(true)}
                >
                  手动输入
                </Button>
                
                <Divider />
                
                {!manualInput ? (
                  <div>
                    <Paragraph>请上传患者病历文件（支持txt格式）</Paragraph>
                    <Dragger {...uploadProps} accept=".txt">
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">点击或拖拽文件至此区域上传</p>
                      <p className="ant-upload-hint">
                        系统将自动解析患者信息，您也可以在下一步中修改
                      </p>
                    </Dragger>
                  </div>
                ) : (
                  <Form 
                    form={form}
                    layout="vertical"
                    onFinish={handleManualSubmit}
                  >
                    <Form.Item name="hospitalNumber" label="住院号" rules={[{ required: true }]}>
                      <Input placeholder="请输入住院号" />
                    </Form.Item>
                    <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
                      <Input placeholder="请输入年龄" />
                    </Form.Item>
                    <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                      <Input placeholder="请输入性别" />
                    </Form.Item>
                    <Form.Item name="diseaseType" label="疾病类型" rules={[{ required: true }]}>
                      <Input placeholder="请输入疾病类型" />
                    </Form.Item>
                    <Form.Item name="pathology" label="病理信息">
                      <TextArea rows={4} placeholder="请输入病理信息" />
                    </Form.Item>
                    <Form.Item name="labTests" label="检验结果">
                      <TextArea rows={4} placeholder="请输入检验结果" />
                    </Form.Item>
                    <Form.Item name="examinations" label="检查结果">
                      <TextArea rows={4} placeholder="请输入检查结果" />
                    </Form.Item>
                    <Form.Item name="geneticTests" label="基因检测数据">
                      <TextArea rows={4} placeholder="请输入基因检测数据" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        保存患者信息
                      </Button>
                    </Form.Item>
                  </Form>
                )}
                
                {/* 调试模式切换 */}
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <Button 
                    icon={<BugOutlined />} 
                    type={debugMode ? "primary" : "text"}
                    onClick={() => setDebugMode(!debugMode)}
                  >
                    {debugMode ? "关闭调试模式" : "调试模式"}
                  </Button>
                </div>
              </Card>
            </Tabs.TabPane>
            
            {/* 患者信息展示标签页 */}
            <Tabs.TabPane tab="患者信息" key="2" disabled={!patientInfo}>
              {renderPatientInfo()}
            </Tabs.TabPane>
            
            {/* 治疗建议标签页 */}
            <Tabs.TabPane tab="治疗建议" key="3" disabled={!recommendations}>
              {renderRecommendations()}
            </Tabs.TabPane>
          </Tabs>
        </Spin>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        肠癌病情评估系统 ©2025
      </Footer>
    </Layout>
  );
}

export default App;