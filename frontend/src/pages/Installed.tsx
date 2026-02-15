import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";

import { useGetInstalledReleases } from "../API/releases";
import ClustersList from "../components/ClustersList";
import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import Spinner from "../components/Spinner";
import type { Release } from "../data/types";
import useAlertError from "../hooks/useAlertError";
import useCustomSearchParams from "../hooks/useCustomSearchParams";

function Installed() {
  const { searchParamsObject } = useCustomSearchParams();
  const { context } = useParams();
  const { filteredNamespace } = searchParamsObject;
  const selectedNamespaces = useMemo(
    () => filteredNamespace?.split("+"),
    [filteredNamespace]
  );
  const navigate = useNavigate();

  const clusterChange = async (clusterName: string) => {
    await navigate({
      pathname: `/${encodeURIComponent(clusterName)}/installed`,
    });
  };

  const handleClusterChange = (clusterName: string) => {
    void clusterChange(clusterName);
  };

  const [filterKey, setFilterKey] = useState<string>("");
  const alertError = useAlertError();
  const { data, isLoading, isRefetching, isError, error } =
    useGetInstalledReleases(context ?? "");

  const onError = useEffectEvent(() => {
    alertError.setShowErrorModal({
      title: "Failed to get list of charts",
      msg: error?.message ?? "",
    });
  });

  useEffect(() => {
    if (isError) {
      onError();
    }
  }, [isError]);

  const filteredReleases = useMemo(() => {
    return (
      data?.filter((installedPackage: Release) => {
        if (filterKey) {
          const {
            namespace: releaseNamespace,
            name: releaseName,
            chartName,
          } = installedPackage;

          const shownByNS =
            !selectedNamespaces ||
            !selectedNamespaces.length ||
            selectedNamespaces.includes(releaseNamespace);
          const shownByStr =
            releaseName.includes(filterKey) || chartName.includes(filterKey);
          if (shownByNS && shownByStr) {
            return true;
          } else {
            return false;
          }
        } else {
          return selectedNamespaces
            ? selectedNamespaces.includes(installedPackage.namespace)
            : true;
        }
      }) ?? []
    );
  }, [data, filterKey, selectedNamespaces]);

  return (
    <div className="flex w-full flex-row">
      <ClustersList
        selectedCluster={context ?? ""}
        filteredNamespaces={selectedNamespaces}
        onClusterChange={handleClusterChange}
        installedReleases={data}
      />

      <div className="w-[calc(100%-17rem)] p-5">
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
