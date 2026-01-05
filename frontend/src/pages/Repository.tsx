import { useMemo, useEffect, useEffectEvent, useCallback } from "react";

import RepositoriesList from "../components/repository/RepositoriesList";
import RepositoryViewer from "../components/repository/RepositoryViewer";
import type { Repository } from "../data/types";
import { useGetRepositories } from "../API/repositories";
import { type NavigateOptions, useParams } from "react-router";
import { useAppContext } from "../context/AppContext";
import useNavigateWithSearchParams from "../hooks/useNavigateWithSearchParams";

function RepositoryPage() {
  const { selectedRepo: repoFromParams, context } = useParams();
  const navigate = useNavigateWithSearchParams();
  const { setSelectedRepo, selectedRepo } = useAppContext();

  const navigateTo = useCallback(
    async (url: string, ...restArgs: NavigateOptions[]) => {
      await navigate(url, ...restArgs);
    },
    [navigate]
  );

  const handleRepositoryChanged = (selectedRepository: Repository) => {
    void navigateTo(
      context
        ? `/${encodeURIComponent(context)}/repository/${selectedRepository.name}`
        : `/repository/${selectedRepository.name}`,
      { replace: true }
    );
  };

  useEffect(() => {
    if (repoFromParams) {
      setSelectedRepo(repoFromParams);
    }
  }, [setSelectedRepo, repoFromParams]);

  useEffect(() => {
    if (selectedRepo && !repoFromParams) {
      void navigateTo(
        context
          ? `/${encodeURIComponent(context)}/repository/${selectedRepo}`
          : `/repository/${selectedRepo}`,
        { replace: true }
      );
    }
  }, [selectedRepo, repoFromParams, context, navigateTo]);

  const { data: repositories = [], isSuccess } = useGetRepositories();

  const onSuccess = useEffectEvent(() => {
    if (repositories && repositories.length && !repoFromParams) {
      handleRepositoryChanged(repositories[0]);
    }
  });

  useEffect(() => {
    if (repositories.length && isSuccess) {
      onSuccess();
    }
  }, [repositories, isSuccess]);

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
