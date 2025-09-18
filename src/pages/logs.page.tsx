import React, { useState, useEffect, useCallback } from 'react';
import { PluginPage } from '@grafana/runtime';
import { Layout, Typography, Space, Button } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { LogEntry, LogQuery } from '../interfaces/logs.interface';
import { lokiApi } from '../providers/api/loki.api';
import LogFilters from '../components/Logs/LogFilters';
import LogQueryBuilder from '../components/Logs/LogQueryBuilder';
import LogResults from '../components/Logs/LogResults';

// LocalStorage utility functions
const getLogSettings = () => {
  try {
    const settings = localStorage.getItem('logSettings');
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Error loading log settings:', error);
    return null;
  }
};

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

function Logs() {
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]); // Tüm logları sakla (Quick Filter için)
  const [loading, setLoading] = useState(false);
  const [queryCollapsed, setQueryCollapsed] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  // Load saved settings from localStorage
  const savedSettings = getLogSettings();
  
  const [query, setQuery] = useState<LogQuery>({
    query: '', // Boş query string - sadece log content'inde arama için
    filters: [],
    timeRange: {
      start: new Date('2025-09-17T20:00:00.000Z').getTime(), // Bugün 20:00
      end: new Date('2025-09-17T23:00:00.000Z').getTime()    // Bugün 23:00
    },
    limit: savedSettings?.limit || 100,
    orderBy: savedSettings?.orderBy || 'timestamp',
    orderDirection: savedSettings?.orderDirection || 'desc'
  });

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      // Loki query oluştur
      let lokiQuery = '{job=~".+"}'; // Tüm logları çek
      
      // Base query
      lokiQuery = `{job=~".+"}`;
      
      // Query string'i parse et ve uygun şekilde ekle
      if (query.query) {
        const queryText = query.query.trim();
        
        // Eğer query "key = value" formatındaysa, label filtreleme olarak ekle
        const labelMatch = queryText.match(/^(\w+)\s*=\s*"([^"]+)"$/);
        if (labelMatch) {
          const [, key, value] = labelMatch;
          lokiQuery = lokiQuery.replace('}', `, ${key}="${value}"}`);
        } else {
          // Normal text arama için |= operatörü kullan
          lokiQuery += ` |= "${queryText}"`;
        }
      }
      
      // Filtreleri ekle (label filtreleme)
      query.filters.forEach(filter => {
        switch (filter.operator) {
          case 'equals':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}="${filter.value}"}`);
            break;
          case 'contains':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}=~".*${filter.value}.*"}`);
            break;
          case 'regex':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}=~"${filter.value}"}`);
            break;
          case 'exists':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}!=""}`);
            break;
          case 'not_exists':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}=""}`);
            break;
        }
      });
      
      // Debug için sorguyu logla
      console.log('Loki query:', lokiQuery);
      
      // Loki'den veri çek
      const result = await lokiApi.queryLogs({
        query: lokiQuery,
        start: new Date(query.timeRange.start).toISOString(),
        end: new Date(query.timeRange.end).toISOString(),
        limit: query.limit,
        direction: query.orderDirection === 'desc' ? 'backward' : 'forward',
        orderBy: query.orderBy,
        orderDirection: query.orderDirection
      });
      
      setFilteredLogs(result.logs);
      
      // İlk yüklemede (filtre yokken) tüm logları sakla
      if (query.filters.length === 0 && !query.query) {
        setAllLogs(result.logs);
      }
    } catch (error) {
      console.error('Loki query error:', error);
      // Hata durumunda boş array set et
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  }, [query]); // query dependency'si eklendi

  useEffect(() => {
    // İlk yüklemede tüm logları çek
    handleSearch();
  }, [handleSearch]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG': return 'blue';
      case 'INFO': return 'green';
      case 'WARN': return 'orange';
      case 'ERROR': return 'red';
      case 'FATAL': return 'purple';
      default: return 'default';
    }
  };

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
          <Space>
            <Text style={{ color: '#8c8c8c' }}>
              View and manage your application logs
            </Text>
          </Space>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              Add to Dashboard
            </Button>
          </Space>
        </Header>

        <Layout>
          {/* Üst kısım - Query Builder */}
          {!queryCollapsed && (
            <Content style={{ 
              background: '#0a0a0a', 
              borderBottom: '1px solid #262626',
              position: 'relative'
            }}>
              {/* Query Collapse Button */}
              <Button
                type="text"
                icon={<UpOutlined />}
                onClick={() => setQueryCollapsed(true)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  color: '#8c8c8c',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid #262626'
                }}
                size="small"
              >
                Hide Query
              </Button>
              
              <div style={{ padding: '16px' }}>
                <LogQueryBuilder 
                  query={query}
                  logs={filteredLogs}
                  onQueryChange={setQuery}
                  onSearch={handleSearch}
                />
              </div>
            </Content>
          )}

          {/* Query Show Button - sadece query gizliyken göster */}
          {queryCollapsed && (
            <div style={{ 
              background: '#0a0a0a', 
              borderBottom: '1px solid #262626',
              padding: '8px 16px',
              textAlign: 'center'
            }}>
              <Button
                type="text"
                icon={<DownOutlined />}
                onClick={() => setQueryCollapsed(false)}
                style={{
                  color: '#8c8c8c',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid #262626'
                }}
                size="small"
              >
                Show Query
              </Button>
            </div>
          )}

          <Layout>
            {/* Sol taraf - Filters */}
            {!filtersCollapsed && (
              <Sider 
                width={300}
                style={{ 
                  background: '#0a0a0a', 
                  borderRight: '1px solid #262626',
                  position: 'relative'
                }}
              >
                {/* Filters Collapse Button */}
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={() => setFiltersCollapsed(true)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                    color: '#8c8c8c',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid #262626'
                  }}
                  size="small"
                >
                  Hide Filters
                </Button>
                
                <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
                  <LogFilters 
                    filters={query.filters}
                    logs={allLogs} // Quick Filter için tüm logları kullan
                    onFiltersChange={(filters) => setQuery({...query, filters})}
                    onSearch={handleSearch}
                  />
                </div>
              </Sider>
            )}

            {/* Sağ taraf - Results */}
            <Content style={{ 
              background: '#0a0a0a', 
              padding: '16px', 
              overflow: 'auto',
              position: 'relative'
            }}>
              {/* Filters Show Button - sadece filters gizliyken göster */}
              {filtersCollapsed && (
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  onClick={() => setFiltersCollapsed(false)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 10,
                    color: '#8c8c8c',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid #262626'
                  }}
                  size="small"
                >
                  Show Filters
                </Button>
              )}
              
              <LogResults 
                logs={filteredLogs}
                loading={loading}
                getLevelColor={getLevelColor}
              />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </PluginPage>
  );
}

export default Logs;
