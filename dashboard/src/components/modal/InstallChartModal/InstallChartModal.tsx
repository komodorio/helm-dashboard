import { useNavigate, useParams } from "react-router-dom";
import useAlertError from "../../../hooks/useAlertError";
import { useCallback, useEffect, useState } from "react";
import { useChartReleaseValues, useGetVersions } from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { UserDefinedValues } from "./UserDefinedValues";
import { ChartValues } from "./ChartValues";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";
import { useChartRepoValues } from "../../../API/repositories";
import { isNewerVersion, isNoneEmptyArray } from "../../../utils/utils";
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams";
import Select, { components } from 'react-select';
import { AiOutlineCheck } from "react-icons/ai";
import { BsCheck, BsCheck2 } from "react-icons/bs";
import { VersionToInstall } from "./VersionToInstall";

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
  const [selectedRepo, setSelectedRepo] = useState("");
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

  const {
    error: versionsError,
    data: _versions,
    refetch: fetchVersion,
  } = useGetVersions(chartName);

  const versions = _versions?.map((v) => ({
    ...v,
    isChartVersion: v.version === chartVersion,
  }));
  latestVersion = latestVersion ?? chartVersion; // a guard for typescript, latestVersion is always defined
  const [selectedVersion, setSelectedVersion] = useState(
    isUpgrade ? latestVersion : chartVersion
  );

  const {
    data: chartValues,
    isLoading: loadingChartValues,
    refetch: refetchChartValues,
  } = useChartRepoValues(
    namespace || "default",
    chartName,
    selectedRepo,
    selectedVersion,
    {
      enabled: isInstall,
    }
  );

  const { data: releaseValues, isLoading: loadingReleaseValues } =
    useChartReleaseValues({
      namespace,
      release: String(releaseName),
      userDefinedValue: userValues,
      revision: revision ? parseInt(revision) : undefined,
      options: {
        enabled: !isInstall,
      },
    });

  useEffect(() => {
    fetchVersion();
  }, [chart, namespace]);

  useEffect(() => {
    if (versions?.length) {
      setSelectedRepo(versions[0].repository);
    }
  }, [versions]);

  useEffect(() => {
    if (selectedRepo) {
      refetchChartValues();
    }
  }, [selectedRepo, selectedVersion, namespace, chart]);

  const setReleaseVersionMutation = useMutation(
    ["setVersion", namespace, chart, selectedVersion, selectedRepo],
    async () => {
      setErrorMessage("");
      const formData = new FormData();
      formData.append("preview", "false");
      formData.append("chart", `${selectedRepo}/${chartName}`);
      formData.append("version", selectedVersion);
      formData.append("values", userValues);
      formData.append("name", chart);

      const res = await fetch(
        // Todo: Change to BASE_URL from env
        `/api/helm/releases/${namespace ? namespace : "default"}${!isInstall ? `/${releaseName}` : ""
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
            `/installed/revision/${selectedCluster}/${response.namespace}/${response.name}/1`
          );
        } else {
          setSelectedVersion(""); //cleanup
          navigate(
            `/installed/revision/${selectedCluster}/${namespace ? namespace : "default"
            }/${chartName}/${response.version}`
          );
          window.location.reload();
        }
      },
      onError: (error) => {
        setErrorMessage((error as Error)?.message || "Failed to update");
      },
    }
  );


  const getVersionManifestFormData = (version: string) => {
    const formData = new FormData();
    formData.append("chart", `${selectedRepo}/${chartName}`);
    formData.append("version", version);
    formData.append("values", "");
    formData.append("preview", "true");
    formData.append("name", chartName);

    return formData;
  };

  const fetchVersionData = async (version: string) => {
    const formData = getVersionManifestFormData(version);
    const fetchUrl = `/api/helm/releases/${namespace ? namespace : "[empty]"}`;
    const response = await fetch(fetchUrl, {
      method: "post",
      body: formData,
    });
    const data = await response.json();
    return data;
  };

  const fetchDiff = useCallback(async () => {
    if (!selectedRepo || versionsError) {
      return;
    }

    const currentVersion = chartVersion;
    if (isUpgrade && selectedVersion === currentVersion) {
      return;
    }

    setIsLoadingDiff(true);
    try {
      const [currentVerData, selectedVerData] = await Promise.all([
        selectedVersion !== currentVersion
          ? fetchVersionData(currentVersion)
          : { manifest: "" },
        fetchVersionData(selectedVersion),
      ]);
      const formData = new FormData();
      formData.append("a", currentVerData.manifest);
      formData.append("b", selectedVerData.manifest);

      const response = await fetch("/diff", {
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
  }, [selectedRepo, selectedVersion, chartName, namespace, isUpgrade]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersion("");
        onClose();
      }}
      title={
        <div className="font-medium">
          {`${isUpgrade || (!isUpgrade && !isInstall) ? "Upgrade" : "Install"
            } `}
          <span className="text-[#198754] font-bold">{chartName}</span>
        </div>
      }
      containerClassNames="w-5/6 text-2xl h-2/3"
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
      {versions && isNoneEmptyArray(versions) && <VersionToInstall versions={versions} onSelectVersion={setSelectedVersion} />}
      <GeneralDetails
        chartName={chart}
        disabled={isUpgrade || (!isUpgrade && !isInstall)}
        namespace={namespace}
        onChartNameInput={(chartName) => setChart(chartName)}
        onNamespaceInput={(namespace) => setNamespace(namespace)}
      />
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues val={userValues} setVal={setUserValues} />

        <ChartValues
          chartValues={chartValues}
          loading={loadingChartValues}
        />
      </div>

      <ManifestDiff
        diff={diff}
        isLoading={isLoadingDiff}
        fetchDiff={fetchDiff}
        versionsError={versionsError}
      />
      {errorMessage && (
        <div>
          <p className="text-red-600 text-lg">
            Failed to get upgrade info: {errorMessage}
          </p>
        </div>
      )}
    </Modal>
  );
};
