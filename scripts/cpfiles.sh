#!/usr/bin/env bash

npx webpack
cp -r src/* docs/
cp dist/*.js docs/


