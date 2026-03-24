.PHONY: help build watch test test-qunit test-cypress update-repomix

help:
	@echo "Available targets:"
	@echo "  build          - Build the project"
	@echo "  watch          - Watch for changes and rebuild"
	@echo "  test           - Run all tests (QUnit and Cypress)"
	@echo "  test-qunit     - Run QUnit tests"
	@echo "  test-cypress   - Run Cypress tests"
	@echo "  repomix        - Update repomix to the latest version"

build:
	@echo "Building the project..."
	npm run build

watch:
	@echo "Watching for changes..."
	npm run watch

test: test-qunit test-cypress

test-qunit:
	@echo "Running QUnit tests..."
	npm run test:qunit

test-cypress:
	@echo "Running Cypress tests..."
	npm run test:cypress

repomix:
	@echo "Updating repomix to the latest version..."
	npx repomix@latest