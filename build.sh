#!/bin/bash

cd /tmp/clubhouse
npm install
npm test
npx esbuild src/index.js --bundle --platform=node --target=node24 --format=cjs --outfile=dist/index.js
