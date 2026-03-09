# PostgreSQL Metrics Dashboard

> **UID:** `postgresql-metrics-dashboard` | **Folder:** Demo | **Datasource:** Prometheus (`webstore-metrics`) | **Refresh:** 30s | **Tags:** `postgresql` `opentelemetry`

## Overview

A comprehensive Grafana dashboard for real-time monitoring of a PostgreSQL instance. Built on **27 metrics** collected by the OpenTelemetry PostgreSQL receiver and stored in Prometheus. The dashboard contains **28 panels** (6 stat + 22 time series) organized into 6 thematic sections.

## Import

To import the dashboard into Grafana:

1. Go to Grafana → **Dashboards → Import**
2. Upload the `postgresql-dashboard.json` file
3. Select **Prometheus (`webstore-metrics`)** as the datasource
4. Click **Import**

---

## Panels

### 1. 📊 Overview

Six stat panels providing at-a-glance health indicators.

| Panel              | Metric / Query                            | Unit  | Thresholds               |
| ------------------ | ----------------------------------------- | ----- | ------------------------ |
| Active Backends    | `postgresql_backends`                     | count | 🟢 <50 / 🟡 <80 / 🔴 ≥80 |
| Max Connections    | `postgresql_connection_max`               | count | 🔵 always                |
| Connection Usage % | `100 * backends / connection_max`         | %     | 🟢 <70 / 🟡 <90 / 🔴 ≥90 |
| Total Databases    | `postgresql_database_count`               | count | 🔵 always                |
| Total Tables       | `sum(postgresql_table_count)`             | count | 🔵 always                |
| Cache Hit Rate %   | `100 * blks_hit / (blks_hit + blks_read)` | %     | 🔴 <90 / 🟡 <98 / 🟢 ≥98 |

### 2. 🔌 Connections & Database Size

| Panel                     | Metrics                                            | Description                                       |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| Active Backends Over Time | `postgresql_backends`, `postgresql_connection_max` | Active connections vs max limit (dashed red line) |
| Database Size             | `postgresql_db_size_bytes`                         | Size per database over time                       |

### 3. 🔄 Transactions

| Panel               | Metrics                                                                      | Description                                                 |
| ------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Commits & Rollbacks | `rate(postgresql_commits_total[1m])`, `rate(postgresql_rollbacks_total[1m])` | Transaction success and failure rates                       |
| Deadlocks           | `rate(postgresql_deadlocks_total[1m])`                                       | Deadlock occurrences — any value > 0 warrants investigation |

### 4. 📦 Tuple Operations

| Panel              | Metrics                                                                                                                       | Description                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Tuple Reads        | `rate(postgresql_tup_fetched_total[1m])`, `rate(postgresql_tup_returned_total[1m])`                                           | Rows fetched vs returned (high returned/fetched ratio = seq scans) |
| Tuple Writes       | `rate(postgresql_tup_inserted_total[1m])`, `rate(postgresql_tup_updated_total[1m])`, `rate(postgresql_tup_deleted_total[1m])` | Insert, update, and delete rates                                   |
| Live & Dead Rows   | `sum by (state) (postgresql_rows)`                                                                                            | Live vs dead row counts — high dead rows indicate vacuum lag       |
| Operations by Type | `rate(postgresql_operations_total[1m])`                                                                                       | Breakdown by operation label                                       |

### 5. 🗃️ Cache & Block I/O

| Panel                          | Metrics                                                                       | Description                                                      |
| ------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Block Cache Hits vs Disk Reads | `rate(postgresql_blks_hit_total[1m])`, `rate(postgresql_blks_read_total[1m])` | Shared buffer hits vs physical disk reads                        |
| Cache Hit Rate %               | `100 * blks_hit / (blks_hit + blks_read)` over 5m                             | Cache efficiency trend — healthy: **≥ 98%**                      |
| Blocks Read by Source & DB     | `rate(postgresql_blocks_read_total[1m])`                                      | Read breakdown by source (heap, index, toast, etc.) and database |

### 6. ✏️ BGWriter

| Panel                     | Metrics                                                                                                       | Description                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| BGWriter Buffer Writes    | `rate(postgresql_bgwriter_buffers_writes_total[1m])`, `rate(postgresql_bgwriter_buffers_allocated_total[1m])` | Buffer write activity by type                               |
| Checkpoints & Max Written | `rate(postgresql_bgwriter_checkpoint_count_total[5m])`, `rate(postgresql_bgwriter_maxwritten_total[5m])`      | Checkpoint frequency; max written stops signal I/O pressure |
| Checkpoint Duration       | `rate(postgresql_bgwriter_duration_milliseconds_total[1m])`                                                   | Time spent in sync and write checkpoint phases              |

### 7. 🗂️ Tables & Indexes

