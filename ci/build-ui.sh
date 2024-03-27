#!/bin/bash -e

WORKING_DIRECTORY="$PWD"

cd "$WORKING_DIRECTORY/dashboard"

npm i
npm run build

cp -a "$WORKING_DIRECTORY/dashboard/static/" "$WORKING_DIRECTORY/pkg/dashboard/static/"