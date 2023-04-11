import { useEffect, useState } from "react";
import { Release } from "../data/types";
import { BsTerminalPlus } from "react-icons/bs";

const clusters = [{ id: "1", name: "docker-desktop" }];

type ClustersListProps = {
  installedPackages: Release[];
};

function ClustersList({ installedPackages }: ClustersListProps) {
  const [namespaces, setNamespaces] =
    useState<{ name: string; amount: number }[]>();

  useEffect(() => {
    const mapNamespaces = new Map<string, number>();

    installedPackages.forEach((release) => {
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
  }, [installedPackages]);

  return (
    <div className="bg-white flex flex-col p-2 rounded shadow-md text-[#3d4048] w-1/6 m-5">
      <label className="font-bold">Clusters</label>
      {clusters.map((cluster) => (
        <span key={cluster.id} className="flex items-center">
          <input
            type="radio"
            id={cluster.id}
            value={cluster.name}
            name="clusters"
          />
          <label className="ml-1">{cluster.name}</label>
        </span>
      ))}

      <label className="font-bold mt-4">Namespaces</label>
      {namespaces?.map((namespace) => (
        <span key={namespace.id} className="flex items-center">
          <input type="checkbox" />
          <label className="ml-1">{`${namespace.name} [${namespace.amount}]`}</label>
        </span>
      ))}
    </div>
  );
}

export default ClustersList;
