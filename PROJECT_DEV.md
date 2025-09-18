# 🚀 **IyziTrace → SigNoz Benzeri Özellikler Geliştirme Planı**

Mevcut durumu analiz ettikten sonra, IyziTrace projenizi SigNoz'a benzer özelliklerle geliştirmek için kapsamlı bir plan hazırladım.

## 📊 **Mevcut Durum Analizi**

### **✅ IyziTrace'de Mevcut Özellikler:**
- **Distributed Tracing** - Tempo entegrasyonu
- **Service Monitoring** - Servis listesi ve detayları
- **Metrics** - Prometheus entegrasyonu
- **Service Map** - Servis bağımlılık haritası
- **Trace Detail** - Detaylı trace görüntüleme
- **Tab Management** - Çoklu tab sistemi
- **Responsive UI** - Ant Design ile modern arayüz

### **❌ Eksik Özellikler (SigNoz'da var):**
- **Logs Management** - Log görüntüleme ve analizi
- **Alerts System** - Uyarı sistemi
- **Dashboard Builder** - Özelleştirilebilir dashboard'lar
- **Error Tracking** - Hata takibi ve analizi
- **Performance Monitoring** - Detaylı performans metrikleri
- **User Management** - Kullanıcı yönetimi
- **API Explorer** - API test aracı

---

## 🎯 **Geliştirme Roadmap'i**

### **🔥 Faz 1: Temel Eksiklikler (1-2 hafta)**

#### **1.1 Logs Management Sistemi**
```typescript
// Yeni dosya: src/pages/logs/logs.page.tsx
// Yeni dosya: src/containers/LogsContainer/LogsContainer.tsx
// Yeni dosya: src/providers/api/logs.api.ts
```

**Özellikler:**
- Log seviyeleri (ERROR, WARN, INFO, DEBUG)
- Log filtreleme ve arama
- Log streaming (gerçek zamanlı)
- Log aggregation

#### **1.2 Enhanced Dashboard**
```typescript
// Güncelleme: src/pages/dashboard.page.tsx
// Yeni dosya: src/containers/DashboardContainer/DashboardContainer.tsx
```

**Özellikler:**
- Sistem genel durumu
- Top error rates
- Service health overview
- Performance metrics

#### **1.3 Error Tracking**
```typescript
// Yeni dosya: src/pages/exceptions/exceptions.page.tsx
// Yeni dosya: src/containers/ExceptionsContainer/ExceptionsContainer.tsx
```

**Özellikler:**
- Error aggregation
- Error trends
- Error details ve stack traces

### **⚡ Faz 2: Gelişmiş Özellikler (2-3 hafta)**

#### **2.1 Alerts System**
```typescript
// Yeni dosya: src/pages/alerts/alerts.page.tsx
// Yeni dosya: src/containers/AlertsContainer/AlertsContainer.tsx
// Yeni dosya: src/providers/api/alerts.api.ts
```

**Özellikler:**
- Alert rules oluşturma
- Alert conditions (threshold, rate, etc.)
- Notification channels (email, slack, webhook)
- Alert history

#### **2.2 Performance Monitoring**
```typescript
// Güncelleme: src/containers/ServicesContainer/
// Yeni dosya: src/components/PerformanceCharts/
```

**Özellikler:**
- P50, P90, P95, P99 latency
- Throughput metrics
- Error rate trends
- Resource utilization

#### **2.3 Advanced Service Map**
```typescript
// Güncelleme: src/containers/ServiceMap/
// Yeni dosya: src/components/ServiceMap/InteractiveServiceMap.tsx
```

**Özellikler:**
- Interactive service map
- Real-time traffic flow
- Service health indicators
- Dependency analysis

### **🚀 Faz 3: Premium Özellikler (3-4 hafta)**

#### **3.1 Dashboard Builder**
```typescript
// Yeni dosya: src/pages/dashboard-builder/dashboard-builder.page.tsx
// Yeni dosya: src/containers/DashboardBuilder/
```

**Özellikler:**
- Drag & drop widget builder
- Custom charts
- Saved dashboards
- Dashboard sharing

#### **3.2 User Management**
```typescript
// Yeni dosya: src/pages/users/users.page.tsx
// Yeni dosya: src/containers/UsersContainer/
```

**Özellikler:**
- User roles (Admin, Viewer, Editor)
- Permission management
- User activity logs

#### **3.3 API Explorer**
```typescript
// Yeni dosya: src/pages/api-explorer/api-explorer.page.tsx
// Yeni dosya: src/containers/ApiExplorerContainer/
```

