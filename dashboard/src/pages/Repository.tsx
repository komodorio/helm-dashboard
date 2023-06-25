import React, { useState } from "react";
import RepositoriesList from "../components/repository/RepositoriesList";
import RepositoryViewer from "../components/repository/RepositoryViewer";
import { Repository } from "../data/types";

function RepositoryPage() {
  const [selectedRepository, setSelectedRepository] = useState<Repository>();

  const handleRepositoryChanged = (selectedRepository: Repository) => {
    setSelectedRepository(selectedRepository);
  };

  return (
    <div className="flex flex-row m-5 gap-4">
      <RepositoriesList
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
