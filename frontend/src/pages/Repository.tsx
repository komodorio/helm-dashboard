import { useMemo, useEffect } from "react";

import RepositoriesList from "../components/repository/RepositoriesList";
import RepositoryViewer from "../components/repository/RepositoryViewer";
import { Repository } from "../data/types";
import { useGetRepositories } from "../API/repositories";
import { HelmRepositories } from "../API/interfaces";
import { useParams } from "react-router-dom";
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

  const { data: repositories = [] } = useGetRepositories({
    onSuccess: (data: HelmRepositories) => {
      const sortedData = data?.sort((a, b) => a.name.localeCompare(b.name));

      if (sortedData && sortedData.length > 0 && !repoFromParams) {
        handleRepositoryChanged(sortedData[0]);
      }
    },
  });

  const selectedRepository = useMemo(() => {
    if (repoFromParams) {
      return repositories?.find((repo) => repo.name === repoFromParams);
    }
  }, [repositories, repoFromParams]);

  return (
    <div className="flex flex-row p-5 gap-4">
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
