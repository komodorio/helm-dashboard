import { Chart, ChartVersion, Repository } from "../data/types";
import mockData from "./mockData";
import { QueryFunctionContext } from "@tanstack/react-query";

class ApiService {
  constructor(
    protected readonly baseUrl: string,
    protected readonly isMockMode: boolean = false
  ) {}

  getToolVersion = async () => {
    if (this.isMockMode) return mockData.status;
    const response = await fetch(`${this.baseUrl}/status`);
    const data = await response.json();
    return data;
  };

  getRepositoryLatestVersion = async (repositoryName: string) => {
    if (this.isMockMode) return mockData.repositoriesLatestVersion[0];
    const response = await fetch(
      `${this.baseUrl}/api/helm/repositories/latestver?name=${repositoryName}`
    );
    const data = await response.json();
    return data;
  };

  getInstalledReleases = async () => {
    if (this.isMockMode) return mockData.installedReleases;
    const response = await fetch(`${this.baseUrl}/api/helm/releases`);
    const data = await response.json();
    return data;
  };

  getClusters = async () => {
    if (this.isMockMode) return mockData.clusters;
    const response = await fetch(`${this.baseUrl}/api/k8s/contexts`);
    const data = await response.json();
    return data;
  };

  getNamespaces = async () => {
    if (this.isMockMode) return mockData.namespaces;
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
      `${this.baseUrl}/api/helm/repositories/${repository.name}`
    );
    const data = await response.json();
    return data;
  };

  getChartVersions = async ({
    queryKey,
  }: QueryFunctionContext<ChartVersion[], Chart>) => {
    const [_, chart] = queryKey;

    console.log(chart);

    const response = await fetch(
      `${this.baseUrl}/api/helm/repositories/versions?name=${chart.name}`
    );
    const data = await response.json();
    return data;
  };
}

const apiService = new ApiService("http://localhost:8080");

export default apiService;
