#!/usr/bin/env sh

rm -rf dist/ 
mkdir -p dist/
rollup -c vv.rollup.config.js
cat dist/vv.bundle.bang.js src/bang.js > dist/cat.bang.js
npx webpack -c webpack.config.js
rm dist/vv.bundle.bang.js
rm dist/cat.bang.js
cp dist/bang.js docs/bang.js


