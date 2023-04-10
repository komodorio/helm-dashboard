export type Chart = {
  name: string;
  home: string;
  sources: string[];
  version: string;
  description: string;
  keywords: string[];
  maintainers: {
    name: string;
    url: string;
  }[];
  icon: string;
  apiVersion: string;
  appVersion: string;
  annotations: {
    category: string;
    licenses: string;
  };
  dependencies: {
    name: string;
    version: string;
    repository: string;
    condition?: string;
    tags?: string[];
  }[];
  urls: string[];
  created: string;
  digest: string;
};

export type Release = {
  name: string;
  namespace: string;
  revision: string;
  updated: string;
  status: string;
  chart: string;
  chartName: string;
  chartVersion: string;
  app_version: string;
  icon: string;
  description: string;
};

export type Repository = {
  name: string;
  url: string;
};

export type InstalledPackage = {
  id:string;
  image: string;
  version: string;
  name: string;
  revision: number;
  lastUpdated: string;
  description: string;
}

