import { useEffect, useState } from "react";
import { Cluster, Release } from "../data/types";
import apiService from "../API/apiService";
import { useQuery } from "@tanstack/react-query";

type ClustersListProps = {
  installedReleases: Release[] | undefined;
};

function ClustersList({ installedReleases }: ClustersListProps) {
  const [namespaces, setNamespaces] =
    useState<{ name: string; amount: number }[]>();

  const { data: clusters } = useQuery<Cluster[]>({
    queryKey: ["clusters"],
    queryFn: apiService.getClusters,
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
    <div className="bg-white flex flex-col p-2 rounded shadow-md text-[#3d4048] w-1/6 m-5">
      <label className="font-bold">Clusters</label>
      {clusters?.map((cluster) => (
        <span key={cluster.Name} className="flex items-center">
          <input
            type="radio"
            id={cluster.Name}
            value={cluster.Name}
            name="clusters"
          />
          <label className="ml-1">{cluster.Name}</label>
        </span>
      ))}

      <label className="font-bold mt-4">Namespaces</label>
      {namespaces?.map((namespace) => (
        <span key={namespace.name} className="flex items-center">
          <input type="checkbox" />
          <label className="ml-1">{`${namespace.name} [${namespace.amount}]`}</label>
        </span>
      ))}
    </div>
  );
}

export default ClustersList;
