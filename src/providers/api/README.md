# Loki API Modules

Bu dizin Loki entegrasyonu için ayrıştırılmış API modüllerini içerir.

## Dosya Yapısı

### `loki.api.read.ts`
**Okuma İşlemleri** - Grafana'nın resmi Loki datasource instance'ını ve önerilen languageProvider metodlarını kullanarak veri okuma
- `queryLogs()` - Zaman aralığı sorguları (range queries)
- `queryLogsInstant()` - Anlık sorgular (instant queries)
- `queryLogsAsDataFrames()` - DataFrame formatında log verilerini getir (Grafana LogsPanel pattern)
- `getLabels()` - Mevcut label'ları listele (languageProvider.fetchLabels kullanarak)
- `getLabelValues()` - Belirli label'ın değerlerini listele (languageProvider.fetchLabelValues kullanarak)
- `getSeriesLabels()` - Belirli stream selector için label'ları getir (languageProvider.fetchSeriesLabels kullanarak)
- `getParserAndLabelKeys()` - Log stream için parser ve label key'leri tespit et (languageProvider.getParserAndLabelKeys kullanarak)
- `getLogRowContext()` - Log context desteği (Grafana LogsPanel pattern)
- `getLogRowContextUi()` - Log context UI desteği (Grafana LogsPanel pattern)
- `hasLogsContextSupport()` - Logs context desteği kontrolü
- `hasLogsContextUiSupport()` - Logs context UI desteği kontrolü
- `getDatasourceInfo()` - Loki datasource bilgilerini getir
- `isDatasourceAvailable()` - Datasource'un aktif olup olmadığını kontrol et
- `getQueryHints()` - Query iyileştirme önerileri al
- `getQueryStats()` - Query istatistikleri al

**Kullanım:**
```typescript
import { lokiReadApi } from '../providers/api/loki.api.read';

// Zaman aralığı sorgusu
const result = await lokiReadApi.queryLogs({
  query: '{job="test-app"}',
  start: '2025-01-01T00:00:00Z',
  end: '2025-01-01T23:59:59Z',
  limit: 100,
  direction: 'backward'
});

// Anlık sorgu
const instantResult = await lokiReadApi.queryLogsInstant({
  query: '{job="test-app"}',
  time: '2025-01-01T12:00:00Z',
  limit: 50
});

// Datasource kontrolü
const isAvailable = await lokiReadApi.isDatasourceAvailable();

// Query hints al
const hints = await lokiReadApi.getQueryHints('{job="test-app"}');

// Query stats al
const stats = await lokiReadApi.getQueryStats('{job="test-app"}', {
  start: '2025-01-01T00:00:00Z',
  end: '2025-01-01T23:59:59Z'
});

// Stream selector için label'ları al
const seriesLabels = await lokiReadApi.getSeriesLabels('{job="test-app"}');

// Parser ve label key'leri tespit et
const parserInfo = await lokiReadApi.getParserAndLabelKeys('{job="test-app"}', { maxLines: 5 });

// DataFrame formatında log verilerini getir (Grafana LogsPanel pattern)
const dataFrames = await lokiReadApi.queryLogsAsDataFrames({
  query: '{job="test-app"}',
  start: '2025-01-01T00:00:00Z',
  end: '2025-01-01T23:59:59Z',
  limit: 100
});

// Log context desteği kontrolü
const hasContextSupport = lokiReadApi.hasLogsContextSupport();
const hasContextUiSupport = lokiReadApi.hasLogsContextUiSupport();
```

### `loki.api.write.ts`
**Yazma İşlemleri** - HTTP push ile Loki'ye veri yazma
- `writeLogs()` - Log array'ini Loki'ye yaz
- `writeLog()` - Tek log entry'sini yaz
- `writeRawLog()` - Raw log line'ını yaz
- `writeProcessedLogsToLoki()` - Pipeline'dan işlenmiş logları yaz

**Kullanım:**
```typescript
import { lokiWriteApi } from '../providers/api/loki.api.write';

const result = await lokiWriteApi.writeLogs([log1, log2], {
  labels: { service: 'my-service' }
});
```