| Panel                | Metrics                                         | Description                  |
| -------------------- | ----------------------------------------------- | ---------------------------- |
| Table Sizes (Top 10) | `topk(10, postgresql_table_size_bytes)`         | Largest tables by size       |
| Index Sizes (Top 10) | `topk(10, postgresql_index_size_bytes)`         | Largest indexes by size      |
| Index Scans          | `rate(postgresql_index_scans_total[1m])`        | Scan rate by table and index |
| Table Vacuums        | `rate(postgresql_table_vacuum_count_total[5m])` | Vacuum frequency per table   |

---

## Metrics Reference

All 27 PostgreSQL metrics available in Prometheus:

| Metric                                            | Description                                    | In Dashboard             |
| ------------------------------------------------- | ---------------------------------------------- | ------------------------ |
| `postgresql_backends`                             | Number of active backend connections           | ✅ Overview, Connections |
| `postgresql_bgwriter_buffers_allocated_total`     | Buffers allocated by bgwriter                  | ✅ BGWriter              |
| `postgresql_bgwriter_buffers_writes_total`        | Buffers written by bgwriter (by type)          | ✅ BGWriter              |
| `postgresql_bgwriter_checkpoint_count_total`      | Number of checkpoints performed                | ✅ BGWriter              |
| `postgresql_bgwriter_duration_milliseconds_total` | Total checkpoint duration in ms                | ✅ BGWriter              |
| `postgresql_bgwriter_maxwritten_total`            | Times bgwriter stopped due to too many buffers | ✅ BGWriter              |
| `postgresql_blks_hit_total`                       | Shared buffer cache hits                       | ✅ Cache                 |
| `postgresql_blks_read_total`                      | Disk block reads (cache miss)                  | ✅ Cache                 |
| `postgresql_blocks_read_total`                    | Blocks read by source and database             | ✅ Cache                 |
| `postgresql_commits_total`                        | Total committed transactions                   | ✅ Transactions          |
| `postgresql_connection_max`                       | Configured max_connections value               | ✅ Overview, Connections |
| `postgresql_database_count`                       | Number of databases                            | ✅ Overview              |
| `postgresql_db_size_bytes`                        | Database size in bytes                         | ✅ Connections           |
| `postgresql_deadlocks_total`                      | Total deadlocks detected                       | ✅ Transactions          |
| `postgresql_index_scans_total`                    | Index scan count by table/index                | ✅ Tables & Indexes      |
| `postgresql_index_size_bytes`                     | Index size in bytes                            | ✅ Tables & Indexes      |
| `postgresql_operations_total`                     | Operations by type label                       | ✅ Tuple Operations      |
| `postgresql_rollbacks_total`                      | Total rolled back transactions                 | ✅ Transactions          |
| `postgresql_rows`                                 | Live and dead row counts by state              | ✅ Tuple Operations      |
| `postgresql_table_count`                          | Number of tables                               | ✅ Overview              |
| `postgresql_table_size_bytes`                     | Table size in bytes                            | ✅ Tables & Indexes      |
| `postgresql_table_vacuum_count_total`             | Vacuum count per table                         | ✅ Tables & Indexes      |
| `postgresql_tup_deleted_total`                    | Rows deleted                                   | ✅ Tuple Operations      |
| `postgresql_tup_fetched_total`                    | Rows fetched by queries                        | ✅ Tuple Operations      |
| `postgresql_tup_inserted_total`                   | Rows inserted                                  | ✅ Tuple Operations      |
| `postgresql_tup_returned_total`                   | Rows returned by sequential scans              | ✅ Tuple Operations      |
| `postgresql_tup_updated_total`                    | Rows updated                                   | ✅ Tuple Operations      |

### Available Labels

| Label                      | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `postgresql_database_name` | Database name                                           |
| `postgresql_table_name`    | Table name                                              |
| `postgresql_index_name`    | Index name                                              |
| `operation`                | Operation type (used in `postgresql_operations_total`)  |
| `state`                    | Row state: `live` or `dead` (used in `postgresql_rows`) |
| `source`                   | Block read source: heap, index, toast, etc.             |
| `type`                     | BGWriter type label                                     |
| `host_name`                | Host name of the PostgreSQL instance                    |

---

## ⚠️ Operational Notes

| Condition                             | Action                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| Connection Usage > 80%                | Increase `max_connections` or implement connection pooling (e.g. PgBouncer)         |
| Cache Hit Rate < 95%                  | Increase `shared_buffers`; investigate large sequential scans                       |
| Deadlocks > 0                         | Review transaction ordering and locking patterns in application code                |
| Dead Rows growing                     | Ensure autovacuum is enabled and keeping up; check `autovacuum_vacuum_scale_factor` |
| High tup_returned / tup_fetched ratio | Sequential scans may be occurring; review missing indexes                           |
| BGWriter Max Written Stops > 0        | Increase `bgwriter_lru_maxpages` or `checkpoint_completion_target`                  |
| Rollback Rate increasing              | Investigate application errors or long-running transactions                         |

---

## Files

| File                        | Description                           |
| --------------------------- | ------------------------------------- |
| `postgresql-dashboard.json` | Grafana dashboard export (importable) |
| `postgresql-dashboard.md`   | This document                         |