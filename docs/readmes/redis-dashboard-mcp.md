# Redis Metrics Dashboard

> **UID:** `redis-metrics-dashboard` | **Folder:** Demo | **Datasource:** Prometheus (`webstore-metrics`) | **Refresh:** 30s | **Tags:** `redis` `opentelemetry`

## Overview

A comprehensive Grafana dashboard for real-time monitoring of a Redis instance. It is built on **29 metrics** collected by the OpenTelemetry Redis receiver and stored in Prometheus. The dashboard contains **20 panels** (6 stat + 14 time series) organized into 6 thematic sections.

## Import

To import the dashboard into Grafana:

1. Go to Grafana → **Dashboards → Import**
2. Upload the `redis-dashboard.json` file
3. Select **Prometheus (`webstore-metrics`)** as the datasource
4. Click **Import**

---

## Panels

### 1. 📊 Overview

Six stat panels providing at-a-glance health indicators.

| Panel                      | Metric                             | Unit    | Thresholds                  |
| -------------------------- | ---------------------------------- | ------- | --------------------------- |
| Uptime                     | `redis_uptime_seconds_total`       | seconds | 🟢 always                   |
| Connected Clients          | `redis_clients_connected`          | count   | 🟢 <50 / 🟡 <100 / 🔴 ≥100  |
| Blocked Clients            | `redis_clients_blocked`            | count   | 🟢 <5 / 🟡 <20 / 🔴 ≥20     |
| Total DB Keys              | `sum(redis_db_keys)`               | count   | 🔵 always                   |
| Commands/sec               | `redis_commands_per_second`        | ops/s   | 🟢 always                   |
| Memory Fragmentation Ratio | `redis_memory_fragmentation_ratio` | ratio   | 🟢 <1.5 / 🟡 <2.0 / 🔴 ≥2.0 |

### 2. 💾 Memory

| Panel                      | Metrics                                                                                                  | Description                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Memory Usage               | `redis_memory_used_bytes`, `redis_memory_peak_bytes`, `redis_memory_rss_bytes`, `redis_memory_lua_bytes` | Used, peak, RSS, and Lua memory over time |
| Memory Fragmentation Ratio | `redis_memory_fragmentation_ratio`                                                                       | RSS / used memory ratio trend             |

### 3. ⚡ Performance & Commands

| Panel                   | Metrics                                                                        | Description                         |
| ----------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| Commands Processed      | `redis_commands_per_second`, `rate(redis_commands_processed_total[1m])`        | Command throughput                  |
| Keyspace Hits vs Misses | `rate(redis_keyspace_hits_total[1m])`, `rate(redis_keyspace_misses_total[1m])` | Cache hit/miss rates                |
| Hit Rate %              | `100 * hits / (hits + misses)`                                                 | Calculated cache hit percentage     |
| Keys Evicted & Expired  | `rate(redis_keys_evicted_total[1m])`, `rate(redis_keys_expired_total[1m])`     | Evicted and expired keys per second |

### 4. 🌐 Network & Connections

| Panel       | Metrics                                                                                    | Description                                               |
| ----------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Network I/O | `rate(redis_net_input_bytes_total[1m])`, `rate(redis_net_output_bytes_total[1m])`          | Input/output bytes per second (output on negative Y-axis) |
| Connections | `rate(redis_connections_received_total[1m])`, `rate(redis_connections_rejected_total[1m])` | Received vs rejected connection rates                     |

### 5. 🖥️ CPU & Persistence

| Panel                       | Metrics                                                                                                     | Description                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| CPU Usage                   | `rate(redis_cpu_time_seconds_total{mode="sys"}[1m])`, `rate(redis_cpu_time_seconds_total{mode="user"}[1m])` | System and user mode CPU consumption    |
| RDB Changes Since Last Save | `redis_rdb_changes_since_last_save`                                                                         | Unsaved changes since last RDB snapshot |

### 6. 🗝️ Keyspace & Replication

| Panel                   | Metrics                                                                                                         | Description                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| DB Keys & Expiring Keys | `redis_db_keys`, `redis_db_expires`                                                                             | Total and TTL-bearing keys per database  |
| Replication             | `redis_slaves_connected`, `redis_replication_offset_bytes`, `redis_replication_backlog_first_byte_offset_bytes` | Connected slaves and replication offsets |

