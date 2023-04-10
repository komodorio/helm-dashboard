import React from "react";

const repositories = [
  { id: "1", name: "bitnami" },
  { id: "2", name: "bitnami-2" },
  { id: "3", name: "bitnami-3" },
];

function RepositoriesList() {
  return (
    <div className="bg-white flex flex-col p-2 rounded shadow-md text-[#3d4048] w-1/6 m-5 gap-3">
      <label className="font-bold">Repositories</label>
      {repositories.map((repository) => (
        <span className="flex items-center" key={repository.id}>
          <input
            type="radio"
            id={repository.id}
            value={repository.name}
            name="clusters"
          />
          <label className="ml-1">{repository.name}</label>
        </span>
      ))}
      <button type="button"  className="bg-white border border-gray-300 p-1 self-start">+ Add Repository</button>
      <p className="text-xs">
        Charts developers: you can also add local directories as chart source.
        Use <span className="text-green-600">--local-chart</span> CLI switch to
        specify it.
      </p>
    </div>
  );
}

export default RepositoriesList;
