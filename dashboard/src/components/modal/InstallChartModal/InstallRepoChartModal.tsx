import { useParams } from "react-router-dom";
import useAlertError from "../../../hooks/useAlertError";
import { useMemo, useState } from "react";
import { useGetVersions, useVersionData } from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { UserDefinedValues } from "./UserDefinedValues";
import { ChartValues } from "./ChartValues";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";
import { useChartRepoValues } from "../../../API/repositories";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import { VersionToInstall } from "./VersionToInstall";
import { isNewerVersion, isNoneEmptyArray } from "../../../utils";
import { useDiffData } from "../../../API/shared";

interface InstallRepoChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartName: string;
  currentlyInstalledChartVersion?: string;
  latestVersion?: string;
  isUpgrade?: boolean;
  latestRevision?: number;
}

export const InstallRepoChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  latestVersion,
}: InstallRepoChartModalProps) => {
  const navigate = useNavigateWithSearchParams();
  const { setShowErrorModal } = useAlertError();
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
    selectedVerData: selectedVerData as any,
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
      const res = await fetch(
        // Todo: Change to BASE_URL from env
        `/api/helm/releases/${namespace ? namespace : "default"}`,
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
          title: "Failed to install the chart",
          msg: String(await res.text()),
        });
      }

      return res.json();
    },
    {
      onSuccess: async (response) => {
        onClose();
        navigate(
          `/${selectedCluster}/${response.namespace}/${response.name}/installed/revision/1`
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
        <div className="font-bold">
          Install <span className="text-green-700 ">{chartName}</span>
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
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues initialValue={""} setValues={setUserValues} />

        <ChartValues chartValues={chartValues} loading={loadingChartValues} />
      </div>

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
