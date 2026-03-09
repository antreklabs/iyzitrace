# Kafka Metrics Dashboard

> **UID:** `kafka-metrics-dashboard` | **Folder:** Demo | **Datasource:** Prometheus (`webstore-metrics`) | **Refresh:** 30s | **Tags:** `kafka` `opentelemetry`

## Overview

A comprehensive Grafana dashboard for real-time monitoring of a Kafka cluster and its consumers. Built on **97 OpenTelemetry metrics** scraped by Prometheus. The dashboard contains **38 panels** (6 stat + 32 time series) organized into 7 thematic sections covering both broker-level and consumer-level observability.

## Import

To import the dashboard into Grafana:

1. Go to Grafana → **Dashboards → Import**
2. Upload the `kafka-dashboard.json` file
3. Select **Prometheus (`webstore-metrics`)** as the datasource
4. Click **Import**

---

## Panels

### 1. 📊 Broker Health (Stat Panels)

Six at-a-glance indicators for immediate cluster health assessment.

| Panel                       | Metric / Query                         | Unit  | Thresholds                 |
| --------------------------- | -------------------------------------- | ----- | -------------------------- |
| Active Controllers          | `kafka_controller_active_count`        | count | 🔴 0 / 🟢 ≥1               |
| Total Partitions            | `sum(kafka_partition_count)`           | count | 🔵 always                  |
| Offline Partitions          | `sum(kafka_partition_offline)`         | count | 🟢 0 / 🔴 ≥1               |
| Under-Replicated Partitions | `sum(kafka_partition_underReplicated)` | count | 🟢 0 / 🟡 <10 / 🔴 ≥10     |
| Max Consumer Lag            | `max(kafka_lag_max)`                   | count | 🟢 <1K / 🟡 <10K / 🔴 ≥10K |
| Total Messages              | `sum(kafka_message_count_total)`       | count | 🔵 always                  |

### 2. 🖥️ Broker — Partitions & Elections

| Panel                              | Metrics                                                                               | Description                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Partition Status                   | `kafka_partition_count`, `kafka_partition_offline`, `kafka_partition_underReplicated` | Total, offline, and under-replicated partition counts over time       |
| ISR Operations & Unclean Elections | `kafka_isr_operation_count`, `kafka_leaderElection_unclean_count_total`               | In-Sync Replica changes and unclean leader elections (data loss risk) |
| Purgatory Size                     | `kafka_purgatory_size`                                                                | Pending requests waiting in fetch/produce purgatory by type           |
| Network I/O Bytes                  | `kafka_network_io_bytes_total`                                                        | Broker-level network throughput by direction                          |

### 3. 📨 Broker — Messages, Requests & Log Flush

| Panel                        | Metrics                                                                            | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Message Rate                 | `rate(kafka_message_count_total[1m])`                                              | Messages produced per second                                           |
| Request Rate by Type         | `rate(kafka_request_count_total[1m])`                                              | Broker request rate broken down by request type                        |
| Log Flush Duration (p50/p99) | `kafka_logs_flush_time_50p_milliseconds`, `kafka_logs_flush_time_99p_milliseconds` | Log segment flush latency percentiles; high p99 indicates I/O pressure |

### 4. 📉 Consumer — Lag & Lead

| Panel                 | Metrics                                                                                             | Description                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Consumer Records Lag  | `kafka_consumer_records_lag`, `kafka_consumer_records_lag_max`, `kafka_consumer_records_lag_avg`    | Lag per topic/partition, plus max and average across all partitions    |
| Consumer Records Lead | `kafka_consumer_records_lead`, `kafka_consumer_records_lead_min`, `kafka_consumer_records_lead_avg` | Lead ahead of the log start offset; low lead signals risk of data loss |
| Max Lag by Client     | `kafka_lag_max`                                                                                     | Per-client max lag — useful for identifying slow consumers             |

### 5. 📥 Consumer — Records & Bytes Consumed

| Panel                            | Metrics                                                                | Description                                                         |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Records Consumed Rate            | `kafka_consumer_records_consumed_rate`                                 | Records consumed per second per client                              |
| Bytes Consumed Rate              | `kafka_consumer_bytes_consumed_rate`                                   | Throughput in bytes per second per client                           |
| Fetch Rate & Records per Request | `kafka_consumer_fetch_rate`, `kafka_consumer_records_per_request_avg`  | How often fetches occur and how many records are returned per fetch |
| Fetch Latency (Avg / Max)        | `kafka_consumer_fetch_latency_avg`, `kafka_consumer_fetch_latency_max` | Time spent waiting for fetch responses from brokers                 |

