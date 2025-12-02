#!/usr/bin/env bash
set -eu

BASE_DIR=$(cd "$(dirname "$0")/.." && pwd)

check_url() {
  url=$1
  name=$2
  echo -n "Checking $name... "
  if curl -sSf --max-time 5 "$url" >/dev/null; then
    echo "OK"
  else
    echo "FAIL"
    exit 1
  fi
}

check_url "http://localhost:9090/-/ready" "Prometheus ready"
check_url "http://localhost:3000/" "Grafana UI"
check_url "http://localhost:3100/ready" "Loki ready"
check_url "http://localhost:3200/" "Tempo HTTP"

echo "All checks passed."
