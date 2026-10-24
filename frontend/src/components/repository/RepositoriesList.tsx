import {
  POPULAR_REPOSITORIES,
  type SuggestedRepository,
} from "../../data/popularRepositories";
import type { Repository } from "../../data/types";
import useCustomSearchParams from "../../hooks/useCustomSearchParams";
import AddRepositoryModal from "../modal/AddRepositoryModal";
import { InstallRepoChartModal } from "../modal/InstallChartModal/InstallRepoChartModal";

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
  const showAddRepositoryModal = searchParamsObject["add_repo"] === "true";
  const setShowAddRepositoryModal = (value: boolean) => {
    if (value) {
      upsertSearchParams("add_repo", "true");
    } else {
      removeSearchParam("add_repo");
      removeSearchParam("repo_name");
      removeSearchParam("repo_url");
    }
  };
  const showInstallURLModal = searchParamsObject["install_url"] === "true";
  const setShowInstallURLModal = (value: boolean) => {
    if (value) {
      upsertSearchParams("install_url", "true");
    } else {
      removeSearchParam("install_url");
    }
  };

  const installedRepoUrls = new Set(
    repositories?.map((r) => r.url.toLowerCase().replace(/\/$/, "")) ?? []
  );
  const installedRepoNames = new Set(
    repositories?.map((r) => r.name.toLowerCase()) ?? []
  );

  const suggestedRepos = POPULAR_REPOSITORIES.filter(
    (preset: SuggestedRepository) =>
      !installedRepoNames.has(preset.name.toLowerCase()) &&
      !installedRepoUrls.has(preset.url.toLowerCase().replace(/\/$/, ""))
  );

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
        <button
          data-cy="install-url-button"
          type="button"
          className="flex h-8 w-fit cursor-pointer items-center gap-2 rounded-sm border border-gray-300 px-3 py-1 text-sm font-semibold text-muted"
          onClick={() => setShowInstallURLModal(true)}
        >
          Install from URL
        </button>

        {suggestedRepos.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Popular Suggestions
            </span>
            <div className="mt-2 flex flex-col gap-2">
              {suggestedRepos.slice(0, 4).map((suggested) => (
                <div
                  key={suggested.name}
                  className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-1.5 text-xs"
                >
                  <span
                    className="truncate font-medium text-gray-700"
                    title={suggested.description}
                  >
                    {suggested.name}
                  </span>
                  <button
                    type="button"
                    data-cy={`quick-add-${suggested.name}`}
                    onClick={() => {
                      upsertSearchParams("repo_name", suggested.name);
                      upsertSearchParams("repo_url", suggested.url);
                      upsertSearchParams("add_repo", "true");
                    }}
                    className="cursor-pointer rounded border border-sky-600 px-2 py-0.5 text-[11px] font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
      <InstallRepoChartModal
        isOpen={showInstallURLModal}
        onClose={() => setShowInstallURLModal(false)}
        chartName=""
        urlMode
      />
    </>
  );
}

export default RepositoriesList;
