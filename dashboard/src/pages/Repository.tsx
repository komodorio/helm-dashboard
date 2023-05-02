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
    <div className="flex flex-row">
      <RepositoriesList
        onRepositoryChanged={handleRepositoryChanged}
        selectedRepository={selectedRepository}
      />
      <div className="p-5 w-4/5">
        <RepositoryViewer repository={selectedRepository} />
      </div>
    </div>
  );
}

export default RepositoryPage;
