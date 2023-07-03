import { useNavigate, useParams } from "react-router-dom";
import useAlertError from "../../../hooks/useAlertError";
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useChartReleaseValues, useGetVersions } from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { UserDefinedValues } from "./UserDefinedValues";
import { ChartValues } from "./ChartValues";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";
import { useChartRepoValues } from "../../../API/repositories";
import { isNewerVersion } from "../../../utils";

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
  const navigate = useNavigate();
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
    data: versions,
    refetch: fetchVersion,
  } = useGetVersions(chartName);

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
        `/api/helm/releases/${namespace ? namespace : "default"}${
          !isInstall ? `/${releaseName}` : ""
        }`,
        {
          method: "post",
          body: formData,
          headers: {
            "X-Kubecontext": selectedCluster,
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
      onSuccess: async () => {
        onClose();
        if (isInstall) {
          navigate(`/`);
        } else {
          setSelectedVersion(""); //cleanup
          navigate(
            `/installed/revision/${selectedCluster}/${namespace ? namespace : "default"}/${chartName}/${selectedVersion}`
          );
          window.location.reload();
        }
      },
      onError: (error) => {
        setErrorMessage((error as Error)?.message || "Failed to update");
      },
    }
  );

  const VersionToInstall = () => {
    const currentVersion = (
      <p className="text-xl">
        current version is:{" "}
        <span className="text-green-700">{chartVersion}</span>
      </p>
    );

    return (
      <div className="flex gap-2 text-xl">
        {versions?.length ? (
          <>
            Version to install:{" "}
            <select
              className=" py-1 border-2 border-gray-200 text-blue-500 rounded"
              onChange={(e) => setSelectedVersion(e.target.value)}
              value={selectedVersion}
            >
              {versions
                ?.sort((a, b) =>
                  isNewerVersion(a.version, b.version) ? 1 : -1
                )
                .map(({ repository, version }) => (
                  <option
                    value={version}
                    key={repository + version}
                  >{`${repository} @ ${version}`}</option>
                ))}
            </select>{" "}
          </>
        ) : null}

        {currentVersion}
      </div>
    );
  };

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
        <div className="font-bold">
          {`${
            isUpgrade || (!isUpgrade && !isInstall) ? "Upgrade" : "Install"
          } `}
          {(isUpgrade || isInstall) && (
            <span className="text-green-700 ">{chartName}</span>
          )}
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
            loadingChartValues ||
            loadingReleaseValues ||
            isLoadingDiff ||
            setReleaseVersionMutation.isLoading,
        },
      ]}
    >
      <VersionToInstall />
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
          chartValues={isInstall ? chartValues : releaseValues}
          loading={isInstall ? loadingChartValues : loadingReleaseValues}
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
