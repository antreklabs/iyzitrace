# IyziTrace - Grafana App Plugin

IyziTrace is a comprehensive observability platform built as a Grafana app plugin, providing distributed tracing, service mapping, and log analysis capabilities.

## Features

- **Distributed Tracing**: Explore and analyze distributed traces with flame graphs and timeline views
- **Service Map**: Visualize service dependencies and interactions in real-time
- **Service Metrics**: Monitor service performance with detailed metrics and charts
- **Log Analysis**: Search and analyze application logs with advanced filtering
- **Log Pipelines**: Process and transform logs with configurable pipelines (SigNoz-like feature)
- **TraceQL Support**: Advanced trace querying with TraceQL language
- **Real-time Data**: Live observability data from telemetry generators

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested data sources and panel plugins.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js and pnpm

### Running the Complete Stack

To run IyziTrace with real observability data, you have two options for data generation:

#### Option 1: Observability Platform (Recommended)

```bash
# Start the observability platform with Tempo, Prometheus, Loki, and telemetry generators
docker compose -f configs/observability-platform/docker-compose.yml up -d
```

This will start:
- **Tempo** (traces) - Distributed tracing backend
- **Prometheus** (metrics) - Metrics collection and storage
- **Loki** (logs) - Log aggregation system
- **OpenTelemetry Collectors** - Data collection and routing
- **NGINX** - Signal router for telemetry data
- **Telemetry Generators** - Generate sample traces, metrics, and logs

#### Option 2: OpenTelemetry Demo

```bash
# Start the OpenTelemetry demo with full microservices stack
docker compose -f configs/opentelemetry-demo/docker-compose.yml up -d
```

This will start:
- **Full Microservices Stack** - Frontend, backend services, databases
- **Tempo** (traces) - Distributed tracing backend
- **Prometheus** (metrics) - Metrics collection and storage
- **Loki** (logs) - Log aggregation system
- **Jaeger** (alternative traces) - Alternative tracing backend
- **Load Generator** - Simulates real user traffic
- **Real Application Data** - More realistic and complex traces

#### Option 3: Both Platforms (Advanced)

You can run both platforms simultaneously for maximum data variety:

```bash
# Start both platforms
docker compose -f configs/observability-platform/docker-compose.yml up -d
docker compose -f configs/opentelemetry-demo/docker-compose.yml up -d
```

**Note**: Both platforms use different ports to avoid conflicts.

#### 2. Start IyziTrace Grafana Plugin

```bash
# Start IyziTrace Grafana instance connected to the data sources
docker compose up -d 
```

This will start:
- Grafana with IyziTrace plugin
- Connected to both observability platform and OpenTelemetry demo datasources
- Pre-configured with Prometheus, Tempo, and Loki datasources from both platforms

#### 3. Access the Application

- **Grafana UI**: http://localhost:3000
- **IyziTrace Plugin**: Navigate to the IyziTrace app in Grafana
- **Service Map**: View real-time service dependencies
- **Traces**: Explore distributed traces from telemetry generators or microservices
- **Logs**: Analyze application logs from Loki
- **Metrics**: Monitor performance metrics from Prometheus

#### 4. Stop the Stack

```bash
# Stop IyziTrace
docker compose down

# Stop observability platform (if running)
docker compose -f configs/observability-platform/docker-compose.yml down

# Stop OpenTelemetry demo (if running)
docker compose -f configs/opentelemetry-demo/docker-compose.yml down
```

## Development Setup

### Frontend Development

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   pnpm run dev
   ```

3. Build plugin in production mode

   ```bash
   pnpm run build
   ```

4. Run the tests (using Jest)

   ```bash
   # Runs the tests and watches for changes, requires git init first
   pnpm run test

   # Exits after running all the tests
   pnpm run test:ci
   ```

5. Run the E2E tests (using Playwright)

   ```bash
   # Spins up a Grafana instance first that we tests against
   pnpm run server

   # If you wish to start a certain Grafana version. If not specified will use latest by default
   GRAFANA_VERSION=11.3.0 pnpm run server

   # Starts the tests
   pnpm run e2e
   ```

6. Run the linter

   ```bash
   pnpm run lint

   # or

   pnpm run lint:fix
   ```

### Development with Observability Data

For development with real observability data, you can choose between:

#### Option A: Observability Platform
```bash
# Start observability platform
docker compose -f configs/observability-platform/docker-compose.yml up -d

# Start IyziTrace in development mode
pnpm run dev

