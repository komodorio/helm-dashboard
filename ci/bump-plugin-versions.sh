#!/bin/bash

WORKING_DIRECTORY="$PWD"

[ -z "$APP_VERSION" ] && {
  APP_VERSION=$(cat ${WORKING_DIRECTORY}/plugin.yaml | grep 'version:' | awk -F'"' '{print $2}')
}

sed -i -e "s/version: .*/version: \"${APP_VERSION}\" /g" ${WORKING_DIRECTORY}/plugin.yaml
