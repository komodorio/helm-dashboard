import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { useGetInstalledReleases } from "../API/releases";
import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";

function Installed() {
  const [selectedCluster, setSelectedCluster] = useState<string>();
  const [filterKey, setFilterKey] = useState<string>("");
  const { data: installedReleases, isLoading, refetch }  = useGetInstalledReleases(selectedCluster || "", {retry: false});

  useEffect(() => { refetch() }, [selectedCluster])

  return (
    <div className="flex flex-row">
      <ClustersList selectedCluster={selectedCluster} setSelectedCluster={setSelectedCluster} installedReleases={installedReleases} />
      <div className="p-5 w-4/5">
        <InstalledPackagesHeader isLoading={isLoading} installedPackages={installedReleases} setFilterKey={setFilterKey} />

        {isLoading ? (
          <Spinner />
        ) : (
          <InstalledPackagesList installedReleases={installedReleases} filterKey={filterKey} />
        )}
      </div>
    </div>
  );
}

export default Installed;