**Özellikler:**
- API endpoint testing
- Query builder
- Response visualization

---

## 🛠️ **Uygulama Planı**

### **🎯 İlk Adım: Logs Management Sistemi**

En kritik eksiklik **Logs Management** olduğu için buradan başlayalım:

#### **1. Logs API Servisi Oluşturma**
```typescript
// src/providers/api/logs.api.ts
export const logsApi = {
  async searchLogs(params: {
    query: string;
    start: number;
    end: number;
    limit?: number;
    level?: string;
    service?: string;
  }) {
    // Loki veya Elasticsearch entegrasyonu
    const response = await getBackendSrv().post('/api/datasources/proxy/uid/loki/api/v1/query_range', {
      query: params.query,
      start: params.start,
      end: params.end,
      limit: params.limit || 1000,
    });
    return response;
  },

  async getLogLevels() {
    return ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  },

  async getLogStreams() {
    // Gerçek zamanlı log streaming
    return new EventSource('/api/logs/stream');
  }
};
```

#### **2. Logs Container Oluşturma**
```typescript
// src/containers/LogsContainer/LogsContainer.tsx
const LogsContainer: React.FC = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    level: '',
    service: '',
    timeRange: [Date.now() - 3600000, Date.now()]
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await logsApi.searchLogs(filters);
      setLogs(response.data.result || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseContainer title="Logs">
      <LogsFilters onFiltersChange={setFilters} />
      <LogsTable data={logs} loading={loading} />
    </BaseContainer>
  );
};
```

#### **3. Route ve Menü Güncelleme**
```typescript
// src/routes/route-constant.tsx'e ekle
{
  path: '/logs',
  element: <LogsPage />,
  name: 'logs',
  title: 'Logs',
  showInMenu: true,
}
```

### **🎯 İkinci Adım: Enhanced Dashboard**

#### **1. Dashboard Container Geliştirme**
```typescript
// src/containers/DashboardContainer/DashboardContainer.tsx
const DashboardContainer: React.FC = () => {
  const [dashboardData, setDashboardData] = useState({
    totalServices: 0,
    totalTraces: 0,
    errorRate: 0,
    avgLatency: 0,
    topErrors: [],
    serviceHealth: []
  });

  return (
    <BaseContainer title="Dashboard">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <StatCard title="Total Services" value={dashboardData.totalServices} />
        </Col>
        <Col span={6}>
          <StatCard title="Total Traces" value={dashboardData.totalTraces} />
        </Col>
        <Col span={6}>
          <StatCard title="Error Rate" value={`${dashboardData.errorRate}%`} />
        </Col>
        <Col span={6}>
          <StatCard title="Avg Latency" value={`${dashboardData.avgLatency}ms`} />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <ErrorTrendChart data={dashboardData.topErrors} />
        </Col>
        <Col span={12}>
          <ServiceHealthChart data={dashboardData.serviceHealth} />
        </Col>
      </Row>
    </BaseContainer>
  );
};
```

### **🎯 Üçüncü Adım: Alerts System**

#### **1. Alerts API Servisi**
```typescript
// src/providers/api/alerts.api.ts
export const alertsApi = {
  async createAlertRule(rule: {
    name: string;
    condition: string;
    threshold: number;
    duration: string;
    notificationChannels: string[];
  }) {
    // Grafana Alerting API entegrasyonu
    const response = await getBackendSrv().post('/api/alerting/rules', rule);
    return response;
  },

  async getAlertRules() {
    const response = await getBackendSrv().get('/api/alerting/rules');
    return response;
  },

  async getAlertHistory(ruleId: string) {
    const response = await getBackendSrv().get(`/api/alerting/rules/${ruleId}/history`);
    return response;
  }
};
```

---

## 📋 **Geliştirme Checklist'i**

### **Faz 1 Checklist:**
- [ ] Logs API servisi oluştur
- [ ] LogsContainer bileşeni geliştir
- [ ] Logs filtreleme sistemi
- [ ] Enhanced Dashboard container
- [ ] Error tracking sayfası
- [ ] Route ve menü güncellemeleri

### **Faz 2 Checklist:**
- [ ] Alerts API servisi
- [ ] AlertsContainer bileşeni
- [ ] Performance monitoring charts
- [ ] Interactive Service Map
- [ ] Real-time data streaming

### **Faz 3 Checklist:**
- [ ] Dashboard Builder
- [ ] User Management
- [ ] API Explorer
- [ ] Advanced visualizations

---

