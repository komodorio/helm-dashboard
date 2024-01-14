import { useMemo } from "react";
import AddRepositoryModal from "../modal/AddRepositoryModal";
import { Repository } from "../../data/types";
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
      <div className="h-fit bg-white w-72 flex flex-col p-3 rounded custom-shadow text-dark gap-3">
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
          className="h-8 w-fit flex items-center gap-2 border rounded text-muted border-gray-300 px-3 py-1 text-sm font-semibold"
          onClick={() => setShowAddRepositoryModal(true)}
        >
          + Add Repository
        </button>
        <p className="text-xs">
          Charts developers: you can also add local directories as chart source.
          Use{" "}
          <span className="text-green-600 font-monospace">--local-chart</span>{" "}
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