# In another terminal, start Grafana with the plugin
pnpm run server
```

#### Option B: OpenTelemetry Demo
```bash
# Start OpenTelemetry demo
docker compose -f configs/opentelemetry-demo/docker-compose.yml up -d

# Start IyziTrace in development mode
pnpm run dev

# In another terminal, start Grafana with the plugin
pnpm run server
```

This setup allows you to:
- Develop the plugin with hot reloading
- Test against real telemetry data (traces, metrics, logs)
- Debug with live telemetry generators or microservices
- Monitor service interactions in real-time
- Choose between simple telemetry generators or complex microservices

# Distributing your plugin

When distributing a Grafana plugin either within the community or privately the plugin must be signed so the Grafana application can verify its authenticity. This can be done with the `@grafana/sign-plugin` package.

_Note: It's not necessary to sign a plugin during development. The docker development environment that is scaffolded with `@grafana/create-plugin` caters for running the plugin without a signature._

## Initial steps

Before signing a plugin please read the Grafana [plugin publishing and signing criteria](https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria) documentation carefully.

`@grafana/create-plugin` has added the necessary commands and workflows to make signing and distributing a plugin via the grafana plugins catalog as straightforward as possible.

Before signing a plugin for the first time please consult the Grafana [plugin signature levels](https://grafana.com/legal/plugins/#what-are-the-different-classifications-of-plugins) documentation to understand the differences between the types of signature level.

1. Create a [Grafana Cloud account](https://grafana.com/signup).
2. Make sure that the first part of the plugin ID matches the slug of your Grafana Cloud account.
   - _You can find the plugin ID in the `plugin.json` file inside your plugin directory. For example, if your account slug is `acmecorp`, you need to prefix the plugin ID with `acmecorp-`._
3. Create a Grafana Cloud API key with the `PluginPublisher` role.
4. Keep a record of this API key as it will be required for signing a plugin

## Signing a plugin

### Using Github actions release workflow

If the plugin is using the github actions supplied with `@grafana/create-plugin` signing a plugin is included out of the box. The [release workflow](./.github/workflows/release.yml) can prepare everything to make submitting your plugin to Grafana as easy as possible. Before being able to sign the plugin however a secret needs adding to the Github repository.

1. Please navigate to "settings > secrets > actions" within your repo to create secrets.
2. Click "New repository secret"
3. Name the secret "GRAFANA_API_KEY"
4. Paste your Grafana Cloud API key in the Secret field
5. Click "Add secret"

#### Push a version tag

To trigger the workflow we need to push a version tag to github. This can be achieved with the following steps:

1. Run `npm version <major|minor|patch>`
2. Run `git push origin main --follow-tags`

## Learn more

Below you can find source code for existing app plugins and other related documentation.

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [`plugin.json` documentation](https://grafana.com/developers/plugin-tools/reference/plugin-jsonplugin-json)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)

## Git Workflow Commands

### Complete Development Workflow

This section covers the complete workflow from creating a feature branch to merging back to dev.

#### 1. Creating a new branch from dev

```bash
# Switch to dev branch
git checkout dev

# Pull latest changes from dev
git pull origin dev

# Create and switch to new branch from dev
git checkout -b feature/overview

# Push the new branch to GitHub and set up tracking
git push -u origin feature/overview
```

#### 2. Creating Pull Request with GitHub CLI

Create and manage pull request:

```bash
# Create pull request from feature branch to dev
gh pr create --base dev --head feature/your-feature-name \
  --title "Your PR Title" \
  --body "## Description
Your detailed PR description here

## Changes
- Change 1
- Change 2

## Testing
- [x] Test case 1
- [x] Test case 2"

# Check PR status
gh pr status

# View PR details
gh pr view [PR_NUMBER]
```

#### 3. Merging and cleanup

```bash
# Merge PR and delete remote branch (can be done by reviewer)
gh pr merge [PR_NUMBER] --merge

# Switch back to dev branch
git checkout dev

# Pull latest changes including your merged PR
git pull origin dev

git branch -m feature/service-map merged-feature/service-map
git push origin merged-feature/service-map
git push origin --delete feature/service-map

```


```bash
   docker compose -f docker-compose.yaml down
   docker compose -f configs/observability-platform/docker-compose.yml down
   docker compose -f configs/opentelemetry-demo/docker-compose.yml down

   docker compose -f docker-compose.yaml up -d
   docker compose -f configs/observability-platform/docker-compose.yml up -d
   docker compose -f configs/opentelemetry-demo/docker-compose.yml up -d

   pnpm run dev     

```
