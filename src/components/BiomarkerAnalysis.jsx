import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Avatar, Spin, Alert, Empty, Typography } from 'antd';

const { Paragraph } = Typography;

/**
 * 将可能的对象转换为可显示文本
 * @param {any} value - 要显示的值
 * @returns {string} - 格式化后的显示文本
 */
const formatValue = (value) => {
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
    return value.map(item => formatValue(item)).join(', ');
  }
  
  // 处理对象 - 转为格式化文本
  if (typeof value === 'object') {
    try {
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${formatValue(val)}`)
        .join('\n');
    } catch (err) {
      console.error('格式化对象错误:', err);
      return JSON.stringify(value);
    }
  }
  
  // 其他类型直接转字符串
  return String(value);
};

// 提取生物标志物的改进函数
const extractBiomarkersFromText = (text) => {
  if (!text) return [];
  
  console.log("Analyzing text for biomarkers");
  
  // 确保文本是字符串
  const textStr = formatValue(text);
  
  const COMMON_BIOMARKERS = [
    'KRAS', 'BRAF', 'NRAS', 'EGFR', 'ALK', 'ROS1', 'MET', 'ERBB2', 'HER2', 
    'BRCA1', 'BRCA2', 'PIK3CA', 'PTEN', 'TP53', 'RB1', 'NF1', 'NF2'
  ];
  
  const results = [];
  
  // 检查文本中是否包含常见生物标志物
  for (const biomarker of COMMON_BIOMARKERS) {
    const biomarkerRegex = new RegExp(biomarker + '[^a-zA-Z0-9]|' + biomarker + '$', 'i');
    
    if (biomarkerRegex.test(textStr)) {
      console.log(`Found biomarker: ${biomarker}`);
      
      // 尝试找到突变状态
      let mutation = 'Unknown';
      let status = 'Unknown';
      
      // 使用多个模式尝试找到突变状态
      const mutationPatterns = [
        // 特定突变，如 G12D, V600E 等
        new RegExp(`${biomarker}[^a-zA-Z0-9]*(([A-Z]\\d+[A-Z])|突变|mutation)`, 'i'),
        // 野生型检测
        new RegExp(`${biomarker}[^a-zA-Z0-9]*(wild[\\-\\s]type|野生型)`, 'i'),
        // 阳性/阴性检测
        new RegExp(`${biomarker}[^a-zA-Z0-9]*(阳性|阴性|positive|negative)`, 'i')
      ];
      
      for (const pattern of mutationPatterns) {
        const match = textStr.match(pattern);
        if (match) {
          mutation = match[1];
          
          // 确定突变状态
          if (/wild[\\-\\s]type|野生型|阴性|negative/i.test(mutation)) {
            status = 'Normal';
          } else if (/突变|mutation|阳性|positive|[A-Z]\d+[A-Z]/i.test(mutation)) {
            status = 'Mutated';
          }
          
          break;
        }
      }
      
      results.push({ name: biomarker, mutation, status });
    }
  }
  
  return results;
};

const BiomarkerAnalysis = ({ patientInfo, onAnalysisComplete }) => {
  const [biomarkers, setBiomarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientInfo) {
      analyzePatient();
    }
  }, [patientInfo]);

  const analyzePatient = async () => {
    if (!patientInfo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Analyzing patient info for biomarkers");
      
      // 将患者信息转为文本
      let patientText = '';
      if (typeof patientInfo === 'string') {
        patientText = patientInfo;
      } else {
        // 确保所有字段都是字符串，处理可能的嵌套对象
        patientText = Object.entries(patientInfo)
          .map(([key, value]) => `${key}: ${formatValue(value)}`)
          .join('\n');
      }
      
      console.log("Patient text prepared for analysis");
      
      // 改进的生物标志物提取逻辑
      const extractedBiomarkers = extractBiomarkersFromText(patientText);
      console.log("Extracted biomarkers:", extractedBiomarkers);
      
      setBiomarkers(extractedBiomarkers);
      
      // 通知父组件分析完成
      if (onAnalysisComplete) {
        onAnalysisComplete(extractedBiomarkers);
      }
    } catch (err) {
      console.error('生物标志物分析错误:', err);
      setError('分析过程中出现错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin tip="分析中..." />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <Card title="生物标志物分析" style={{ marginTop: '20px' }}>
      {biomarkers.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={biomarkers}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    style={{ 
                      backgroundColor: 
                        item.status === 'Mutated' ? '#ff4d4f' : 
                        item.status === 'Normal' ? '#52c41a' : 
                        '#faad14' 
                    }}
                  >
                    {item.name.charAt(0)}
                  </Avatar>
                }
                title={
                  <span>
                    {item.name} 
                    <Tag 
                      color={
                        item.status === 'Mutated' ? 'red' : 
                        item.status === 'Normal' ? 'green' : 
                        'orange'
                      }
                      style={{ marginLeft: '8px' }}
                    >
                      {item.status}
                    </Tag>
                  </span>
                }
                description={
                  <Paragraph>
                    检测结果: {item.mutation}
                  </Paragraph>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="未检测到生物标志物" />
      )}
    </Card>
  );
};

export default BiomarkerAnalysis;