## 🚀 **Hemen Başlayabileceğiniz İlk Adımlar:**

1. **Logs API servisi oluşturun** - En kritik eksiklik
2. **Dashboard'ı geliştirin** - Kullanıcı deneyimi için önemli
3. **Error tracking ekleyin** - SigNoz'un temel özelliklerinden biri

---

## 📁 **Yeni Dosya Yapısı**

### **Faz 1 İçin Yeni Dosyalar:**
```
src/
├── pages/
│   ├── logs/
│   │   └── logs.page.tsx
│   └── exceptions/
│       └── exceptions.page.tsx
├── containers/
│   ├── LogsContainer/
│   │   ├── LogsContainer.tsx
│   │   ├── LogsFilters.tsx
│   │   └── LogsTable.tsx
│   ├── DashboardContainer/
│   │   ├── DashboardContainer.tsx
│   │   ├── StatCard.tsx
│   │   └── components/
│   └── ExceptionsContainer/
│       ├── ExceptionsContainer.tsx
│       └── ErrorTrendChart.tsx
├── providers/
│   └── api/
│       ├── logs.api.ts
│       └── alerts.api.ts
└── components/
    └── charts/
        ├── ErrorTrendChart.tsx
        └── ServiceHealthChart.tsx
```

### **Faz 2 İçin Yeni Dosyalar:**
```
src/
├── pages/
│   └── alerts/
│       └── alerts.page.tsx
├── containers/
│   ├── AlertsContainer/
│   │   ├── AlertsContainer.tsx
│   │   ├── AlertRules.tsx
│   │   └── AlertHistory.tsx
│   └── PerformanceContainer/
│       └── PerformanceContainer.tsx
└── components/
    └── PerformanceCharts/
        ├── LatencyChart.tsx
        ├── ThroughputChart.tsx
        └── ErrorRateChart.tsx
```

---

## 🔧 **Teknik Gereksinimler**

### **Yeni Bağımlılıklar:**
```json
{
  "dependencies": {
    "react-query": "^3.39.0",        // Server state management
    "react-window": "^1.8.8",        // Virtual scrolling for large logs
    "react-virtualized": "^9.22.0",  // Table virtualization
    "monaco-editor": "^0.45.0",      // Code editor for queries
    "react-flow-renderer": "^10.3.0", // Interactive service map
    "socket.io-client": "^4.7.0"     // Real-time updates
  }
}
```

### **Grafana Plugin Güncellemeleri:**
```json
// plugin.json güncellemeleri
{
  "includes": [
    {
      "type": "page",
      "name": "Logs",
      "path": "/a/iyzitrace-app/logs",
      "addToNav": true
    },
    {
      "type": "page", 
      "name": "Alerts",
      "path": "/a/iyzitrace-app/alerts",
      "addToNav": true
    },
    {
      "type": "page",
      "name": "Exceptions", 
      "path": "/a/iyzitrace-app/exceptions",
      "addToNav": true
    }
  ]
}
```

---

## 📊 **Performans Optimizasyonları**

### **1. Virtual Scrolling**
```typescript
// Büyük log listeleri için
import { FixedSizeList as List } from 'react-window';

const LogsTable = ({ data }) => (
  <List
    height={600}
    itemCount={data.length}
    itemSize={50}
    itemData={data}
  >
    {LogRow}
  </List>
);
```

### **2. Data Caching**
```typescript
// React Query ile cache
import { useQuery } from 'react-query';

const useLogs = (filters) => {
  return useQuery(
    ['logs', filters],
    () => logsApi.searchLogs(filters),
    {
      staleTime: 30000, // 30 saniye
      cacheTime: 300000, // 5 dakika
    }
  );
};
```

### **3. Real-time Updates**
```typescript
// WebSocket ile real-time
const useRealTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const eventSource = new EventSource('/api/logs/stream');
    eventSource.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs(prev => [newLog, ...prev.slice(0, 999)]);
    };
    
    return () => eventSource.close();
  }, []);
  
  return logs;
};
```

---

## 🎯 **Başlangıç Önerisi**

**İlk olarak Logs Management sistemi ile başlayın çünkü:**
1. ✅ En kritik eksiklik
2. ✅ SigNoz'un temel özelliklerinden biri
3. ✅ Mevcut altyapıya kolay entegrasyon
4. ✅ Kullanıcı deneyimini önemli ölçüde iyileştirir

Hangi özellikle başlamak istiyorsunuz? Size detaylı kod örnekleri ve implementasyon rehberi hazırlayabilirim!
