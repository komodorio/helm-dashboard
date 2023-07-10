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

interface InstallChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartName: string;
  chartVersion: string;
  latestVersion?: string;
  isUpgrade?: boolean;
  isInstall?: boolean;
}

export const InstallChartModal = ({
  isOpen,
  onClose,
  chartName,
  chartVersion,
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
    chart: releaseName,
    revision,
    context: selectedCluster,
  } = useParams();
  const [namespace, setNamespace] = useState(queryNamespace);
  const [chart, setChart] = useState(chartName);

  const { error: versionsError, data: _versions } = useGetVersions(chartName, {
    select: (data) => {
      return data?.sort((a, b) =>
        isNewerVersion(a.version, b.version) ? 1 : -1
      );
    },
    onSuccess: (data) => {
      const selectedVersion = (data || []).find(
        ({ version }) => version === (isUpgrade ? latestVersion : chartVersion)
      ) || { version: "", repository: "" };

      setSelectedVersionData(selectedVersion);
    },
  });

  const versions = _versions?.map((v) => ({
    ...v,
    isChartVersion: v.version === chartVersion,
  }));

  latestVersion = latestVersion ?? chartVersion; // a guard for typescript, latestVersion is always defined
  const [selectedVersionData, setSelectedVersionData] = useState<{
    version: string;
    repository?: string;
  }>();

  const selectedVersion = useMemo(() => {
    return selectedVersionData?.version;
  }, [selectedVersionData]);

  const selectedRepo = useMemo(() => {
    return selectedVersionData?.repository;
  }, [selectedVersionData]);

  const {
    data: chartValues,
    isLoading: loadingChartValues,
    refetch: refetchChartValues,
  } = useChartRepoValues(
    namespace || "default",
    chartName,
    selectedRepo || "",
    selectedVersion || "",
    {
      enabled: isInstall && selectedRepo !== "",
      onSuccess: (data) => {
        if (data) {
          fetchDiff({ userValues: data });
        }
      },
    }
  );

  const { data: releaseValues, isLoading: loadingReleaseValues } =
    useChartReleaseValues({
      namespace,
      release: String(releaseName),
      userDefinedValue: userValues, // for key only
      revision: revision ? parseInt(revision) : undefined,
      options: {
        enabled: !isInstall,
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
      chart,
      selectedVersion,
      selectedRepo,
      selectedCluster,
    ],
    async () => {
      setErrorMessage("");
      const formData = new FormData();
      formData.append("preview", "false");
      formData.append("chart", `${selectedRepo}/${chartName}`);
      formData.append("version", selectedVersion || "");
      formData.append("values", userValues);
      formData.append("name", chart);

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
          setSelectedVersionData({ version: "" }); //cleanup
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
      formData.append("chart", `${selectedRepo}/${chartName}`);
      formData.append("version", version);
      formData.append(
        "values",
        userValues ? userValues : releaseValues ? releaseValues : ""
      );
      formData.append("preview", "true");
      formData.append("name", chartName);

      return formData;
    },
    [userValues, selectedRepo, chartName]
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

    const currentVersion = chartVersion;

    setIsLoadingDiff(true);
    try {
      const [currentVerData, selectedVerData] = await Promise.all([
        fetchVersionData({ version: currentVersion }),
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
        setSelectedVersionData({ version: "" });
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
          onSelectVersion={(versionData) => {
            setSelectedVersionData(versionData);
          }}
        />
      )}
      <GeneralDetails
        releaseName={isInstall ? chart : String(releaseName)}
        disabled={isUpgrade || (!isUpgrade && !isInstall)}
        namespace={namespace}
        onReleaseNameInput={(releaseName) => setChart(releaseName)}
        onNamespaceInput={(namespace) => setNamespace(namespace)}
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
