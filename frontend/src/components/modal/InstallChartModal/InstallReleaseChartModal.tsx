import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  useChartReleaseValues,
  useGetReleaseManifest,
  useGetVersions,
  useVersionData,
} from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import { VersionToInstall } from "./VersionToInstall";
import { isNewerVersion, isNoneEmptyArray } from "../../../utils";
import useCustomSearchParams from "../../../hooks/useCustomSearchParams";
import { useChartRepoValues } from "../../../API/repositories";
import { useDiffData } from "../../../API/shared";
import { InstallChartModalProps } from "../../../data/types";
import { DefinedValues } from "./DefinedValues";
import apiService from "../../../API/apiService";
import { InstallUpgradeTitle } from "./InstallUpgradeTitle";

export const InstallReleaseChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  latestVersion,
  isUpgrade = false,
  latestRevision,
}: InstallChartModalProps) => {
  const navigate = useNavigateWithSearchParams();
  const [userValues, setUserValues] = useState<string>();
  const [installError, setInstallError] = useState("");

  const {
    namespace: queryNamespace,
    chart: _releaseName,
    context: selectedCluster,
  } = useParams();
  const { searchParamsObject } = useCustomSearchParams();
  const { filteredNamespace } = searchParamsObject;
  const [namespace, setNamespace] = useState(queryNamespace || "");
  const [releaseName, setReleaseName] = useState(_releaseName || "");

  const { error: versionsError, data: _versions } = useGetVersions(chartName, {
    select: (data) => {
      return data?.sort((a, b) =>
        isNewerVersion(a.version, b.version) ? 1 : -1
      );
    },
    onSuccess: (data) => {
      const empty = { version: "", repository: "", urls: [] };
      return setSelectedVersionData(data[0] ?? empty);
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
    return selectedVersionData?.repository || "";
  }, [selectedVersionData]);

  const chartAddress = useMemo(() => {
    if (!selectedVersionData || !selectedVersionData.repository) return "";

    return selectedVersionData.urls?.[0]?.startsWith("file://")
      ? selectedVersionData.urls[0]
      : `${selectedVersionData.repository}/${chartName}`;
  }, [selectedVersionData, chartName]);

  // the original chart values
  const { data: chartValues } = useChartRepoValues({
    version: selectedVersion || "",
    chart: chartAddress,
  });

  // The user defined values (if any we're set)
  const { data: releaseValues, isLoading: loadingReleaseValues } =
    useChartReleaseValues({
      namespace,
      release: String(releaseName),
      revision: latestRevision ? latestRevision : undefined,
    });

  // This hold the selected version manifest, we use it for the diff
  const { data: selectedVerData, error: selectedVerDataError } = useVersionData(
    {
      version: selectedVersion || "",
      userValues: userValues || "",
      chartAddress,
      releaseValues,
      namespace,
      releaseName,
    }
  );

  const { data: currentVerManifest, error: currentVerManifestError } =
    useGetReleaseManifest({
      namespace,
      chartName: _releaseName || "",
    });

  const {
    data: diffData,
    isLoading: isLoadingDiff,
    error: diffError,
  } = useDiffData({
    selectedRepo,
    versionsError: versionsError as string,
    currentVerManifest,
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
      if (chartAddress) {
        formData.append("chart", chartAddress);
      }
      formData.append("version", selectedVersion || "");
      formData.append("values", userValues || releaseValues || ""); // if userValues is empty, we use the release values

      const data = await apiService.fetchWithDefaults(
        `/api/helm/releases/${
          namespace ? namespace : "default"
        }${`/${releaseName}`}`,
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
        setSelectedVersionData({ version: "", urls: [] }); //cleanup
        navigate(
          `/${
            namespace ? namespace : "default"
          }/${releaseName}/installed/revision/${response.version}`
        );
        window.location.reload();
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
        setUserValues(releaseValues);
        onClose();
      }}
      title={
        <InstallUpgradeTitle
          isUpgrade={isUpgrade}
          releaseValues={isUpgrade || releaseValues}
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
            loadingReleaseValues ||
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
          showCurrentVersion
        />
      )}

      <GeneralDetails
        releaseName={releaseName}
        disabled
        namespace={namespace ? namespace : filteredNamespace}
        onReleaseNameInput={setReleaseName}
        onNamespaceInput={setNamespace}
      />

      <DefinedValues
        initialValue={releaseValues}
        onUserValuesChange={(values: string) => setUserValues(values)}
        chartValues={chartValues}
        loading={loadingReleaseValues}
      />

      <ManifestDiff
        diff={diffData as string}
        isLoading={isLoadingDiff}
        error={
          (currentVerManifestError as string) ||
          (selectedVerDataError as string) ||
          (diffError as string) ||
          installError ||
          (versionsError as string)
        }
      />
    </Modal>
  );
};
