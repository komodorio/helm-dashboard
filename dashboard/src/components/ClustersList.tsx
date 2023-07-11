import { useMemo } from "react";
import { Cluster, Release } from "../data/types";
import apiService from "../API/apiService";
import { useQuery } from "@tanstack/react-query";
import useCustomSearchParams from "../hooks/useCustomSearchParams";
import { useAppContext } from "../context/AppContext";

type ClustersListProps = {
  onClusterChange: (clusterName: string) => void;
  selectedCluster: string;
  filteredNamespaces: string[];
  installedReleases?: Release[];
};

function getCleanClusterName(rawClusterName: string) {
  if (rawClusterName.indexOf("arn") === 0) {
    // AWS cluster
    const clusterSplit = rawClusterName.split(":");
    const clusterName = clusterSplit.slice(-1)[0].replace("cluster/", "");
    const region = clusterSplit.at(-3);
    return region + "/" + clusterName + " [AWS]";
  }

  if (rawClusterName.indexOf("gke") === 0) {
    // GKE cluster
    return (
      rawClusterName.split("_").at(-2) +
      "/" +
      rawClusterName.split("_").at(-1) +
      " [GKE]"
    );
  }

  return rawClusterName;
}

function ClustersList({
  installedReleases,
  selectedCluster,
  filteredNamespaces,
  onClusterChange,
}: ClustersListProps) {
  const { upsertSearchParams, removeSearchParam } = useCustomSearchParams();
  const { clusterMode } = useAppContext();

  const { data: clusters } = useQuery<Cluster[]>({
    queryKey: ["clusters", selectedCluster],
    queryFn: apiService.getClusters,
    onSuccess(data) {
      const sortedData = data?.sort((a, b) =>
        getCleanClusterName(a.Name).localeCompare(getCleanClusterName(b.Name))
      );

      if (sortedData && sortedData.length > 0 && !selectedCluster) {
        onClusterChange(sortedData[0].Name);
      }
    },
  });

  const namespaces = useMemo(() => {
    const mapNamespaces = new Map<string, number>();

    installedReleases?.forEach((release) => {
      const amount = mapNamespaces.get(release.namespace) ?? 1;
      mapNamespaces.set(release.namespace, amount);
    });

    return Array.from(mapNamespaces, ([key, value]) => ({
      id: crypto.randomUUID(),
      name: key,
      amount: value,
    }));
  }, [installedReleases]);

  const onNamespaceChange = (namespace: string) => {
    const newSelectedNamespaces = filteredNamespaces?.includes(namespace)
      ? filteredNamespaces?.filter((ns) => ns !== namespace)
      : [...(filteredNamespaces ?? []), namespace];
    removeSearchParam("filteredNamespace");
    if (newSelectedNamespaces.length > 0) {
      upsertSearchParams(
        "filteredNamespace",
        newSelectedNamespaces.map((ns) => ns).join("+")
      );
    }
  };

  return (
    <div className="bg-white flex flex-col p-2 rounded shadow-md text-[#3d4048] w-48 m-5 h-fit pb-4 drop-shadow">
      {!clusterMode ? (
        <>
          <label className="font-bold">Clusters</label>
          {clusters
            ?.sort((a, b) =>
              getCleanClusterName(a.Name).localeCompare(
                getCleanClusterName(b.Name)
              )
            )
            ?.map((cluster) => {
              return (
                <span
                  key={cluster.Name}
                  className="flex items-center mt-2 text-xs"
                >
                  <input
                    className="cursor-pointer"
                    onChange={(e) => {
                      onClusterChange(e.target.value);
                    }}
                    type="radio"
                    id={cluster.Name}
                    value={cluster.Name}
                    checked={cluster.Name == selectedCluster}
                    name="clusters"
                  />
                  <label htmlFor={cluster.Name} className="ml-1 ">
                    {getCleanClusterName(cluster.Name)}
                  </label>
                </span>
              );
            })}
        </>
      ) : null}

      <label className="font-bold mt-4">Namespaces</label>
      {namespaces
        ?.sort((a, b) => a.name.localeCompare(b.name))
        ?.map((namespace) => (
          <span key={namespace.name} className="flex items-center mt-2 text-xs">
            <input
              type="checkbox"
              id={namespace.name}
              onChange={(event) => {
                onNamespaceChange(event.target.value);
              }}
              value={namespace.name}
            />
            <label
              htmlFor={namespace.name}
              className="ml-1"
            >{`${namespace.name} [${namespace.amount}]`}</label>
          </span>
        ))}
    </div>
  );
}

export default ClustersList;
