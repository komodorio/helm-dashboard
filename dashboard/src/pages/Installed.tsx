import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { useGetInstalledReleases } from "../API/releases";
import { useMemo, useState } from "react";
import Spinner from "../components/Spinner";
import useAlertError from "../hooks/useAlertError";
import { useParams, useNavigate } from "react-router-dom";
import useCustomSearchParams from "../hooks/useCustomSearchParams";
import { Release } from "../data/types";

function Installed() {
  const { searchParamsObject, upsertSearchParams } = useCustomSearchParams();
  const { context } = useParams();
  const { filteredNamespace } = searchParamsObject;
  const namespaces = filteredNamespace?.split("+") ?? ["default"];
  const navigate = useNavigate();

  const handleClusterChange = (
    clusterName: string,
    clusterNamespaces: string[] = []
  ) => {
    const newSearchParams = upsertSearchParams(
      "filteredNamespace",
      clusterNamespaces.length > 0
        ? `${clusterNamespaces.map((ns) => ns).join("+")}`
        : "default"
    );
    navigate({
      pathname: `/${clusterName}/installed`,
      search: newSearchParams.toString(),
    });
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
      data?.filter((installedPackage: Release) => {
        return (
          installedPackage.name.includes(filterKey) ||
          (installedPackage.namespace.includes(filterKey) &&
            namespaces.includes(installedPackage.namespace))
        );
      }) ?? []
    );
  }, [data, filterKey, namespaces]);

  return (
    <div className="flex flex-row w-full">
      <ClustersList
        selectedCluster={context ?? ""}
        filteredNamespaces={namespaces}
        onClusterChange={handleClusterChange}
        installedReleases={data}
      />

      <div className="p-5 w-[calc(100%-17rem)]">
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
