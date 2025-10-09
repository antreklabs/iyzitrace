## Deployment Guide (iyzitrace)

This document describes how to deploy and run the project on a remote server over SSH and how to start the supporting observability stack with Docker Compose. It also shows how to make `pnpm run dev` run remotely on the server.

Assumptions:
- You can SSH into the server as: `ssh root@217.154.215.186`
- Remote working directory: `/opt/iyzitrace`
- Local project root: `/Users/gokhansipahi/projects/iyzitrace/iyzitrace`

You can copy/paste the command blocks below in order.

### 0) One-time prerequisites on the server

```bash
ssh root@217.154.215.186 \
  'sudo mkdir -p /opt/iyzitrace && sudo chown -R $USER:$USER /opt/iyzitrace && \
   # Install Docker + Compose v2 (Ubuntu example)
   if ! command -v docker >/dev/null 2>&1; then \
     curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER; \
   fi && \
   # Install Node (via nvm) + pnpm
   if ! command -v node >/dev/null 2>&1; then \
     export PROFILE="$HOME/.bashrc"; \
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash; \
     . "$HOME/.nvm/nvm.sh"; \
     nvm install --lts; \
   fi && \
   if ! command -v pnpm >/dev/null 2>&1; then \
     corepack enable; corepack prepare pnpm@latest --activate; \
   fi'

# IMPORTANT: If Docker was just installed, re-login so group changes apply
ssh root@217.154.215.186 'exit'
```

### 1) Sync project files to the server

Use rsync to mirror your local working copy to the server (deletes removed files, keeps `node_modules` out).

```bash
export SERVER_HOST=217.154.215.186
export SERVER_USER=root
export REMOTE_DIR=/opt/iyzitrace
export LOCAL_DIR=/Users/gokhansipahi/projects/iyzitrace/iyzitrace

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude 'docker-compose.yaml' \
  --exclude 'package.json' \
  "$LOCAL_DIR/" "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"
```


```bash
export SERVER_HOST=217.154.215.186
export SERVER_USER=root
export REMOTE_DIR=/opt/iyzitrace
export LOCAL_DIR=/Users/gokhansipahi/projects/iyzitrace/iyzitrace

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  "$LOCAL_DIR/" "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"
```

You can re-run this command whenever you make changes locally.

### 2) Install dependencies on the server

```bash
ssh $SERVER_USER@$SERVER_HOST \
  'cd /opt/iyzitrace && \
   . "$HOME/.nvm/nvm.sh" 2>/dev/null || true && \
   corepack enable && corepack prepare pnpm@latest --activate && \
   pnpm install --frozen-lockfile'
```

### 3) Start the Observability Stack (Docker Compose)

There are three compose files in the repo. Use the ones you need:

- Root compose: `docker-compose.yml`
- Observability Platform: `configs/observability-platform/docker-compose.yml`
- OpenTelemetry Demo: `configs/opentelemetry-demo/docker-compose.yml`

Run them on the server like this:

```bash
ssh $SERVER_USER@$SERVER_HOST \
  'cd /opt/iyzitrace && \
   # Option A: start root compose (Grafana plugin dev env)
   docker compose -f docker-compose.yaml up -d && \
   \
   # Option B: start observability-platform stack
   docker compose -f configs/observability-platform/docker-compose.yml up -d && \
   \
   # Option C: start OpenTelemetry demo stack
   docker compose -f configs/opentelemetry-demo/docker-compose.yml up -d'
```

Use whichever option(s) apply to your setup. You can run multiple stacks as needed.

To check containers:

```bash
ssh $SERVER_USER@$SERVER_HOST 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"'
```

### 4) Run the Webpack dev server remotely (pnpm run dev)

Start `pnpm run dev` on the server inside a persistent session so it keeps running after you disconnect.

Option A: using `screen` (simple)
```bash
ssh $SERVER_USER@$SERVER_HOST \
  'cd /opt/iyzitrace && \
   . "$HOME/.nvm/nvm.sh" 2>/dev/null || true && \
   screen -S iyzitrace-dev -dm bash -lc "pnpm run dev" && \
   screen -ls'

# To attach later:
ssh $SERVER_USER@$SERVER_HOST 'screen -r iyzitrace-dev'
# To stop:
ssh $SERVER_USER@$SERVER_HOST 'screen -S iyzitrace-dev -X quit'
```

