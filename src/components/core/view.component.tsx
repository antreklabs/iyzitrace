import React, { useState, useEffect, useCallback } from 'react';
import '../../assets/styles/components/core/view.css';
import { Button, Dropdown, Modal, Form, Input, message } from 'antd';
import { SaveOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPluginSettings, savePluginSettings } from '../../api/service/settings.service';

interface ViewData {
  id: string;
  title: string;
  description?: string;
  page: string;
  query: string;
  data: any;
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

  useEffect(() => {
    loadViews();
  }, []);

  useEffect(() => {
    if (Array.isArray(views) && views.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const viewIdFromUrl = searchParams.get('viewId');

      if (viewIdFromUrl) {
        const matchingView = views.find(v => v.id === viewIdFromUrl);
        if (matchingView && (!selectedView || selectedView.id !== matchingView.id)) {
          setSelectedView(matchingView);
          writeLastSelected(matchingView.id);
        }
      }
    }
  }, [location.search, views]);

  useEffect(() => {
    if (!selectedView && Array.isArray(views) && views.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const viewIdFromUrl = searchParams.get('viewId');

      if (viewIdFromUrl) {
        const matchingView = views.find(v => v.id === viewIdFromUrl);
        if (matchingView) {
          setSelectedView(matchingView);
          writeLastSelected(matchingView.id);
          return;
        }
      }

      const last = safeReadLastSelected();
      const candidate = last && last.pageName === pageName
        ? views.find(v => v.id === last.viewId) || views[0]
        : views[0];
      setSelectedView(candidate);
      writeLastSelected(candidate.id);
      if (candidate.query) {
        navigate(`${location.pathname}${candidate.query}`, { replace: true });
      }
    }
  }, [views]);

  const loadViews = async () => {
    try {
      const settings = await getPluginSettings();
      const pageViews = settings.pageViews || [];
      const currentPageViews = pageViews.filter((view: ViewData) => view.page === pageName);

      if (currentPageViews.length > 0) {
        setViews(currentPageViews as ViewData[]);
        autoSelectView(currentPageViews as ViewData[]);
      } else {
        const localViews = localStorage.getItem(`iyzitrace-views-${pageName}`);
        const parsedViews = JSON.parse(localViews);
        if (parsedViews && parsedViews.length > 0) {
          const parsedViews = JSON.parse(localViews);
          setViews(parsedViews as ViewData[]);
          autoSelectView(parsedViews as ViewData[]);
        } else {
          const created = await ensureDefaultView();
          if (created) {
            setViews([created]);
            setSelectedView(created);
            writeLastSelected(created.id);
          } else {
            const refreshed = await getPluginSettings();
            const pageViewsAfter = (refreshed.pageViews || []).filter((v: ViewData) => v.page === pageName);
            if (pageViewsAfter.length > 0) {
              setViews(pageViewsAfter as ViewData[]);
              autoSelectView(pageViewsAfter as ViewData[]);
            } else {
              const local = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
              if (Array.isArray(local) && local.length > 0) {
                setViews(local);
                autoSelectView(local);
              }
            }
          }
        }
      }
    } catch (error) {
      const localViews = localStorage.getItem(`iyzitrace-views-${pageName}`);
      if (localViews) {
        const parsedViews = JSON.parse(localViews);
        setViews(parsedViews);
        autoSelectView(parsedViews as ViewData[]);
      } else {
        const created = await ensureDefaultView();
        if (created) {
          setViews([created]);
          setSelectedView(created);
          writeLastSelected(created.id);
        }
      }
    }
  };

