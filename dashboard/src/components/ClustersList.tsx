const clusters = [
  { id: "1", name: "docker-desktop" },
  { id: "2", name: "docker-desktop2" },
];

const namespaces = [
  { id: "1", name: "default", amount: 1 },
  { id: "2", name: "docker-desktop2", amount: 2 },
];

function ClustersList() {
  return (
    <div className="bg-white flex flex-col m-2">
      <label className="font-bold">Clusters</label>
      {clusters.map((cluster) => (
        <span className="flex items-center">
          <input
            key={cluster.id}
            type="radio"
            id={cluster.id}
            value={cluster.name}
            name="clusters"
          />
          <label className="ml-1">{cluster.name}</label>
        </span>
      ))}

      <label className="font-bold">Namespaces</label>
      {namespaces.map((namespace) => (
        <span className="flex items-center">
          <input key={namespace.id} type="checkbox" />
          <label className="ml-1">{`${namespace.name} [${namespace.amount}]`}</label>
        </span>
      ))}
    </div>
  );
}

export default ClustersList;
