import { useMemo } from "react";
import { Cluster, Release } from "../data/types";
import apiService from "../API/apiService";
import { useQuery } from "@tanstack/react-query";
import useCustomSearchParams from "../hooks/useCustomSearchParams";
import { useAppContext } from "../context/AppContext";
import { v4 as uuidv4 } from "uuid";

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

      if (selectedCluster) {
        const cluster = data.find(
          (cluster) => getCleanClusterName(cluster.Name) === selectedCluster
        );
        if (!filteredNamespaces && cluster?.Namespace) {
          upsertSearchParams("filteredNamespace", cluster.Namespace);
        }
      }
    },
  });

  const namespaces = useMemo(() => {
    const mapNamespaces = new Map<string, number>();

    installedReleases?.forEach((release) => {
      const amount = mapNamespaces.get(release.namespace)
        ? Number(mapNamespaces.get(release.namespace)) + 1
        : 1;
      mapNamespaces.set(release.namespace, amount);
    });

    return Array.from(mapNamespaces, ([key, value]) => ({
      id: uuidv4(),
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
    <div className="bg-white flex flex-col p-2 rounded custom-shadow text-cluster-list w-48 m-5 h-fit pb-4 custom-">
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
                  className="data-cy-clusterName flex items-center mt-2 text-xs"
                >
                  <input
                    className="cursor-pointer data-cy-clustersInput"
                    onChange={(e) => {
                      onClusterChange(e.target.value);
                    }}
                    type="radio"
                    id={cluster.Name}
                    value={cluster.Name}
                    checked={cluster.Name === selectedCluster}
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
              checked={
                filteredNamespaces
                  ? filteredNamespaces.includes(namespace.name)
                  : false
              }
            />
            <label
              htmlFor={namespace.name}
              className="data-cy-clusterList-namespace ml-1"
            >{`${namespace.name} [${namespace.amount}]`}</label>
          </span>
        ))}
    </div>
  );
}

export default ClustersList;
