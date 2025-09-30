import React, { useState, useEffect } from 'react';
import { PluginPage } from '@grafana/runtime';
import { Layout, Button, Table, Space, Modal, App, Tabs, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LogPipeline } from '../../interfaces/pipeline.interface';
import { pipelineApi } from '../../providers/api/loki/pipeline.api';
import PipelineEditor from '../../components/Pipeline/PipelineEditor';

const { Header, Content } = Layout;

function LogsPipelinesContent() {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<LogPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<LogPipeline | null>(null);

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    setLoading(true);
    try {
      const data = await pipelineApi.getPipelines();
      setPipelines(data);
    } catch (error) {
      message.error('Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPipeline(null);
    setEditorVisible(true);
  };

  const handleEdit = (pipeline: LogPipeline) => {
    setEditingPipeline(pipeline);
    setEditorVisible(true);
  };

  const handleDuplicate = async (pipeline: LogPipeline) => {
    try {
      const duplicatedPipeline = {
        ...pipeline,
        name: `${pipeline.name} (Copy)`,
        description: pipeline.description ? `${pipeline.description} (Copy)` : 'Duplicated pipeline',
        enabled: false, // Disable by default for safety
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      
      // Remove the id so it creates a new one
      delete (duplicatedPipeline as any).id;
      
      await pipelineApi.createPipeline(duplicatedPipeline);
      message.success('Pipeline duplicated successfully');
      await loadPipelines();
    } catch (error) {
      message.error('Failed to duplicate pipeline');
    }
  };

  const handleToggleEnabled = async (pipeline: LogPipeline, enabled: boolean) => {
    try {
      await pipelineApi.updatePipeline(pipeline.id, { enabled });
      await loadPipelines();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const movePipeline = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pipelines.length) return;
    const newOrder = [...pipelines];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, moved);
    // Persist order in localStorage directly
    localStorage.setItem('logPipelines', JSON.stringify(newOrder));
    setPipelines(newOrder);
  };


  const handleDelete = async (id: string) => {
    modal.confirm({
      title: 'Delete Pipeline',
      content: 'Are you sure you want to delete this pipeline?',
      onOk: async () => {
        try {
          await pipelineApi.deletePipeline(id);
          await loadPipelines();
          message.success('Pipeline deleted successfully');
        } catch (error) {
          message.error('Failed to delete pipeline');
        }
      }
    });
  };

  const handleSave = async (pipeline: Omit<LogPipeline, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      if (editingPipeline) {
        await pipelineApi.updatePipeline(editingPipeline.id, pipeline);
        message.success('Pipeline updated successfully');
      } else {
        await pipelineApi.createPipeline(pipeline);
        message.success('Pipeline created successfully');
      }
      setEditorVisible(false);
      await loadPipelines();
    } catch (error) {
      message.error('Failed to save pipeline');
    }
  };

  const columns = [
    {
      title: 'Pipeline Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Filters',
      dataIndex: 'filters',
      key: 'filters',
      render: (filters: any[]) => (
        <div>
          {filters.length === 0 ? (
            <span style={{ color: '#8c8c8c' }}>No filters</span>
          ) : (
            filters.map((filter, index) => (
              <span key={index} style={{ 
                background: '#f0f0f0', 
                padding: '2px 6px', 
                margin: '2px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'inline-block'
              }}>
                {filter.field} {filter.operator} {filter.value}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      title: 'Processors',
      dataIndex: 'processors',
      key: 'processors',
      render: (processors: any[]) => (
        <span style={{ color: '#8c8c8c' }}>
          {processors.length} processor{processors.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (_: boolean, record: LogPipeline) => (
        <Switch checked={record.enabled} onChange={(v) => handleToggleEnabled(record, v)} />
      )
    },
    {
      title: 'Last Edited',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Edited By',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LogPipeline, index: number) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            title="Edit Pipeline"
          />
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => handleDuplicate(record)}
            title="Duplicate Pipeline"
          />
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            danger
            title="Delete Pipeline"
          />
          <Button 
            type="text" 
            icon={<ArrowUpOutlined />} 
            onClick={() => movePipeline(index, 'up')}
            title="Move Up"
          />
          <Button 
            type="text" 
            icon={<ArrowDownOutlined />} 
            onClick={() => movePipeline(index, 'down')}
            title="Move Down"
          />
        </Space>
      ),
    },
  ];

  return (
    <PluginPage>
      <Layout style={{ height: '100vh', background: '#0a0a0a' }}>
        <Header style={{ 
          background: '#141414', 
          borderBottom: '1px solid #262626',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tabs
              activeKey="pipelines"
              onChange={(key) => navigate(key === 'logs' ? '/a/iyzitrace-app/logs' : '/a/iyzitrace-app/logs-pipelines')}
              items={[
                { key: 'logs', label: 'Explorer' },
                { key: 'pipelines', label: 'Pipelines' }
              ]}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Pipeline
          </Button>
        </Header>

        <Content style={{ background: '#0a0a0a', padding: '24px' }}>
          <Table
            columns={columns}
            dataSource={pipelines}
            loading={loading}
            rowKey="id"
            pagination={false}
            style={{ background: '#141414' }}
            scroll={{ x: 800 }}
          />
        </Content>
      </Layout>

      <Modal
        title={editingPipeline ? 'Edit Pipeline' : 'Create Pipeline'}
        open={editorVisible}
        onCancel={() => { setEditorVisible(false); setEditingPipeline(null); }}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <PipelineEditor
          pipeline={editingPipeline}
          onSave={handleSave}
          onCancel={() => { setEditorVisible(false); setEditingPipeline(null); }}
        />
      </Modal>
    </PluginPage>
  );
}

function LogsPipelinesPage() {
  return (
    <App>
      <LogsPipelinesContent />
    </App>
  );
}

export default LogsPipelinesPage;
