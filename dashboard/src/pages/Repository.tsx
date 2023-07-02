import React, { useMemo } from "react";

import RepositoriesList from "../components/repository/RepositoriesList";
import RepositoryViewer from "../components/repository/RepositoryViewer";
import { Repository } from "../data/types";
import { useGetRepositories } from "../API/repositories";
import { HelmRepositories } from "../API/interfaces";
import { useParams, useNavigate } from "react-router-dom";

function RepositoryPage() {
  const { selectedRepo: repoFromParams, context } = useParams();
  const navigate = useNavigate();
  const handleRepositoryChanged = (selectedRepository: Repository) => {
    navigate(`/repository/${context}/${selectedRepository.name}`, { replace: true });
  };

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
      <div className="w-10/12">
        <RepositoryViewer repository={selectedRepository} />
      </div>
    </div>
  );
}

export default RepositoryPage;
