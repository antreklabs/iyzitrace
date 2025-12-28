import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Table,
  Modal,
  Checkbox,
  message,
  Space,
  Tabs,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Team, type TeamMember, type TeamPage, type AvailablePage, type TeamSettings } from '../../api/service/team.service';
import pluginJson from '../../plugin.json';
import { getTeams } from '../../api/service/team.service';
import '../../assets/styles/pages/teams/teams.css';

const { Search } = Input;
const { TabPane } = Tabs;
const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

const TeamsManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [searchText, setSearchText] = useState('');
  const [addPageModalVisible, setAddPageModalVisible] = useState(false);
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const teams = await getTeams();
      const data = teams.find((team: Team) => String(team.id) === String(teamId) || team.uid === teamId);

      if (!data) {
        setTeam(null);
        return;
      }

      let settings: TeamSettings | undefined;
      let pages: TeamPage[] = [];

      try {
        settings = await api.getTeamSettings(teamId!);
      } catch (error) {
      }

      try {
        pages = await api.getTeamPages(teamId!);
      } catch (error) {
      }

      setTeam({
        ...data,
        members: data.members || [],
        settings: settings || { name: data.name, icon: data.icon },
        pages: pages,
      });
    } catch (error) {
      message.error('Failed to fetch team data');
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePages = async () => {
    try {
      const pages = await api.getAvailablePages();
      setAvailablePages(pages);
    } catch (error) {
    }
  };

  const handleAddPages = async () => {
    try {
      await api.addTeamPages(teamId!, selectedPages);

      await fetchTeam();

      setAddPageModalVisible(false);
      setSelectedPages([]);
      message.success('Pages added successfully');
    } catch (error) {
      message.error('Failed to add pages');
    }
  };

  const handleRemovePage = async (pageId: string) => {
    try {
      await api.removeTeamPage(teamId!, pageId);

      await fetchTeam();

      message.success('Page removed successfully');
    } catch (error) {
      message.error('Failed to remove page');
    }
  };

  const membersColumns = [
    {
      title: 'Member',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TeamMember) => (
        <div className="teams-member-info">
          <img src={record.avatar} width={32} height={32} />
          <div>
            <div className="teams-member-name">{text}</div>
            <div className="teams-member-email">{record.email}</div>
          </div>
        </div>
      ),
    },
  ];

  const pagesColumns = [
    {
      title: 'Page',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TeamPage) => (
        <div className="teams-page-item">
          <div className="teams-page-item-icon">{record.icon}</div>
          <div>
            <div className="teams-page-item-name">{text}</div>
            <div className="teams-page-item-description">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      render: (route: string) => <span className="teams-page-item-route">{route}</span>,
    },
    {
      title: 'Added at',
      dataIndex: 'addedAt',
      key: 'addedAt',
      render: (date: string) => <span className="teams-page-item-date">{date}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: any, record: TeamPage) => (
        <Button
          className="teams-remove-button"
          icon={<DeleteOutlined />}
          onClick={() => handleRemovePage(record.id)}
        >
          Remove from team
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="teams-manage-container">
        <div className="teams-empty-state">
          Loading team data...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="teams-manage-container">
        <Alert
          message="Team not found"
          description="The requested team could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="teams-manage-container">
      {
      }
      <div className="teams-manage-header">
        <div>
          <div className="teams-breadcrumb">
            <span
              className="breadcrumb-link"
              onClick={() => navigate(`${PLUGIN_BASE_URL}/teams`)}
            >
              Teams
            </span>
            <span>›</span>
            <div className="teams-manage-team-info">
              <div className="teams-manage-team-icon">
                <img src={team.icon} width={16} height={16} />
              </div>
              <span className="teams-manage-team-name">{team.name}</span>
            </div>
          </div>
        </div>

        <div className="teams-manage-header-actions">
          <Button
            className="teams-leave-button"
            icon={<ArrowLeftOutlined />}
          >
            Leave team
          </Button>
        </div>
      </div>

      {
      }
      <Card className="teams-tabs-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Members" key="members">
            {
            }
            <div className="teams-manage-search-bar">
              <Search
                placeholder="Search members by name or email..."
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
            <Table
              className="teams-manage-table"
              columns={membersColumns}
              dataSource={Array.isArray(team.members) ? team.members.filter((member: TeamMember) =>
                member.name.toLowerCase().includes(searchText.toLowerCase()) ||
                member.email.toLowerCase().includes(searchText.toLowerCase())
              ) : []}
              pagination={false}
              rowKey="id"
            />

            {(!Array.isArray(team.members) || team.members.length === 0) && (
              <div className="teams-empty-state">
                No members found in this team
              </div>
            )}
          </TabPane>

          <TabPane tab="Pages" key="pages">
            {
            }
            <div className="teams-manage-search-bar">
              <Search
                placeholder="Search pages by name..."
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
            <div className="teams-add-actions-wrapper">
              <Button
                type="primary"
                className="teams-add-button"
                icon={<PlusOutlined />}
                onClick={() => {
                  setAddPageModalVisible(true);
                  fetchAvailablePages();
                }}
              >
                Add Pages
              </Button>
            </div>

            {
            }
            <Table
              className="teams-manage-table"
              columns={pagesColumns}
              dataSource={team.pages?.filter((page: TeamPage) =>
                page.name.toLowerCase().includes(searchText.toLowerCase()) ||
                page.description.toLowerCase().includes(searchText.toLowerCase())
              ) || []}
              pagination={false}
              rowKey="id"
            />

            {(!team.pages || team.pages.length === 0) && (
              <div className="teams-empty-state">
                No pages found in this team
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {
      }
      <Modal
        title="Add pages"
        open={addPageModalVisible}
        onCancel={() => setAddPageModalVisible(false)}
        footer={null}
        className="teams-modal"
        width={600}
      >
        <div className="teams-manage-search-bar">
          <Search
            placeholder="Search pages..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
          />
        </div>

        <div className="teams-pages-list">
          {availablePages.map(page => (
            <div key={page.id} className="teams-available-page-item">
              <Checkbox
                checked={selectedPages.includes(page.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPages([...selectedPages, page.id]);
                  } else {
                    setSelectedPages(selectedPages.filter(id => id !== page.id));
                  }
                }}
              />
              <div className="teams-available-page-icon">{page.icon}</div>
              <div className="teams-available-page-content">
                <div className="teams-available-page-name">{page.name}</div>
                <div className="teams-available-page-description">{page.description}</div>
                <div className="teams-available-page-route">{page.route}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="teams-form-actions">
          <Space>
            <Button onClick={() => setAddPageModalVisible(false)}>
              Discard
            </Button>
            <Button
              type="primary"
              onClick={handleAddPages}
              disabled={selectedPages.length === 0}
              className="teams-add-button"
            >
              Add
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default TeamsManagePage;