import { useState } from "react";
import AddRepositoryModal from "../modal/AddRepositoryModal";
import { Repository } from "../../data/types";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../API/apiService";

type RepositoriesListProps = {
  selectedRepository: Repository | undefined;
  onRepositoryChanged: (selectedRepository: Repository) => void;
};

function RepositoriesList({
  onRepositoryChanged,
  selectedRepository,
}: RepositoriesListProps) {
  const [showAddRepositoryModal, setShowAddRepositoryModal] = useState(false);

  const { data: repositories } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: apiService.getRepositories,
    onSuccess: (data: Repository[]) => {
      onRepositoryChanged(data[0]);
    },
  });

  return (
    <>
      <div className="bg-white flex flex-col p-2 rounded shadow-md text-[#3d4048] w-1/6 m-5 gap-3">
        <label className="font-bold">Repositories</label>
        <div className="flex flex-col gap-1">
          {repositories
            ?.sort((a, b) => a.name.localeCompare(b.name))
            .map((repository) => (
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
          className="bg-white border border-gray-300 p-1 self-start"
          onClick={() => setShowAddRepositoryModal(true)}
        >
          + Add Repository
        </button>
        <p className="text-sm">
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
