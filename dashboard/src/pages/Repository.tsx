import React from "react";
import RepositoriesList from "../components/repository/RepositoriesList";
import RepositoryViewer from "../components/repository/RepositoryViewer";

function Repository() {
  return (
    <div className="flex flex-row">
      <RepositoriesList />
            <div className="p-5 w-4/5">
              <RepositoryViewer/>
            </div>
    </div>
  );
}

export default Repository;
