import { useEffect, useState } from "react";
import { Cluster, Release } from "../data/types";
import apiService from "../API/apiService";
import { useQuery } from "@tanstack/react-query";

type ClustersListProps = {
  setSelectedCluster: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedCluster: string | undefined;
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
  setSelectedCluster,
}: ClustersListProps) {
  const [namespaces, setNamespaces] =
    useState<{ name: string; amount: number }[]>();

  const { data: clusters } = useQuery<Cluster[]>({
    queryKey: ["clusters"],
    queryFn: apiService.getClusters,
    onSuccess(data) {
      const sortedData = data?.sort((a, b) => a.Name.localeCompare(b.Name));

      if (sortedData && sortedData.length > 0 && !selectedCluster) {
        setSelectedCluster(sortedData[0].Name);
      }
    },
  });

  useEffect(() => {
    const mapNamespaces = new Map<string, number>();

    installedReleases?.forEach((release) => {
      if (mapNamespaces.has(release.namespace)) {
        const amount = mapNamespaces.get(release.namespace) ?? 0 + 1;
        mapNamespaces.set(release.namespace, amount);
      } else {
        mapNamespaces.set(release.namespace, 1);
      }
    });

    const tempNamespaces = Array.from(mapNamespaces, ([key, value]) => ({
      id: crypto.randomUUID(),
      name: key,
      amount: value,
    }));

    setNamespaces(tempNamespaces);
  }, [installedReleases]);

  return (
    <div className="bg-white flex flex-col p-2 rounded shadow-md text-[#3d4048] w-1/6 m-5 h-fit">
      <label className="font-bold">Clusters</label>
      {clusters
        ?.sort((a, b) =>
          getCleanClusterName(a.Name).localeCompare(getCleanClusterName(b.Name))
        )
        ?.map((cluster, i) => (
          <span key={cluster.Name} className="flex items-center">
            <input
              className="cursor-pointer"
              onChange={(e) => setSelectedCluster(e.target.value)}
              type="radio"
              id={cluster.Name}
              value={cluster.Name}
              checked={cluster.Name == selectedCluster}
              name="clusters"
            />
            <label htmlFor={cluster.Name} className="ml-1">
              {getCleanClusterName(cluster.Name)}
            </label>
          </span>
        ))}

      <label className="font-bold mt-4">Namespaces</label>
      {namespaces
        ?.sort((a, b) => a.name.localeCompare(b.name))
        ?.map((namespace) => (
          <span key={namespace.name} className="flex items-center">
            <input type="checkbox" id={namespace.name} />
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
