import { useState } from "react";
import AddRepositoryModal from "../modal/AddRepositoryModal";
import { Repository } from "../../data/types";
import { useGetRepositories } from "../../API/repositories";
import { HelmRepositories } from "../../API/interfaces";

type RepositoriesListProps = {
  selectedRepository: Repository | undefined;
  onRepositoryChanged: (selectedRepository: Repository) => void;
};

function RepositoriesList({
  onRepositoryChanged,
  selectedRepository,
}: RepositoriesListProps) {
  const [showAddRepositoryModal, setShowAddRepositoryModal] = useState(false);

  const { data: repositories } = useGetRepositories({
    onSuccess: (data: HelmRepositories) => {
      const sortedData = data?.sort((a, b) => a.name.localeCompare(b.name));

      if (sortedData && sortedData.length > 0 && !selectedRepository) {
        onRepositoryChanged(sortedData[0]);
      }
    },
  });

  return (
    <>
      <div className="bg-white w-2/12 flex flex-col p-6 rounded shadow-md text-[#3d4048] gap-3">
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
                id={repository.url}
                value={repository.name}
                checked={repository.url === selectedRepository?.url}
                name="clusters"
              />
              <label className="ml-1">{repository.name}</label>
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
