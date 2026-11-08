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
    void clusterChange(clusterName);
  };

  const [filterKey, setFilterKey] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when cluster context or namespace changes
  const [prevContext, setPrevContext] = useState(context);
  if (context !== prevContext) {
    setPrevContext(context);
    setCurrentPage(1);
  }

  const [prevFilteredNamespace, setPrevFilteredNamespace] =
    useState(filteredNamespace);
  if (filteredNamespace !== prevFilteredNamespace) {
    setPrevFilteredNamespace(filteredNamespace);
    setCurrentPage(1);
  }

  const offset = (currentPage - 1) * pageSize;
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

  // TODO: When backend implements pagination metadata, read 'total' from API response.
  // For now, fall back to the full list length.
  const total = filteredReleases.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const paginatedReleases = useMemo(() => {
    // TODO: When backend supports server-side pagination slicing, data will already be sliced.
    // For now, backend returns the full list, so slice client-side.
    const start = (currentPage - 1) * pageSize;
    return filteredReleases.slice(start, start + pageSize);
  }, [filteredReleases, currentPage, pageSize]);

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

        {isLoading ? (
          <div className="py-2">
            <Spinner />
          </div>
        ) : (
          <>
            <InstalledPackagesList filteredReleases={paginatedReleases} />
            <InstalledPackagesPagination
              currentPage={currentPage}
              totalItems={total}
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
