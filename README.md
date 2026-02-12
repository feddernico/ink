# ink
Ink is a functional and minimalistic webapp to write documents in markdown and export them.

## Repo Structure

the structure of the repo is as follows:

```
src/
  app.ts  (The app logic in Typescript)
  styles.scss  (The app styles, in SCSS)
dist/
  app.min.js 
  styles.min.css
ink-app.html  (The single page, inline <style> and <script>)
build/
  inject.js
```


## Building process

The workflow followed to build the app takes advantage of `esbuild` and `sass`.

A Makefile helps keeping the building process simple, with a simple command to rebuild the app.

The webapp is released as a single HTML file.
