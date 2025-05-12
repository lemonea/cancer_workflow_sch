import React from 'react';
import { Form, Card, Button, Input, Select, message } from 'antd';
import { callLinkAIAPI, extractJSONFromText } from '../utils/apiService';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 将可能的对象转换为显示文本
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

const MedicalRecordParser = ({ initialData, onSave, loading }) => {
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(!initialData);

  // 设置初始表单值
  React.useEffect(() => {
    if (initialData) {
      // 确保所有表单值为字符串
      const formattedData = {};
      
      Object.entries(initialData).forEach(([key, value]) => {
        formattedData[key] = formatValue(value);
      });
      
      console.log("设置表单值:", formattedData);
      form.setFieldsValue(formattedData);
    }
  }, [initialData, form]);

  // 处理表单提交
  const handleSubmit = (values) => {
    onSave(values);
    setEditMode(false);
    message.success('患者信息已保存');
  };

  return (
    <Card title="患者基本信息" 
      extra={!loading && (
        <Button 
          type={editMode ? "default" : "primary"} 
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "取消" : "编辑"}
        </Button>
      )}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={!editMode}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item name="hospitalNumber" label="住院号" rules={[{ required: true }]}>
            <Input placeholder="请输入住院号" />
          </Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
            <Input placeholder="请输入年龄" />
          </Form.Item>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
            <Select placeholder="请选择性别">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item name="diseaseType" label="疾病类型" rules={[{ required: true }]}>
            <Input placeholder="请输入疾病类型" />
          </Form.Item>
        </div>
        
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
        
        {editMode && (
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存患者信息
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default MedicalRecordParser;