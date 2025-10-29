import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Modal, Form, Input, message } from 'antd';
import { SaveOutlined, EditOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultSearchQuery } from '../../api/service/query.service';
import { getPluginSettings, savePluginSettings } from '../../api/service/settings.service';

interface ViewData {
  id: string;
  title: string;
  description?: string;
  page: string;
  query: string;
  createdAt: string;
}

interface ViewComponentProps {
  pageName: string;
}

const ViewComponent: React.FC<ViewComponentProps> = ({ pageName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [selectedView, setSelectedView] = useState<ViewData | null>(null);
  const [views, setViews] = useState<ViewData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingView, setEditingView] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load views from plugin settings or localStorage
  useEffect(() => {
    loadViews();
  }, []);

  const loadViews = async () => {
    try {
      // Önce plugin settings'den yükle
      const settings = await getPluginSettings();
      const pageViews = settings.pageViews || [];
      const currentPageViews = pageViews.filter((view: ViewData) => view.page === pageName);
      
      if (currentPageViews.length > 0) {
        setViews(currentPageViews);
      } else {
        // Plugin settings'de yoksa localStorage'dan yükle
        const localViews = localStorage.getItem(`iyzitrace-views-${pageName}`);
        if (localViews) {
          const parsedViews = JSON.parse(localViews);
          setViews(parsedViews);
        }
      }
    } catch (error) {
      console.error('Error loading views from plugin settings, trying localStorage:', error);
      // Plugin settings başarısız olursa localStorage'dan yükle
      const localViews = localStorage.getItem(`iyzitrace-views-${pageName}`);
      if (localViews) {
        const parsedViews = JSON.parse(localViews);
        setViews(parsedViews);
      }
    }
  };

  const handleSaveAsView = () => {
    setEditingView(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleUpdateView = () => {
    if (selectedView) {
      setEditingView(selectedView);
      form.setFieldsValue({
        title: selectedView.title,
        description: selectedView.description
      });
      setModalVisible(true);
    }
  };

  const handleClearView = () => {
    setSelectedView(null);
    // Reset URL to default parameters
    const defaultQuery = getDefaultSearchQuery();
    navigate(`${location.pathname}?${defaultQuery}`, { replace: true });
  };

  const handleModalOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const currentQuery = location.search;
      const viewData: ViewData = {
        id: editingView?.id || Date.now().toString(),
        title: values.title,
        description: values.description || '',
        page: pageName,
        query: currentQuery,
        createdAt: editingView?.createdAt || new Date().toISOString()
      };

      try {
        // Önce plugin settings'e kaydetmeyi dene
        const settings = await getPluginSettings();
        const pageViews = settings.pageViews || [];
        
        if (editingView) {
          // Update existing view
          const updatedViews = pageViews.map((view: ViewData) => 
            view.id === editingView.id ? { ...view, query: currentQuery } : view
          );
          await savePluginSettings({ ...settings, pageViews: updatedViews });
        } else {
          // Add new view
          const updatedViews = [...pageViews, viewData];
          await savePluginSettings({ ...settings, pageViews: updatedViews });
        }
        
        message.success('View saved successfully');
      } catch (pluginError) {
        console.warn('Plugin settings failed, using localStorage:', pluginError);
        
        // Plugin settings başarısız olursa localStorage'a kaydet
        const localViews = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
        
        if (editingView) {
          // Update existing view
          const updatedViews = localViews.map((view: ViewData) => 
            view.id === editingView.id ? { ...view, query: currentQuery } : view
          );
          localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(updatedViews));
        } else {
          // Add new view
          const updatedViews = [...localViews, viewData];
          localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(updatedViews));
        }
        
        message.success('View saved to local storage');
      }

      await loadViews();
      setModalVisible(false);
      setEditingView(null);
      form.resetFields();
    } catch (error) {
      console.error('Error saving view:', error);
      message.error('Failed to save view');
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingView(null);
    form.resetFields();
  };

  const handleViewSelect = (viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setSelectedView(view);
      // Navigate to the saved query
      navigate(`${location.pathname}${view.query}`, { replace: true });
    }
  };

  const handleViewDelete = async (viewId: string) => {
    try {
      try {
        // Önce plugin settings'den silmeyi dene
        const settings = await getPluginSettings();
        const pageViews = settings.pageViews || [];
        const updatedViews = pageViews.filter((view: ViewData) => view.id !== viewId);
        await savePluginSettings({ ...settings, pageViews: updatedViews });
        message.success('View deleted successfully');
      } catch (pluginError) {
        console.warn('Plugin settings failed, using localStorage:', pluginError);
        
        // Plugin settings başarısız olursa localStorage'dan sil
        const localViews = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
        const updatedViews = localViews.filter((view: ViewData) => view.id !== viewId);
        localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(updatedViews));
        message.success('View deleted from local storage');
      }
      
      if (selectedView?.id === viewId) {
        setSelectedView(null);
      }
      
      await loadViews();
    } catch (error) {
      console.error('Error deleting view:', error);
      message.error('Failed to delete view');
    }
  };

  const dropdownItems = [
    ...views.map(view => ({
      key: view.id,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            <span>{view.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedView(view);
                handleUpdateView();
              }}
              style={{ color: '#1890ff', padding: '2px 4px' }}
              title="Update this view"
            />
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleViewDelete(view.id);
              }}
              style={{ color: '#ff4d4f', padding: '2px 4px' }}
              title="Delete this view"
            />
          </div>
        </div>
      ),
      onClick: () => handleViewSelect(view.id)
    })),
    ...(views.length > 0 ? [{
      key: 'divider',
      type: 'divider' as const
    }] : []),
    {
      key: 'save-as',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0', color: 'green' }}>
          <SaveOutlined style={{ marginRight: 8, fontSize: '14px', color: 'green' }} />
          <span style={{ fontWeight: 500 }}>Save as view</span>
        </div>
      ),
      onClick: handleSaveAsView
    },
    ...(selectedView ? [{
      key: 'clear-view',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0', color: '#ffd700' }}>
          <CloseOutlined style={{ marginRight: 8, fontSize: '14px', color: '#ffd700' }} />
          <span style={{ fontWeight: 500 }}>Clear selection</span>
        </div>
      ),
      onClick: handleClearView
    }] : [])
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Only show dropdown for view selection */}
        <Dropdown
          menu={{ items: dropdownItems }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <Button
            style={{
              backgroundColor: '#404040',
              border: '1px solid #555',
              color: '#ffffff',
              borderRadius: '6px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '160px'
            }}
          >
            {selectedView ? (
              <>
                <span style={{ flex: 1, textAlign: 'left' }}>{selectedView.title}</span>
              </>
            ) : (
              <>
                <span style={{ flex: 1, textAlign: 'left' }}>Views</span>
              </>
            )}
          </Button>
        </Dropdown>
      </div>

      <Modal
        title={editingView ? 'Update View' : 'Save as View'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingView ? 'Update' : 'Save'}
        cancelText="Cancel"
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: '',
            description: ''
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
            label="Description"
            name="description"
          >
            <Input.TextArea 
              placeholder="Optional description for this view"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ViewComponent;
