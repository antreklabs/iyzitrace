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
import { useNavigate } from 'react-router-dom';
import { api, type Team, type CreateTeamData } from '../../api/service/team.service';
import pluginJson from '../../plugin.json';
import { getTeams } from '../../api/service/team.service';
import '../../assets/styles/pages/teams/teams.styles';

const { Search } = Input;
const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
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
        <div className="team-cell">
          <div className="team-icon">
            <img src={record.icon} width={32} height={32} />
          </div>
          <span className="team-name">{text}</span>
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
            <div className="team-members-wrapper">
              {members.slice(0, 3).map((member: any) => (
                <div key={member.id} className="team-member-item">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span className="team-member-name">{member.name}</span>
                </div>
              ))}
              {members.length > 3 && (
                <Badge count={`+${members.length - 3}`} className="team-badge-purple" />
              )}
            </div>
          );
        }
        return <Badge count={members} className="team-badge-purple" />;
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (text: any, record: Team) => (
        <Button
          className="team-manage-button"
          icon={<SettingOutlined />}
          onClick={() => handleManageTeam(record.id)}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <div className="teams-page-container">
      {
      }
      <div className="teams-page-header">
        <div className="teams-page-header-left">
          <h1 className="teams-page-title">Teams</h1>
          <p className="teams-page-description">
            Manage existing teams in your organization.
          </p>
        </div>

      </div>

      {
      }
      <div className="teams-search-bar">
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
      <Card className="teams-table-card">
        <Table
          columns={columns}
          dataSource={teams}
          loading={loading}
          pagination={false}
          rowKey="id"
        />

        {teams.length === 0 && !loading && (
          <div className="teams-empty-state">
            No teams found in this organization
          </div>
        )}
      </Card>

      {
      }
      {teams.length > 0 && (
        <div className="teams-pagination-wrapper">
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
        className="teams-modal"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTeam}
        >
          <Form.Item label="Icon">
            <div className="teams-form-icon-wrapper">
              <div className="team-icon-preview">
                {'🔧'}
              </div>
              <Button
                className="team-randomize-button"
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

          <div className="teams-form-actions">
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" className="teams-create-button">
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