### 6. ✅ Consumer — Commits

| Panel                      | Metrics                                                                  | Description                                       |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Commit Rate                | `kafka_consumer_commit_rate`                                             | Offset commit frequency per client                |
| Commit Latency (Avg / Max) | `kafka_consumer_commit_latency_avg`, `kafka_consumer_commit_latency_max` | Latency of offset commits to the broker           |
| Assigned Partitions        | `kafka_consumer_assigned_partitions`                                     | Number of partitions assigned per consumer client |

### 7. 🔁 Consumer — Rebalancing

| Panel                              | Metrics                                                                                   | Description                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Rebalance Rate & Failed Rebalances | `kafka_consumer_rebalance_rate_per_hour`, `kafka_consumer_failed_rebalance_rate_per_hour` | Rebalance frequency; failed rebalances indicate group instability |
| Rebalance Latency (Avg / Max)      | `kafka_consumer_rebalance_latency_avg`, `kafka_consumer_rebalance_latency_max`            | Time taken to complete a rebalance                                |
| Join & Sync Rate                   | `kafka_consumer_join_rate`, `kafka_consumer_sync_rate`                                    | Group join and sync protocol rates                                |
| Last Rebalance & Last Heartbeat    | `kafka_consumer_last_rebalance_seconds_ago`, `kafka_consumer_last_heartbeat_seconds_ago`  | Time since last rebalance and last heartbeat per consumer         |

### 8. 🌐 Consumer — Network & Connections

| Panel                            | Metrics                                                                                                              | Description                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Network I/O Rate                 | `kafka_consumer_incoming_byte_rate`, `kafka_consumer_outgoing_byte_rate`                                             | Consumer-level network throughput per client       |
| Connection Count & Creation Rate | `kafka_consumer_connection_count`, `kafka_consumer_connection_creation_rate`, `kafka_consumer_connection_close_rate` | Active connections and connection churn            |
| Request Latency (Avg / Max)      | `kafka_consumer_request_latency_avg`, `kafka_consumer_request_latency_max`                                           | End-to-end request round-trip time                 |
| IO Ratio & IO Wait Ratio         | `kafka_consumer_io_ratio`, `kafka_consumer_io_wait_ratio`                                                            | Fraction of time the I/O thread is busy vs waiting |

### 9. 🔐 Consumer — Authentication & Heartbeat

| Panel                            | Metrics                                                                                                                                     | Description                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Authentication Events            | `kafka_consumer_successful_authentication_rate`, `kafka_consumer_failed_authentication_rate`, `kafka_consumer_failed_reauthentication_rate` | Auth success and failure rates per client     |
| Heartbeat Rate & Poll Idle Ratio | `kafka_consumer_heartbeat_rate`, `kafka_consumer_poll_idle_ratio_avg`                                                                       | Consumer liveness and poll thread utilization |

---

## Metrics Reference

All 97 Kafka metrics available in Prometheus, grouped by category:

### Broker Metrics (11)

| Metric                                      | Description                                             |
| ------------------------------------------- | ------------------------------------------------------- |
| `kafka_controller_active_count`             | Number of active Kafka controllers (should always be 1) |
| `kafka_isr_operation_count`                 | ISR shrink/expand operations                            |
| `kafka_lag_max`                             | Max consumer lag per client                             |
| `kafka_leaderElection_unclean_count_total`  | Unclean leader elections (potential data loss)          |
| `kafka_logs_flush_Count_milliseconds_total` | Total log flush operations                              |
| `kafka_logs_flush_time_50p_milliseconds`    | Log flush latency p50                                   |
| `kafka_logs_flush_time_99p_milliseconds`    | Log flush latency p99                                   |
| `kafka_message_count_total`                 | Total messages received by broker                       |
| `kafka_network_io_bytes_total`              | Broker network I/O bytes                                |
| `kafka_partition_count`                     | Total partition count                                   |
| `kafka_partition_offline`                   | Number of offline partitions                            |
| `kafka_partition_underReplicated`           | Under-replicated partitions                             |
| `kafka_purgatory_size`                      | Requests waiting in purgatory                           |
| `kafka_request_count_total`                 | Total broker requests by type                           |

### Consumer Metrics (83)

