import { useMutation } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";

import apiService from "../../../API/apiService";
import { useVersionData } from "../../../API/releases";
import { useChartRepoValues } from "../../../API/repositories";
import { useDiffData } from "../../../API/shared";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import Spinner from "../../Spinner";
import Modal, { ModalButtonStyle } from "../Modal";

import { GeneralDetails } from "./GeneralDetails";

const DefinedValues = lazy(() => import("./DefinedValues"));
const ManifestDiff = lazy(() => import("./ManifestDiff"));

type InstallURLChartModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const InstallURLChartModal = ({
  isOpen,
  onClose,
}: InstallURLChartModalProps) => {
  const navigate = useNavigateWithSearchParams();
  const [chartURL, setChartURL] = useState("");
  const [userValues, setUserValues] = useState("");
  const [installError, setInstallError] = useState("");
  const [namespace, setNamespace] = useState("");
  const [releaseName, setReleaseName] = useState("");

  const { data: chartValues = "", isLoading: loadingChartValues } =
    useChartRepoValues({
      version: "",
      chart: chartURL,
    });

  const { data: selectedVerData = {}, error: selectedVerDataError } =
    useVersionData({
      version: "",
      userValues,
      chartAddress: chartURL,
      releaseValues: userValues,
      namespace,
      releaseName,
      isInstallRepoChart: true,
      enabled: Boolean(chartURL),
    });

  const {
    data: diffData,
    isLoading: isLoadingDiff,
    error: diffError,
  } = useDiffData({
    selectedRepo: "",
    versionsError: "",
    currentVerManifest: "",
    selectedVerData,
    chart: chartURL,
  });

  const installMutation = useMutation<{
    namespace: string;
    name: string;
  }>({
    mutationKey: ["installFromURL", namespace, releaseName, chartURL],
    mutationFn: async () => {
      setInstallError("");
      const formData = new FormData();
      formData.append("preview", "false");
      formData.append("chart", chartURL);
      formData.append("values", userValues);
      formData.append("name", releaseName);

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
      setInstallError(error?.message || "Failed to install");
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setChartURL("");
        setUserValues("");
        setInstallError("");
        onClose();
      }}
      title={<div className="font-bold">Install from URL</div>}
      containerClassNames="w-full text-2xl h-2/3"
      actions={[
        {
          id: "1",
          callback: installMutation.mutate,
          variant: ModalButtonStyle.info,
          isLoading: installMutation.isPending,
          disabled:
            !chartURL ||
            !releaseName ||
            loadingChartValues ||
            isLoadingDiff ||
            installMutation.isPending,
        },
      ]}
    >
      <div>
        <h4 className="text-lg">Chart URL:</h4>
        <input
          className="w-full rounded-sm border border-1 border-gray-300 bg-white px-2 py-1 text-lg"
          value={chartURL}
          onChange={(e) => setChartURL(e.target.value)}
          placeholder="oci://registry-1.docker.io/example/chart:1.0.0"
        />
      </div>

      <GeneralDetails
        releaseName={releaseName}
        disabled={false}
        namespace={namespace}
        onReleaseNameInput={setReleaseName}
        onNamespaceInput={setNamespace}
      />

      <DefinedValues
        initialValue=""
        onUserValuesChange={setUserValues}
        chartValues={chartValues}
        loading={loadingChartValues}
      />

      <Suspense fallback={<Spinner />}>
        <ManifestDiff
          diff={diffData as string}
          isLoading={isLoadingDiff}
          error={
            (selectedVerDataError as unknown as string) ||
            (diffError as unknown as string) ||
            installError
          }
        />
      </Suspense>
    </Modal>
  );
};
