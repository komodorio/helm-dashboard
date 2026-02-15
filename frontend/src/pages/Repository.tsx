import { useMemo, useEffect, useCallback } from "react";
import { type NavigateOptions, useParams } from "react-router";

import { useGetRepositories } from "../API/repositories";
import RepositoriesList from "../components/repository/RepositoriesList";
import RepositoryViewer from "../components/repository/RepositoryViewer";
import { useAppContext } from "../context/AppContext";
import type { Repository } from "../data/types";
import useNavigateWithSearchParams from "../hooks/useNavigateWithSearchParams";

function RepositoryPage() {
  const { selectedRepo: repoFromParams, context } = useParams();
  const navigate = useNavigateWithSearchParams();
  const { setSelectedRepo } = useAppContext();

  const navigateTo = useCallback(
    async (url: string, ...restArgs: NavigateOptions[]) => {
      await navigate(url, ...restArgs);
    },
    [navigate]
  );

  const handleRepositoryChanged = (selectedRepository: Repository) => {
    void navigateTo(`/repository/${selectedRepository.name}`, {
      replace: true,
    });
  };

  useEffect(() => {
    if (repoFromParams) {
      setSelectedRepo(repoFromParams);
    }
  }, [setSelectedRepo, repoFromParams]);
  const { data: repositories = [], isSuccess } = useGetRepositories();

  useEffect(() => {
    if (repositories.length && isSuccess && !repoFromParams) {
      const firstRepo = repositories[0];
      void navigateTo(`/repository/${firstRepo.name}`, { replace: true });
    }
  }, [repositories, isSuccess, repoFromParams, context, navigateTo]);

  const selectedRepository = useMemo(() => {
    if (repoFromParams) {
      return repositories?.find((repo) => repo.name === repoFromParams);
    }
  }, [repositories, repoFromParams]);

  return (
    <div className="flex flex-row gap-4 p-5">
      <RepositoriesList
        repositories={repositories}
        onRepositoryChanged={handleRepositoryChanged}
        selectedRepository={selectedRepository}
      />
      <div className="w-[calc(100%-21rem)]">
        <RepositoryViewer repository={selectedRepository} />
      </div>
    </div>
  );
}

export default RepositoryPage;
