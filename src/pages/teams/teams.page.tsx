import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Table,
  Badge,
  Modal,
  Form,
  Input as AntInput,
  message,
  Pagination,
  Space,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  SettingOutlined,
  EditOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { api, type Team, type CreateTeamData } from '../../api/service/team.service';
import pluginJson from '../../plugin.json';
import { getTeams } from '../../api/service/team.service';

const { Search } = Input;
const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

const getStyles = () => ({
  container: css`
    padding: 24px;
    background: #0f0f0f;
    min-height: 100vh;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  `,
  headerLeft: css`
    flex: 1;
  `,
  title: css`
    font-size: 24px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 8px 0;
  `,
  description: css`
    font-size: 14px;
    color: #8c8c8c;
    margin: 0;
  `,
  createButton: css`
    background: #7c3aed;
    border-color: #7c3aed;
    
    &:hover {
      background: #6d28d9;
      border-color: #6d28d9;
    }
  `,
  searchBar: css`
    margin-bottom: 24px;
    
    .ant-input {
      background: #1f1f1f;
      border-color: #404040;
      color: #fff;
      
      &:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
      }
    }
  `,
  table: css`
    .ant-table {
      background: #1f1f1f;
      border-radius: 8px;
    }
    
    .ant-table-thead > tr > th {
      background: #262626;
      border-bottom: 1px solid #404040;
      color: #fff;
      font-weight: 600;
    }
    
    .ant-table-tbody > tr > td {
      background: #1f1f1f;
      border-bottom: 1px solid #404040;
      color: #fff;
    }
    
    .ant-table-tbody > tr:hover > td {
      background: #262626;
    }
  `,
  teamIcon: css`
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-right: 12px;
  `,
  teamName: css`
    font-weight: 500;
    color: #fff;
  `,
  manageButton: css`
    background: transparent;
    border: 1px solid #404040;
    color: #fff;
    
    &:hover {
      background: #262626;
      border-color: #7c3aed;
      color: #7c3aed;
    }
  `,
  modal: css`
    .ant-modal-content {
      background: #1f1f1f;
      border-radius: 8px;
    }
    
    .ant-modal-header {
      background: #1f1f1f;
      border-bottom: 1px solid #404040;
    }
    
    .ant-modal-title {
      color: #fff;
    }
    
    .ant-modal-body {
      background: #1f1f1f;
    }
    
    .ant-form-item-label > label {
      color: #fff;
    }
    
    .ant-input {
      background: #262626;
      border-color: #404040;
      color: #fff;
      
      &:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
      }
    }
  `,
  iconPreview: css`
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    color: #fff;
    margin-right: 16px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
  `,
  randomizeButton: css`
    background: #262626;
    border-color: #404040;
    color: #fff;
    
    &:hover {
      background: #404040;
      border-color: #7c3aed;
      color: #7c3aed;
    }
  `,
});

const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const styles = getStyles();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTeams();
  }, [currentPage, pageSize, searchText]);

  const fetchTeams = async () => {
    setLoading(true);
    try {

      const data = await getTeams();
      const filteredTeams = data.filter((team: Team) =>
        team.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setTeams(filteredTeams);
      setTotal(filteredTeams.length);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (values: CreateTeamData) => {
    try {
      const newTeam = await api.createTeam(values);
      setTeams([...teams, newTeam]);
      setCreateModalVisible(false);
      form.resetFields();
      message.success('Team created successfully');
    } catch (error) {
      message.error('Failed to create team');
    }
  };

  const handleManageTeam = (teamId: string) => {
    navigate(`${PLUGIN_BASE_URL}/teams/${teamId}/manage`);
  };

  const generateRandomIcon = () => {
    const icons = ['🔧', '🎨', '📊', '🚀', '💡', '⚡', '🌟', '🎯', '🔥', '💎'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    form.setFieldsValue({ icon: randomIcon });
  };

  const columns = [
    {
      title: 'Team',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Team) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className={styles.teamIcon} style={{ background: `linear-gradient(135deg, #${Math.random().toString(16).substr(-6)}, #${Math.random().toString(16).substr(-6)})` }}>
            
            <img src={record.icon} width={32} height={32} />
          </div>
          <span className={styles.teamName}>{text}</span>
        </div>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members: number | any[], record: Team) => {
        if (Array.isArray(members)) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {members.slice(0, 3).map((member: any) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>{member.name}</span>
                </div>
              ))}
              {members.length > 3 && (
                <Badge count={`+${members.length - 3}`} style={{ backgroundColor: '#7c3aed' }} />
              )}
            </div>
          );
        }
        return <Badge count={members} style={{ backgroundColor: '#7c3aed' }} />;
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (text: any, record: Team) => (
        <Button
          className={styles.manageButton}
          icon={<SettingOutlined />}
          onClick={() => handleManageTeam(record.id)}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {
}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Teams</h1>
          <p className={styles.description}>
            Manage existing teams in your organization.
          </p>
        </div>
        
      </div>

      {
}
      <div className={styles.searchBar}>
        <Search
          placeholder="Search teams by name..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={setSearchText}
        />
      </div>

      {
}
      <Card className={styles.table}>
        <Table
          columns={columns}
          dataSource={teams}
          loading={loading}
          pagination={false}
          rowKey="id"
        />
        
        {teams.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
            No teams found in this organization
          </div>
        )}
      </Card>

      {
}
      {teams.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            }}
          />
        </div>
      )}

      {
}
      <Modal
        title="Create new team"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTeam}
        >
          <Form.Item label="Icon">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className={styles.iconPreview}>
                {'🔧'}
              </div>
              <Button
                className={styles.randomizeButton}
                icon={<EditOutlined />}
                onClick={generateRandomIcon}
              >
                Randomize
              </Button>
            </div>
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter team name' }]}
          >
            <AntInput placeholder="Engineering" />
          </Form.Item>
          
          <Form.Item name="icon" hidden>
            <AntInput />
          </Form.Item>
          
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" className={styles.createButton}>
                Create Team
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamsPage;