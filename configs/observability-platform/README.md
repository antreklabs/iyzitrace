# Observability Platform (dev) — Quick Start

This folder contains a docker-compose based observability platform for development and demo purposes. It bundles Tempo, Loki, Prometheus, OpenTelemetry collectors, and an NGINX based OTLP ingress.

Use `docker-compose.dev.yml` to enable developer tooling such as Grafana and Alertmanager and to expose common UI ports.

## Quickstart

Prereqs:
- Docker Engine (v20+)
- docker compose V2 (as `docker compose`)

Steps:

1. Create the Docker network (optional):
```bash
docker network inspect shared-network >/dev/null 2>&1 || docker network create shared-network
```

2. Start the stack (dev overlay):
```bash
cd configs/observability-platform
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

3. Check the services:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

4. Access UIs (dev overlay)
- Grafana: http://localhost:3000  (user: admin / pass: admin)
- Prometheus: http://localhost:9090
- Loki: http://localhost:3100
- Tempo: http://localhost:3200

5. Ingress OTLP endpoints
- gRPC: localhost:4317
- HTTP: localhost:4318
These endpoints are routed through `nginx` to the internal OTEL collector services.

## Notes
- This setup is *for development and demos only*. Do not use default credentials or `latest` tags in production.
- For production use, see Helm/Kubernetes deployment recommendations in the repo documentation.
