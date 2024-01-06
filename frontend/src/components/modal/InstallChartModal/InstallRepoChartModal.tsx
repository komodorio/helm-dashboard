import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useGetVersions, useVersionData } from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";
import { useChartRepoValues } from "../../../API/repositories";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import { VersionToInstall } from "./VersionToInstall";
import { isNewerVersion, isNoneEmptyArray } from "../../../utils";
import { useDiffData } from "../../../API/shared";
import { InstallChartModalProps } from "../../../data/types";
import { DefinedValues } from "./DefinedValues";
import apiService from "../../../API/apiService";
import { InstallUpgradeTitle } from "./InstallUpgradeTitle";

export const InstallRepoChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  latestVersion,
}: InstallChartModalProps) => {
  const navigate = useNavigateWithSearchParams();
  const [userValues, setUserValues] = useState("");
  const [installError, setInstallError] = useState("");

  const { context: selectedCluster, selectedRepo: currentRepoCtx } =
    useParams();
  const [namespace, setNamespace] = useState("");
  const [releaseName, setReleaseName] = useState(chartName);

  const { error: versionsError, data: _versions } = useGetVersions(chartName, {
    select: (data) => {
      return data?.sort((a, b) =>
        isNewerVersion(a.version, b.version) ? 1 : -1
      );
    },
    onSuccess: (data) => {
      const empty = { version: "", repository: "", urls: [] };
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const chartAddress = useMemo(() => {
    if (!selectedVersionData || !selectedVersionData?.repository) {
      return "";
    }
    return selectedVersionData?.urls?.[0]?.startsWith("file://")
      ? selectedVersionData?.urls[0]
      : `${selectedVersionData?.repository}/${chartName}`;
  }, [selectedVersionData, chartName]);

  const { data: chartValues, isLoading: loadingChartValues } =
    useChartRepoValues({
      version: selectedVersion || "",
      chart: chartAddress,
    });

  // This hold the selected version manifest, we use it for the diff
  const { data: selectedVerData, error: selectedVerDataError } = useVersionData(
    {
      version: selectedVersion || "",
      userValues,
      chartAddress,
      releaseValues: userValues,
      namespace,
      releaseName,
      isInstallRepoChart: true,
      options: {
        enabled: Boolean(chartAddress),
      },
    }
  );

  const {
    data: diffData,
    isLoading: isLoadingDiff,
    error: diffError,
  } = useDiffData({
    selectedRepo: selectedRepo || "",
    versionsError: versionsError as string,
    currentVerManifest: "", // current version manifest should always be empty since its a fresh install
    selectedVerData,
    chart: chartAddress,
  });

  // Confirm method (install)
  const setReleaseVersionMutation = useMutation(
    [
      "setVersion",
      namespace,
      releaseName,
      selectedVersion,
      selectedRepo,
      selectedCluster,
      chartAddress,
    ],
    async () => {
      setInstallError("");
      const formData = new FormData();
      formData.append("preview", "false");
      formData.append("chart", chartAddress);
      formData.append("version", selectedVersion || "");
      formData.append("values", userValues);
      formData.append("name", releaseName || "");
      const data = await apiService.fetchWithDefaults(
        `/api/helm/releases/${namespace ? namespace : "default"}`,
        {
          method: "post",
          body: formData,
        }
      );
      return data;
    },
    {
      onSuccess: async (response) => {
        onClose();
        navigate(
          `/${response.namespace}/${response.name}/installed/revision/1`
        );
      },
      onError: (error) => {
        setInstallError((error as Error)?.message || "Failed to update");
      },
    }
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersionData({ version: "", urls: [] });
        onClose();
      }}
      title={
        <InstallUpgradeTitle
          isUpgrade={false}
          releaseValues={false}
          chartName={chartName}
        />
      }
      containerClassNames="w-full text-2xl h-2/3"
      actions={[
        {
          id: "1",
          callback: setReleaseVersionMutation.mutate,
          variant: ModalButtonStyle.info,
          isLoading: setReleaseVersionMutation.isLoading,
          disabled:
            loadingChartValues ||
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
          showCurrentVersion={false}
        />
      )}

      <GeneralDetails
        releaseName={releaseName ?? ""}
        disabled={false}
        namespace={namespace}
        onReleaseNameInput={setReleaseName}
        onNamespaceInput={setNamespace}
      />

      <DefinedValues
        initialValue={""}
        onUserValuesChange={setUserValues}
        chartValues={chartValues}
        loading={loadingChartValues}
      />

      <ManifestDiff
        diff={diffData as string}
        isLoading={isLoadingDiff}
        error={
          (selectedVerDataError as string) ||
          (diffError as string) ||
          installError ||
          (versionsError as string)
        }
      />
    </Modal>
  );
};