## Mimari Kararlar

### Okuma (Read)
- **Grafana Datasource Instance**: Tüm okuma işlemleri Grafana'nın resmi Loki datasource instance'ı üzerinden yapılır
- **LanguageProvider Methods**: Grafana'nın önerdiği `languageProvider` metodları kullanılır
- **Authentication**: Grafana'nın built-in authentication sistemi kullanılır
- **Caching**: Grafana'nın intelligent caching mekanizması otomatik olarak kullanılır
- **DataFrame Support**: Grafana'nın DataFrame formatı ile uyumlu response handling
- **Advanced Features**: 
  - Query hints ve iyileştirme önerileri
  - Query istatistikleri
  - Template variable desteği
  - Ad-hoc filter desteği
  - Parser detection (JSON, Logfmt, Pack)
  - Stream selector analysis
  - Log context support (Grafana LogsPanel pattern)
  - DataFrame format support
  - LogRowModel compatibility

### Yazma (Write)
- **Direct HTTP**: Yazma işlemleri doğrudan HTTP push ile yapılır
- **Fallback**: Grafana proxy başarısız olursa CORS proxy'ye fallback
- **Batch Processing**: Loglar batch'ler halinde gönderilir

## Konfigürasyon

### Datasource
- Okuma için Grafana'da "Loki" datasource'u tanımlanmalı
- URL: `http://localhost:3100` (Loki server)
- Access: `Server (default)`

### CORS Proxy
- Yazma için CORS proxy `http://localhost:3101` kullanılır
- Proxy, `/loki/api/v1/push` isteklerini Loki'ye yönlendirir

## Grafana'nın Önerdiği LanguageProvider Metodları

Bu implementasyon Grafana'nın resmi dokümantasyonunda önerilen `languageProvider` metodlarını kullanır:

### Avantajları:
- **Intelligent Caching**: Sonuçlar input argümanlarına ve seçili zaman aralığına göre cache'lenir
- **Proper Authentication**: Custom authentication datasource seçenekleri doğru şekilde handle edilir
- **Improved Instrumentation**: Gelişmiş monitoring ve analiz özellikleri
- **Performance**: Gereksiz fetch isteklerini azaltarak performansı artırır

### Kullanılan Metodlar:
- `languageProvider.fetchLabels()` - Label isimlerini getir
- `languageProvider.fetchLabelValues()` - Label değerlerini getir
- `languageProvider.fetchSeriesLabels()` - Stream selector için label'ları getir
- `languageProvider.getParserAndLabelKeys()` - Parser ve label key'leri tespit et

## Grafana LogsPanel Pattern Desteği

Bu implementasyon Grafana'nın resmi LogsPanel kodunda kullanılan pattern'leri destekler:

### DataFrame Support:
- `queryLogsAsDataFrames()` - Grafana'nın DataFrame formatında veri döner
- LogRowModel uyumluluğu
- Grafana'nın log visualization component'leri ile uyumlu

### Context Support:
- `getLogRowContext()` - Log context sorguları
- `getLogRowContextUi()` - Context UI component'leri
- `hasLogsContextSupport()` - Context desteği kontrolü
- `hasLogsContextUiSupport()` - Context UI desteği kontrolü

### LogsPanel Integration:
- Grafana'nın LogRows component'i ile uyumlu
- LogRowContextModal desteği
- Infinite scrolling desteği
- Log filtering ve sorting desteği

## Hata Yönetimi

### Okuma Hataları
- Datasource bulunamazsa: "Loki datasource not configured"
- Query hataları: Loki'dan gelen hata mesajları

### Yazma Hataları
- Grafana proxy başarısız: CORS proxy'ye fallback
- CORS proxy başarısız: Detaylı hata mesajı

## Migration Notes

Bu refactor ile:
- ✅ Okuma ve yazma işlemleri ayrıştırıldı
- ✅ Grafana datasource entegrasyonu iyileştirildi
- ✅ Mevcut API imzaları korundu
- ✅ Geriye dönük uyumluluk sağlandı
