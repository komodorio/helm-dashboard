import {
  Chart,
  ChartVersion,
  Release,
  ReleaseHealthStatus,
  ReleaseRevision,
  Repository,
} from "../data/types";
import { type QueryFunctionContext } from "@tanstack/react-query";
interface ClustersResponse {
  AuthInfo: string;
  Cluster: string;
  IsCurrent: boolean;
  Name: string;
  Namespace: string;
}
class ApiService {
  currentCluster = "";
  constructor(protected readonly isMockMode: boolean = false) {}

  setCluster = (cluster: string) => {
    this.currentCluster = cluster;
  };

  public async fetchWithDefaults<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    let response;

    if (this.currentCluster) {
      const headers = new Headers(options?.headers);
      if (!headers.has("X-Kubecontext")) {
        headers.set("X-Kubecontext", this.currentCluster);
      }
      response = await fetch(url, { ...options, headers });
    } else {
      response = await fetch(url, options);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    let data;
    if (!response.headers.get("Content-Type")) {
      return {} as T;
    } else if (response.headers.get("Content-Type")?.includes("text/plain")) {
      data = await response.text();
    } else {
      data = await response.json();
    }
    return data;
  }

  getToolVersion = async () => {
    const response = await fetch("/status");
    const data = await response.json();
    return data;
  };

  getRepositoryLatestVersion = async (repositoryName: string) => {
    const data = await this.fetchWithDefaults(
      `/api/helm/repositories/latestver?name=${repositoryName}`
    );
    return data;
  };

  getInstalledReleases = async () => {
    const data = await this.fetchWithDefaults("/api/helm/releases");
    return data;
  };

  getClusters = async () => {
    const response = await fetch("/api/k8s/contexts");
    const data = (await response.json()) as ClustersResponse[];
    return data;
  };

  getNamespaces = async () => {
    const data = await this.fetchWithDefaults("/api/k8s/namespaces/list");
    return data;
  };

  getRepositories = async () => {
    const data = await this.fetchWithDefaults("/api/helm/repositories");
    return data;
  };

  getRepositoryCharts = async ({
    queryKey,
  }: QueryFunctionContext<Chart[], Repository>) => {
    const [, repository] = queryKey;
    const data = await this.fetchWithDefaults(
      `/api/helm/repositories/${repository}`
    );
    return data;
  };

  getChartVersions = async ({
    queryKey,
  }: QueryFunctionContext<ChartVersion[], Chart>) => {
    const [, chart] = queryKey;

    const data = await this.fetchWithDefaults(
      `/api/helm/repositories/versions?name=${chart.name}`
    );
    return data;
  };

  getResourceStatus = async ({
    release,
  }: {
    release: Release;
  }): Promise<ReleaseHealthStatus[] | null> => {
    if (!release) return null;

    const data = await this.fetchWithDefaults<
      Promise<ReleaseHealthStatus[] | null>
    >(
      `/api/helm/releases/${release.namespace}/${release.name}/resources?health=true`
    );
    return data;
  };

  getReleasesHistory = async ({
    queryKey,
  }: QueryFunctionContext<Release[], Release>): Promise<ReleaseRevision[]> => {
    const [, params] = queryKey;

    if (!params.namespace || !params.chart) return [];

    const data = await this.fetchWithDefaults<ReleaseRevision[]>(
      `/api/helm/releases/${params.namespace}/${params.chart}/history`
    );

    return data;
  };

  getValues = async ({
    queryKey,
  }: {
    queryKey: [
      string,
      { namespace: string; chart: { name: string }; version: number }
    ];
  }) => {
    const [, params] = queryKey;
    const { namespace, chart, version } = params;

    if (!namespace || !chart || !chart.name || version === undefined)
      return Promise.reject(new Error("missing parameters"));

    const url = `/api/helm/repositories/values?chart=${namespace}/${chart.name}&version=${version}`;
    const data = await this.fetchWithDefaults(url);

    return data;
  };
}

const apiService = new ApiService();

export default apiService;
