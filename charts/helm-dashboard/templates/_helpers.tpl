{{/*
Expand the name of the chart.
*/}}
{{- define "helm-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "helm-dashboard.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- $fullname := default (ternary .Release.Name (printf "%s-%s" .Release.Name $name) (contains $name .Release.Name)) .Values.fullnameOverride }}
{{- $fullname | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "helm-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "helm-dashboard.labels" -}}
helm.sh/chart: {{ include "helm-dashboard.chart" . }}
{{ include "helm-dashboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "helm-dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "helm-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "helm-dashboard.serviceAccountName" -}}
{{- default (.Values.serviceAccount.create | ternary (include "helm-dashboard.fullname" .) "default") .Values.serviceAccount.name }}
{{- end }}

{{/*
Return the proper image Registry Secret Names
*/}}
{{- define "helm-dashboard.imagePullSecrets" -}}
{{ include "common.images.pullSecrets" (dict "images" (list .Values.image) "global" .Values.global) }}
{{- end -}}


{{/*
Return the proper image name
*/}}
{{- define "helm-dashboard.image" -}}
{{- $image := .Values.image -}}
{{- $tag := default .Chart.AppVersion $image.tag -}}
{{- $_ := set $image "tag" $tag -}}
{{ include "common.images.image" (dict "imageRoot" $_ "global" .Values.global) }}
{{- end -}}

{{/*
Return the proper image name
*/}}
{{- define "test.image" -}}
{{ include "common.images.image" (dict "imageRoot" .Values.testImage "global" .Values.global) }}
{{- end -}}