COMPOSE_FILES=-f docker-compose.yml -f docker-compose.dev.yml

.PHONY: up down logs ps test

up:
	docker compose $(COMPOSE_FILES) up -d

down:
	docker compose $(COMPOSE_FILES) down

logs:
	docker compose $(COMPOSE_FILES) logs -f

ps:
	docker compose $(COMPOSE_FILES) ps

test:
	./tests/checks.sh