| Metric                                                     | Description                            |
| ---------------------------------------------------------- | -------------------------------------- |
| `kafka_consumer_assigned_partitions`                       | Partitions assigned to consumer        |
| `kafka_consumer_bytes_consumed_rate`                       | Bytes consumed per second              |
| `kafka_consumer_bytes_consumed_total`                      | Total bytes consumed                   |
| `kafka_consumer_commit_latency_avg`                        | Avg offset commit latency              |
| `kafka_consumer_commit_latency_max`                        | Max offset commit latency              |
| `kafka_consumer_commit_rate`                               | Offset commit rate                     |
| `kafka_consumer_commit_sync_time_ns_total`                 | Total sync commit time                 |
| `kafka_consumer_commit_total`                              | Total commits                          |
| `kafka_consumer_committed_time_ns_total`                   | Total committed time                   |
| `kafka_consumer_connection_close_rate`                     | Connection close rate                  |
| `kafka_consumer_connection_close_total`                    | Total connections closed               |
| `kafka_consumer_connection_count`                          | Active connection count                |
| `kafka_consumer_connection_creation_rate`                  | New connection creation rate           |
| `kafka_consumer_connection_creation_total`                 | Total connections created              |
| `kafka_consumer_failed_authentication_rate`                | Failed auth rate                       |
| `kafka_consumer_failed_authentication_total`               | Total failed auths                     |
| `kafka_consumer_failed_reauthentication_rate`              | Failed re-auth rate                    |
| `kafka_consumer_failed_reauthentication_total`             | Total failed re-auths                  |
| `kafka_consumer_failed_rebalance_rate_per_hour`            | Failed rebalances per hour             |
| `kafka_consumer_failed_rebalance_total`                    | Total failed rebalances                |
| `kafka_consumer_fetch_latency_avg`                         | Avg fetch latency                      |
| `kafka_consumer_fetch_latency_max`                         | Max fetch latency                      |
| `kafka_consumer_fetch_rate`                                | Fetch requests per second              |
| `kafka_consumer_fetch_size_avg`                            | Avg fetch response size                |
| `kafka_consumer_fetch_size_max`                            | Max fetch response size                |
| `kafka_consumer_fetch_throttle_time_avg`                   | Avg fetch throttle time                |
| `kafka_consumer_fetch_throttle_time_max`                   | Max fetch throttle time                |
| `kafka_consumer_fetch_total`                               | Total fetch requests                   |
| `kafka_consumer_heartbeat_rate`                            | Heartbeat rate                         |
| `kafka_consumer_heartbeat_response_time_max`               | Max heartbeat response time            |
| `kafka_consumer_heartbeat_total`                           | Total heartbeats                       |
| `kafka_consumer_incoming_byte_rate`                        | Incoming bytes per second              |
| `kafka_consumer_incoming_byte_total`                       | Total incoming bytes                   |
| `kafka_consumer_io_ratio`                                  | Fraction of time I/O thread is active  |
| `kafka_consumer_io_time_ns_avg`                            | Avg I/O time per select                |
| `kafka_consumer_io_time_ns_total`                          | Total I/O time                         |
| `kafka_consumer_io_wait_ratio`                             | Fraction of time I/O thread is waiting |
| `kafka_consumer_io_wait_time_ns_avg`                       | Avg I/O wait time                      |
| `kafka_consumer_io_wait_time_ns_total`                     | Total I/O wait time                    |
| `kafka_consumer_join_rate`                                 | Group join rate                        |
| `kafka_consumer_join_time_avg`                             | Avg time to join group                 |
| `kafka_consumer_join_time_max`                             | Max time to join group                 |
| `kafka_consumer_join_total`                                | Total joins                            |
| `kafka_consumer_last_heartbeat_seconds_ago`                | Time since last heartbeat              |
| `kafka_consumer_last_poll_seconds_ago`                     | Time since last poll                   |
| `kafka_consumer_last_rebalance_seconds_ago`                | Time since last rebalance              |
| `kafka_consumer_network_io_rate`                           | Network I/O operations per second      |
| `kafka_consumer_network_io_total`                          | Total network I/O operations           |
| `kafka_consumer_outgoing_byte_rate`                        | Outgoing bytes per second              |
| `kafka_consumer_outgoing_byte_total`                       | Total outgoing bytes                   |
| `kafka_consumer_poll_idle_ratio_avg`                       | Fraction of time poll thread is idle   |
| `kafka_consumer_rebalance_latency_avg`                     | Avg rebalance duration                 |
| `kafka_consumer_rebalance_latency_max`                     | Max rebalance duration                 |
| `kafka_consumer_rebalance_latency_total`                   | Total rebalance time                   |
| `kafka_consumer_rebalance_rate_per_hour`                   | Rebalances per hour                    |
| `kafka_consumer_rebalance_total`                           | Total rebalances                       |
| `kafka_consumer_records_consumed_rate`                     | Records consumed per second            |
| `kafka_consumer_records_consumed_total`                    | Total records consumed                 |
| `kafka_consumer_records_lag`                               | Current lag per partition              |
| `kafka_consumer_records_lag_avg`                           | Avg lag across partitions              |
| `kafka_consumer_records_lag_max`                           | Max lag across partitions              |
| `kafka_consumer_records_lead`                              | Current lead per partition             |
| `kafka_consumer_records_lead_avg`                          | Avg lead across partitions             |
| `kafka_consumer_records_lead_min`                          | Min lead across partitions             |
| `kafka_consumer_records_per_request_avg`                   | Avg records per fetch request          |
| `kafka_consumer_request_latency_avg`                       | Avg request round-trip latency         |
| `kafka_consumer_request_latency_max`                       | Max request round-trip latency         |
| `kafka_consumer_request_rate`                              | Requests per second                    |
| `kafka_consumer_request_size_avg`                          | Avg request payload size               |
| `kafka_consumer_request_size_max`                          | Max request payload size               |
| `kafka_consumer_request_total`                             | Total requests sent                    |
| `kafka_consumer_response_rate`                             | Responses per second                   |
| `kafka_consumer_response_total`                            | Total responses received               |
| `kafka_consumer_select_rate`                               | I/O layer select call rate             |
| `kafka_consumer_select_total`                              | Total I/O select calls                 |
| `kafka_consumer_successful_authentication_no_reauth_total` | Successful auths without re-auth       |
| `kafka_consumer_successful_authentication_rate`            | Successful auth rate                   |
| `kafka_consumer_successful_authentication_total`           | Total successful auths                 |
| `kafka_consumer_successful_reauthentication_rate`          | Successful re-auth rate                |
| `kafka_consumer_successful_reauthentication_total`         | Total successful re-auths              |
| `kafka_consumer_sync_rate`                                 | Group sync rate                        |
| `kafka_consumer_sync_time_avg`                             | Avg group sync duration                |
| `kafka_consumer_sync_time_max`                             | Max group sync duration                |
| `kafka_consumer_sync_total`                                | Total group syncs                      |
| `kafka_consumer_time_between_poll_avg`                     | Avg time between poll calls            |
| `kafka_consumer_time_between_poll_max`                     | Max time between poll calls            |

