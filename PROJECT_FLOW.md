# 🚀 **IyziTrace Projesi - Detaylı Analiz ve Açıklama**

Bu projeyi sıfırdan anlayabilmeniz için tüm detaylarıyla açıklayacağım. Bu bir **Grafana App Plugin** projesi ve **distributed tracing** için geliştirilmiş.

---

## 📁 **1. PROJE YAPISI VE ORGANİZASYON**

### **Ana Klasör Yapısı:**
```
iyzitrace/
├── src/                    # Kaynak kodlar
│   ├── components/         # React bileşenleri
│   ├── containers/         # Sayfa container'ları
│   ├── pages/             # Sayfa bileşenleri
│   ├── providers/         # API servisleri
│   ├── store/             # Redux state yönetimi
│   ├── routes/            # Sayfa yönlendirme
│   ├── utils/             # Yardımcı fonksiyonlar
│   └── interfaces/        # TypeScript tip tanımları
├── dist/                  # Build edilmiş dosyalar
├── provisioning/          # Grafana konfigürasyonu
└── shared/               # Paylaşılan konfigürasyonlar
```

---

## 🏗️ **2. MİMARİ YAPISI**

### **A. Grafana Plugin Mimarisi**
```typescript
// module.tsx - Plugin giriş noktası
export const plugin = new AppPlugin<{}>()
  .setRootPage(App)                    // Ana uygulama
  .addConfigPage({                     // Konfigürasyon sayfası
    title: 'Configuration',
    icon: 'cog',
    body: AppConfig,
    id: 'configuration',
  });
```

**Ne işe yarar?**
- Grafana'ya plugin olarak entegre olur
- Ana sayfa ve konfigürasyon sayfası sağlar
- Grafana'nın tema ve API'lerini kullanır

### **B. React Uygulama Mimarisi**
```typescript
// App.tsx - Ana uygulama bileşeni
function App(props: AppRootProps) {
  return (
    <React.StrictMode>
      <Provider store={store}>           {/* Redux store */}
        <PersistGate loading={null} persistor={persistor}>
          <ConfigProvider theme={themetoken}>  {/* Ant Design tema */}
            <AliveScope>                        {/* Tab yönetimi */}
              <TempoInitializer></TempoInitializer>  {/* Tempo bağlantısı */}
              <MainLayout>                       {/* Ana layout */}
                <AppRoutes />                    {/* Sayfa yönlendirme */}
              </MainLayout>
            </AliveScope>
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}
```

---

## 🔄 **3. LIFECYCLE VE STATE YÖNETİMİ**

### **A. React Lifecycle**
```typescript
// TempoInitializer.tsx - Uygulama başlangıcında çalışır
const TempoInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadTempos = async () => {
      // Grafana'dan Tempo datasource'larını al
      const listFromGrafana = getDataSourceSrv()
        .getList()
        .filter((ds) => ds.type === 'tempo');

      const uidList = listFromGrafana.map((ds) => ds.uid);
      dispatch(setTempoUids(uidList));  // Redux'a kaydet

      // LocalStorage'dan kayıtlı UID'yi al
      const saved = getTempoUidFromLocal();
      if (saved && uidList.includes(saved)) {
        dispatch(setSelectedTempoUid(saved));
      }
    };

    loadTempos();
  }, [dispatch]);  // Sadece dispatch değiştiğinde çalış

  return null; // Görünmez component
}
```

### **B. Redux State Yönetimi**
```typescript
// store.ts - Redux store konfigürasyonu
const store = configureStore({
  reducer: persistedReducer,  // Redux Persist ile kalıcı
});

// tempo.slice.ts - Tempo verileri için state
const tempoSlice = createSlice({
  name: 'tempo',
  initialState: {
    tempoUids: [],                    // Mevcut Tempo datasource'ları
    selectedTempoUid: null,          // Seçili Tempo UID'si
    selectedPrometheusUid: null,     // Seçili Prometheus UID'si
  },
  reducers: {
    setTempoUids(state, action) {    // Tempo listesini güncelle
      state.tempoUids = action.payload;
    },
    setSelectedTempoUid(state, action) {  // Seçili Tempo'yu güncelle
      state.selectedTempoUid = action.payload;
    },
  },
});
```