Option B: using `tmux` (alternative)
```bash
ssh $SERVER_USER@$SERVER_HOST \
  'cd /opt/iyzitrace && \
   . "$HOME/.nvm/nvm.sh" 2>/dev/null || true && \
   tmux new -d -s iyzitrace-dev "pnpm run dev" && \
   tmux ls'

# Attach:  ssh $SERVER_USER@$SERVER_HOST 'tmux attach -t iyzitrace-dev'
# Stop:    ssh $SERVER_USER@$SERVER_HOST 'tmux kill-session -t iyzitrace-dev'
```

Option C: using `pm2` (daemon)
```bash
ssh $SERVER_USER@$SERVER_HOST \
  'cd /opt/iyzitrace && \
   . "$HOME/.nvm/nvm.sh" 2>/dev/null || true && \
   pnpm dlx pm2@latest start "pnpm run dev" --name iyzitrace-dev --time && \
   pnpm dlx pm2 ls'

# Logs:  ssh $SERVER_USER@$SERVER_HOST 'pnpm dlx pm2 logs iyzitrace-dev'
# Stop:  ssh $SERVER_USER@$SERVER_HOST 'pnpm dlx pm2 delete iyzitrace-dev'
```

### 4.a) Run pnpm dev inside Docker (detached, no session needed)

You can run the watcher inside a container so it keeps running independently of your SSH session. Two options:

Option A: docker run (no extra files needed)
```bash
ssh $SERVER_USER@$SERVER_HOST \
  'mkdir -p /opt/iyzitrace && \
   docker run -d --name iyzitrace-dev \
   -v /opt/iyzitrace:/app \
   -w /app \
   -p 3000:3000 \
   -p 35729:35729 \
   --restart unless-stopped \
   node:18-alpine sh -lc "apk add --no-cache git && corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run dev"'

# Logs / Stop
ssh $SERVER_USER@$SERVER_HOST 'docker logs -f iyzitrace-dev'
ssh $SERVER_USER@$SERVER_HOST 'docker rm -f iyzitrace-dev'
```

Option B: docker-compose service (recommended)

Add this service to your compose file (or create `docker-compose.dev.yaml`) on the server:

```yaml
services:
  iyzitrace-dev:
    image: node:18-alpine
    container_name: iyzitrace-dev
    working_dir: /app
    command: sh -lc "apk add --no-cache git && corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run dev"
    volumes:
      - /opt/iyzitrace:/app
    ports:
      - "3000:3000"     # if your dev server exposes 3000
      - "35729:35729"   # LiveReload if used
    restart: unless-stopped
```

Start it:
```bash
ssh $SERVER_USER@$SERVER_HOST 'cd /opt/iyzitrace && sudo docker compose -f docker-compose.dev.yaml up -d'
```

Notes:
- The container mounts `/opt/iyzitrace`, so re-running the rsync in step 1 updates the code live.
- If your dev build doesn’t expose port 3000 or 35729, remove those port mappings.
- If you prefer not to run as root, drop `sudo` and ensure your user is in the docker group.

### 5) Iterating during development

Each time you change code locally:
```bash
# 1) Re-sync files
rsync -avz --delete --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  "$LOCAL_DIR/" "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"

# 2) (Optional) reinstall if dependencies changed
ssh $SERVER_USER@$SERVER_HOST 'cd /opt/iyzitrace && pnpm install --frozen-lockfile'

# 3) Webpack dev is already running remotely; it will rebuild automatically
```

### 6) Helpful maintenance commands

```bash
# Restart stacks
ssh $SERVER_USER@$SERVER_HOST 'cd /opt/iyzitrace && docker compose -f docker-compose.yml restart'

# View Docker logs
ssh $SERVER_USER@$SERVER_HOST 'docker ps --format "table {{.Names}}\t{{.Image}}"'
ssh $SERVER_USER@$SERVER_HOST 'docker logs -n 200 -f grafana'

# Free disk space from dangling images
ssh $SERVER_USER@$SERVER_HOST 'docker system prune -af'
```

### Notes
- If you use a different shell on the server, source the appropriate profile for nvm.
- If your server is not Ubuntu/Debian, adapt the Docker install step accordingly.
- Ensure port exposure and firewall rules allow access to Grafana and related services.


