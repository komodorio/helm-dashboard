import { useNavigate, useParams } from "react-router-dom";
import useAlertError from "../../../hooks/useAlertError";
import { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useGetChartValues, useGetVersions } from "../../../API/releases";
import Modal, { ModalButtonStyle } from "../Modal";
import { GeneralDetails } from "./GeneralDetails";
import { UserDefinedValues } from "./UserDefinedValues";
import { ChartValues } from "./ChartValues";
import { ManifestDiff } from "./ManifestDiff";
import { useMutation } from "@tanstack/react-query";

export const InstallChartModal = ({
  isOpen,
  onClose,
  chartName,
  chartVersion,
  latestVersion,
  isUpgrade = false,
  isInstall = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  chartName: string;
  chartVersion: string;
  latestVersion?: string;
  isUpgrade?: boolean;
  isInstall?: boolean;
}) => {
  const navigate = useNavigate();
  const { setShowErrorModal } = useAlertError();
  const [selectedRepo, setSelectedRepo] = useState("");
  const [userValues, setUserValues] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const {
    namespace: queryNamespace,
    chart: releaseName,
    revision,
  } = useParams();
  const { selectedCluster } = useAppContext();
  const [namespace, setNamespace] = useState(queryNamespace);
  const [chart, setChart] = useState(chartName);

  const {
    error: versionsError,
    data: versions,
    refetch: fetchVersion,
  } = useGetVersions(chartName);

  useEffect(() => {
    fetchVersion();
  }, [chart, namespace]);

  latestVersion = latestVersion ?? chartVersion; // a guard for typescript, latestVersion is always defined
  const [selectedVersion, setSelectedVersion] = useState(
    isUpgrade ? latestVersion : chartVersion
  );

  const { data: chartValues, refetch: refetchChartValues } = useGetChartValues(
    namespace || "default",
    chartName,
    selectedRepo,
    selectedVersion,
    {
      enabled: false,
      refetchOnWindowFocus: false,
    }
  );

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
            `/installed/revision/minikube/default/my-release/${
              Number(revision) + 1
            }`
          );
          window.location.reload();
        }
      },
      onError: (error) => {
        setErrorMessage((error as Error)?.message || "Failed to update");
      },
    }
  );

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
              {versions?.map(({ repository, version }) => (
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersion("");
        onClose();
      }}
      title={
        <div className="font-bold">
          {`${isUpgrade ? "Upgrade" : "Install"} `}
          <span className="text-green-700 ">{chartName}</span>
        </div>
      }
      containerClassNames="w-5/6 text-2xl"
      actions={[
        {
          id: "1",
          callback: setReleaseVersionMutation.mutate,
          variant: ModalButtonStyle.info,
          isLoading: setReleaseVersionMutation.isLoading,
        },
      ]}
    >
      <VersionToInstall />
      <GeneralDetails
        chartName={chart}
        isUpgrade={isUpgrade}
        namespace={namespace}
        onChartNameInput={(chartName) => setChart(chartName)}
        onNamespaceInput={(namespace) => setNamespace(namespace)}
      />
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues val={userValues} setVal={setUserValues} />
        <ChartValues chartValues={chartValues} />
      </div>

      <ManifestDiff
        currentVersion={chartVersion}
        selectedVersion={selectedVersion}
        selectedRepo={selectedRepo}
        chartName={chartName}
        namespace={namespace}
        isUpgrade={isUpgrade}
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
