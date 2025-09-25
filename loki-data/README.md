Loki Seeding
============

Bu klasör, Loki'ye örnek log verisi göndermek için bir script içerir. Üretilen loglar, uygulamadaki transform ve UI ile uyumlu alanlara sahiptir.

Üretilen JSON alanları
----------------------
- Top-level: `id`, `timestamp`, `level`, `service`, `message`, `traceId`, `spanId`, `hostname`, `environment`, `namespace`, `pod`, `deployment`, `cluster`
- Attributes: `app`, `job`, `level`, `service`, `service_name`, `environment`
- Labels (stream): `job`, `app`, `service`, `service_name`, `level`, `environment`

Script
------
Çalıştırmak için:

```bash
node loki-data/seed-logs.js
```

Varsayılan olarak `http://localhost:3100`'a yazar. Farklı bir endpoint için:

```bash
LOKI_URL=http://localhost:3100 node loki-data/seed-logs.js
```

Temiz başlangıç (kalıcı veriyi siler!)
-------------------------------------
Tamamen sıfırdan başlamak için (tüm Loki verisini siler):

```bash
docker compose down
docker compose up -d
node loki-data/seed-logs.js
```

Notlar
-----
- Servisler `api`, `web`, `worker`; environment `prod`, `staging`; seviyeler `DEBUG/INFO/WARN/ERROR/FATAL` olarak çeşitlendirilir.
- Script, her kombinasyon için ayrı stream kullanır ve logları son saatlere damgalar.

