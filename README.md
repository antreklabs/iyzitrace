# IyziTrace Documentation

A comprehensive OpenTelemetry-native observability platform built as a Grafana plugin. Transform your telemetry data into actionable insights with powerful visualization, AI-driven analysis, and intelligent service mapping.

---

## Table of Contents

<!-- !toc (minlevel=2 omit="Table of Contents") -->

* [Introduction](#introduction)
* [Platform Features Gallery](#platform-features-gallery)
  * [Infrastructure & Service Topology](#infrastructure--service-topology)
  * [Performance Monitoring](#performance-monitoring)
  * [Distributed Tracing](#distributed-tracing)
  * [Log Management](#log-management)
  * [Customization](#customization)
* [Get Started](#get-started)
  * [Installation](#installation)
  * [Initial Configuration](#initial-configuration)
  * [Quick Start Guide](#quick-start-guide)
* [Key Concepts](#key-concepts)
  * [Resources](#resources)
  * [Service Infrastructure Mapping](#service-infrastructure-mapping)
  * [Time Picker](#time-picker)
  * [Filtering](#filtering)
* [Features](#features)
  * [Landing Page](#landing-page)
  * [Overview](#overview)
  * [Service Map](#service-map)
  * [Services](#services)
  * [Traces](#traces)
  * [Logs](#logs)
  * [Views](#views)
  * [Exceptions](#exceptions)
  * [AI Assistant](#ai-assistant)
* [Configuration](#configuration)
  * [Settings](#settings)
  * [Datasources](#datasources)
  * [Definitions](#definitions)
  * [AI Configuration](#ai-configuration)
* [Access Control](#access-control)
  * [Teams](#teams)
  * [Page Permissions](#page-permissions)
* [Advanced Features](#advanced-features)
  * [Service-Infrastructure Mapping](#service-infrastructure-mapping)
  * [Orphan Services](#orphan-services)
  * [Search and Filter](#search-and-filter)
* [API Reference](#api-reference)
* [FAQ](#faq)
* [Troubleshooting](#troubleshooting)

<!-- toc! -->

---

## Introduction

IyziTrace is a powerful observability platform designed to provide deep insights into your distributed systems. Built on OpenTelemetry standards and running as a Grafana plugin, it combines metrics, logs, and traces into a unified, intuitive interface.

### Infrastructure Monitoring, Without the Heavy Lift

Collect metrics, logs, and traces in minutes. Zero-maintenance pipelines, transparent pricing, and deep context for faster debugging.

**Platform Highlights:**

- **10s install time** - Get up and running in seconds
- **99.95% uptime** - Enterprise-grade reliability
- **OpenTelemetry native** - Built on open standards
- **Usage-based pricing** - Transparent, predictable costs

### What is IyziTrace?

IyziTrace offers:

- **Unified Observability**: Seamlessly correlate metrics, logs, and traces
- **Service-Centric View**: Understand your microservices architecture at a glance
- **Infrastructure Monitoring**: Real-time insights into your hosts and containers
- **AI-Powered Analysis**: Get intelligent recommendations and anomaly detection
- **OpenTelemetry Native**: Built on open standards for maximum compatibility

### Why IyziTrace?

**Observability Only You Need**

No complex setups, no maintenance — all the context for your logs, metrics and traces.

- **Full-stack Infrastructure Overview**: See servers, runtimes, services and operations in a single layered view. From CPU usage to business operations, IyziTrace gives you an instant, end-to-end snapshot of your system health.

  ![Full-stack Infrastructure Overview](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2010.58.00.png&w=1920&q=75)

- **Infrastructure Layer Map**: Visualize all infrastructures across regions as interactive cards with health badges. Quickly spot which data center or platform needs attention before it impacts your services.

  ![Infrastructure Layer Map](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2010.59.18.png&w=1920&q=75)

- **Focus on Critical Zones**: Drill into a specific zone or cluster to understand how internal components behave. Highlighted elements let you zoom in on what matters without losing the global context.

  ![Focus on Critical Zones](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2010.59.34.png&w=1920&q=75)

- **Deep Infrastructure Details**: Select any infrastructure node and instantly see IP, OS, type and resource usage. No more jumping between tools – all critical details are a single click away.

  ![Deep Infrastructure Details](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2010.59.59.png&w=1920&q=75)

- **Application Layer Topology**: Discover every runtime and platform running on your infrastructure – Go, Node.js, Nginx, Java, PHP and more. IyziTrace shows how each application fits into the bigger picture.

  ![Application Layer Topology](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.00.59.png&w=1920&q=75)

- **Application Health & Latency**: Open any application to see its status, connected services and latency distribution. Identify slow dependencies and failing integrations directly from the detail panel.

  ![Application Health & Latency](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.01.16.png&w=1920&q=75)

### Built for Modern Platforms

From Kubernetes to serverless, gain real-time visibility with zero heavy lifting:

**Kubernetes & Containers**
- Autoscaling insights
- Pod restart tracking
- Resource bottleneck detection
- OTel + kube integrations without the YAML jungle

**APM & Backend Services**
- Latency, errors, throughput, and saturation in one place
- Trace + log correlation makes RCA straightforward
- Real-time performance monitoring

**SLOs & Alerting**
- Define SLOs on any metric
- Route alerts to Slack/PagerDuty
- Reduce noise with multi-signal rules

### Cost Under Control — No Surprises

Transparent pricing so you always know what you're paying for — no hidden fees, no guesswork, just predictable costs.

**Price by Telemetry**

Pay just for the telemetry you care about. Our pricing is transparent and based on how many logs, spans, and metric data points you send — not bytes stored or seat count. Send all the metadata you need without hidden costs.

**Cost Control**

Use OpenTelemetry agents and the OTEL Collector's pipelines to manage ingestion, downsampling, and routing. Keep costs predictable while retaining what matters.

### World Class Observability

Our customers praise IyziTrace as a powerful platform with excellent user experience and support. IyziTrace simplifies observability for every developer, providing deep insights into logs, metrics, and traces — because details matter.

### Architecture

IyziTrace is deployed as a **Grafana Plugin** and connects to:
- **Tempo**: For distributed tracing data
- **Loki**: For log aggregation and querying
- **Prometheus**: For metrics collection and querying

---

## Platform Features Gallery

IyziTrace provides a comprehensive set of features designed to give you complete visibility into your distributed systems:

### Infrastructure & Service Topology

**1. Service Map – End-to-End Calls**

![Service Map – End-to-End Calls](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.01.54.png&w=1920&q=75)

View every API and backend service as a connected map. Follow request paths across microservices and understand how each dependency affects overall performance.

- Visual representation of all services
- Interactive dependency graph
- Real-time call flow visualization
- Identify bottlenecks at a glance

**2. Full Service Dependency Graph**

![Full Service Dependency Graph](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.03.40.png&w=1920&q=75)

Visualize every microservice in your system and how they interact. Expand, search, or drill into any node to understand dependencies, bottlenecks, or upstream/downstream risks.

- Complete system topology
- Interactive node exploration
- Dependency impact analysis
- Upstream/downstream tracing

**3. Visual Call Flows**

![Visual Call Flows](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.02.05.png&w=1920&q=75)

Follow the exact path of a request across services – from the edge to the core and back. IyziTrace turns complex microservice flows into an easy-to-read visual journey.

- Request path visualization
- Service interaction timeline
- Cross-service tracing
- Easy-to-understand flow diagrams

### Performance Monitoring

**4. Service Performance Overview**

![Service Performance Overview](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.04.24.png&w=1920&q=75)

Track latency, error rates, traffic volume, and performance metrics across all services. The overview dashboard gives you a real-time picture of system behavior across your entire stack.

- Real-time metrics display
- Aggregated performance data
- System-wide health snapshot
- Traffic pattern analysis

**5. Service-Level Metrics**

![Service-Level Metrics](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.02.29.png&w=1920&q=75)

Open a single service to inspect its health, error rate and latency (avg, min, max). From here you can jump directly to logs, metrics or traces for faster root cause analysis.

- Detailed service health
- Error rate tracking
- Latency analysis (avg, min, max)
- Quick navigation to related data

**6. Service Detail – Call Metrics**

![Service Detail – Call Metrics](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.04.59.png&w=1920&q=75)

Analyze detailed call metrics for the selected service, including latency percentiles (P50, P90, P99), throughput, and performance anomalies over time.

- Latency percentiles
- Throughput analysis
- Performance anomaly detection
- Time-series visualization

**7. Service Detail – Operations Insight**

![Service Detail – Operations Insight](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.05.14.png&w=1920&q=75)

Dive into operation-level performance for a service. Monitor latency, APDEX scores, and operations-per-second to detect regressions or spikes instantly.

- Operation-level metrics
- APDEX scoring
- Regression detection
- Spike identification

**8. Operation-Level Insight**

![Operation-Level Insight](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.03.03.png&w=1920&q=75)

Monitor each operation such as "Create User" with its own latency and P95 metrics. See which source and target services are involved in every call.

- Per-operation metrics
- P95 latency tracking
- Source-target service mapping
- Operation health monitoring

**9. Operation Detail – Update Profile**

![Operation Detail – Update Profile](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.03.11.png&w=1920&q=75)

Inspect the full execution of specific operations, including latency (avg/p95), HTTP/gRPC method, and source–target service path. Quickly identify bottlenecks in user-facing flows.

- Full operation execution details
- HTTP/gRPC method inspection
- Service path visualization
- Bottleneck identification

### Distributed Tracing

**10. Distributed Traces Overview**

![Distributed Traces Overview](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.06.02.png&w=1920&q=75)

View all traces across your system sorted by latency, root service, or timestamp. Instantly find the slowest or fastest requests and inspect their complete trace data.

- Sortable trace list
- Quick performance analysis
- Complete trace inspection
- Root service identification

**11. Advanced Time Range Filtering**

![Advanced Time Range Filtering](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.06.14.png&w=1920&q=75)

Use quick ranges or precise date-time selection to analyze trace data within any custom timeframe. Perfect for incident analysis or regression detection.

- Quick time range selection
- Custom date-time picker
- Incident analysis tools
- Regression detection support

**12. Multi-Backend Trace Selection**

![Multi-Backend Trace Selection](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.06.27.png&w=1920&q=75)

Choose between multiple tracing backends (Tempo, Observability Platform, etc.) to compare environments, test data, or staging vs production pipelines.

- Multiple backend support
- Environment comparison
- Staging vs production analysis
- Seamless backend switching

### Log Management

**13. Centralized Log Explorer**

![Centralized Log Explorer](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.07.14.png&w=1920&q=75)

Search, filter, and inspect logs from any service. View runtime details, JVM/OS diagnostics, container metadata, and attributes from OpenTelemetry logs.

- Unified log search
- Runtime diagnostics
- Container metadata
- OpenTelemetry attributes

### Customization

**14. Custom Monitoring Dashboards**

![Custom Monitoring Dashboards](https://beta.iyzitrace.com/_next/image?url=%2Ffeatures%2FScreenshot%202025-10-17%20at%2011.08.59.png&w=1920&q=75)

Create dashboards tailored to your needs: logs, metrics, service maps, or trace views. Save and reuse widgets to build a personalized observability control center.

- Custom dashboard creation
- Widget library
- Reusable components
- Personalized layouts

---

## Get Started

### Installation

#### Step 1: Install from Grafana Marketplace

1. Log in to your Grafana instance
2. Navigate to **Configuration** → **Plugins**
3. Search for **"IyziTrace"**
4. Click **Install**

Alternatively, install via CLI:

```bash
grafana-cli plugins install iyzitrace-app
```

#### Step 2: Enable the Plugin

1. Go to **Configuration** → **Plugins**
2. Find **IyziTrace** in your installed plugins
3. Click **Enable**

### Initial Configuration

#### Step 1: Obtain API Key

1. Visit [IyziTrace Website](https://iyzitrace.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Generate a new API key
5. Copy the key (you'll need it in the next step)

#### Step 2: Configure Settings

1. In Grafana, go to **IyziTrace** → **Settings**
2. Navigate to the **Security** tab
3. Paste your **API Key**
4. Click **Save Settings**

#### Step 3: Add Datasources

**Add Tempo Datasource:**

1. Go to **Connections** → **Data sources**
2. Click **Add data source**
3. Select **Tempo**
4. Configure your Tempo endpoint
5. Click **Save & test**

**Add Loki Datasource:**

1. Click **Add data source**
2. Select **Loki**
3. Configure your Loki endpoint
4. Click **Save & test**

**Add Prometheus Datasource:**

1. Click **Add data source**
2. Select **Prometheus**
3. Configure your Prometheus endpoint
4. Click **Save & test**

Then, return to **IyziTrace** → **Settings** → **Datasources** tab and select your default datasources.

#### Step 4: Configure Definitions

1. Go to **Settings** → **Definitions** tab
2. Define your metric and label patterns:
   - **Service Label Name**: Default label for service names (e.g., `service_name`)
   - **Operation Label Name**: Default label for operation names (e.g., `span_name`)
   - **Type Label Name**: Default label for operation types (e.g., `span_kind`)
3. Add custom metric definitions for your specific use cases
4. Click **Save Settings**

#### Step 5: (Optional) Enable AI Support

1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account and obtain an API key
3. In IyziTrace, go to **Settings** → **AI Configuration** tab
4. Enter your **OpenRouter API Key**
5. Configure AI settings:
   - **Model**: Select your preferred model (e.g., `gpt-4`)
   - **Temperature**: Adjust creativity (0.0 - 1.0)
   - **Max Tokens**: Set maximum response length
6. Click **Save Settings**

#### Step 6: Configure Teams (Optional)

1. Navigate to **Teams**
2. Click **Create Team**
3. Set team name and description
4. Assign team members
5. Configure page permissions for the team
6. Click **Save**

### Quick Start Guide

Once configured, you'll see the **Landing Page** with setup progress:

1. ✅ **Set Api Key** - Configured in step 2
2. ✅ **Add Tempo Datasource** - Configured in step 3
3. ✅ **Add Loki Datasource** - Configured in step 3
4. ✅ **Add Prometheus Datasource** - Configured in step 3
5. ⏳ **Send Traces** - Configure your applications to send OTLP traces
6. ⏳ **Send Logs** - Configure your applications to send logs
7. ⏳ **Send Metrics** - Configure your applications to send metrics
8. ⏳ **Assign Orphan Services** - Map services to infrastructure
9. ✅ **Setup AI Assistant** - Configured in step 5

---

## Key Concepts

### Resources

In IyziTrace, everything revolves around **resources**. A resource represents a component in your system:

- **Infrastructure**: Physical or virtual hosts (e.g., servers, containers)
- **Services**: Applications or microservices running on infrastructure
- **Operations**: Individual functions or API endpoints within services

Resources follow OpenTelemetry semantic conventions and include attributes like:
- `cloud.region`
- `host.name`
- `host.ip`
- `os.type`
- `service.name`
- `service.version`

### Service Infrastructure Mapping

IyziTrace automatically discovers relationships between services and infrastructure:

1. **Auto-Discovery**: Based on `host_name` and `cloud_region` labels
2. **Manual Mapping**: Drag-and-drop orphan services to infrastructure
3. **Persistent Mapping**: Mappings are saved and persist across sessions

### Time Picker

All views support flexible time range selection:

- **Quick Ranges**: Last 5 minutes, 15 minutes, 1 hour, 6 hours, 24 hours, 7 days
- **Custom Range**: Select specific start and end times
- **Relative Ranges**: "now-1h" to "now"

Time ranges are preserved when navigating between views.

### Filtering

IyziTrace provides powerful filtering capabilities:

- **Field Filters**: Filter by any resource attribute
- **Label Filters**: Filter by OpenTelemetry labels
- **Operation Filters**: Filter by operation name or type
- **Status Filters**: Filter by health status (healthy, warning, error)
- **Search**: Free-text search across all visible data

---

## Features

### Landing Page

The **Landing Page** provides an at-a-glance overview of your observability setup.

**Key Features:**
- **Setup Progress**: Track completion of setup steps
- **Section Status Cards**: Quick view of which features have data
  - Overview: Active if infrastructure data exists
  - Service Map: Active if service graph data exists
  - Services: Active if service metrics exist
  - Traces: Active if trace data exists
  - Logs: Active if log data exists
  - Views: Active if saved views exist
  - Exceptions: Active if exception data exists
  - AI Assistant: Active if API key is configured
  - Teams: Active if teams are configured
  - Settings: Active if API key is set
- **Quick Navigation**: Click "Explore" on any card to jump to that section

**Setup Steps:**

1. **Set Api Key**: Configure your IyziTrace API key
2. **Add Tempo Datasource**: Connect to your Tempo instance
3. **Add Loki Datasource**: Connect to your Loki instance
4. **Add Prometheus Datasource**: Connect to your Prometheus instance
5. **Send Traces**: Start sending OTLP traces from your applications
6. **Send Logs**: Start sending logs to Loki
7. **Send Metrics**: Start sending metrics to Prometheus
8. **Assign Orphan Services**: Map discovered services to infrastructure
9. **Setup AI Assistant**: Configure AI for intelligent insights

Hover over incomplete steps to see detailed information and quick links.

### Overview

The **Overview** page provides a comprehensive view of your entire infrastructure and service topology - from physical hosts to business operations in a single layered view.

**What You'll See:**

From CPU usage to business operations, IyziTrace gives you an instant, end-to-end snapshot of your system health. The overview combines infrastructure monitoring with service-level observability, allowing you to:

- Track latency, error rates, traffic volume, and performance metrics across all services
- Get a real-time picture of system behavior across your entire stack
- See servers, runtimes, services and operations in a single unified interface
- Identify bottlenecks from infrastructure to application level

**Layout:**

The page is organized into horizontal scrollable sections:

1. **Regions**: Cloud regions where your infrastructure is deployed
2. **Infrastructures**: Physical/virtual hosts grouped by region
3. **Orphan Services**: Services not yet mapped to infrastructure (if any)
4. **Services**: Services mapped to their infrastructure
5. **Operations**: Operations within each service

**Key Features:**

#### 1. Interactive Drill-Down

- Click on a **Region** to filter infrastructures to that region
- Click on an **Infrastructure** to see its services and applications
- Click on a **Service** to see its operations
- Click on an **Operation** to view detailed metrics

#### 2. Infrastructure Cards

Each infrastructure card displays:

- **Name**: Host name
- **OS Type**: Operating system (Linux, Windows, macOS)
- **IP Address**: Host IP address
- **Status**: Health status with color indicator
  - 🟢 Healthy
  - 🟡 Warning
  - 🔴 Error
- **CPU Usage**: Real-time CPU percentage
- **Memory Usage**: Current memory utilization
- **Service Count**: Number of services running

**Visual Indicators:**
- Different background gradients for different OS types
- Color-coded status badges
- Applications icon shows number of apps

#### 3. Service-Infrastructure Mapping

**Orphan Services:**

Services that cannot be automatically mapped appear in the "Orphan Services" section.

**Drag-and-Drop Mapping:**

1. Locate the orphan service
2. Drag it to the target infrastructure card
3. Drop to create the mapping
4. The service immediately moves to the "Services" section

**Visual Feedback:**
- Dragged service becomes semi-transparent
- Drop target infrastructure shows green border and glow effect
- Smooth animation on successful drop

**Unmapping Services:**

1. Find the mapped service
2. Click the small ❌ icon next to the health status
3. Confirm in the modal dialog
4. Service returns to "Orphan Services"

#### 4. Service Cards

Each service card displays:

- **Service Name**: Name of the service
- **Type**: Service type (HTTP, gRPC, Database, etc.)
- **Status**: Health indicator
- **Avg Duration**: Average response time
- **Calls/sec**: Request rate
- **Operations**: Number of operations

Services are sorted by status (error → warning → healthy) and then by latency.

#### 5. Operation Cards

Each operation card displays:

- **Operation Name**: Endpoint or function name
- **Method**: HTTP method or operation type
- **Avg Duration**: Average execution time
- **P95 Duration**: 95th percentile latency
- **Call Count**: Number of calls

#### 6. Search Functionality

Each section has its own search bar:

- **Regions**: Search by region name
- **Infrastructures**: Search by host name or IP
- **Services**: Search by service name or type
- **Operations**: Search by operation name or method
- **Orphan Services**: Search by service name

Search is **real-time** and **case-insensitive**.

#### 7. Expandable Table View

At the bottom, a detailed table shows:

- **Root Level**: All infrastructures with their metrics
- **Level 1**: Services per infrastructure (expandable)
- **Level 2**: Operations per service (expandable)

**Table Features:**
- Sortable columns
- Filterable by any field
- Resizable columns
- Export to CSV

### Service Map

The **Service Map** provides a visual representation of service dependencies and data flow, turning complex microservice flows into an easy-to-read visual journey.

**Service Map – End-to-End Calls**

View every API and backend service as a connected map. Follow request paths across microservices and understand how each dependency affects overall performance. The service map helps you:

- Visualize every microservice in your system and how they interact
- Expand, search, or drill into any node to understand dependencies
- Identify bottlenecks or upstream/downstream risks
- Follow the exact path of a request across services – from the edge to the core and back

**Two Views Available:**

#### 1. Overview Service Map

Shows the complete topology from infrastructure to services.

**Components:**

- **Regions**: Top-level grouping by cloud region
- **Infrastructures**: Hosts within each region
- **Services**: Services running on each host
- **Dependency Lines**: Arrows showing request flow between services

**Features:**

- **Auto-Layout**: Automatic positioning using Dagre algorithm
- **Zoom & Pan**: Navigate large service maps
- **Minimap**: Overview of the entire graph
- **Click to Focus**: Click any node to see details
- **Service Legend**: Color-coded by service type

#### 2. Infrastructure Service Map

Detailed view for a specific infrastructure.

**To Access:**
1. Select an infrastructure from the dropdown
2. The map shows all services on that host and their connections

**Node Information:**

Each node shows:
- Service name
- Request rate (calls/sec)
- Average latency
- Error rate

**Edge Information:**

Each edge shows:
- Number of requests
- Average duration
- Operation type (HTTP, gRPC, etc.)

**Interactive Features:**

- **Hover**: See detailed metrics
- **Click Node**: Open service detail drawer
- **Click Edge**: See operation-level details
- **Fullscreen Mode**: Expand map to full screen

**Service Map Drawer:**

When you click a node, a drawer opens showing:

- **Service Metrics**:
  - Call count
  - Average duration
  - P50, P75, P90, P95, P99 latencies
  - Error count and rate
  
- **Incoming Dependencies**: Services calling this service
- **Outgoing Dependencies**: Services this service calls
- **Recent Traces**: Latest traces involving this service
- **Quick Links**: Jump to Traces, Logs, or Service Detail

### Services

The **Services** page provides comprehensive performance monitoring for all your services with service-level and operation-level insights.

**Service-Level Metrics**

Open a single service to inspect its health, error rate and latency (avg, min, max). From here you can jump directly to logs, metrics or traces for faster root cause analysis. Each service card displays:

- **Health Status**: Real-time health indicator
- **Error Rate**: Percentage of failed requests
- **Latency Distribution**: Average, minimum, and maximum response times
- **Quick Navigation**: Jump to related traces, logs, or detailed metrics

**Operation-Level Insight**

Monitor each operation such as "Create User" with its own latency and P95 metrics. See which source and target services are involved in every call. Dive into operation-level performance to:

- Monitor latency, APDEX scores, and operations-per-second
- Detect regressions or spikes instantly
- Inspect full execution including HTTP/gRPC method
- Identify bottlenecks in user-facing flows

**Overview Cards:**

At the top, you'll see summary cards:

1. **Total Services**: Count of all services
2. **Average Latency**: Overall avg response time
3. **Total Calls**: Sum of all requests
4. **Error Rate**: Percentage of failed requests

**Services Grid:**

Each service is displayed in a card showing:

- **Service Name** with icon
- **Type**: HTTP, gRPC, Database, etc.
- **Status**: Health indicator
- **Metrics**:
  - Avg Duration
  - Calls/sec
  - Error Count
  - Success Rate

**Sorting:**

Services are automatically sorted by:
1. Status (error → warning → healthy)
2. Latency (highest first)

**Filtering:**

Use the filter panel to:
- Filter by service name (contains)
- Filter by service type
- Filter by status
- Filter by latency range
- Filter by time range

**Service Detail:**

Click on any service card to open the detail page with comprehensive analytics:

1. **Service Detail – Call Metrics**:
   - Analyze detailed call metrics for the selected service
   - Latency percentiles (P50, P90, P99)
   - Throughput and performance anomalies over time
   - Real-time performance graphs

2. **Service Detail – Operations Insight**:
   - Dive into operation-level performance
   - Monitor latency, APDEX scores, and operations-per-second
   - Detect regressions or spikes instantly
   - Identify which operations need optimization

3. **Performance Timeline**:
   - Latency over time (line chart)
   - Request rate over time (bar chart)
   - Error rate over time (area chart)
   - Interactive charts with zoom and pan

4. **Operations List**:
   - All operations within the service
   - Sorted by latency (highest first)
   - Click to see operation details
   - Filter and search operations

5. **Recent Traces**:
   - Latest traces for this service
   - Click to open full trace view
   - See trace duration and status

6. **Related Logs**:
   - Logs from this service
   - Automatically filtered by service name
   - Correlated with traces for debugging

### Traces

The **Traces** page helps you analyze distributed traces across your microservices, providing visual call flows and detailed span information.

**Distributed Traces Overview**

View all traces across your system sorted by latency, root service, or timestamp. Instantly find the slowest or fastest requests and inspect their complete trace data. The traces page provides:

- **Visual Call Flows**: Follow the exact path of a request across services – from the edge to the core and back
- **Performance Analysis**: Sort by duration to find bottlenecks
- **Full Visibility**: Complete trace data with all spans and attributes
- **Quick Filtering**: Find traces by service, operation, or time range

**Advanced Time Range Filtering**

Use quick ranges or precise date-time selection to analyze trace data within any custom timeframe:

- **Quick Ranges**: Last 5 min, 15 min, 1 hour, 6 hours, 24 hours, 7 days
- **Custom Selection**: Pick exact start and end times
- **Perfect for**: Incident analysis or regression detection
- **Time Correlation**: Align with logs and metrics for complete picture

**Multi-Backend Trace Selection**

Choose between multiple tracing backends (Tempo, Observability Platform, etc.) to:

- Compare environments (dev, staging, production)
- Test data from different sources
- Switch between tracing backends seamlessly
- Maintain consistent UI across backends

**Trace List:**

Displays all traces with:

- **Trace ID**: Unique identifier (clickable for details)
- **Root Service**: Entry point service
- **Duration**: Total trace duration (sortable)
- **Spans**: Number of spans in the trace
- **Timestamp**: When the trace occurred
- **Status**: Success or error indicator with color coding

**Filtering:**

Advanced filter options:

- **Service Name**: Filter by root or any service in the trace
- **Operation Name**: Filter by specific operation
- **Duration Range**: Min and max duration
- **Status**: Success, error, or both
- **Tags**: Filter by custom tags
- **Time Range**: Select time window

**Search:**

Free-text search across:
- Trace IDs
- Service names
- Operation names
- Tag values

**Trace Detail:**

Click on a trace to see:

#### 1. Trace Timeline

- **Gantt Chart View**: Horizontal timeline of all spans
- **Color Coding**: Different services have different colors
- **Span Duration**: Width represents duration
- **Parent-Child Relationships**: Indentation shows call hierarchy

#### 2. Flame Graph

- **Visual Performance**: See which spans took the most time
- **Interactive**: Click to zoom into specific sections
- **Color Intensity**: Darker colors indicate longer duration

#### 3. Span Details

When you click a span:

- **Service Information**: Service name, instance, version
- **Operation Details**: Operation name, type, method
- **Timing**: Start time, duration, timestamps
- **Attributes**: All span attributes (grouped by category)
- **Events**: Span events and logs
- **Links**: Links to related spans or traces

**Special Features:**

- **Trace ID Links**: If logs contain `otelTraceID`, they link to this page
- **Span ID Links**: Direct link to specific span in trace
- **Export**: Download trace as JSON
- **Share**: Generate shareable link

### Logs

The **Logs** page provides powerful log aggregation and search capabilities with centralized log exploration.

**Centralized Log Explorer**

Search, filter, and inspect logs from any service. View runtime details, JVM/OS diagnostics, container metadata, and attributes from OpenTelemetry logs. The log explorer provides:

- **Unified View**: All logs from all services in one place
- **Rich Context**: Runtime details, diagnostics, and metadata
- **OpenTelemetry Integration**: Full support for OTEL log attributes
- **Fast Search**: Find what you need in seconds

**Log Stream:**

Real-time log entries with:

- **Timestamp**: When the log was generated
- **Level**: Debug, Info, Warning, Error, Fatal
- **Service**: Source service name
- **Message**: Log message content
- **Labels**: Associated labels and attributes
- **Trace Correlation**: Link to related traces when available

**Level Indicators:**

- 🔵 **Debug**: Blue
- 🟢 **Info**: Green
- 🟡 **Warning**: Yellow  
- 🔴 **Error**: Red
- 🟣 **Fatal**: Purple

**Filtering:**

Multiple filter options:

- **Log Level**: Select one or more levels
- **Service Name**: Filter by service
- **Search Query**: LogQL queries or free text
- **Time Range**: Select time window
- **Labels**: Filter by any label

**LogQL Support:**

Write powerful queries:

```logql
{service_name="api-gateway"} |= "error" | json
```

```logql
{job="app"} | json | line_format "{{.level}}: {{.message}}"
```

**Expanded Log View:**

Click on a log entry to see:

#### 1. Full Log Details

- Complete message (if truncated)
- Formatted JSON (if structured log)
- All attributes and labels
- Stack trace (if error)

#### 2. Additional Attributes

**Special Handling for OpenTelemetry:**

- **Trace ID**: Clickable link to trace detail
- **Span ID**: Clickable link to specific span in trace
- Automatically sorted to show trace/span IDs first

#### 3. Context Menu

- **Show Context**: View logs before/after this entry
- **Filter by Field**: Add field value to filter
- **Copy**: Copy log message or entire entry
- **Jump to Trace**: If trace ID present

**AI Log Analysis (if enabled):**

- **Severity Inference**: AI determines actual severity
- **Pattern Detection**: Identifies common error patterns
- **Anomaly Detection**: Highlights unusual log entries

**Log Metrics:**

At the top, see aggregated statistics:

- **Log Count**: Total logs in time range
- **Error Rate**: Percentage of error logs
- **Top Services**: Services with most logs
- **Log Distribution**: Timeline of log volume

### Views

The **Views** page allows you to save and manage custom views of your observability data.

**Custom Monitoring Dashboards**

Create dashboards tailored to your needs: logs, metrics, service maps, or trace views. Save and reuse widgets to build a personalized observability control center. Views help you:

- **Save Complex Queries**: Don't rebuild filters every time
- **Share with Team**: Collaborate on common investigations
- **Quick Access**: One-click access to frequently used views
- **Organize Workflows**: Structure your monitoring process

**What is a View?**

A view is a saved combination of:
- Page (Service Map, Services, Traces, Logs, etc.)
- Filters and query parameters
- Time range
- Selected fields
- Display preferences

**Creating a View:**

1. Navigate to any page (e.g., Logs)
2. Apply your desired filters
3. Click **Save View** button
4. Enter a name and description
5. Click **Save**

**View List:**

The main page shows all your saved views:

- **Name**: View title
- **Page**: Which page this view is for
- **Created**: When it was created
- **Last Used**: When you last accessed it
- **Creator**: Who created it

**Using a View:**

Click on any view to:
- Instantly navigate to that page
- Auto-apply all saved filters
- Restore saved time range

**Managing Views:**

- **Edit**: Modify name, description, or query
- **Duplicate**: Create a copy to modify
- **Share**: Share with team members
- **Delete**: Remove the view

**View Organization:**

- **Search**: Find views by name
- **Filter by Page**: Show only views for specific pages
- **Sort**: By name, date, or last used
- **Favorites**: Star frequently used views

### Exceptions

The **Exceptions** page helps you track and analyze errors and exceptions across your services.

**Exception Overview:**

Summary cards showing:

1. **Total Exceptions**: Count of all exceptions
2. **Exception Rate**: Exceptions per second
3. **Affected Services**: Number of services with exceptions
4. **New Exceptions**: First-time exceptions in time range

**Exception List:**

Each exception entry shows:

- **Exception Type**: Class or error type
- **Message**: Error message
- **Service**: Where the exception occurred
- **Count**: Number of occurrences
- **First Seen**: When first detected
- **Last Seen**: Most recent occurrence
- **Trend**: Increasing, stable, or decreasing

**Exception Detail:**

Click on an exception to see:

#### 1. Exception Information

- Full exception type and message
- Stack trace (if available)
- Exception attributes

#### 2. Occurrence Timeline

- Chart showing exception frequency over time
- Identify spikes or patterns

#### 3. Affected Services

- List of services where this exception occurs
- Percentage of occurrences per service

#### 4. Related Traces

- Recent traces containing this exception
- Click to view full trace

#### 5. Related Logs

- Log entries around the time of exceptions
- Automatically filtered by service and time

**Grouping:**

Exceptions are intelligently grouped by:
- Exception type
- Similar stack traces
- Same service and operation

**Alerting:**

Set up alerts for:
- New exception types
- Exception rate threshold
- Exception in critical services

### AI Assistant

The **AI Assistant** provides intelligent insights and recommendations powered by AI.

**Features:**

#### 1. AI Chat Interface

A floating chat button in the bottom right of every page:

- Click to open AI Assistant
- Minimal design with glassmorphism effect
- Smooth animations

**Chat Functionality:**

- **Context-Aware**: AI knows which page you're on
- **Data-Aware**: AI has access to your current view data
- **Natural Language**: Ask questions in plain English

**Example Questions:**

```
"What services have the highest error rate?"
"Show me the slowest endpoints"
"Why is my response time increasing?"
"Which services are calling user-service?"
"Find anomalies in my logs"
```

#### 2. Optimization Tips

When you first open the AI Assistant, it automatically:

- Analyzes your current page data
- Identifies potential issues
- Provides optimization recommendations

**Example Tips:**

- "Service X has high latency on operation Y"
- "Consider adding caching to reduce database calls"
- "Your error rate spiked 2 hours ago on service Z"

#### 3. Action Buttons

Below each AI response:

- **Tell me more**: Get detailed explanation
- **Find more issues**: Discover additional problems
- **Show examples**: See code examples or queries

#### 4. Full Screen Mode

- Click the fullscreen icon to expand chat
- Maximize for complex analyses
- Press again to restore

**AI Configuration:**

In Settings → AI Configuration:

- **API Key**: Your OpenRouter API key
- **Model**: Choose AI model (GPT-4, Claude, etc.)
- **Temperature**: Adjust creativity (0.0-1.0)
- **Max Tokens**: Maximum response length

**AI Status Card:**

On the landing page and AI page:
- Shows "Active" if API key is configured
- Shows "Inactive" if not configured
- Click to go to settings

---

## Configuration

### Settings

Access settings via the **Settings** menu item.

#### Tabs:

1. **Datasources**: Configure default data sources
2. **Definitions**: Define metric and label patterns
3. **Time Range**: Set default time range
4. **AI Configuration**: Configure AI assistant
5. **Security**: API key management

### Datasources

**Default Datasources:**

- **Default Prometheus**: Primary metrics source
- **Default Tempo**: Primary traces source
- **Default Loki**: Primary logs source

**Default Time Range:**

Select from:
- Last 5 minutes
- Last 15 minutes
- Last 1 hour
- Last 6 hours
- Last 24 hours
- Last 7 days

### Definitions

Define how IyziTrace interprets your metrics:

**Label Definitions:**

- **Service Label Name**: Label for service names (default: `service_name`)
- **Operation Label Name**: Label for operation names (default: `span_name`)
- **Type Label Name**: Label for operation types (default: `span_kind`)

**Metric Definitions:**

Add custom metrics for:
- Latency metrics (e.g., `http_request_duration_seconds`)
- Error metrics (e.g., `http_requests_total{status="5xx"}`)
- Throughput metrics (e.g., `http_requests_total`)

**Definition Table:**

Each definition has:
- **Name**: Human-readable name
- **Type**: Metric or Label
- **PromQL Pattern**: Query pattern
- **Description**: What this definition represents

### AI Configuration

**API Key:**

- Enter your OpenRouter API key
- Key is stored securely in Grafana
- Required for AI Assistant features

**Model Settings:**

- **Model**: Select AI model
  - GPT-4
  - GPT-3.5-turbo
  - Claude 3
  - Other OpenRouter models
  
- **Temperature**: Controls randomness (0.0-1.0)
  - 0.0: Deterministic, focused responses
  - 1.0: Creative, varied responses
  
- **Max Tokens**: Maximum response length
  - Typical: 2000-4000 tokens
  - Long analyses: Up to 8000 tokens

**Save All Settings:**

Click **Save Settings** button to save:
- All datasource configurations
- All definitions
- All AI settings
- All security settings

---

## Access Control

### Teams

IyziTrace supports multi-tenancy through teams.

**Creating a Team:**

1. Navigate to **Teams**
2. Click **Create Team**
3. Enter:
   - **Team Name**: Unique identifier
   - **Display Name**: Human-readable name
   - **Description**: Team purpose
4. Click **Save**

**Team Management:**

- **View Teams**: See all teams you have access to
- **Edit Team**: Modify team details
- **Delete Team**: Remove team (admin only)

### Page Permissions

Control which pages team members can access:

**Available Pages:**

- Landing
- Overview
- Service Map
- Services
- Traces
- Logs
- Views
- Exceptions
- AI Assistant
- Teams
- Settings

**Setting Permissions:**

1. Select a team
2. Check pages the team can access
3. Click **Save Permissions**

**Permission Levels:**

- **Admin**: Can access all pages and manage teams
- **User**: Can access assigned pages only
- **No Access**: If a team has no page assignments, they see all pages (default behavior)

**Sidebar Behavior:**

- Admin users see all menu items
- Team users only see allowed menu items
- If no permissions are set, all users see all items

---

## Advanced Features

### Service-Infrastructure Mapping

**Auto-Discovery:**

IyziTrace automatically maps services to infrastructure based on:

1. **Host Name Matching**: If service and infrastructure share same `host_name`
2. **Cloud Region Matching**: If they're in the same `cloud_region`

**Manual Mapping:**

For services that can't be auto-mapped:

1. They appear in "Orphan Services" section
2. Drag the service card
3. Drop it on target infrastructure
4. Mapping is saved persistently

**Mapping Storage:**

Mappings are stored in Grafana plugin settings:

```json
{
  "serviceInfrastructureMapping": {
    "service-id-1": "infrastructure-id-1",
    "service-id-2": "infrastructure-id-2"
  }
}
```

**Unmapping:**

1. Click the ❌ icon on a mapped service
2. Confirm in the modal
3. Service returns to orphan services
4. Mapping is removed from storage

### Orphan Services

**What are Orphan Services?**

Services discovered in your telemetry but not mapped to any infrastructure:

- Services without matching `host_name`
- Services from external systems
- Services in different regions
- Manually instrumented services

**Why Map Them?**

Mapping orphan services:
- Completes your topology view
- Enables infrastructure-level filtering
- Shows complete dependency graph
- Improves resource attribution

### Search and Filter

**Global Search:**

Each section supports search:

- **Real-time**: Results update as you type
- **Case-insensitive**: Matches regardless of case
- **Contains logic**: Matches partial strings
- **Multi-field**: Searches across multiple fields

**Search Scope by Section:**

- **Regions**: Region name
- **Infrastructures**: Name, IP, OS type
- **Services**: Service name, type
- **Operations**: Operation name, method, path
- **Orphan Services**: Service name, type

**Filter Persistence:**

- Filters are preserved in URL
- Share filtered views with team members
- Bookmark specific filter combinations

---

## API Reference

IyziTrace exposes various APIs for programmatic access.

### Datasource APIs

**Prometheus Queries:**

```typescript
import { getQueryData } from './api/provider/prometheus.provider';

const data = await getQueryData('up{job="api"}');
```

**Tempo Queries:**

```typescript
import { getQueryData } from './api/provider/tempo.provider';

const traces = await getQueryData('{}', startTime, endTime, limit);
```

**Loki Queries:**

```typescript
import { getQueryData } from './api/provider/loki.provider';

const logs = await getQueryData(
  '{service_name="api"}', 
  startTime, 
  endTime,
  limit
);
```

### Settings APIs

**Get Plugin Settings:**

```typescript
import { getPluginSettings } from './api/service/settings.service';

const settings = await getPluginSettings();
```

**Save Plugin Settings:**

```typescript
import { savePluginSettings } from './api/service/settings.service';

await savePluginSettings({
  serviceInfraMapping: {...},
  aiConfig: {...}
});
```

### Service Map APIs

**Get Regions:**

```typescript
import { getRegions } from './api/service/service-map.service';

const regions = await getRegions(filterModel);
```

**Get Orphan Services:**

```typescript
import { getOrphanServices } from './api/service/service-map.service';

const orphans = await getOrphanServices(filterModel);
```

### AI APIs

**Ask AI:**

```typescript
import { askAI } from './api/service/ai.service';

const response = await askAI(
  'What services have high error rates?',
  context
);
```

---

## FAQ

**Q: How do I start sending data to IyziTrace?**

A: IyziTrace doesn't collect data directly. Configure your applications to send:
- Traces to Tempo (via OTLP)
- Logs to Loki
- Metrics to Prometheus

Then connect these datasources in IyziTrace settings.

**Q: Why don't I see my services?**

A: Ensure:
1. Your datasources are connected
2. Data is being sent to Prometheus/Tempo/Loki
3. Metrics contain required labels (`service_name`, etc.)
4. Check definitions in Settings match your label names

**Q: How do I map orphan services?**

A: Drag the service from "Orphan Services" section and drop it on the target infrastructure card.

**Q: Can I use IyziTrace without AI features?**

A: Yes! AI Assistant is optional. All core features work without it.

**Q: How are permissions enforced?**

A: Permissions are enforced through team-based access control. Admins see everything; team users see only assigned pages.

**Q: Can I export my data?**

A: Yes:
- Tables support CSV export
- Traces can be exported as JSON
- Use the datasource APIs to fetch raw data

**Q: How do I troubleshoot missing infrastructure?**

A: Check that:
1. Prometheus is scraping `__inv_base` metric
2. Host inventory is being collected
3. Required labels (`host_name`, `cloud_region`) are present

**Q: What OpenTelemetry version is supported?**

A: IyziTrace supports OpenTelemetry 1.0+ and is compatible with OTLP protocol.

**Q: Can I customize metric definitions?**

A: Yes! Go to Settings → Definitions to add custom metric patterns.

**Q: How do I configure alerts?**

A: Alerts are managed through Grafana's native alerting system. Create alert rules based on your datasources.

---

## Troubleshooting

### Common Issues

#### 1. "No data found"

**Symptoms**: Empty pages, no services, no traces

**Solutions**:
- Verify datasources are connected and healthy
- Check that applications are sending data
- Confirm time range includes data
- Review datasource logs for errors

#### 2. "Orphan services not disappearing after mapping"

**Symptoms**: Mapped services still show in orphan section

**Solutions**:
- Refresh the page
- Check plugin settings were saved
- Verify mapping API call succeeded
- Clear browser cache

#### 3. "AI Assistant not responding"

**Symptoms**: AI chat shows errors or no response

**Solutions**:
- Verify API key is configured
- Check OpenRouter account has credits
- Test API key in OpenRouter dashboard
- Review browser console for errors

#### 4. "Services not auto-mapping"

**Symptoms**: Expected services appear as orphans

**Solutions**:
- Verify `host_name` label matches infrastructure
- Check `cloud_region` matches
- Ensure both service and infrastructure exist
- Review auto-discovery logic in service-map.service.ts

#### 5. "Table not showing nested data"

**Symptoms**: Infrastructure expands but shows no services

**Solutions**:
- Verify data structure includes `services` array
- Check that `l1Key` and `l2Key` match your data
- Review table column definitions
- Check browser console for errors

#### 6. "Search not working"

**Symptoms**: Search returns no results or wrong results

**Solutions**:
- Check search is case-insensitive
- Verify searchable fields are configured
- Review getSearchableText function
- Clear search and try again

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'iyzitrace:*');
```

This will log detailed information about:
- API calls
- Data fetching
- Rendering
- State changes

### Getting Help

For additional support:

1. Check this documentation
2. Review [GitHub Issues](https://github.com/iyzitrace/iyzitrace)
3. Contact support team
4. Join community discussions

---

## Meta

**Version**: 1.0.0

**License**: Proprietary

**Questions? Comments?**

Send them to: support@iyzitrace.com

---

## Start Observing in Minutes

No credit card required. Start your observability journey today!

**Ready to get started?**

1. Install the IyziTrace plugin from Grafana Marketplace
2. Configure your datasources (Tempo, Loki, Prometheus)
3. Set up your API key
4. Start sending telemetry data
5. Explore your systems with powerful visualizations

**Need help?** Contact us at support@iyzitrace.com

---

## Legal & Compliance

- [Terms and Conditions](https://iyzitrace.com/legal/terms)
- [Privacy Policy](https://iyzitrace.com/legal/privacy)
- [Data Processing Agreement](https://iyzitrace.com/legal/dpa)
- [Vulnerability Disclosure](https://iyzitrace.com/legal/vulnerability-disclosure)

---

*©2025 IYZI Trace Inc. Built with ❤️ by the IyziTrace Team*

