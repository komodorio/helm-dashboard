import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { Release } from "../data/types";
import { useQuery } from "@tanstack/react-query";
import apiService from "../API/apiService";
import { useGetInstalledReleases } from "../API/releases";

function Installed() {
  const { data: installedReleases } = useGetInstalledReleases()

  debugger;
  return (
    <div className="flex flex-row">
      <ClustersList installedReleases={installedReleases} />
      <div className="p-5 w-4/5">
        <InstalledPackagesHeader installedPackages={installedReleases} />

        <InstalledPackagesList installedReleases={installedReleases} />
      </div>
    </div>
  );
}

export default Installed;
