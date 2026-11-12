.PHONY: install dev dev-down dev-logs dev-clean db-up db-down db-migrate db-reset run test lint format build help

COMPOSE_FILE := docker-compose.yml
DB_SERVICE   := postgres
DB_USER      := taskd
DB_NAME      := taskd

# === Helpers ================================================================
define _wait_for_db
	@echo "▶ Waiting for PostgreSQL..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do \
		if docker compose -f $(COMPOSE_FILE) exec -T $(DB_SERVICE) pg_isready -U $(DB_USER) -d $(DB_NAME) >/dev/null 2>&1; then \
			echo "  ✅ Database ready on port 5432"; exit 0; \
		fi; \
		printf '.'; sleep 1; \
	done; \
	echo "  ❌ Database not ready after 15s — check 'make dev-logs'"; exit 1
endef

# === Bootstrap & Local Dev ==================================================
bootstrap: install dev

install:
	@echo "▶ Installing dependencies with pnpm..."
	pnpm install
	@if [ ! -f .env ]; then cp .env.example .env && echo "  ✅ .env created from .env.example"; fi

dev: db-up
	@echo ""
	@echo "   Starting NestJS in watch mode..."
	@echo "   API:     http://localhost:3000/api/v1"
	@echo "   Swagger: http://localhost:3000/api/docs"
	@echo ""
	pnpm start:dev

dev-down:
	docker compose -f $(COMPOSE_FILE) down

dev-logs:
	docker compose -f $(COMPOSE_FILE) logs -f

# Full wipe — containers, networks, AND volumes (DESTROYS DB data)
dev-clean:
	@echo "⚠️  Removing containers, networks, AND volumes..."
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	@echo "✅ Cleaned. Run 'make dev' to start fresh."

# === Database ===============================================================
db-up:
	@echo "▶ Starting PostgreSQL container..."
	docker compose -f $(COMPOSE_FILE) up -d $(DB_SERVICE)
	$(call _wait_for_db)

db-down:
	docker compose -f $(COMPOSE_FILE) stop $(DB_SERVICE)

db-migrate:
	@echo "▶ Applying SQL migrations..."
	@for file in migrations/*.sql; do \
		echo "  -> Executing $$file"; \
		docker compose -f $(COMPOSE_FILE) exec -T $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME) < "$$file"; \
	done
	@echo "✅ Migrations applied!"

db-reset: dev-clean db-up
	@echo "✅ Database wiped and re-initialized from migrations/"

db-shell:
	docker compose -f $(COMPOSE_FILE) exec $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME)

# === Code Quality & Testing =================================================
run:
	pnpm start:dev

build:
	pnpm build

lint:
	pnpm lint

format:
	pnpm format

test:
	pnpm test

test-cov:
	pnpm test:cov

# === Help ===================================================================
help:
	@echo ""
	@echo "TaskD - Identity Service — Available Commands"
	@echo "=============================================="
	@echo ""
	@echo "  First-time setup:"
	@echo "  make bootstrap    Install deps, copy .env, start DB & run server"
	@echo ""
	@echo "  Day-to-day development:"
	@echo "  make dev          Start PostgreSQL + NestJS server (watch mode)"
	@echo "  make dev-down     Stop all containers"
	@echo "  make dev-logs     Tail container logs"
	@echo "  make dev-clean    Wipe containers & volumes (DESTROYS DB data)"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  make db-up        Start only PostgreSQL container"
	@echo "  make db-down      Stop PostgreSQL container"
	@echo "  make db-migrate   Run all SQL files in migrations/"
	@echo "  make db-reset     Destroy DB volume and recreate from scratch"
	@echo "  make db-shell     Open interactive psql terminal"
	@echo ""
	@echo "  Quality & Tests:"
	@echo "  make test         Run unit tests"
	@echo "  make test-cov     Run tests with coverage report"
	@echo "  make lint         Check code style"
	@echo "  make format       Auto-format code"
	@echo ""