### **C. Tab Yönetimi**
```typescript
// tab.slice.ts - Tab state yönetimi
const tabsSlice = createSlice({
  name: 'tabs',
  initialState: {
    tabs: [{ key: '/a/iyzitrace-app/', label: 'Dashboard', closable: false }],
    activeKey: '/a/iyzitrace-app/',
  },
  reducers: {
    addTab: (state, action) => {     // Yeni tab ekle
      if (!state.tabs.find(t => t.key === action.payload.key)) {
        state.tabs.push(action.payload);
        state.activeKey = action.payload.key;
      }
    },
    removeTab: (state, action) => {  // Tab kaldır
      state.tabs = state.tabs.filter(t => t.key !== action.payload);
    },
  },
});
```

---

## 📊 **4. VERİ AKIŞI VE API ENTEGRASYONLARI**

### **A. Tempo API Entegrasyonu**
```typescript
// tempo.api.ts - Tempo backend ile iletişim
export const TempoApi = {
  async searchTraceQL({ query, start, end, limit }) {
    const uid = this.getSelectedUid();
    const url = `/api/datasources/proxy/uid/${uid}/api/search`;
    
    const response = await getBackendSrv().post(url, {
      query,
      start: start * 1_000_000,  // Nanosaniyeye çevir
      end: end * 1_000_000,
      limit,
    });
    
    return response;
  },

  async getServiceNames() {
    const uid = this.getSelectedUid();
    const url = `/api/datasources/proxy/uid/${uid}/api/search/tags/service.name/values`;
    const res = await getBackendSrv().get(url);
    return res;
  },
};
```

### **B. Prometheus API Entegrasyonu**
```typescript
// prometheus.api.ts - Prometheus metrikleri
export const prometheusApi = {
  async runTraceQLQuery(query: string) {
    const uid = await this.resolvePrometheusUid();
    const url = `/api/datasources/proxy/uid/${uid}/api/v1/query`;
    const res = await getBackendSrv().get(url, { query });
    return res.data.result;
  },
};
```

### **C. Veri Akışı Örneği - Service Card**
```typescript
// ServiceCard.tsx - Servis kartı bileşeni
const ServiceCard: React.FC<ServiceCardProps> = ({ name, start, end }) => {
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatency = async () => {
      try {
        setLoading(true);
        
        // Prometheus'dan latency metriklerini al
        const avgLatencyQuery = `sum(rate(traces_spanmetrics_latency_sum{service="${name}"}[5m])) / sum(rate(traces_spanmetrics_latency_count{service="${name}"}[5m]))`;
        
        const avgLatencyResponse = await prometheusApi.runTraceQLQuery(avgLatencyQuery);
        const avgLatencyValue = avgLatencyResponse[0]?.value[1] || 0;
        
        setLatency({
          avg: parseFloat(avgLatencyValue),
          // ... diğer metrikler
        });
      } catch (err) {
        setLatency(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLatency();
  }, [name, start, end]);  // Bu değerler değiştiğinde yeniden fetch et

  return (
    <Card style={cardStyle}>
      {loading ? (
        <Spin size="small" />
      ) : (
        <div>
          <Text>Avg. Lat: {latency?.avg?.toFixed(2)} ms</Text>
          {/* ... diğer metrikler */}
        </div>
      )}
    </Card>
  );
};
```

---

## 🎨 **5. UI BİLEŞENLERİ VE SAYFA YAPILARI**

### **A. Layout Yapısı**
```typescript
// MainLayout.tsx - Ana layout
const MainLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />                    {/* Sol menü */}
      <Layout>
        <Layout.Header>
          <TabManager />             {/* Üst tab yöneticisi */}
        </Layout.Header>
        <Content className="main-content">
          {children}                 {/* Sayfa içeriği */}
        </Content>
      </Layout>
    </Layout>
  );
};
```

