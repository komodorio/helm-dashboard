import { useMemo } from "react";
import AddRepositoryModal from "../modal/AddRepositoryModal";
import type { Repository } from "../../data/types";
import useCustomSearchParams from "../../hooks/useCustomSearchParams";

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
  const { searchParamsObject, upsertSearchParams, removeSearchParam } =
    useCustomSearchParams();
  const showAddRepositoryModal = useMemo(
    () => searchParamsObject["add_repo"] === "true",
    [searchParamsObject]
  );
  const setShowAddRepositoryModal = (value: boolean) => {
    if (value) {
      upsertSearchParams("add_repo", "true");
    } else {
      removeSearchParam("add_repo");
    }
  };

  return (
    <>
      <div className="custom-shadow flex h-fit w-72 flex-col gap-3 rounded-sm bg-white p-3 text-dark">
        <label className="font-bold">Repositories</label>
        <div className="flex flex-col gap-1">
          {repositories?.map((repository) => (
            <span
              className="flex items-center"
              key={repository.url + repository.name}
              title={repository.url}
            >
              <input
                onChange={() => {
                  onRepositoryChanged(repository);
                }}
                className="cursor-pointer"
                type="radio"
                id={repository.name}
                value={repository.name}
                checked={repository.name === selectedRepository?.name}
                name="clusters"
              />
              <label htmlFor={repository.name} className="ml-1 text-sm">
                {repository.name}
              </label>
            </span>
          ))}
        </div>
        <button
          data-cy="install-repository-button"
          type="button"
          style={{ marginTop: "10px" }}
          className="flex h-8 w-fit cursor-pointer items-center gap-2 rounded-sm border border-gray-300 px-3 py-1 text-sm font-semibold text-muted"
          onClick={() => setShowAddRepositoryModal(true)}
        >
          + Add Repository
        </button>
        <p className="text-xs">
          Charts developers: you can also add local directories as chart source.
          Use{" "}
          <span className="font-monospace text-green-600">--local-chart</span>{" "}
          CLI switch to specify it.
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
