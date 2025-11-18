import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Table,
  Modal,
  Form,
  Input as AntInput,
  Checkbox,
  message,
  Space,
  Tabs,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Team, type TeamMember, type TeamSettings, type AvailableMember, type TeamPage, type AvailablePage } from '../../api/teams';
import pluginJson from '../../plugin.json';
import { getTeams } from '../../api/service/team.service';

const { Search } = Input;
const { TabPane } = Tabs;
const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

// Types are imported from API service

const getStyles = () => ({
  container: css`
    padding: 24px;
    background: #0f0f0f;
    min-height: 100vh;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  `,
  breadcrumb: css`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8c8c8c;
    font-size: 14px;
    
    .breadcrumb-link {
      color: #7c3aed;
      cursor: pointer;
      
      &:hover {
        color: #a855f7;
      }
    }
  `,
  teamInfo: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  teamIcon: css`
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
  `,
  teamName: css`
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  `,
  headerActions: css`
    display: flex;
    gap: 12px;
  `,
  addMemberButton: css`
    background: #7c3aed;
    border-color: #7c3aed;
    
    &:hover {
      background: #6d28d9;
      border-color: #6d28d9;
    }
  `,
  leaveTeamButton: css`
    background: #262626;
    border-color: #404040;
    color: #fff;
    
    &:hover {
      background: #404040;
      border-color: #dc2626;
      color: #dc2626;
    }
  `,
  tabs: css`
    .ant-tabs-nav {
      background: #1f1f1f;
      border-radius: 8px 8px 0 0;
      margin: 0;
    }
    
    .ant-tabs-tab {
      color: #8c8c8c;
      
      &.ant-tabs-tab-active {
        color: #7c3aed;
      }
    }
    
    .ant-tabs-ink-bar {
      background: #7c3aed;
    }
    
    .ant-tabs-content-holder {
      background: #1f1f1f;
      border-radius: 0 0 8px 8px;
      padding: 24px;
    }
  `,
  searchBar: css`
    margin-bottom: 24px;
    
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
  table: css`
    .ant-table {
      background: #262626;
      border-radius: 8px;
    }
    
    .ant-table-thead > tr > th {
      background: #404040;
      border-bottom: 1px solid #525252;
      color: #fff;
      font-weight: 600;
    }
    
    .ant-table-tbody > tr > td {
      background: #262626;
      border-bottom: 1px solid #525252;
      color: #fff;
    }
    
    .ant-table-tbody > tr:hover > td {
      background: #404040;
    }
  `,
  memberInfo: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  memberName: css`
    font-weight: 500;
    color: #fff;
  `,
  memberEmail: css`
    font-size: 12px;
    color: #8c8c8c;
  `,
  removeButton: css`
    background: transparent;
    border: 1px solid #404040;
    color: #dc2626;
    
    &:hover {
      background: #dc2626;
      border-color: #dc2626;
      color: #fff;
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
    
    .ant-checkbox-wrapper {
      color: #fff;
    }
  `,
  settingsForm: css`
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
  dangerZone: css`
    margin-top: 32px;
    padding: 24px;
    background: #1f1f1f;
    border-radius: 8px;
    border: 1px solid #dc2626;
  `,
  dangerTitle: css`
    color: #dc2626;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
  `,
  dangerDescription: css`
    color: #8c8c8c;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 16px;
  `,
  deleteButton: css`
    background: #dc2626;
    border-color: #dc2626;
    
    &:hover {
      background: #b91c1c;
      border-color: #b91c1c;
    }
  `,
});

const TeamsManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const styles = getStyles();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [searchText, setSearchText] = useState('');
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [addPageModalVisible, setAddPageModalVisible] = useState(false);
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [form] = Form.useForm();

  // Data will be fetched from API

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const teams = await getTeams();
      console.log('teams', teams);
      console.log('teamId', teamId);
      const data = teams.find((team: Team) => team.id == teamId);
      const settings = await api.getTeamSettings(teamId!);
      const pages = await api.getTeamPages(teamId!);
      setTeam({
        ...data,
        members: data.members,
        settings: settings,
        pages: pages,
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      message.error('Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const members = await api.getAvailableMembers();
      setAvailableMembers(members);
    } catch (error) {
      console.error('Error fetching available members:', error);
    }
  };

  const fetchAvailablePages = async () => {
    try {
      const pages = await api.getAvailablePages();
      setAvailablePages(pages);
    } catch (error) {
      console.error('Error fetching available pages:', error);
    }
  };

  const handleAddMembers = async () => {
    try {
      await api.updateTeamMembers(teamId!, { memberIds: selectedMembers });
      
      // Refresh team data
      await fetchTeam();
      
      setAddMemberModalVisible(false);
      setSelectedMembers([]);
      message.success('Members added successfully');
    } catch (error) {
      console.error('Error adding members:', error);
      message.error('Failed to add members');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.removeTeamMember(teamId!, memberId);
      
      // Refresh team data
      await fetchTeam();
      
      message.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      message.error('Failed to remove member');
    }
  };

  const handleAddPages = async () => {
    try {
      await api.addTeamPages(teamId!, selectedPages);
      
      // Refresh team data
      await fetchTeam();
      
      setAddPageModalVisible(false);
      setSelectedPages([]);
      message.success('Pages added successfully');
    } catch (error) {
      console.error('Error adding pages:', error);
      message.error('Failed to add pages');
    }
  };

  const handleRemovePage = async (pageId: string) => {
    try {
      await api.removeTeamPage(teamId!, pageId);
      
      // Refresh team data
      await fetchTeam();
      
      message.success('Page removed successfully');
    } catch (error) {
      console.error('Error removing page:', error);
      message.error('Failed to remove page');
    }
  };

  const handleUpdateSettings = async (values: TeamSettings) => {
    try {
      await api.updateTeamSettings(teamId!, values);
      
      // Update local state
      if (team) {
        setTeam({
          ...team,
          settings: values,
          name: values.name,
          icon: values.icon,
        });
      }
      
      message.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('Failed to update settings');
    }
  };

  const generateRandomIcon = () => {
    const icons = ['🔧', '🎨', '📊', '🚀', '💡', '⚡', '🌟', '🎯', '🔥', '💎'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    form.setFieldsValue({ icon: randomIcon });
  };

  const membersColumns = [
    {
      title: 'Member',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TeamMember) => (
        <div className={styles.memberInfo}>
          <img src={record.avatar} width={32} height={32} />
          <div>
            <div className={styles.memberName}>{text}</div>
            <div className={styles.memberEmail}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: any, record: TeamMember) => (
        <Button
          className={styles.removeButton}
          icon={<UserDeleteOutlined />}
          onClick={() => handleRemoveMember(record.id)}
        >
          Remove from team
        </Button>
      ),
    },
  ];

  const pagesColumns = [
    {
      title: 'Page',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TeamPage) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 20 }}>{record.icon}</div>
          <div>
            <div style={{ fontWeight: 500, color: '#fff' }}>{text}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      render: (route: string) => <span style={{ color: '#8c8c8c', fontFamily: 'monospace' }}>{route}</span>,
    },
    {
      title: 'Added at',
      dataIndex: 'addedAt',
      key: 'addedAt',
      render: (date: string) => <span style={{ color: '#8c8c8c' }}>{date}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: any, record: TeamPage) => (
        <Button
          className={styles.removeButton}
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
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
          Loading team data...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className={styles.container}>
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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <span 
              className="breadcrumb-link"
              onClick={() => navigate(`${PLUGIN_BASE_URL}/teams`)}
            >
              Teams
            </span>
            <span>›</span>
            <div className={styles.teamInfo}>
              <div className={styles.teamIcon} style={{ background: `linear-gradient(135deg, #7c3aed, #a855f7)` }}>
                <img src={team.icon} width={16} height={16} />
              </div>
              <span className={styles.teamName}>{team.name}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <Button
            className={styles.leaveTeamButton}
            icon={<ArrowLeftOutlined />}
          >
            Leave team
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card className={styles.tabs}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Members" key="members">
            {/* Search Bar */}
            <div className={styles.searchBar}>
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

            {/* Add Member Button */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                className={styles.addMemberButton}
                icon={<PlusOutlined />}
                onClick={() => {
                  setAddMemberModalVisible(true);
                  fetchAvailableMembers();
                }}
              >
                Add member
              </Button>
            </div>

            {/* Members Table */}
            <Table
              className={styles.table}
              columns={membersColumns}
              dataSource={Array.isArray(team.members) ? team.members.filter((member: TeamMember) =>
                member.name.toLowerCase().includes(searchText.toLowerCase()) ||
                member.email.toLowerCase().includes(searchText.toLowerCase())
              ) : []}
              pagination={false}
              rowKey="id"
            />
            
            {(!Array.isArray(team.members) || team.members.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                No members found in this team
              </div>
            )}
          </TabPane>

          <TabPane tab="Pages" key="pages">
            {/* Search Bar */}
            <div className={styles.searchBar}>
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

            {/* Add Pages Button */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                className={styles.addMemberButton}
                icon={<PlusOutlined />}
                onClick={() => {
                  setAddPageModalVisible(true);
                  fetchAvailablePages();
                }}
              >
                Add Pages
              </Button>
            </div>

            {/* Pages Table */}
            <Table
              className={styles.table}
              columns={pagesColumns}
              dataSource={team.pages?.filter((page: TeamPage) =>
                page.name.toLowerCase().includes(searchText.toLowerCase()) ||
                page.description.toLowerCase().includes(searchText.toLowerCase())
              ) || []}
              pagination={false}
              rowKey="id"
            />
            
            {(!team.pages || team.pages.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                No pages found in this team
              </div>
            )}
          </TabPane>

          <TabPane tab="Settings" key="settings">
            <Form
              form={form}
              layout="vertical"
              initialValues={team.settings || { name: team.name, icon: team.icon }}
              onFinish={handleUpdateSettings}
              className={styles.settingsForm}
            >
              <Form.Item label="Display settings">
                <div style={{ marginBottom: 24 }}>
                  <Form.Item label="Icon" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={styles.iconPreview}>
                        {form.getFieldValue('icon') || team.icon}
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
                    <AntInput />
                  </Form.Item>
                  
                  <Form.Item name="icon" hidden>
                    <AntInput />
                  </Form.Item>
                </div>
              </Form.Item>
              
              <div style={{ textAlign: 'right' }}>
                <Button type="primary" htmlType="submit" className={styles.addMemberButton}>
                  Save Changes
                </Button>
              </div>
            </Form>

            {/* Danger Zone */}
            <div className={styles.dangerZone}>
              <div className={styles.dangerTitle}>Danger zone</div>
              <div className={styles.dangerDescription}>
                Permanently remove this team. Deleting the team will reset all team-specific permissions and accesses. 
                The member will remain in the system, but will no longer have any team-specific roles or data associated. 
                This action cannot be undone.
              </div>
              <Button
                danger
                className={styles.deleteButton}
                icon={<DeleteOutlined />}
              >
                Delete team
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Add Member Modal */}
      <Modal
        title="Add member"
        open={addMemberModalVisible}
        onCancel={() => setAddMemberModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={500}
      >
        <div className={styles.searchBar} style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search members..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
          />
        </div>
        
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {availableMembers.map(member => (
            <div key={member.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 0',
              borderBottom: '1px solid #404040'
            }}>
              <Checkbox
                checked={selectedMembers.includes(member.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMembers([...selectedMembers, member.id]);
                  } else {
                    setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                  }
                }}
              />
              <img src={member.avatar} width={32} height={32} />
              <div>
                <div style={{ color: '#fff', fontWeight: 500 }}>{member.name}</div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>{member.email}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={() => setAddMemberModalVisible(false)}>
              Discard
            </Button>
            <Button 
              type="primary" 
              onClick={handleAddMembers}
              disabled={selectedMembers.length === 0}
              className={styles.addMemberButton}
            >
              Add
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Add Pages Modal */}
      <Modal
        title="Add pages"
        open={addPageModalVisible}
        onCancel={() => setAddPageModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={600}
      >
        <div className={styles.searchBar} style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search pages..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
          />
        </div>
        
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {availablePages.map(page => (
            <div key={page.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 0',
              borderBottom: '1px solid #404040'
            }}>
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
              <div style={{ fontSize: 20, marginLeft: 12, marginRight: 12 }}>{page.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 500 }}>{page.name}</div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>{page.description}</div>
                <div style={{ color: '#8c8c8c', fontSize: 11, fontFamily: 'monospace' }}>{page.route}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={() => setAddPageModalVisible(false)}>
              Discard
            </Button>
            <Button 
              type="primary" 
              onClick={handleAddPages}
              disabled={selectedPages.length === 0}
              className={styles.addMemberButton}
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
