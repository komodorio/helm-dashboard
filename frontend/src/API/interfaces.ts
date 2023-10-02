export interface HelmRepository {
  name: string;
  url: string;
}

export interface ChartVersion {
  name: string;
  version: string;
}

export interface K8sContext {
  name: string;
}

export interface K8sResource {
  kind: string;
  name: string;
  namespace: string;
}

export interface Scanner {
  id: string;
  name: string;
  type: string;
}

export interface ScanResult {
  scannerType: string;
  result: string;
}

export interface ScannersList {
  scanners: Scanner[];
}

export interface ScanResults {
  [scannerType: string]: ScanResult;
}

export interface ApplicationStatus {
  Analytics: boolean;
  CacheHitRatio: number;
  ClusterMode: boolean;
  CurVer: string;
  LatestVer: string;
}

export interface KubectlContexts {
  contexts: string[];
}

export interface K8sResourceList {
  items: K8sResource[];
}

export type HelmRepositories = Repository[];

export interface ChartList {
  charts: Chart[];
}

export interface LatestChartVersion {
  name: string;
  version: string;
  app_version: string;
  description: string;
  installed_namespace: string;
  installed_name: string;
  repository: string;
  urls: string[];
  isSuggestedRepo: boolean;
}

export interface ChartVersions {
  versions: string[];
}

export interface ValuesYamlText {
  content: string;
}

export interface Repository {
  name: string;
  url: string;
}

export interface Chart {
  name: string;
  repo: string;
  version: string;
  appVersion: string;
  description: string;
  created: string;
  digest: string;
  urls: string[];
  icon: string;
}