---

## Metrics Reference

All 29 Redis metrics available in Prometheus:

| Metric                                              | Description                           | In Dashboard             |
| --------------------------------------------------- | ------------------------------------- | ------------------------ |
| `redis_clients_blocked`                             | Number of blocked clients             | ✅ Overview              |
| `redis_clients_connected`                           | Number of connected clients           | ✅ Overview              |
| `redis_clients_max_input_buffer_bytes`              | Max client input buffer size          | —                        |
| `redis_clients_max_output_buffer_bytes`             | Max client output buffer size         | —                        |
| `redis_commands_per_second`                         | Commands processed per second         | ✅ Overview, Performance |
| `redis_commands_processed_total`                    | Total commands processed (counter)    | ✅ Performance           |
| `redis_connections_received_total`                  | Total connections received            | ✅ Network               |
| `redis_connections_rejected_total`                  | Total connections rejected            | ✅ Network               |
| `redis_cpu_time_seconds_total`                      | Total CPU time by mode                | ✅ CPU                   |
| `redis_db_avg_ttl_milliseconds`                     | Average TTL of keys per DB            | —                        |
| `redis_db_expires`                                  | Number of keys with TTL per DB        | ✅ Keyspace              |
| `redis_db_keys`                                     | Total keys per DB                     | ✅ Overview, Keyspace    |
| `redis_keys_evicted_total`                          | Total evicted keys                    | ✅ Performance           |
| `redis_keys_expired_total`                          | Total expired keys                    | ✅ Performance           |
| `redis_keyspace_hits_total`                         | Total keyspace cache hits             | ✅ Performance           |
| `redis_keyspace_misses_total`                       | Total keyspace cache misses           | ✅ Performance           |
| `redis_latest_fork_microseconds`                    | Duration of last fork in µs           | —                        |
| `redis_memory_fragmentation_ratio`                  | RSS / used memory ratio               | ✅ Overview, Memory      |
| `redis_memory_lua_bytes`                            | Lua engine memory usage               | ✅ Memory                |
| `redis_memory_peak_bytes`                           | Peak memory used                      | ✅ Memory                |
| `redis_memory_rss_bytes`                            | Resident set size memory              | ✅ Memory                |
| `redis_memory_used_bytes`                           | Current memory in use                 | ✅ Memory                |
| `redis_net_input_bytes_total`                       | Total bytes received                  | ✅ Network               |
| `redis_net_output_bytes_total`                      | Total bytes sent                      | ✅ Network               |
| `redis_rdb_changes_since_last_save`                 | Unsaved RDB changes since last save   | ✅ Persistence           |
| `redis_replication_backlog_first_byte_offset_bytes` | Replication backlog first byte offset | ✅ Replication           |
| `redis_replication_offset_bytes`                    | Master replication offset             | ✅ Replication           |
| `redis_slaves_connected`                            | Number of connected slaves            | ✅ Replication           |
| `redis_uptime_seconds_total`                        | Total Redis uptime                    | ✅ Overview              |

---

## ⚠️ Operational Notes

| Condition                    | Action                                            |
| ---------------------------- | ------------------------------------------------- |
| Hit Rate < 90%               | Review eviction policy and key TTL alignment      |
| Fragmentation Ratio > 1.5    | Enable `activedefrag yes` or plan a Redis restart |
| Blocked Clients > 20         | Investigate `BLPOP`, `BRPOP`, or `WAIT` commands  |
| Rejected Connections > 0     | Check `maxclients` config and connection pooling  |
| RDB Changes growing steadily | Verify AOF/RDB persistence configuration          |

### Unused Metrics (Available for Extension)

The following metrics are collected but not yet visualized — available for additional panels:

- `redis_clients_max_input_buffer_bytes` / `redis_clients_max_output_buffer_bytes` — client buffer pressure analysis
- `redis_db_avg_ttl_milliseconds` — key lifecycle analysis
- `redis_latest_fork_microseconds` — RDB save performance

---

## Files

| File                          | Description                           |
| ----------------------------- | ------------------------------------- |
| `redis-dashboard.json`        | Grafana dashboard export (importable) |
| `redis-dashboard.md`          | This document                         |
| `Redis_Dashboard_README.docx` | Detailed Word document                |