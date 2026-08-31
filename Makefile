SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE := docker compose
TEMPORAL_PID := .temporal/temporal.pid
TEMPORAL_LOG := .temporal/temporal.log
TEMPORAL_DB := .temporal/coffer.db

.PHONY: help up down install db-build migrate deploy seed seed-dynamic dev worker api web sync sync-new check replay

help:
	@grep -hE '^[a-z-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Start postgres and the temporal dev server
	$(COMPOSE) up -d --wait
	@mkdir -p .temporal
	@if [ -f $(TEMPORAL_PID) ] && kill -0 $$(cat $(TEMPORAL_PID)) 2>/dev/null; then \
		echo "temporal already running on 7233, ui on 8233"; \
	else \
		temporal server start-dev --db-filename $(TEMPORAL_DB) --ip 127.0.0.1 --port 7233 --ui-port 8233 > $(TEMPORAL_LOG) 2>&1 & \
		echo $$! > $(TEMPORAL_PID); \
		echo "temporal starting on 7233, ui on 8233, log in $(TEMPORAL_LOG)"; \
	fi

down: ## Stop postgres and the temporal dev server
	@if [ -f $(TEMPORAL_PID) ]; then kill $$(cat $(TEMPORAL_PID)) 2>/dev/null || true; rm -f $(TEMPORAL_PID); echo "temporal stopped"; fi
	$(COMPOSE) down

install: ## Install every workspace dependency
	pnpm install

db-build: ## Generate the prisma client and compile the built packages
	pnpm run packages:build

migrate: ## Author a migration from the schema, apply it, then rebuild the packages
	pnpm --filter @coffer/database exec prisma migrate dev
	$(MAKE) db-build

deploy: ## Apply migrations that already exist, authoring none
	pnpm --filter @coffer/database exec prisma migrate deploy

seed: ## Seed the user and a sandbox business with three months of history
	pnpm --filter @coffer/worker run seed

seed-dynamic: ## Seed from the dynamic sandbox user, so sync-new can inject transactions
	COFFER_SANDBOX_USER=dynamic pnpm --filter @coffer/worker run seed

dev: up db-build ## Run web, api and worker together
	pnpm run dev

worker: up ## Run the worker on its own
	pnpm --filter @coffer/worker run dev

api: up ## Run the api on its own
	pnpm --filter @coffer/api run dev

web: ## Run the dashboard on its own
	pnpm --filter @coffer/web run dev

sync: ## Trigger the sync workflow by hand for the newest consent
	pnpm --filter @coffer/worker run sync

sync-new: ## Inject a sandbox transaction, then trigger the sync workflow
	COFFER_INJECT_TRANSACTIONS=true pnpm --filter @coffer/worker run sync

check: ## Lint, typecheck and test
	pnpm run lint
	pnpm run typecheck
	pnpm run test

replay: ## Rebuild the normalised tables from the raw payloads
	pnpm --filter @coffer/worker run replay
