# NGINX Metrics Dashboard

> **UID:** `nginx-metrics-dashboard` | **Folder:** Demo | **Datasource:** Prometheus (`webstore-metrics`) | **Refresh:** 30s | **Tags:** `nginx` `opentelemetry`

## Overview

A comprehensive Grafana dashboard for real-time monitoring of an NGINX instance. Built on **4 OpenTelemetry metrics** scraped by Prometheus, the dashboard derives rich observability through calculated queries — including drop rates, handle rate %, and requests per connection. It contains **19 panels** (4 stat + 15 time series/piechart) organized into 4 thematic sections.

## Import

To import the dashboard into Grafana:

1. Go to Grafana → **Dashboards → Import**
2. Upload the `nginx-dashboard.json` file
3. Select **Prometheus (`webstore-metrics`)** as the datasource
4. Click **Import**

---

## Panels

### 1. 📊 Overview (Stat Panels)

Four at-a-glance indicators for immediate health assessment.

| Panel               | Metric / Query                              | Unit  | Thresholds                    |
| ------------------- | ------------------------------------------- | ----- | ----------------------------- |
| Total Requests      | `nginx_requests_total`                      | count | 🔵 always                     |
| Request Rate        | `rate(nginx_requests_total[1m])`            | req/s | 🟢 <500 / 🟡 <1000 / 🔴 ≥1000 |
| Active Connections  | `nginx_connections_current{state="active"}` | count | 🟢 <500 / 🟡 <1000 / 🔴 ≥1000 |
| Dropped Connections | `accepted_total - handled_total`            | count | 🟢 0 / 🟡 ≥1 / 🔴 ≥10         |

### 2. 📈 Request Throughput

| Panel                     | Query                                                              | Description                                            |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| Request Rate (req/s)      | `rate(nginx_requests_total[1m])`, `rate(nginx_requests_total[5m])` | Short-term (1m) and smoothed (5m) request rate overlay |
| Cumulative Total Requests | `nginx_requests_total`                                             | Ever-increasing total request counter                  |

### 3. 🔌 Connections — Lifecycle

| Panel                          | Query                                                                                     | Description                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Accepted vs Handled (Rate)     | `rate(nginx_connections_accepted_total[1m])`, `rate(nginx_connections_handled_total[1m])` | Connection acceptance and handling rates — any gap indicates drops             |
| Dropped Connections Rate       | `rate(accepted[1m]) - rate(handled[1m])`                                                  | Rate of connections dropped due to resource limits (e.g. `worker_connections`) |
| Cumulative Accepted vs Handled | `accepted_total`, `handled_total`, `accepted - handled`                                   | Long-term view of the gap between accepted and handled connections             |

### 4. 🔴 Connections — Current State

| Panel                            | Query                                        | Description                                                                        |
| -------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Current Connections by State     | `nginx_connections_current` (all states)     | Time series of active, reading, writing, and waiting connections                   |
| Connection State Distribution    | `nginx_connections_current` (donut chart)    | Real-time distribution of connection states                                        |
| Waiting (Keep-Alive) Connections | `nginx_connections_current{state="waiting"}` | Idle keep-alive connections — high values may indicate keep-alive misconfiguration |
| Reading & Writing Connections    | `nginx_connections_current{state="reading    | writing"}`                                                                         | Connections actively receiving requests or sending responses |

### 5. 🧮 Efficiency Analysis

| Panel                    | Query                                          | Description                                                                         |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Connection Handle Rate % | `100 * rate(handled[1m]) / rate(accepted[1m])` | Percentage of accepted connections successfully handled — should be ≥ 99%           |
| Requests per Connection  | `rate(requests[1m]) / rate(handled[1m])`       | Average number of HTTP requests per TCP connection — reflects keep-alive efficiency |

---

## Metrics Reference

All 4 NGINX metrics available in Prometheus:

| Metric                             | Type    | Description                                      | Used In                             |
| ---------------------------------- | ------- | ------------------------------------------------ | ----------------------------------- |
| `nginx_requests_total`             | Counter | Total number of client requests processed        | ✅ Overview, Throughput, Efficiency |
| `nginx_connections_accepted_total` | Counter | Total accepted TCP connections since start       | ✅ Overview, Lifecycle, Efficiency  |
| `nginx_connections_handled_total`  | Counter | Total handled TCP connections since start        | ✅ Overview, Lifecycle, Efficiency  |
| `nginx_connections_current`        | Gauge   | Current connections broken down by `state` label | ✅ Overview, Current State          |

### Available Labels

| Label       | Values                                    | Description              |
| ----------- | ----------------------------------------- | ------------------------ |
| `state`     | `active`, `reading`, `writing`, `waiting` | Current connection state |
| `host_name` | hostname string                           | NGINX host identifier    |

### Connection States Explained

| State     | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `active`  | Total active client connections (includes reading, writing, waiting) |
| `reading` | Connections where NGINX is reading the request header                |
| `writing` | Connections where NGINX is writing a response to the client          |
| `waiting` | Idle keep-alive connections waiting for the next request             |

### Derived Metrics (Calculated in Dashboard)

| Derived Metric          | Formula                                        | Description                                                    |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| Dropped Connections     | `accepted_total - handled_total`               | Connections accepted but not handled (resource exhaustion)     |
| Drop Rate               | `rate(accepted[1m]) - rate(handled[1m])`       | Real-time connection drop rate                                 |
| Handle Rate %           | `100 * rate(handled[1m]) / rate(accepted[1m])` | Fraction of accepted connections successfully handled          |
| Requests per Connection | `rate(requests[1m]) / rate(handled[1m])`       | Keep-alive efficiency — higher = more reuse per TCP connection |

---

## ⚠️ Operational Notes

| Condition                     | Action                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Dropped Connections > 0       | Increase `worker_connections` in `nginx.conf`; check system `ulimit -n`            |
| Handle Rate % < 99%           | Worker process resource exhaustion — scale workers or tune connection limits       |
| Waiting connections very high | Review `keepalive_timeout` setting; may indicate idle connection accumulation      |
| Reading connections spike     | Slow clients sending requests — consider `client_header_timeout` tuning            |
| Writing connections spike     | Slow clients or upstream delays — review upstream response times                   |
| Requests/connection < 1       | Keep-alive may be disabled; connections are being reused very little               |
| Requests/connection very high | Clients making many requests per connection — normal for HTTP/2 or proxied traffic |

---

## Files

| File                   | Description                           |
| ---------------------- | ------------------------------------- |
| `nginx-dashboard.json` | Grafana dashboard export (importable) |
| `nginx-dashboard.md`   | This document                         |