### **B. Sidebar Menü**
```typescript
// sidebar.component.tsx - Sol menü
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (e) => {
    navigate(`${PLUGIN_BASE_URL}/${e.key}`);  // Sayfa değiştir
  };

  return (
    <Sider>
      <Menu
        theme="dark"
        selectedKeys={[currentKey || 'services']}
        onClick={handleMenuClick}
        items={[
          { key: 'services', icon: <BarChartOutlined />, label: 'Services' },
          { key: 'traces', icon: <FileSearchOutlined />, label: 'Traces' },
          { key: 'logs', icon: <ProfileOutlined />, label: 'Logs' },
          // ... diğer menü öğeleri
        ]}
      />
    </Sider>
  );
};
```

### **C. Sayfa Yapısı**
```typescript
// services.page.tsx - Servisler sayfası
function ServicesPage() {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <ServicesContainer />  {/* Container bileşeni */}
    </PluginPage>
  );
}

// ServicesContainer.tsx - Servisler container'ı
const ServicesContainer = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await TempoApi.getServiceNames();
        setServices(Array.isArray(data.values) ? data.values : []);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <BaseContainer title="Services">
      <Row gutter={[16, 16]}>
        {services.map((service) => (
          <Col key={service.value} xs={24} sm={12} md={8} lg={6} xl={4}>
            <ServiceCard name={service.value} start={oneWeekAgo} end={now} />
          </Col>
        ))}
      </Row>
    </BaseContainer>
  );
};
```

---

## 🛠️ **6. YARDIMCI ARAÇLAR VE UTİLİTELER**

### **A. Tema Sistemi**
```typescript
// themetoken.util.ts - Ant Design tema konfigürasyonu
export const themetoken = {
  algorithm: theme.darkAlgorithm,  // Koyu tema
  token: {
    colorPrimary: "#d5521e",       // Ana renk
    colorError: "#fd3838",         // Hata rengi
    fontSize: 13,                  // Font boyutu
    borderRadius: 12,              // Köşe yuvarlaklığı
    fontFamily: "Quicksand, sans-serif"  // Font ailesi
  },
  components: {
    Select: {
      colorTextPlaceholder: "rgba(255, 255, 255, 0.45)"
    },
    // ... diğer bileşen stilleri
  }
};
```

### **B. LocalStorage Yönetimi**
```typescript
// localstorage.util.ts - Yerel depolama
const STORAGE_KEY = 'selectedTempoUid';

export const saveTempoUidToLocal = (uid: string) => {
  localStorage.setItem(STORAGE_KEY, uid);
};

export const getTempoUidFromLocal = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};
```

### **C. Renk Yardımcıları**
```typescript
// color.util.ts - Renk yardımcıları
export const randomBackgroundGradient = () => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    // ... diğer gradient'ler
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};
```

---

## 🔄 **7. SAYFA YÖNLENDİRME SİSTEMİ**

### **A. Route Tanımları**
```typescript
// route-constant.tsx - Sayfa yolları
export const appRoutes: AppRoute[] = [
  {
    path: '/services/:serviceName',    // Servis detay sayfası
    element: <ServiveDetail />,
    name: 'serviceDetail',
    title: 'Service Detail',
  },
  {
    path: '/services',                 // Servisler listesi
    element: <Services />,
    name: 'services',
    title: 'Services',
    showInMenu: true,
  },
  {
    path: '/traces/:traceId',          // Trace detay sayfası
    element: <TraceDetail />,
    name: 'tracedetail',
    title: 'Trace Detail',
  },
  {
    path: '/traces',                   // Trace listesi
    element: <TracePage />,
    name: 'traces',
    title: 'Traces',
    showInMenu: true,
  },
  {
    path: '/',                         // Ana sayfa
    element: <Dashboard />,
    name: 'dashboard',
    title: 'Dashboard',
    showInMenu: true,
  },
];
```

### **B. Route Renderer**
```typescript
// AppRoutes.tsx - Route renderer
const AppRoutes = () => (
  <Routes>
    {renderRoutes(appRoutes)}
    <Route path="*" element={<Navigate to="/" replace />} />  {/* 404 yönlendirme */}
  </Routes>
);
```

---

## 📈 **8. VERİ GÖRSELLEŞTİRME**

