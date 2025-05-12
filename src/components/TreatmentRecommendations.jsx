import React from 'react';
import { Card, Typography, Divider, Button, Skeleton, Result, Alert } from 'antd';
import { MedicineBoxOutlined, BarChartOutlined, CoffeeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

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

/**
 * 治疗建议组件
 * 
 * @param {Object} patientInfo - 患者信息
 * @param {Object} recommendations - 治疗建议数据
 * @param {Function} onGenerateRecommendations - 生成建议的回调函数
 * @param {boolean} loading - 加载状态
 */
const TreatmentRecommendations = ({ 
  patientInfo, 
  recommendations, 
  onGenerateRecommendations, 
  loading 
}) => {
  
  // 如果没有患者信息，显示提示
  if (!patientInfo) {
    return (
      <Result
        status="warning"
        title="缺少患者信息"
        subTitle="请先上传并确认患者病历信息"
      />
    );
  }
  
  // 如果正在加载中
  if (loading) {
    return (
      <Card title="正在生成治疗建议...">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }
  
  // 如果已经有建议数据
  if (recommendations) {
    // 确保所有数据都是字符串
    const formattedRecommendations = {
      treatmentPlan: formatValue(recommendations.treatmentPlan),
      prognosis: formatValue(recommendations.prognosis),
      nutritionPlan: formatValue(recommendations.nutritionPlan)
    };
    
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
            <span>肠癌治疗建议</span>
          </div>
        }
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
      >
        <Alert
          message="系统生成的建议仅供医生参考"
          description="以下建议基于当前输入的患者信息自动生成，最终治疗方案应由医生根据患者具体情况决定。"
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <section style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ marginRight: '8px' }} />
            治疗方案
          </Title>
          <Paragraph style={{ lineHeight: '1.8', whiteSpace: 'pre-line' }}>
            {formattedRecommendations.treatmentPlan}
          </Paragraph>
        </section>
        
        <Divider />
        
        <section style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ marginRight: '8px' }} />
            预后评估
          </Title>
          <Paragraph style={{ lineHeight: '1.8', whiteSpace: 'pre-line' }}>
            {formattedRecommendations.prognosis}
          </Paragraph>
        </section>
        
        <Divider />
        
        <section style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ display: 'flex', alignItems: 'center' }}>
            <CoffeeOutlined style={{ marginRight: '8px' }} />
            营养支持方案
          </Title>
          <Paragraph style={{ lineHeight: '1.8', whiteSpace: 'pre-line' }}>
            {formattedRecommendations.nutritionPlan}
          </Paragraph>
        </section>
        
        <Divider />
        
        <section>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ marginRight: '5px' }} />
            注意：以上建议仅供参考，具体治疗方案请遵医嘱
          </Text>
        </section>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button 
            type="primary" 
            onClick={onGenerateRecommendations}
            disabled={loading}
          >
            重新生成建议
          </Button>
        </div>
      </Card>
    );
  }
  
  // 默认显示生成按钮
  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <MedicineBoxOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
          <span>治疗建议</span>
        </div>
      }
    >
      <div style={{ textAlign: 'center', margin: '40px 0', padding: '20px' }}>
        <div style={{ fontSize: '64px', color: '#1890ff', marginBottom: '20px' }}>
          <MedicineBoxOutlined />
        </div>
        <Paragraph>
          基于患者信息生成个性化治疗建议，包括治疗方案、预后评估和营养支持方案
        </Paragraph>
        <Button
          type="primary"
          size="large"
          icon={<MedicineBoxOutlined />}
          onClick={onGenerateRecommendations}
          loading={loading}
          disabled={!patientInfo}
        >
          生成个性化治疗建议
        </Button>
      </div>
    </Card>
  );
};

export default TreatmentRecommendations;