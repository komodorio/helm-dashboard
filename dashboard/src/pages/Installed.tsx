import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { useGetInstalledReleases } from "../API/releases";
import { useEffect, useMemo, useState } from "react";
import Spinner from "../components/Spinner";
import useAlertError from "../hooks/useAlertError";
import { useNavigate, useParams } from "react-router-dom";
import useCustomSearchParams from "../hooks/useCustomSearchParams";
import { Release } from "../data/types";

function Installed() {
  const { searchParamsObject } = useCustomSearchParams();
  const { context } = useParams();
  const { filteredNamespace } = searchParamsObject;
  const namespaces = filteredNamespace?.split("+") ?? [];
  const navigate = useNavigate();


  const handleClusterChange = (
    clusterName: string,
    namespaces: string[] = []
  ) => {
    navigate(
      `/installed/${clusterName}?&filteredNamespace=${
        namespaces.length > 0
          ? `${namespaces.map((ns) => ns).join("+")}`
          : "default"
      }`
    );
  };

  const [filterKey, setFilterKey] = useState<string>("");
  const alertError = useAlertError();
  const { data, isLoading, isRefetching } = useGetInstalledReleases(
    context ?? "",
    {
      retry: false,
      onError: (e) => {
        alertError.setShowErrorModal({
          title: "Failed to get list of charts",
          msg: (e as Error).message,
        });
      },
    }
  );

  const filteredReleases = useMemo(() => {
    return (
      data?.filter(
        (installedPackage: Release) =>
          installedPackage.name.includes(filterKey) &&
          namespaces.includes(installedPackage.namespace)
      ) ?? []
    );
  }, [data, filterKey, namespaces]);

  return (
    <div className="flex flex-row">
      <ClustersList
        selectedCluster={context ?? ""}
        filteredNamespaces={namespaces}
        onClusterChange={handleClusterChange}
        installedReleases={data}
      />
      <div className="p-5 w-4/5">
        <InstalledPackagesHeader
          isLoading={isLoading || isRefetching}
          filteredReleases={filteredReleases}
          setFilterKey={setFilterKey}
        />

        {isLoading || isRefetching ? (
          <div className="py-2">
            <Spinner />
          </div>
        ) : (
          <InstalledPackagesList filteredReleases={filteredReleases} />
        )}
      </div>
    </div>
  );
}

export default Installed;
