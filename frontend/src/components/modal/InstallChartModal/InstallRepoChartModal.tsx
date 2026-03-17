import { useMutation } from "@tanstack/react-query";
import {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router";

import { BsPencil, BsX } from "react-icons/bs";

import apiService from "../../../API/apiService";
import type { LatestChartVersion } from "../../../API/interfaces";
import { useGetVersions, useVersionData } from "../../../API/releases";
import { useChartRepoValues } from "../../../API/repositories";
import { useDiffData } from "../../../API/shared";
import type { InstallChartModalProps } from "../../../data/types";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import { isNoneEmptyArray } from "../../../utils";
import Spinner from "../../Spinner";
import Modal, { ModalButtonStyle } from "../Modal";

import { GeneralDetails } from "./GeneralDetails";
import { InstallUpgradeTitle } from "./InstallUpgradeTitle";
import { VersionToInstall } from "./VersionToInstall";

const DefinedValues = lazy(() => import("./DefinedValues"));
const ManifestDiff = lazy(() => import("./ManifestDiff"));

export const InstallRepoChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  urlMode: initialURLMode = false,
}: InstallChartModalProps & { urlMode?: boolean }) => {
  const navigate = useNavigateWithSearchParams();
  const [userValues, setUserValues] = useState("");
  const [installError, setInstallError] = useState("");

  const { context: selectedCluster, selectedRepo: currentRepoCtx } =
    useParams();
  const [namespace, setNamespace] = useState("");
  const [releaseName, setReleaseName] = useState(chartName);

  const {
    error: versionsError,
    data: _versions = [],
    isSuccess,
  } = useGetVersions(chartName);

  const [versions, setVersions] = useState<
    Array<LatestChartVersion & { isChartVersion: boolean }>
  >([]);

  const [selectedVersionData, setSelectedVersionData] = useState<{
    version: string;
    repository?: string;
    urls: string[];
  }>();

  const onSuccess = useEffectEvent(() => {
    const empty = { version: "", repository: "", urls: [] };
    const versionsToRepo = _versions.filter(
      (v) => v.repository === currentRepoCtx
    );

    setSelectedVersionData(versionsToRepo[0] ?? empty);
    setVersions(
      _versions?.map((v) => ({
        ...v,
        isChartVersion: v.version === currentlyInstalledChartVersion,
      }))
    );
  });

  useEffect(() => {
    if (isSuccess && _versions.length) {
      onSuccess();
    }
  }, [isSuccess, _versions]);

  const selectedVersion = selectedVersionData?.version;

  const selectedRepo = selectedVersionData?.repository;

  const [chartURL, setChartURL] = useState("");
  const [useURLMode, setUseURLMode] = useState(initialURLMode);

  const repoChartAddress = useMemo(() => {
    if (!selectedVersionData || !selectedVersionData?.repository) {
      return "";
    }
    return selectedVersionData?.urls?.[0]?.startsWith("file://")
      ? selectedVersionData?.urls[0]
      : `${selectedVersionData?.repository}/${chartName}`;
  }, [selectedVersionData, chartName]);

  const chartAddress = useURLMode ? chartURL : repoChartAddress || chartURL;

  const { data: chartValues = "", isLoading: loadingChartValues } =
    useChartRepoValues({
      version: selectedVersion || "",
      chart: chartAddress,
    });

  // This hold the selected version manifest, we use it for the diff
  const { data: selectedVerData = {}, error: selectedVerDataError } =
    useVersionData({
      version: selectedVersion || "",
      userValues,
      chartAddress,
      releaseValues: userValues,
      namespace,
      releaseName,
      isInstallRepoChart: true,
      enabled: Boolean(chartAddress),
    });

  const {
    data: diffData,
    isLoading: isLoadingDiff,
    error: diffError,
  } = useDiffData({
    selectedRepo: selectedRepo || "",
    versionsError: versionsError as unknown as string, // TODO fix it
    currentVerManifest: "", // current version manifest should always be empty since it's a fresh install
    selectedVerData,
    chart: chartAddress,
  });

  // Confirm method (install)
  const setReleaseVersionMutation = useMutation<{
    namespace: string;
    name: string;
  }>({
    mutationKey: [
      "setVersion",
      namespace,
      releaseName,
      selectedVersion,
      selectedRepo,
      selectedCluster,
      chartAddress,
    ],
    mutationFn: async () => {
      setInstallError("");
      const formData = new FormData();
      formData.append("preview", "false");
      formData.append("chart", chartAddress);
      formData.append("version", selectedVersion || "");
      formData.append("values", userValues);
      formData.append("name", releaseName || "");

      return await apiService.fetchWithSafeDefaults({
        url: `/api/helm/releases/${namespace ? namespace : "default"}`,
        options: {
          method: "post",
          body: formData,
        },
        fallback: { namespace: "", name: "" },
      });
    },

    onSuccess: async (response: { namespace: string; name: string }) => {
      onClose();
      await navigate(
        `/${response.namespace}/${response.name}/installed/revision/1`
      );
    },
    onError: (error) => {
      setInstallError(error?.message || "Failed to update");
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersionData({ version: "", urls: [] });
        onClose();
      }}
      title={
        initialURLMode ? (
          <div className="font-bold">Install from URL</div>
        ) : (
          <InstallUpgradeTitle
            isUpgrade={false}
            releaseValues={false}
            chartName={chartName}
          />
        )
      }
      containerClassNames="w-full text-2xl h-2/3"
      actions={[
        {
          id: "1",
          callback: setReleaseVersionMutation.mutate,
          variant: ModalButtonStyle.info,
          isLoading: setReleaseVersionMutation.isPending,
          disabled:
            loadingChartValues ||
            isLoadingDiff ||
            setReleaseVersionMutation.isPending,
        },
      ]}
    >
      {!useURLMode && versions && isNoneEmptyArray(versions) ? (
        <div className="flex items-center gap-2">
          <VersionToInstall
            versions={versions}
            initialVersion={selectedVersionData}
            onSelectVersion={setSelectedVersionData}
            showCurrentVersion={false}
          />
          <button
            type="button"
            className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
            title="Switch to URL"
            onClick={() => setUseURLMode(true)}
          >
            <BsPencil className="text-lg" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <h4 className="text-lg">Chart URL:</h4>
            <input
              className="w-full rounded-sm border border-1 border-gray-300 bg-white px-2 py-1 text-lg"
              value={chartURL}
              onChange={(e) => setChartURL(e.target.value)}
              placeholder="oci://registry-1.docker.io/example/chart:1.0.0"
            />
          </div>
          {versions && isNoneEmptyArray(versions) && (
            <button
              type="button"
              className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
              title="Switch to repository"
              onClick={() => {
                setUseURLMode(false);
                setChartURL("");
              }}
            >
              <BsX className="text-2xl" />
            </button>
          )}
        </div>
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

      <Suspense fallback={<Spinner />}>
        <ManifestDiff
          diff={diffData as string}
          isLoading={isLoadingDiff}
          error={
            (selectedVerDataError as unknown as string) || // TODO fix it
            (diffError as unknown as string) ||
            installError ||
            (versionsError as unknown as string)
          }
        />
      </Suspense>
    </Modal>
  );
};
