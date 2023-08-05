import { useParams } from "react-router-dom";
import useAlertError from "../../../hooks/useAlertError";
import { useMemo, useState } from "react";
import {
  useChartReleaseValues,
  useGetReleaseManifest,
  useGetVersions,
  useVersionData,
} from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { UserDefinedValues } from "./UserDefinedValues";
import { ChartValues } from "./ChartValues";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import { VersionToInstall } from "./VersionToInstall";
import { isNewerVersion, isNoneEmptyArray } from "../../../utils";
import useCustomSearchParams from "../../../hooks/useCustomSearchParams";
import { useChartRepoValues } from "../../../API/repositories";
import { useDiffData } from "../../../API/shared";

interface InstallReleaseChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartName: string;
  currentlyInstalledChartVersion?: string;
  latestVersion?: string;
  isUpgrade?: boolean;
  latestRevision?: number;
}

export const InstallReleaseChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  latestVersion,
  isUpgrade = false,
  latestRevision,
}: InstallReleaseChartModalProps) => {
  const navigate = useNavigateWithSearchParams();
  const { setShowErrorModal } = useAlertError();
  const [userValues, setUserValues] = useState("");
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
    if (!selectedVersionData) return "";

    return selectedVersionData.urls?.[0]?.startsWith("file://")
      ? selectedVersionData.urls[0]
      : `${selectedVersionData.repository}/${chartName}`;
  }, [selectedVersionData, chartName]);

  // the original chart values
  const { data: chartValues, isLoading: loadingChartValues } =
    useChartRepoValues(
      { version: selectedVersion || "", chart: chartAddress as string } // it can't be undefined because query is enabled only if it is defined
    );

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
      userValues,
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
      if (chartAddress) {
        formData.append("chart", chartAddress);
      }
      formData.append("version", selectedVersion || "");
      formData.append("values", userValues);

      const res = await fetch(
        // Todo: Change to BASE_URL from env
        `/api/helm/releases/${
          namespace ? namespace : "default"
        }${`/${releaseName}`}`,
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
          title: "Failed to upgrade the chart",
          msg: String(await res.text()),
        });
      }

      return res.json();
    },
    {
      onSuccess: async (response) => {
        onClose();
        setSelectedVersionData({ version: "", urls: [] }); //cleanup
        navigate(
          `/${selectedCluster}/${
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
        <div className="font-bold">
          {`${isUpgrade ? "Upgrade" : "Install"} `}
          {(isUpgrade || releaseValues) && (
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
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues
          initialValue={releaseValues}
          setValues={setUserValues}
        />

        <ChartValues chartValues={chartValues} loading={loadingChartValues} />
      </div>

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
