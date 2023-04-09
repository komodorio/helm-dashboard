import { useState } from "react";
import InstalledPackagesHeader from "../components/InstalledPackagesArea.tsx/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackagesArea.tsx/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { InstalledPackage } from "../data/types";

const currentPackage = {
  image:
    "https://bitnami.com/assets/stacks/argo-cd/img/argo-cd-stack-220x234.png",
  version: "0.1.0",
  name: "airflow",
  revision: 1,
  lastUpdated: "9d",
  description:
    "Apache Airflow is a tool th express and execute workflows as directed acyclic graphs (DAGs) it",
};

function Installed() {
  const [installedPackages, setInstalledPackages] = useState<
    InstalledPackage[]
  >([currentPackage, currentPackage]);

  return (
    <div className="flex flex-row">
      <ClustersList />
      <div className="p-5 w-4/5">
        <InstalledPackagesHeader installedPackages={installedPackages} />

        <InstalledPackagesList
          installedPackages={installedPackages}
          setInstalledPackages={setInstalledPackages}
        />
      </div>
    </div>
  );
}

export default Installed;