### Available Labels

| Label          | Description                               |
| -------------- | ----------------------------------------- |
| `client_id`    | Consumer client identifier                |
| `topic`        | Kafka topic name                          |
| `partition`    | Partition number                          |
| `direction`    | Network direction: `inbound` / `outbound` |
| `type`         | Request type or purgatory type            |
| `operation`    | ISR operation type                        |
| `node_id`      | Broker node ID                            |
| `service_name` | Service name from OpenTelemetry           |

---

## ⚠️ Operational Notes

| Condition                        | Action                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Active Controllers ≠ 1           | Immediate investigation — cluster may have split-brain or no active controller              |
| Offline Partitions > 0           | Check broker availability; partitions with no leader are unavailable for reads/writes       |
| Under-Replicated Partitions > 0  | Check broker connectivity and replication health                                            |
| Unclean Elections > 0            | Potential data loss event — review replica configuration (`unclean.leader.election.enable`) |
| Consumer Lag growing             | Consumer is falling behind; scale consumers or investigate processing bottleneck            |
| Consumer Lead Min = 0            | Consumer is at risk of losing track of its position in the log                              |
| Failed Rebalances > 0            | Group instability — check session timeouts, `max.poll.interval.ms`, and consumer health     |
| Last Heartbeat > session timeout | Consumer may be considered dead by the group coordinator                                    |
| Fetch Throttle Time > 0          | Consumer is being throttled by broker quota limits                                          |
| Log Flush p99 > 500ms            | Disk I/O pressure on broker — investigate storage performance                               |
| Purgatory Size growing           | Broker is accumulating delayed requests — check replica availability and fetch performance  |

---

## Files

| File                   | Description                           |
| ---------------------- | ------------------------------------- |
| `kafka-dashboard.json` | Grafana dashboard export (importable) |
| `kafka-dashboard.md`   | This document                         |