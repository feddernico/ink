PHONY: esbuild

esbuild:
	npx esbuild src/app.ts \
		--bundle \
		--minify \
		--target=es2018 \
		--outfile=dist/app.min.js
