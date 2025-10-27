import React, { useState, useEffect } from 'react';
import { Typography, Form, Card, Button, Space, Empty, Modal, Input, Select, message } from 'antd';
import { PluginPage } from '@grafana/runtime';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface DashboardWidget {
  id: string;
  title: string;
  type: 'logs' | 'traces' | 'services' | 'metrics';
  query: string;
  filters: any[];
  timeRange: {
    start: number;
    end: number;
  };
  createdAt: string;
}

function ViewsPage() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [form] = Form.useForm();

  // LocalStorage'dan widget'ları yükle
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Error loading dashboard widgets:', error);
      }
    }
  }, []);

  // Widget'ları LocalStorage'a kaydet
  const saveWidgets = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('dashboardWidgets', JSON.stringify(newWidgets));
  };

  const handleAddWidget = () => {
    setEditingWidget(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditWidget = (widget: DashboardWidget) => {
    setEditingWidget(widget);
    
    // Filter'ları string olarak formatla
    const filtersText = widget.filters && widget.filters.length > 0 
      ? widget.filters.map(f => `${f.key} ${f.operator} "${f.value}"`).join(', ')
      : 'No filters';
    
    form.setFieldsValue({
      ...widget,
      filters: filtersText
    });
    setModalVisible(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    saveWidgets(newWidgets);
    message.success('Widget deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const widgetData: DashboardWidget = {
        id: editingWidget?.id || `widget-${Date.now()}`,
        title: values.title,
        type: values.type,
        query: values.query || '',
        filters: editingWidget?.filters || [], // Mevcut filter'ları koru
        timeRange: values.timeRange || {
          start: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
          end: Date.now()
        },
        createdAt: editingWidget?.createdAt || new Date().toISOString()
      };

      let newWidgets;
      if (editingWidget) {
        newWidgets = widgets.map(w => w.id === editingWidget.id ? widgetData : w);
        message.success('Widget updated successfully');
      } else {
        newWidgets = [...widgets, widgetData];
        message.success('Widget added to dashboard');
      }

      saveWidgets(newWidgets);
      setModalVisible(false);
      form.resetFields();
    }).catch(errorInfo => {
      // console.log('Validation failed:', errorInfo);
    });
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const renderWidget = (widget: DashboardWidget) => {
    return (
      <Card
        key={widget.id}
        title={widget.title}
        size="small"
        style={{ marginBottom: '16px' }}
        extra={
          <Space>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                // Widget'a tıklandığında query ve filter'ları URL'ye ekleyerek yönlendir
                const params = new URLSearchParams();
                if (widget.query) {
                  params.set('query', widget.query);
                }
                if (widget.filters && widget.filters.length > 0) {
                  params.set('filters', JSON.stringify(widget.filters));
                }
                if (widget.timeRange) {
                  params.set('start', new Date(widget.timeRange.start).toISOString());
                  params.set('end', new Date(widget.timeRange.end).toISOString());
                }
                
                const queryString = params.toString();
                const url = queryString ? `?${queryString}` : '';
                
                switch (widget.type) {
                  case 'logs':
                    window.location.href = `/a/iyzitrace-app/logs${url}`;
                    break;
                  case 'traces':
                    window.location.href = `/a/iyzitrace-app/traces${url}`;
                    break;
                  case 'services':
                    window.location.href = `/a/iyzitrace-app/services${url}`;
                    break;
                }
              }}
            >
              View
            </Button>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditWidget(widget)}
            >
              Edit
            </Button>
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDeleteWidget(widget.id)}
            >
              Delete
            </Button>
          </Space>
        }
      >
        <div>
          <Text strong>Type: </Text>
          <Text>{widget.type}</Text>
        </div>
        {widget.query && (
          <div>
            <Text strong>Query: </Text>
            <Text code>{widget.query}</Text>
          </div>
        )}
        {widget.filters.length > 0 && (
          <div>
            <Text strong>Filters: </Text>
            <Text>{widget.filters.length} active</Text>
          </div>
        )}
        <div>
          <Text strong>Created: </Text>
          <Text>{new Date(widget.createdAt).toLocaleDateString()}</Text>
        </div>
      </Card>
    );
  };

  return (
    <PluginPage>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: 0 }}>Views</Title>
            <Text style={{ color: '#8c8c8c' }}>
              Manage your views and quick access to different screens
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddWidget}
          >
            Add View
          </Button>
        </div>

        {widgets.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text style={{ color: '#8c8c8c' }}>No views added yet.</Text>
                <p style={{ color: '#595959', fontSize: '12px', marginTop: '8px' }}>
                  Click "Add View" to create your first view, or use "Save as View" from other pages.
                </p>
              </div>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {widgets.map(renderWidget)}
          </div>
        )}

        {/* Add/Edit Widget Modal */}
        <Modal
          title={editingWidget ? 'Edit View' : 'Add View to Dashboard'}
          open={modalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText={editingWidget ? 'Update' : 'Add'}
          cancelText="Cancel"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              type: 'logs',
              query: '',
              filters: []
            }}
          >
            <Form.Item
              label="View Title"
              name="title"
              rules={[{ required: true, message: 'Please enter view title' }]}
            >
              <Input placeholder="Enter view title" />
            </Form.Item>

            <Form.Item
              label="View Type"
              name="type"
              rules={[{ required: true, message: 'Please select view type' }]}
            >
              <Select placeholder="Select view type">
                <Option value="serviceMap">Service Map</Option>
                <Option value="services">Services</Option>
                <Option value="traces">Traces</Option>
                <Option value="logs">Logs</Option>
                <Option value="alerts">Alerts</Option>
                <Option value="exceptions">Exceptions</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Query (Optional)"
              name="query"
            >
              <Input.TextArea 
                placeholder="Enter query or leave empty for default view"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              label="Active Filters"
              name="filters"
            >
              <Input.TextArea 
                placeholder="Active filters will be displayed here"
                rows={2}
                readOnly
              />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <Input.TextArea 
                placeholder="Optional description for this view"
                rows={2}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PluginPage>
  );
}

export default ViewsPage;
