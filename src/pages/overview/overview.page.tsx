import React from 'react';
import { Card, Row, Col, Progress, Badge, List, Avatar, Typography } from 'antd';
import { 
  CloudServerOutlined, 
  AppstoreOutlined, 
  SettingOutlined, 
  UnorderedListOutlined,
  CoffeeOutlined,
  WindowsOutlined,
  DatabaseOutlined,
  BellOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  TruckOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const OverviewPage: React.FC = () => {
  // Static data for servers
  const servers = [
    {
      title: 'Web Server 01',
      subtitle: 'Ubuntu 20.04 LTS',
      status: 'healthy',
      cpu: 45,
      memory: { used: 8, total: 16 },
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'DB Server 01',
      subtitle: 'Windows Server 2019',
      status: 'warning',
      cpu: 78,
      memory: { used: 28, total: 32 },
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Cache Server',
      subtitle: 'CentOS 8',
      status: 'healthy',
      cpu: 23,
      memory: { used: 4, total: 8 },
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  // Static data for applications
  const applications = [
    {
      icon: <CoffeeOutlined style={{ fontSize: '24px', color: '#ff6b35' }} />,
      title: 'Java Runtime',
      subtitle: 'OpenJDK 11.0.2',
      status: 'running'
    },
    {
      icon: <WindowsOutlined style={{ fontSize: '24px', color: '#512bd4' }} />,
      title: '.NET Core',
      subtitle: 'Version 6.0.1',
      status: 'running'
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: '24px', color: '#dc382d' }} />,
      title: 'Redis Cache',
      subtitle: 'Version 6.2.6',
      status: 'warning'
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: '24px', color: '#f80000' }} />,
      title: 'Oracle DB',
      subtitle: 'Version 19c',
      status: 'running'
    }
  ];

  // Static data for services
  const javaServices = [
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
      title: 'User Management Service',
      port: 'Port: 8080',
      status: 'healthy'
    },
    {
      icon: <ShoppingCartOutlined style={{ fontSize: '20px', color: '#722ed1' }} />,
      title: 'Order Processing Service',
      port: 'Port: 8081',
      status: 'healthy'
    }
  ];

  const dotnetServices = [
    {
      icon: <CreditCardOutlined style={{ fontSize: '20px', color: '#52c41a' }} />,
      title: 'Payment Gateway Service',
      port: 'Port: 5000',
      status: 'warning'
    },
    {
      icon: <BellOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />,
      title: 'Notification Service',
      port: 'Port: 5001',
      status: 'healthy'
    }
  ];

  // Static data for operations
  const userManagementOps = [
    {
      icon: <UserOutlined style={{ fontSize: '18px', color: '#1890ff' }} />,
      title: 'Create User',
      time: '142ms avg',
      status: 'healthy'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '18px', color: '#52c41a' }} />,
      title: 'Validate User',
      time: '89ms avg',
      status: 'healthy'
    },
    {
      icon: <EditOutlined style={{ fontSize: '18px', color: '#722ed1' }} />,
      title: 'Update Profile',
      time: '234ms avg',
      status: 'warning'
    }
  ];

  const orderProcessingOps = [
    {
      icon: <PlusOutlined style={{ fontSize: '18px', color: '#fa8c16' }} />,
      title: 'Create Order',
      time: '567ms avg',
      status: 'healthy'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '18px', color: '#f5222d' }} />,
      title: 'Process Payment',
      time: '1.2s avg',
      status: 'warning'
    },
    {
      icon: <TruckOutlined style={{ fontSize: '18px', color: '#1890ff' }} />,
      title: 'Ship Order',
      time: '345ms avg',
      status: 'healthy'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#f5222d';
      default:
        return '#d9d9d9';
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 50) return '#52c41a';
    if (value < 80) return '#faad14';
    return '#f5222d';
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Servers & Infrastructure Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudServerOutlined style={{ color: '#1890ff' }} />
          Servers & Infrastructure
        </Title>
        <Row gutter={[16, 16]}>
          {servers.map((server, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                hoverable
                style={{
                  borderRadius: '12px',
                  background: server.gradient,
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <Title level={4} style={{ color: 'white', margin: 0 }}>{server.title}</Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{server.subtitle}</Text>
                  </div>
                  <Badge 
                    color={getStatusColor(server.status)} 
                    style={{ width: '12px', height: '12px' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>CPU Usage</Text>
                  <Progress
                    percent={server.cpu}
                    strokeColor={getProgressColor(server.cpu)}
                    trailColor="rgba(255,255,255,0.3)"
                    showInfo={false}
                    style={{ marginTop: '4px' }}
                  />
                  <Text style={{ color: 'white', fontSize: '12px' }}>{server.cpu}%</Text>
                </div>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Memory</Text>
                  <Progress
                    percent={(server.memory.used / server.memory.total) * 100}
                    strokeColor={getProgressColor((server.memory.used / server.memory.total) * 100)}
                    trailColor="rgba(255,255,255,0.3)"
                    showInfo={false}
                    style={{ marginTop: '4px' }}
                  />
                  <Text style={{ color: 'white', fontSize: '12px' }}>
                    {server.memory.used}GB / {server.memory.total}GB
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Applications Layer Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppstoreOutlined style={{ color: '#1890ff' }} />
          Applications Layer
        </Title>
        <Row gutter={[16, 16]}>
          {applications.map((app, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
                bodyStyle={{ padding: '20px', textAlign: 'center' }}
              >
                <div style={{ marginBottom: '12px' }}>{app.icon}</div>
                <Title level={4} style={{ margin: '0 0 8px 0' }}>{app.title}</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                  {app.subtitle}
                </Text>
                <Badge 
                  color={getStatusColor(app.status)} 
                  text={app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  style={{ fontSize: '12px' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Services Layer Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#1890ff' }} />
          Services Layer
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Title level={4} style={{ color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CoffeeOutlined style={{ color: 'white' }} />
                Java Services
              </Title>
              <List
                dataSource={javaServices}
                renderItem={(item) => (
                  <List.Item style={{ border: 'none', padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={item.icon} style={{ background: 'rgba(255,255,255,0.2)' }} />}
                      title={<Text style={{ color: 'white' }}>{item.title}</Text>}
                      description={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>{item.port}</Text>}
                    />
                    <Badge color={getStatusColor(item.status)} />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Title level={4} style={{ color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WindowsOutlined style={{ color: 'white' }} />
                .NET Services
              </Title>
              <List
                dataSource={dotnetServices}
                renderItem={(item) => (
                  <List.Item style={{ border: 'none', padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={item.icon} style={{ background: 'rgba(255,255,255,0.2)' }} />}
                      title={<Text style={{ color: 'white' }}>{item.title}</Text>}
                      description={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>{item.port}</Text>}
                    />
                    <Badge color={getStatusColor(item.status)} />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Operations Layer Section */}
      <div>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UnorderedListOutlined style={{ color: '#1890ff' }} />
          Operations Layer
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: 'none'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Title level={4} style={{ marginBottom: '16px' }}>
                User Management Operations
              </Title>
              <List
                dataSource={userManagementOps}
                renderItem={(item) => (
                  <List.Item style={{ border: 'none', padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={item.icon} style={{ background: '#f0f0f0' }} />}
                      title={<Text>{item.title}</Text>}
                      description={<Text type="secondary">{item.time}</Text>}
                    />
                    <Badge color={getStatusColor(item.status)} />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: 'none'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Title level={4} style={{ marginBottom: '16px' }}>
                Order Processing Operations
              </Title>
              <List
                dataSource={orderProcessingOps}
                renderItem={(item) => (
                  <List.Item style={{ border: 'none', padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={item.icon} style={{ background: '#f0f0f0' }} />}
                      title={<Text>{item.title}</Text>}
                      description={<Text type="secondary">{item.time}</Text>}
                    />
                    <Badge color={getStatusColor(item.status)} />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default OverviewPage;
