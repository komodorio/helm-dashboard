import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { useGetInstalledReleases } from "../API/releases";
import { useState } from "react";
import Spinner from "../components/Spinner";

function Installed() {
  const [selectedCluster, setSelectedCluster] = useState<string>();
  const { data: installedReleases, isLoading } = useGetInstalledReleases();

  return (
    <div className="flex flex-row">
      <ClustersList selectedCluster={selectedCluster} setSelectedCluster={setSelectedCluster} installedReleases={installedReleases} />
      <div className="p-5 w-4/5">
        <InstalledPackagesHeader installedPackages={installedReleases} />

        {isLoading ? (
          <Spinner />
        ) : (
          <InstalledPackagesList installedReleases={installedReleases} />
        )}
      </div>
    </div>
  );
}

export default Installed;
