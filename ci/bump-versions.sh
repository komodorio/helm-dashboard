#!/bin/bash

WORKING_DIRECTORY="$PWD"

# Update version and appVersion for Helm charts
[ -z "$HELM_CHARTS_SOURCE" ] && HELM_CHARTS_SOURCE="$WORKING_DIRECTORY/charts/helm-dashboard"

[ -z "$APP_VERSION" ] && {
  APP_VERSION=$(cat ${HELM_CHARTS_SOURCE}/Chart.yaml | grep 'appVersion:' | awk -F'"' '{print $2}')
}

sed -i -e "s/appVersion.*/appVersion: \"${APP_VERSION}\" /g" ${HELM_CHARTS_SOURCE}/Chart.yaml
CURRENT_VERSION=$(cat ${HELM_CHARTS_SOURCE}/Chart.yaml | grep 'version:' | awk '{print $2}')
NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
sed -i -e "s/${CURRENT_VERSION}/${NEW_VERSION}/g" ${HELM_CHARTS_SOURCE}/Chart.yaml

# Update tag and commit details for App logger
sed -i -e "s/.*version = .*/    version = \"${APP_VERSION}\"/g" ${WORKING_DIRECTORY}/main.go
sed -i -e "s/.*commit  = .*/    commit = \"${TAG_SHA}\"/g" ${WORKING_DIRECTORY}/main.go
sed -i -e "s/.*date    .*/    date = \"${TAG_DATE}\"/g" ${WORKING_DIRECTORY}/main.go