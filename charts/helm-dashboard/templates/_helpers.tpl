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
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
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
{{- if .Values.serviceAccount.create }}
{{- default (include "helm-dashboard.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
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
{{- $tag := .Chart.AppVersion -}}
{{- if $image.tag -}}
{{- $tag = $image.tag -}}
{{- end -}}
{{- $_ := set $image "tag" $tag -}}
{{ include "common.images.image" (dict "imageRoot" $_ "global" .Values.global) }}
{{- end -}}

{{/*
Return the proper image name
*/}}
{{- define "test.image" -}}
{{ include "common.images.image" (dict "imageRoot" .Values.testImage "global" .Values.global) }}
{{- end -}}