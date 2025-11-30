import { useMemo, useEffect, useEffectEvent } from "react";

import RepositoriesList from "../components/repository/RepositoriesList";
import RepositoryViewer from "../components/repository/RepositoryViewer";
import { Repository } from "../data/types";
import { useGetRepositories } from "../API/repositories";
import { useParams } from "react-router";
import { useAppContext } from "../context/AppContext";
import useNavigateWithSearchParams from "../hooks/useNavigateWithSearchParams";

function RepositoryPage() {
  const { selectedRepo: repoFromParams, context } = useParams();
  const navigate = useNavigateWithSearchParams();
  const { setSelectedRepo, selectedRepo } = useAppContext();

  const handleRepositoryChanged = (selectedRepository: Repository) => {
    navigate(`/repository/${selectedRepository.name}`, {
      replace: true,
    });
  };

  useEffect(() => {
    if (repoFromParams) {
      setSelectedRepo(repoFromParams);
    }
  }, [setSelectedRepo, repoFromParams]);

  useEffect(() => {
    if (selectedRepo && !repoFromParams) {
      navigate(`/repository/${selectedRepo}`, {
        replace: true,
      });
    }
  }, [selectedRepo, repoFromParams, context, navigate]);

  const { data: repositories = [], isSuccess } = useGetRepositories();

  const onSuccess = useEffectEvent(() => {
    // TODO should we passe sorted to RepositoriesList as in ClustersList?
    const sortedData = [...repositories]?.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (sortedData && sortedData.length > 0 && !repoFromParams) {
      handleRepositoryChanged(sortedData[0]);
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
