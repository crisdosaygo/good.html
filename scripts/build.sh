#!/usr/bin/env sh

rm -rf dist/ 
mkdir -p dist/
npx rollup -c vv.rollup.config.js
cat dist/vv.bundle.bang.js src/bang.js > src/cat.bang.js
npx webpack -c webpack.config.js
rm dist/vv.bundle.bang.js
rm src/cat.bang.js
cp dist/bang.js docs/bang.js
cp dist/bang.js 7guis/bang.js


