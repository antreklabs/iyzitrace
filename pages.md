IyziTrace Plugin Pages
======================

This document introduces each page in the IyziTrace Grafana App Plugin, explaining its purpose, inputs and filters, data sources, and example analysis use‑cases.

Infra Overview
--------------
- Purpose: High‑level landing showing the health and topology entry points of your platform.
- Data: Summaries from Tempo (traces), Loki (logs), and the plugin’s Service Map inventory.
- Filters: Global time range, environment, service/app/infra tags where present.
- Analysis: Spot platform‑wide regressions and jump into maps, services, logs, and traces.

Service Map
--------------------------------
- Purpose: Visualize dependencies across infrastructure → applications → services.
- Data: OpenTelemetry trace relationships; Service Map configuration stored in plugin settings.
- Filters: Time range, layer (infra/app/service), node selection, grouped edge expand/collapse, hover focus.
- Analysis:
  - See which services call a target and via which operation types (HTTP/gRPC/other).
  - Expand grouped edges to inspect parallel operations without label/line overlap.
  - Zoom to node from edge labels; follow source/target focus for root‑cause analysis.

Services
-----------
- Purpose: List services with core performance and reliability indicators.
- Data: Tempo traces (latency, error rate), Loki logs (error/warn counts), optional metrics if wired.
- Filters: Time range, datasource (Tempo/Loki), service name, status/error filters, pagination.
- Analysis: Find slow/noisy services and drill down to traces and logs for debugging.

Traces
---------
- Purpose: Explore distributed traces to understand request lifecycles and latency distribution.
- Data: Tempo traces and spans enriched with attributes (service.name, http.*, rpc.*, db.*).
- Filters: Time range, service, operation, status/error, latency thresholds.
- Analysis: Identify slow spans and problematic downstream calls; compare patterns across versions/environments.

Logs
-------
- Purpose: Search and analyze logs correlated with services and traces.
- Data: Loki log streams; correlation with Tempo via traceID when present.
- Filters: Time range, datasource, service/app labels, text query, level (error/warn/info).
- Analysis: Investigate incidents by pivoting between traces and logs; measure error spikes and root causes.

Views
------------------
- Purpose: Curated dashboards for engineering and SRE workflows.
- Data: Mix of Tempo, Loki, and optionally Prometheus or others.
- Filters: Time range and dashboard variables (service, namespace, region, etc.).
- Analysis: Executive and team views; SLA/SLO overviews; performance trends.

Alerts (Coming Soon)
--------------------
- Purpose: Central place to review observability alerts related to traces/logs/services.
- Data: Planned integration with Grafana Alerting; correlation with Tempo/Loki context.
- Filters: Time, status, severity, resource, service.
- Analysis: Prioritize incidents and jump into traces/logs in one click.

Exceptions (Coming Soon)
------------------------
- Purpose: Aggregate and triage exceptions across services.
- Data: Exception events from logs or error tracking signals (mapped via Loki labels).
- Filters: Time, service, exception type, fingerprint, environment.
- Analysis: Track top error classes, recurrences, and recent regressions.

Team (Coming Soon)
------------------
- Purpose: Team‑focused workspace for ownership and on‑call views.
- Data: Ownership metadata (service → team), incident history (if provided).
- Filters: Team, service, time range.
- Analysis: Who owns what, what broke recently, and where to focus.

Settings (Coming Soon)
---------------------
- Purpose: Configure the IyziTrace app.
- Data: Stored in Grafana plugin settings: `json_data` and `secure_json_data`.
- Key fields:
  - Default Loki datasource UID
  - Default Tempo datasource UID
  - Default Absolute Time Range (start/end)
  - Service Map Configuration (infra/app/service layout grid)
  - API Key (secure)
- Note: The configuration page already supports editing these fields and persisting them.

Global Filters and UX
---------------------
- Time Range: Quick ranges (Last 15m, 1h, …) and absolute ranges; picker label stays in sync.
- Datasources: Defaults set in Settings; overridable per page.
- Hover/Focus: Maps dim unrelated nodes/edges; hovering over groups keeps everything visible unless a node is focused.
- Expand/Collapse: Grouped operations render as a single edge; click label to expand; click pane to collapse.

Typical Workflows
-----------------
1. Incident to cause: Alerts → Service Map (zoom to source) → Traces (slow spans) → Logs (errors).
2. Performance regression: Services v2 (p95 up) → Traces v2 (hot spans) → Map (downstream bottleneck).
3. Dependency changes: Map (app/infra layers) → verify new or missing edges by operation type.

Data Sources
------------
- Tempo: traces and spans; correlations via trace IDs and attributes.
- Loki: logs and exception lines; labels link to services, pods, regions, etc.
- Optional: Prometheus or others can be added to dashboards if needed.

