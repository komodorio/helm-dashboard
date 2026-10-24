import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";

import { useGetInstalledReleases } from "../API/releases";
import ClustersList from "../components/ClustersList";
import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import InstalledPackagesPagination from "../components/InstalledPackages/InstalledPackagesPagination";
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
    setCurrentPage(1);
    void clusterChange(clusterName);
  };

  const [filterKey, setFilterKey] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / pageSize));
  const effectiveCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const offset = (effectiveCurrentPage - 1) * pageSize;
  const limit = pageSize;

  const alertError = useAlertError();
  const { data, isLoading, isRefetching, isError, error } =
    useGetInstalledReleases({
      context: context ?? "",
      offset,
      limit,
    });

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

  const filteredTotalPages = Math.max(
    1,
    Math.ceil(filteredReleases.length / pageSize)
  );
  const activePage = Math.min(
    Math.max(1, effectiveCurrentPage),
    filteredTotalPages
  );

  // TODO: When backend implements pagination metadata, extract 'total' from the API response
  // (e.g. data.total or 'X-Total-Count' header). For now, assume total is data.length or filteredReleases.length.
  const paginatedReleases = useMemo(() => {
    // TODO: When backend supports server-side pagination slicing, data will already be sliced.
    // For now, backend returns the full list, so slice client-side.
    const start = (activePage - 1) * pageSize;
    return filteredReleases.slice(start, start + pageSize);
  }, [filteredReleases, activePage, pageSize]);

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
          setFilterKey={(key) => {
            setFilterKey(key);
            setCurrentPage(1);
          }}
        />

        {isLoading || isRefetching ? (
          <div className="py-2">
            <Spinner />
          </div>
        ) : (
          <>
            <InstalledPackagesList filteredReleases={paginatedReleases} />
            <InstalledPackagesPagination
              currentPage={activePage}
              totalItems={filteredReleases.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Installed;
