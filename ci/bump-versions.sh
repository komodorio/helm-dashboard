#!/bin/bash

WORKING_DIRECTORY="$PWD"

[ "$APP_VERSION" ] || {
  echo "ERROR: Environment variable APP_VERSION is required"
  exit 1
}

[ -z "$HELM_CHARTS_SOURCE" ] && HELM_CHARTS_SOURCE="$WORKING_DIRECTORY/charts/helm-dashboard"

sed -i -e "s/appVersion.*/appVersion: \"${APP_VERSION}\" /g" ${HELM_CHARTS_SOURCE}/Chart.yaml
CURRENT_VERSION=$(cat ${HELM_CHARTS_SOURCE}/Chart.yaml | grep 'version:' | awk '{print $2}')
NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
sed -i -e "s/${CURRENT_VERSION}/${NEW_VERSION}/g" ${HELM_CHARTS_SOURCE}/Chart.yaml
