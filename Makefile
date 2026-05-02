.PHONY: help build up down test lint migrate health

help:
	@echo "Guelma Guide - Development Tools"
	@echo ""
	@echo "Usage:"
	@echo "  make build        Build all docker containers"
	@echo "  make up           Start the development environment"
	@echo "  make down         Stop the development environment"
	@echo "  make test         Run all tests (frontend & backend)"
	@echo "  make lint         Run all linters"
	@echo "  make migrate      Run backend migrations"
	@echo "  make health       Check API health"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

test:
	@echo "Running backend tests..."
	cd backend && pytest
	@echo "Running frontend tests..."
	npm test

lint:
	@echo "Linting backend..."
	cd backend && flake8 .
	@echo "Linting frontend..."
	npm run lint

migrate:
	docker-compose exec api alembic upgrade head

health:
	curl http://localhost:8000/api/v1/health
