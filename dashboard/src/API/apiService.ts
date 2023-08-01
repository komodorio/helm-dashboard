import {
  Chart,
  ChartVersion,
  Release,
  ReleaseHealthStatus,
  ReleaseRevision,
  Repository,
} from "../data/types"
import { QueryFunctionContext } from "@tanstack/react-query"
interface ClustersResponse {
  AuthInfo: string
  Cluster: string
  IsCurrent: boolean
  Name: string
  Namespace: string
}
class ApiService {
  currentCluster = ""
  constructor(protected readonly isMockMode: boolean = false) {}

  setCluster = (cluster: string) => {
    this.currentCluster = cluster
  }

  public fetchWithDefaults = async (url: string, options?: RequestInit) => {
    if (this.currentCluster) {
      const headers = new Headers(options?.headers)
      if (!headers.has("X-Kubecontext")) {
        headers.set("X-Kubecontext", this.currentCluster)
      }
      return fetch(url, { ...options, headers })
    }
    return fetch(url, options)
  }
  getToolVersion = async () => {
    const response = await fetch(`/status`)
    const data = await response.json()
    return data
  }

  getRepositoryLatestVersion = async (repositoryName: string) => {
    const response = await this.fetchWithDefaults(
      `/api/helm/repositories/latestver?name=${repositoryName}`
    )
    const data = await response.json()
    return data
  }

  getInstalledReleases = async () => {
    const response = await this.fetchWithDefaults(`/api/helm/releases`)
    const data = await response.json()
    return data
  }

  getClusters = async () => {
    const response = await fetch(`/api/k8s/contexts`)
    const data = (await response.json()) as ClustersResponse[]
    return data
  }

  getNamespaces = async () => {
    const response = await this.fetchWithDefaults(`/api/k8s/namespaces/list`)
    const data = await response.json()
    return data
  }

  getRepositories = async () => {
    const response = await this.fetchWithDefaults(`/api/helm/repositories`)
    const data = await response.json()
    return data
  }

  getRepositoryCharts = async ({
    queryKey,
  }: QueryFunctionContext<Chart[], Repository>) => {
    const [, repository] = queryKey
    const response = await this.fetchWithDefaults(
      `/api/helm/repositories/${repository}`
    )
    const data = await response.json()
    return data
  }

  getChartVersions = async ({
    queryKey,
  }: QueryFunctionContext<ChartVersion[], Chart>) => {
    const [, chart] = queryKey

    const response = await this.fetchWithDefaults(
      `/api/helm/repositories/versions?name=${chart.name}`
    )
    const data = await response.json()
    return data
  }

  getResourceStatus = async ({
    release,
  }: {
    release: Release
  }): Promise<ReleaseHealthStatus[] | null> => {
    if (!release) return null

    const response = await this.fetchWithDefaults(
      `/api/helm/releases/${release.namespace}/${release.name}/resources?health=true`
    )
    const data = await response.json()
    return data
  }

  getReleasesHistory = async ({
    queryKey,
  }: QueryFunctionContext<Release[], Release>): Promise<ReleaseRevision[]> => {
    const [, params] = queryKey

    if (!params.namespace || !params.chart) return []

    const response = await this.fetchWithDefaults(
      `/api/helm/releases/${params.namespace}/${params.chart}/history`
    )
    const data = await response.json()

    return data
  }

  getValues = async ({ queryKey }: any) => {
    const [, params] = queryKey
    const { namespace, chart, version } = params

    if (!namespace || !chart || !chart.name || version === undefined)
      return Promise.reject(new Error("missing parameters"))

    const url = `/api/helm/repositories/values?chart=${namespace}/${chart.name}&version=${version}`
    const response = await this.fetchWithDefaults(url)
    const data = await response.text()

    return data
  }
}

const apiService = new ApiService()

export default apiService