### **A. ApexCharts Entegrasyonu**
```typescript
// MiddleStatsCharts.tsx - Grafik bileşeni
const MiddleStatsCharts = ({ serviceNames, start, end }) => {
  const [chartData, setChartData] = useState([]);

  const getMetrics = async () => {
    const p50Query = `histogram_quantile(0.50, sum(rate(traces_spanmetrics_latency_bucket[5m])) by (le, service))`;
    const p90Query = `histogram_quantile(0.90, sum(rate(traces_spanmetrics_latency_bucket[5m])) by (le, service))`;
    
    const [p50, p90] = await Promise.all([
      prometheusApi.runTraceQLQuery(p50Query),
      prometheusApi.runTraceQLQuery(p90Query),
    ]);
    
    // Veriyi grafik formatına çevir
    const data = {};
    p50.forEach((item) => {
      const name = item.metric?.service || 'unknown';
      if (!data[name]) data[name] = { service: name };
      data[name]['p50'] = parseFloat(item.value[1]) * 1000;
    });
    
    setChartData(Object.values(data));
  };

  return (
    <ApexCharts
      options={{
        chart: { type: "line", height: 400 },
        xaxis: { categories: services },
        yaxis: { title: { text: "Latency (ms)" } },
      }}
      series={[
        { name: "P50", data: chartData.map(d => d.p50) },
        { name: "P90", data: chartData.map(d => d.p90) },
      ]}
    />
  );
};
```

---

## ⚙️ **9. PROJE ÇALIŞMA PRENSİBİ**

### **A. Uygulama Başlatma Sırası:**
1. **Grafana Plugin Yükleme** → `module.tsx` çalışır
2. **App Bileşeni Yükleme** → `App.tsx` çalışır
3. **Redux Store Kurulumu** → State yönetimi başlar
4. **Tempo Bağlantısı** → `TempoInitializer` çalışır
5. **Layout Render** → `MainLayout` render edilir
6. **Route Yükleme** → Sayfa yönlendirme aktif olur

### **B. Kullanıcı Etkileşimi:**
1. **Menü Tıklama** → Sidebar'dan sayfa seçimi
2. **Tab Yönetimi** → Yeni tab açma/kapama
3. **Veri Çekme** → API çağrıları ile veri alma
4. **State Güncelleme** → Redux ile state güncelleme
5. **UI Render** → Yeni veri ile UI güncelleme

### **C. Veri Akışı:**
```
Grafana Tempo → TempoApi → Redux Store → React Components → UI
     ↓
Prometheus → PrometheusApi → Charts → ApexCharts → Grafikler
```

---

## 🚀 **10. GELİŞTİRME İÇİN ÖNEMLİ NOKTALAR**

### **A. Yeni Sayfa Ekleme:**
1. `src/pages/` altında sayfa bileşeni oluştur
2. `src/containers/` altında container oluştur
3. `src/routes/route-constant.tsx`'e route ekle
4. `src/components/core/layout/sidebar.component.tsx`'e menü öğesi ekle

### **B. Yeni API Ekleme:**
1. `src/providers/api/` altında API servisi oluştur
2. `src/providers/index.ts`'e export et
3. Bileşenlerde kullan

### **C. State Yönetimi:**
1. `src/store/slices/` altında yeni slice oluştur
2. `src/store/rootReducer.ts`'e ekle
3. Bileşenlerde `useAppSelector` ve `useAppDispatch` kullan

---

## 📝 **Özet**

Bu proje, modern React geliştirme pratiklerini, Grafana ekosistemi entegrasyonunu ve distributed tracing konularını bir araya getiren kapsamlı bir uygulamadır. Her bileşen belirli bir sorumluluğa sahip ve birbirleriyle uyumlu çalışacak şekilde tasarlanmıştır.

**Ana Özellikler:**
- ✅ Grafana App Plugin olarak çalışır
- ✅ Redux ile state yönetimi
- ✅ Tempo ve Prometheus entegrasyonu
- ✅ Modern React hooks kullanımı
- ✅ Ant Design UI bileşenleri
- ✅ ApexCharts ile veri görselleştirme
- ✅ Tab yönetimi sistemi
- ✅ Responsive tasarım
