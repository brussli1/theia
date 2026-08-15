# Production deploy helpers (#18) — thin wrappers over the production
# compose stack. All targets read .env.production (see .env.production.example
# and docs/deploy.md).

COMPOSE := docker compose --env-file .env.production -f compose.prod.yaml

.PHONY: config build up down ps logs smoke

config:
	$(COMPOSE) config

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

smoke:
	./deploy/smoke_check.sh
