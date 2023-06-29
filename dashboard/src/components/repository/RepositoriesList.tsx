import { useState } from "react";
import AddRepositoryModal from "../modal/AddRepositoryModal";
import { Repository } from "../../data/types";

type RepositoriesListProps = {
  selectedRepository: Repository | undefined;
  onRepositoryChanged: (selectedRepository: Repository) => void;
  repositories: Repository[];
};

function RepositoriesList({
  onRepositoryChanged,
  selectedRepository,
  repositories,
}: RepositoriesListProps) {
  const [showAddRepositoryModal, setShowAddRepositoryModal] = useState(false);

  return (
    <>
      <div className="h-fit bg-white w-2/12 flex flex-col p-3 rounded shadow-md text-[#3d4048] gap-3">
        <label className="font-bold">Repositories</label>
        <div className="flex flex-col gap-1">
          {repositories?.map((repository) => (
            <span
              className="flex items-center"
              key={repository.url}
              onClick={() => {
                onRepositoryChanged(repository);
              }}
              title={repository.url}
            >
              <input
                className="cursor-pointer"
                type="radio"
                id={repository.name}
                value={repository.name}
                checked={repository.name === selectedRepository?.name}
                name="clusters"
              />
              <label htmlFor={repository.name} className="ml-1">
                {repository.name}
              </label>
            </span>
          ))}
        </div>
        <button
          type="button"
          className="h-8 w-fit flex items-center gap-2 bg-white border border-gray-300 px-3 py-1 text-sm font-semibold"
          onClick={() => setShowAddRepositoryModal(true)}
        >
          + Add Repository
        </button>
        <p className="text-xs">
          Charts developers: you can also add local directories as chart source.
          Use <span className="text-green-600">--local-chart</span> CLI switch
          to specify it.
        </p>
      </div>
      <AddRepositoryModal
        isOpen={showAddRepositoryModal}
        onClose={() => setShowAddRepositoryModal(false)}
      />
    </>
  );
}

export default RepositoriesList;
