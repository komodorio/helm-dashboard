import { useQuery, UseQueryOptions, useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useGetInstalledReleases(options?: UseQueryOptions<InstalledReleases[]>) {
  return useQuery<InstalledReleases[]>(['installedReleases'], () => callApi<InstalledReleases[]>('/api/helm/releases'), options);
}

// Install new release
function useInstallRelease(options?: UseMutationOptions<void, unknown, InstallReleaseRequest>) {
  return useMutation<void, unknown, InstallReleaseRequest>((request) => {
    const formData = new FormData();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    return callApi<void>('/api/helm/releases/{ns}', {
      method: 'POST',
      body: formData,
    });
  }, options);
}

// Upgrade/reconfigure existing release
function useUpgradeRelease(options?: UseMutationOptions<void, unknown, UpgradeReleaseRequest>) {
  return useMutation<void, unknown, UpgradeReleaseRequest>((request) => {
    const formData = new FormData();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    return callApi<void>('/api/helm/releases/{ns}/{name}', {
      method: 'POST',
      body: formData,
    });
  }, options);
}

// Get revision history for release
function useGetReleaseRevisions(ns: string, name: string, options?: UseQueryOptions<ReleaseRevisions>) {
  return useQuery<ReleaseRevisions>(['releaseRevisions', ns, name], () => callApi<ReleaseRevisions>(`/api/helm/releases/${ns}/${name}/history`), options);
}

/**
// Get manifest for release
function useGetManifest(ns: string, name: string, revision?: string, revisionDiff?: string, options?: UseQueryOptions<ManifestText>) {
  const queryParams = new URLSearchParams({ revision, revisionDiff }).toString();
  return useQuery<ManifestText>(['manifest', ns, name], () => callApi<ManifestText>(`/api/helm/releases/${ns}/${name}/manifest?${queryParams}`), options);
}

const queryParams = new URLSearchParams({ revision, revisionDiff, userDefined: userDefined ? 'true' : undefined }).toString();
  return useQuery<ValuesYamlText>(['values', ns, name], () => callApi<ValuesYamlText>(`/api/helm/releases/${ns}/${name}/values?${queryParams}`), options);
}

// Get textual notes for release
function useGetNotes(ns: string, name: string, revision?: string, revisionDiff?: string, options?: UseQueryOptions<NotesText>) {
  const queryParams = new URLSearchParams({ revision, revisionDiff }).toString();
  return useQuery<NotesText>(['notes', ns, name], () => callApi<NotesText>(`/api/helm/releases/${ns}/${name}/notes?${queryParams}`), options);
}

// List of installed k8s resources for this release
function useGetResources(ns: string, name: string, health?: boolean, options?: UseQueryOptions<StructuredResources>) {
  const queryParams = new URLSearchParams({ health: health ? 'true' : undefined }).toString();
  return useQuery<StructuredResources>(['resources', ns, name], () => callApi<StructuredResources>(`/api/helm/releases/${ns}/${name}/resources?${queryParams}`), options);
}
 */

// Rollback the release to a previous revision
function useRollbackRelease(options?: UseMutationOptions<void, unknown, { ns: string; name: string; revision: number }>) {
  return useMutation<void, unknown, { ns: string; name: string; revision: number }>(({ ns, name, revision }) => {
    const formData = new FormData();
    formData.append('revision', revision.toString());

    return callApi<void>(`/api/helm/releases/${ns}/${name}/rollback`, {
      method: 'POST',
      body: formData,
    });
  }, options);
}

// Run the tests on a release
function useTestRelease(options?: UseMutationOptions<void, unknown, { ns: string; name: string }>) {
  return useMutation<void, unknown, { ns: string; name: string }>(({ ns, name }) => {
    return callApi<void>(`/api/helm/releases/${ns}/${name}/test`, {
      method: 'POST',
    });
  }, options);
}



// Request objects
interface InstallReleaseRequest {
    name: string;
    chart: string;
    version?: string;
    values?: string;
    preview?: boolean;
  }
  
  interface UpgradeReleaseRequest {
    name: string;
    chart: string;
    version?: string;
    values?: string;
    preview?: boolean;
  }
  
  // Response objects
  export interface InstalledReleases {
    id: string;
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
  }
  
  interface ReleaseRevisions {}
  
  interface ManifestText {}
  
  interface ValuesYamlText {}
  
  interface NotesText {}
  
  interface StructuredResources {}

export async function callApi<T>(url: string, options?: RequestInit): Promise<T> {
  const baseUrl = "http://localhost:8080";
  const response = await fetch(baseUrl + url, options);
  
    if (!response.ok) {
      throw new Error(`An error occurred while fetching data: ${response.statusText}`);
    }
  
    const data = await response.json();
    return data;
  }
  