.PHONY: build watch test test-qunit test-cypress update-repomix

build:
	npm run build

watch:
	npm run watch

test: test-qunit test-cypress

test-qunit:
	npm run test:qunit

test-cypress:
	npm run test:cypress

update-repomix:
	npx repomix@latest