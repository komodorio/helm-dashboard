const clusters = [{ id: "1", name: "docker-desktop" }];

const namespaces = [{ id: "1", name: "default", amount: 1 }];

function ClustersList() {
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
      {namespaces.map((namespace) => (
        <span key={namespace.id} className="flex items-center">
          <input type="checkbox" />
          <label className="ml-1">{`${namespace.name} [${namespace.amount}]`}</label>
        </span>
      ))}
    </div>
  );
}

export default ClustersList;
