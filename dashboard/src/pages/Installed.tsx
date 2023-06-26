import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { useGetInstalledReleases } from "../API/releases";
import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import useAlertError from "../hooks/useAlertError";

function Installed() {
  const [selectedCluster, setSelectedCluster] = useState<string>();
  const [filterKey, setFilterKey] = useState<string>("");
  const { data, isLoading, refetch, isRefetching }  = useGetInstalledReleases(selectedCluster || "", {retry: false});
  const a = useAlertError()
  
  useEffect(() => { 
    refetch().then(e => {}).catch(e => a.setShowErrorModal({
      title: "Unable to load installed packages",
      msg: e.message
    }))
   }, [selectedCluster])

  return (
    <div className="flex flex-row">
      <ClustersList selectedCluster={selectedCluster} setSelectedCluster={setSelectedCluster} installedReleases={data} />
      <div className="p-5 w-4/5">
        <InstalledPackagesHeader isLoading={isLoading || isRefetching} installedPackages={data} setFilterKey={setFilterKey} />

        {isLoading || isRefetching ? (
          <Spinner />
        ) : (
          <InstalledPackagesList installedReleases={data} filterKey={filterKey} />
        )}
      </div>
    </div>
  );
}

export default Installed;
