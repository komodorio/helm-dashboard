import { Chart, ChartVersion, Repository } from "../data/types";
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
