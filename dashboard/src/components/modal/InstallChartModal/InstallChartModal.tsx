import { useParams } from "react-router-dom";
import useAlertError from "../../../hooks/useAlertError";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  callApi,
  useChartReleaseValues,
  useGetVersions,
} from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { UserDefinedValues } from "./UserDefinedValues";
import { ChartValues } from "./ChartValues";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";
import { useChartRepoValues } from "../../../API/repositories";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import { VersionToInstall } from "./VersionToInstall";
import apiService from "../../../API/apiService";
import { isNewerVersion, isNoneEmptyArray } from "../../../utils";
import useCustomSearchParams from "../../../hooks/useCustomSearchParams";

interface InstallChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartName: string;
  currentlyInstalledChartVersion?: string;
  latestVersion?: string;
  isUpgrade?: boolean;
  isInstall?: boolean;
}

export const InstallChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  latestVersion,
  isUpgrade = false,
  isInstall = false,
}: InstallChartModalProps) => {
  const navigate = useNavigateWithSearchParams();
  const { setShowErrorModal } = useAlertError();
  const [userValues, setUserValues] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [diff, setDiff] = useState("");

  const {
    namespace: queryNamespace,
    chart: _releaseName,
    revision,
    context: selectedCluster,
    selectedRepo: currentRepoCtx,
  } = useParams();
  const { searchParamsObject } = useCustomSearchParams();
  const { filteredNamespace } = searchParamsObject;
  const [namespace, setNamespace] = useState(queryNamespace);
  const [releaseName, setReleaseName] = useState(
    isInstall ? chartName : _releaseName
  );

  const { error: versionsError, data: _versions } = useGetVersions(chartName, {
    select: (data) => {
      return data?.sort((a, b) =>
        isNewerVersion(a.version, b.version) ? 1 : -1
      );
    },
    onSuccess: (data) => {
      const empty = { version: "", repository: "", urls: [] };
      if (!isInstall) {
        return setSelectedVersionData(data[0] ?? empty);
      }
      const versionsToRepo = data.filter(
        (v) => v.repository === currentRepoCtx
      );
      return setSelectedVersionData(versionsToRepo[0] ?? empty);
    },
  });

  const versions = _versions?.map((v) => ({
    ...v,
    isChartVersion: v.version === currentlyInstalledChartVersion,
  }));

  latestVersion = latestVersion ?? currentlyInstalledChartVersion; // a guard for typescript, latestVersion is always defined
  const [selectedVersionData, setSelectedVersionData] = useState<{
    version: string;
    repository?: string;
    urls: string[];
  }>();

  const selectedVersion = useMemo(() => {
    return selectedVersionData?.version;
  }, [selectedVersionData]);

  const selectedRepo = useMemo(() => {
    return selectedVersionData?.repository;
  }, [selectedVersionData]);

  const chart = useMemo(() => {
    return selectedVersionData?.urls?.[0]?.startsWith("file://")
      ? selectedVersionData?.urls[0]
      : `${selectedVersionData?.repository}/${chartName}`;
  }, [selectedVersionData, chartName]);

  const {
    data: chartValues,
    isLoading: loadingChartValues,
    refetch: refetchChartValues,
  } = useChartRepoValues(namespace || "default", selectedVersion || "", chart, {
    enabled: isInstall && Boolean(selectedRepo) && selectedRepo !== "",
    onSuccess: (data) => {
      fetchDiff({ userValues: "" });
    },
  });

  const { data: releaseValues, isLoading: loadingReleaseValues } =
    useChartReleaseValues({
      namespace,
      release: String(releaseName),
      // userDefinedValue: userValues, // for key only
      revision: revision ? parseInt(revision) : undefined,
      options: {
        onSuccess: (data: string) => {
          if (data) {
            fetchDiff({ userValues: "" });
            setUserValues(data);
          }
        },
      },
    });

  useEffect(() => {
    if (selectedRepo) {
      refetchChartValues();
    }
  }, [selectedRepo, selectedVersion, namespace, chart]);

  // Confirm method (install)
  const setReleaseVersionMutation = useMutation(
    [
      "setVersion",
      namespace,
      releaseName,
      selectedVersion,
      selectedRepo,
      selectedCluster,
      chart,
    ],
    async () => {
      setErrorMessage("");
      const formData = new FormData();
      formData.append("preview", "false");
      formData.append("chart", chart);
      formData.append("version", selectedVersion || "");
      formData.append("values", userValues);
      if (isInstall) {
        formData.append("name", releaseName || "");
      }
      const res = await fetch(
        // Todo: Change to BASE_URL from env
        `/api/helm/releases/${namespace ? namespace : "default"}${
          !isInstall ? `/${releaseName}` : `/${releaseValues ? chartName : ""}` // if there is no release we don't provide anything, and we dont display version
        }`,
        {
          method: "post",
          body: formData,
          headers: {
            "X-Kubecontext": selectedCluster as string,
          },
        }
      );

      if (!res.ok) {
        setShowErrorModal({
          title: `Failed to ${isInstall ? "install" : "upgrade"} the chart`,
          msg: String(await res.text()),
        });
      }

      return res.json();
    },
    {
      onSuccess: async (response) => {
        onClose();
        if (isInstall) {
          navigate(
            `/${selectedCluster}/${response.namespace}/${response.name}/installed/revision/1`
          );
        } else {
          setSelectedVersionData({ version: "", urls: [] }); //cleanup
          navigate(
            `/${selectedCluster}/${
              namespace ? namespace : "default"
            }/${releaseName}/installed/revision/${response.version}`
          );
          window.location.reload();
        }
      },
      onError: (error) => {
        setErrorMessage((error as Error)?.message || "Failed to update");
      },
    }
  );

  const getVersionManifestFormData = useCallback(
    ({ version, userValues }: { version: string; userValues?: string }) => {
      const formData = new FormData();
      // preview needs to come first, for some reason it has a meaning at the backend
      formData.append("preview", "true");
      formData.append("chart", chart);
      formData.append("version", version);
      formData.append(
        "values",
        userValues ? userValues : releaseValues ? releaseValues : ""
      );
      if (isInstall) {
        formData.append("name", chartName);
      }
      return formData;
    },
    [userValues, chart, chartName, isInstall]
  );

  // It actually fetches the manifest for the diffs
  const fetchVersionData = async ({
    version,
    userValues,
  }: {
    version: string;
    userValues?: string;
  }) => {
    const formData = getVersionManifestFormData({ version, userValues });
    const fetchUrl = `/api/helm/releases/${
      namespace ? namespace : isInstall ? "" : "[empty]"
    }${
      !isInstall
        ? `/${releaseName}`
        : `${releaseValues ? chartName : !namespace ? "default" : ""}`
    }`; // if there is no release we don't provide anything, and we dont display version;
    try {
      setErrorMessage("");
      const data = await callApi(fetchUrl, {
        method: "post",
        body: formData,
      });
      return data;
    } catch (e) {
      setErrorMessage((e as Error).message as string);
    }
  };

  const fetchDiff = async ({ userValues }: { userValues: string }) => {
    if (!selectedRepo || versionsError) {
      return;
    }

    const currentVersion = currentlyInstalledChartVersion;

    setIsLoadingDiff(true);
    try {
      const [currentVerData, selectedVerData] = await Promise.all([
        currentVersion
          ? fetchVersionData({ version: currentVersion, userValues })
          : Promise.resolve({ manifest: "" }),
        fetchVersionData({ version: selectedVersion || "", userValues }),
      ]);
      const formData = new FormData();

      formData.append("a", isInstall ? "" : currentVerData.manifest);
      formData.append("b", selectedVerData.manifest);

      const response = await apiService.fetchWithDefaults("/diff", {
        method: "post",
        body: formData,
      });
      const diff = await response.text();
      setDiff(diff);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDiff(false);
    }
  };

  useEffect(() => {
    if (
      selectedVersion &&
      ((!isInstall && !loadingReleaseValues) ||
        (isInstall && !loadingChartValues)) &&
      selectedRepo
    ) {
      fetchDiff({ userValues });
    }
  }, [selectedVersion, userValues, loadingReleaseValues, selectedRepo]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersionData({ version: "", urls: [] });
        if (!isInstall) {
          setUserValues(releaseValues);
          fetchDiff({ userValues: releaseValues });
        }
        onClose();
      }}
      title={
        <div className="font-bold">
          {`${
            isUpgrade || (!isUpgrade && !isInstall) ? "Upgrade" : "Install"
          } `}
          {(isUpgrade || releaseValues || isInstall) && (
            <span className="text-green-700 ">{chartName}</span>
          )}
        </div>
      }
      containerClassNames="w-full text-2xl h-2/3"
      actions={[
        {
          id: "1",
          callback: setReleaseVersionMutation.mutate,
          variant: ModalButtonStyle.info,
          isLoading: setReleaseVersionMutation.isLoading,
          disabled:
            (isInstall && loadingChartValues) ||
            (!isInstall && loadingReleaseValues) ||
            isLoadingDiff ||
            setReleaseVersionMutation.isLoading,
        },
      ]}
    >
      {versions && isNoneEmptyArray(versions) && (
        <VersionToInstall
          versions={versions}
          initialVersion={selectedVersionData}
          onSelectVersion={setSelectedVersionData}
          isInstall={isInstall}
        />
      )}

      <GeneralDetails
        releaseName={releaseName ?? ""}
        disabled={isUpgrade || (!isUpgrade && !isInstall)}
        namespace={namespace ? namespace : filteredNamespace}
        onReleaseNameInput={setReleaseName}
        onNamespaceInput={setNamespace}
      />
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues
          initialValue={releaseValues}
          setValues={(val) => {
            setUserValues(val);
            fetchDiff({ userValues: val });
          }}
        />

        <ChartValues
          chartValues={chartValues}
          loading={isInstall ? loadingChartValues : loadingReleaseValues}
        />
      </div>

      <ManifestDiff
        diff={diff}
        isLoading={
          isLoadingDiff ||
          (isInstall ? loadingChartValues : loadingReleaseValues)
        }
        error={errorMessage || (versionsError as string)}
      />
    </Modal>
  );
};
