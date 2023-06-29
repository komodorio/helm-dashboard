import { Chart, ChartVersion, Release, Repository } from "../data/types";
import { QueryFunctionContext } from "@tanstack/react-query";

class ApiService {
  constructor(
    protected readonly baseUrl: string,
    protected readonly isMockMode: boolean = false
  ) {}

  getToolVersion = async () => {
    const response = await fetch(`${this.baseUrl}/status`);
    const data = await response.json();
    return data;
  };

  getRepositoryLatestVersion = async (repositoryName: string) => {
    const response = await fetch(
      `${this.baseUrl}/api/helm/repositories/latestver?name=${repositoryName}`
    );
    const data = await response.json();
    return data;
  };

  getInstalledReleases = async () => {
    const response = await fetch(`${this.baseUrl}/api/helm/releases`);
    const data = await response.json();
    return data;
  };

  getClusters = async () => {
    const response = await fetch(`${this.baseUrl}/api/k8s/contexts`);
    const data = await response.json();
    return data;
  };

  getNamespaces = async () => {
    const response = await fetch(`${this.baseUrl}/api/k8s/namespaces/list`);
    const data = await response.json();
    return data;
  };

  getRepositories = async () => {
    const response = await fetch(`${this.baseUrl}/api/helm/repositories`);
    const data = await response.json();
    return data;
  };

  getRepositoryCharts = async ({
    queryKey,
  }: QueryFunctionContext<Chart[], Repository>) => {
    const [_, repository] = queryKey;

    const response = await fetch(
      `${this.baseUrl}/api/helm/repositories/${repository}`
    );
    const data = await response.json();
    return data;
  };

  getChartVersions = async ({
    queryKey,
  }: QueryFunctionContext<ChartVersion[], Chart>) => {
    const [_, chart] = queryKey;

    const response = await fetch(
      `${this.baseUrl}/api/helm/repositories/versions?name=${chart.name}`
    );
    const data = await response.json();
    return data;
  };

  getReleasesHistory = async ({
    queryKey,
  }: QueryFunctionContext<Release[], Release>) => {
    const [_, params] = queryKey;
  
    if (!params.namespace || !params.chart) return null;

    const response = await fetch(
      `${this.baseUrl}/api/helm/releases/${params.namespace}/${params.chart}/history`
    );
    const data = await response.json();

    return data;
  };

  getValues = async ({ queryKey }: any) => {
    const [_, params] = queryKey;
    const { namespace, chart, version } = params;

    if (!namespace || !chart || !chart.name || version === undefined)
      return Promise.reject(new Error("missing parameters"));

    const url = `${this.baseUrl}/api/helm/repositories/values?chart=${namespace}/${chart.name}&version=${version}`;
    const response = await fetch(url);
    const data = await response.text();

    return data;
  };
}

let baseURL = "";

if (import.meta.env.DEV) {
  baseURL = "http://localhost:8080";
}

const apiService = new ApiService(baseURL);

export default apiService;