  const ensureDefaultView = async (): Promise<ViewData | null> => {
    const defaultView: ViewData = {
      id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: 'default',
      description: '',
      page: pageName,
      query: '',
      data: {},
      createdAt: new Date().toISOString(),
    };
    try {
      const settings = await getPluginSettings();
      const pageViews = settings.pageViews || [];
      const exists = pageViews.some((v: ViewData) => v.page === pageName);
      if (!exists) {
        await savePluginSettings({ ...settings, pageViews: [...pageViews, defaultView] });
        writeLastSelected(defaultView.id);
        return defaultView;
      }
    } catch {
      const localViews = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
      if (!Array.isArray(localViews) || localViews.length === 0) {
        localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify([defaultView]));
        writeLastSelected(defaultView.id);
        return defaultView;
      }
    }
    return null;
  };

  const writeLastSelected = (viewId: string) => {
    try {
      localStorage.setItem(`lastSelectedPageView_${pageName}`, JSON.stringify({ pageName, viewId }));
    } catch { }
  };

  const autoSelectView = (list: ViewData[]) => {
    if (!Array.isArray(list) || list.length === 0) return;

    const searchParams = new URLSearchParams(location.search);
    const viewIdFromUrl = searchParams.get('viewId');

    if (viewIdFromUrl) {
      const matchingView = list.find(v => v.id === viewIdFromUrl);
      if (matchingView) {
        setSelectedView(matchingView);
        writeLastSelected(matchingView.id);
        return;
      }
    }

    const last = safeReadLastSelected();
    const candidate = last && last.pageName === pageName
      ? list.find(v => v.id === last.viewId) || list[0]
      : list[0];
    setSelectedView(candidate);
    writeLastSelected(candidate.id);

    if (candidate.query) {
      const queryString = candidate.query;
      const separator = queryString.includes('?') ? '&' : '?';
      const urlWithViewId = `${queryString}${separator}viewId=${candidate.id}`;
      navigate(`${location.pathname}${urlWithViewId}`, { replace: true });
    }
  };

  const safeReadLastSelected = (): { pageName: string; viewId: string } | null => {
    try {
      const raw = localStorage.getItem(`lastSelectedPageView_${pageName}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
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

  const handleQuickSave = async (targetViewId?: string) => {
    const targetId = targetViewId || selectedView?.id;
    const targetView = views.find(v => v.id === targetId);
    if (!targetView) {
      message.warning('No view selected');
      return;
    }
    try {
      setLoading(true);
      let currentQuery = location.search;
      const searchParams = new URLSearchParams(currentQuery);
      searchParams.delete('viewId');
      const cleanQuery = searchParams.toString();
      currentQuery = cleanQuery ? `?${cleanQuery}` : '';

      try {
        const settings = await getPluginSettings();
        const pageViews = settings.pageViews || [];
        const updatedViews = pageViews.map((view: ViewData) =>
          view.id === targetView.id ? { ...view, query: currentQuery } : view
        );
        await savePluginSettings({ ...settings, pageViews: updatedViews });
      } catch (pluginError) {
        const localViews = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
        const updatedViews = localViews.map((view: ViewData) =>
          view.id === targetView.id ? { ...view, query: currentQuery } : view
        );
        localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(updatedViews));
      }

      message.success(`View "${targetView.title}" saved`);
      await loadViews();
    } catch (error) {
      message.error('Failed to save view');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      let currentQuery = location.search;
      const searchParams = new URLSearchParams(currentQuery);
      searchParams.delete('viewId');
      const cleanQuery = searchParams.toString();
      currentQuery = cleanQuery ? `?${cleanQuery}` : '';

      const viewData: ViewData = {
        id: editingView?.id || `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: values.title,
        description: values.description || '',
        page: pageName,
        query: currentQuery,
        data: {},
        createdAt: editingView?.createdAt || new Date().toISOString()
      };

      try {
        const settings = await getPluginSettings();
        const pageViews = settings.pageViews || [];

        if (editingView) {
          const updatedViews = pageViews.map((view: ViewData) =>
            view.id === editingView.id ? { ...view, query: currentQuery } : view
          );
          await savePluginSettings({ ...settings, pageViews: updatedViews });
        } else {
          const updatedViews = [...pageViews, viewData];
          await savePluginSettings({ ...settings, pageViews: updatedViews });
        }

        message.success('View saved successfully');
      } catch (pluginError) {

        const localViews = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');

        if (editingView) {
          const updatedViews = localViews.map((view: ViewData) =>
            view.id === editingView.id ? { ...view, query: currentQuery } : view
          );
          localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(updatedViews));
        } else {
          const updatedViews = [...localViews, viewData];
          localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(updatedViews));
        }

        message.success('View saved to local storage');
      }

      await loadViews();

      // Select the newly created/updated view
      if (!editingView) {
        setSelectedView(viewData);
        writeLastSelected(viewData.id);
        const separator = viewData.query.includes('?') ? '&' : '?';
        const urlWithViewId = `${viewData.query}${separator}viewId=${viewData.id}`;
        navigate(`${location.pathname}${urlWithViewId}`, { replace: true });
      }

      setModalVisible(false);
      setEditingView(null);
      form.resetFields();
    } catch (error) {
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
      writeLastSelected(view.id);

      const queryString = view.query || '';
      const separator = queryString.includes('?') ? '&' : '?';
      const urlWithViewId = `${queryString}${separator}viewId=${view.id}`;

      navigate(`${location.pathname}${urlWithViewId}`, { replace: true });
    }
  };

  const handleViewDelete = async (viewId: string) => {
    // Find the view to check if it's default
    const viewToDelete = views.find(v => v.id === viewId);
    if (viewToDelete?.title === 'default') {
      message.warning('Default view cannot be deleted');
      return;
    }

    try {
      try {
        const settings = await getPluginSettings();
        const pageViews = settings.pageViews || [];
        const updatedViews = pageViews.filter((view: ViewData) => view.id !== viewId);
        await savePluginSettings({ ...settings, pageViews: updatedViews });
        message.success('View deleted successfully');
      } catch (pluginError) {

        const localViews = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
        const updatedViews = localViews.filter((view: ViewData) => view.id !== viewId);
        localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(updatedViews));
        message.success('View deleted from local storage');
      }

      try {
        const localViewsMirror = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
        const localUpdated = localViewsMirror.filter((view: ViewData) => view.id !== viewId);
        localStorage.setItem(`iyzitrace-views-${pageName}`, JSON.stringify(localUpdated));
      } catch { }

      try {
        const lastRaw = localStorage.getItem(`lastSelectedPageView_${pageName}`);
        if (lastRaw) {
          const last = JSON.parse(lastRaw);
          if (last?.pageName === pageName && last?.viewId === viewId) {
            localStorage.removeItem(`lastSelectedPageView_${pageName}`);
          }
        }
      } catch { }

      // If deleted view was selected, switch to default view
      if (selectedView?.id === viewId) {
        const remainingViews = views.filter(v => v.id !== viewId);
        const defaultView = remainingViews.find(v => v.title === 'default') || remainingViews[0];
        if (defaultView) {
          setSelectedView(defaultView);
          writeLastSelected(defaultView.id);
          const separator = defaultView.query?.includes('?') ? '&' : '?';
          const urlWithViewId = `${defaultView.query || ''}${separator}viewId=${defaultView.id}`;
          navigate(`${location.pathname}${urlWithViewId}`, { replace: true });
        } else {
          setSelectedView(null);
        }
      }

      await loadViews();
    } catch (error) {
      message.error('Failed to delete view');
    }
  };

  const dropdownItems = [
    ...views.map(view => {
      const isDefault = view.title === 'default';
      return {
        key: view.id,
        label: (
          <div className="view-dropdown-item">
            <div className="view-dropdown-item-left">

              <span>{view.title}</span>
            </div>
            <div className="view-dropdown-item-right">
              <Button
                type="text"
                size="small"
                icon={<SaveOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickSave(view.id);
                }}
                className="view-action-btn-save"
                title={`Save current filters to "${view.title}"`}
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedView(view);
                  handleUpdateView();
                }}
                className="view-action-btn-edit"
                title="Update this view"
              />
              {!isDefault && (
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDelete(view.id);
                  }}
                  className="view-action-btn-delete"
                  title="Delete this view"
                />
              )}
            </div>
          </div>
        ),
        onClick: () => handleViewSelect(view.id)
      };
    }),
    ...(views.length > 0 ? [{
      key: 'divider',
      type: 'divider' as const
    }] : []),
    {
      key: 'save-as',
      label: (
        <div className="view-save-item">
          <SaveOutlined className="view-save-icon" />
          <span className="view-save-label">Save as view</span>
        </div>
      ),
      onClick: handleSaveAsView
    }
  ];

  return (
    <>
      <div className="view-dropdown-wrapper">
        {
        }
        <Dropdown
          menu={{ items: dropdownItems }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <Button
            className="view-dropdown-btn"
          >
            {selectedView ? (
              <>
                <span className="view-dropdown-btn-text">{selectedView.title}</span>
              </>
            ) : (
              <>
                <span className="view-dropdown-btn-text">Views</span>
              </>
            )}
          </Button>
        </Dropdown>
      </div>

      {/* Quick Save Button */}
      <div className="view-quick-save-wrapper">
        <Button
          type="text"
          icon={<SaveOutlined />}
          onClick={() => handleQuickSave()}
          loading={loading}
          className="view-quick-save-btn"
          title={selectedView ? `Quick save to "${selectedView.title}"` : 'Save view'}
        />
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