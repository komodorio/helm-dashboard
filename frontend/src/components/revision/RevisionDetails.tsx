import { useEffect, useRef, useState } from "react";
import { Diff2HtmlUI } from "diff2html/lib/ui/js/diff2html-ui-slim.js";

import {
  BsPencil,
  BsTrash3,
  BsHourglassSplit,
  BsArrowRepeat,
  BsArrowUp,
  BsCheckCircle,
} from "react-icons/bs";
import { Release, ReleaseRevision } from "../../data/types";
import StatusLabel, { DeploymentStatus } from "../common/StatusLabel";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  useGetReleaseInfoByType,
  useGetLatestVersion,
  useGetResources,
  useRollbackRelease,
  useTestRelease,
} from "../../API/releases";

import RevisionDiff from "./RevisionDiff";
import RevisionResource from "./RevisionResource";
import Tabs from "../Tabs";
import { type UseQueryResult, useMutation } from "@tanstack/react-query";
import Modal, { ModalButtonStyle } from "../modal/Modal";
import Spinner from "../Spinner";
import useAlertError from "../../hooks/useAlertError";
import Button from "../Button";
import { InstallReleaseChartModal } from "../modal/InstallChartModal/InstallReleaseChartModal";
import { diffConfiguration, isNewerVersion } from "../../utils";
import useNavigateWithSearchParams from "../../hooks/useNavigateWithSearchParams";
import apiService from "../../API/apiService";

type RevisionTagProps = {
  caption: string;
  text: string;
};

type RevisionDetailsProps = {
  release: Release;
  installedRevision: ReleaseRevision;
  isLatest: boolean;
  latestRevision: number;
};

export default function RevisionDetails({
  release,
  installedRevision,
  isLatest,
  latestRevision,
}: RevisionDetailsProps) {
  const [searchParams] = useSearchParams();

  const revisionTabs = [
    {
      value: "resources",
      label: "Resources",
      content: <RevisionResource isLatest={isLatest} />,
    },
    {
      value: "manifests",
      label: "Manifests",
      content: <RevisionDiff latestRevision={latestRevision} />,
    },
    {
      value: "values",
      label: "Values",
      content: (
        <RevisionDiff
          latestRevision={latestRevision}
          includeUserDefineOnly={true}
        />
      ),
    },
    {
      value: "notes",
      label: "Notes",
      content: <RevisionDiff latestRevision={latestRevision} />,
    },
  ];
  const { context, namespace, chart } = useParams();
  const tab = searchParams.get("tab");
  const selectedTab =
    revisionTabs.find((t) => t.value === tab) || revisionTabs[0];
  const [isReconfigureModalOpen, setIsReconfigureModalOpen] = useState(false);

  const {
    data: latestVerData,
    refetch: refetchLatestVersion,
    isLoading: isLoadingLatestVersion,
    isRefetching: isRefetchingLatestVersion,
  } = useGetLatestVersion(release.chart_name);

  const [showTestsResults, setShowTestResults] = useState(false);

  const { setShowErrorModal } = useAlertError();
  const {
    mutate: runTests,
    isPending: isRunningTests,
    data: testResults,
  } = useTestRelease({
    onError: (error) => {
      setShowTestResults(false);
      setShowErrorModal({
        title: "Failed to run tests for chart " + chart,
        msg: error.message,
      });
      console.error("Failed to execute test for chart", error);
    },
  });

  const handleRunTests = () => {
    if (!namespace || !chart) {
      setShowErrorModal({
        title: "Missing data to run test",
        msg: "Missing chart and/or namespace",
      });
      return;
    }

    try {
      runTests({
        ns: namespace,
        name: chart,
      });
    } catch (error: unknown) {
      setShowErrorModal({
        title: "Test failed to run",
        msg: (error as Error).message,
      });
    }
    setShowTestResults(true);
  };

  const displayTestResults = () => {
    if (!testResults || (testResults as []).length === 0) {
      return (
        <div>
          Tests executed successfully
          <br />
          <br />
          <pre>Empty response from API</pre>
        </div>
      );
    } else {
      return (
        <div>
          {testResults.split("\n").map((line, index) => (
            <div key={index} className="mb-2">
              {line}
              <br />
            </div>
          ))}
        </div>
      );
    }
  };

  const Header = () => {
    const navigate = useNavigate();

    const addRepo = async () => {
      await navigate(
        `/repository?add_repo=true&repo_url=${latestVerData?.[0]?.urls[0]}&repo_name=${latestVerData?.[0]?.repository}`
      );
    };

    return (
      <header className="flex flex-wrap justify-between">
        <h1 className="float-left mb-1 font-roboto-slab text-3xl font-semibold">
          {chart}
        </h1>
        <div className="float-right flex h-fit flex-row flex-wrap gap-3">
          <div className="flex flex-col">
            <Button
              className="flex min-w-[150px] items-center justify-center gap-2 text-sm font-semibold disabled:bg-gray-200"
              onClick={() => setIsReconfigureModalOpen(true)}
              disabled={isLoadingLatestVersion || isRefetchingLatestVersion}
            >
              {isLoadingLatestVersion || isRefetchingLatestVersion ? (
                <>
                  <BsHourglassSplit />
                  Checking...
                </>
              ) : canUpgrade ? (
                <>
                  <BsArrowUp />
                  Upgrade to {latestVerData?.[0]?.version}
                </>
              ) : (
                <>
                  <BsPencil />
                  Reconfigure
                </>
              )}
            </Button>

            {isReconfigureModalOpen && (
              <InstallReleaseChartModal
                isOpen={isReconfigureModalOpen}
                chartName={release.chart_name}
                currentlyInstalledChartVersion={installedRevision.chart_ver}
                latestVersion={latestVerData?.[0]?.version}
                isUpgrade={canUpgrade}
                onClose={() => {
                  setIsReconfigureModalOpen(false);
                }}
                latestRevision={latestRevision}
              />
            )}
            {latestVerData?.[0]?.isSuggestedRepo ? (
              <span
                onClick={() => {
                  void addRepo();
                }}
                className="cursor-pointer text-sm text-blue-600 underline"
              >
                Add repository for it: {latestVerData[0].repository}
              </span>
            ) : (
              <span
                onClick={() => void refetchLatestVersion()}
                className="cursor-pointer text-xs underline"
              >
                Check for new version
              </span>
            )}
          </div>

          <Rollback release={release} installedRevision={installedRevision} />
          {release.has_tests ? (
            <>
              {" "}
              <Button
                onClick={handleRunTests}
                className="flex h-1/2 items-center gap-2 text-sm font-semibold"
              >
                <BsCheckCircle />
                Run tests
              </Button>
              <Modal
                containerClassNames="w-4/5"
                title="Test results"
                isOpen={showTestsResults}
                onClose={() => setShowTestResults(false)}
              >
                {isRunningTests ? (
                  <div className="mr-2 flex items-center">
                    <Spinner /> Waiting for completion..
                  </div>
                ) : (
                  displayTestResults()
                )}
              </Modal>{" "}
            </>
          ) : null}

          <Uninstall />
        </div>
      </header>
    );
  };

  const canUpgrade = !latestVerData?.[0]?.version
    ? false
    : isNewerVersion(installedRevision.chart_ver, latestVerData?.[0]?.version);

  return (
    <div className="flex flex-col gap-3 px-16 pt-5">
      <StatusLabel status={release.status} />
      <Header />
      <div className="-mt-4 flex flex-row gap-6 text-sm">
        <span>
          Revision <span className="font-semibold">#{release.revision}</span>
        </span>
        <span className="text-sm">
          {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          }).format(new Date(release.updated))}
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        <RevisionTag caption="chart version" text={release.chart} />
        <RevisionTag
          caption="app version"
          text={release.app_version || "N/A"}
        />
        <RevisionTag caption="namespace" text={namespace ?? ""} />
        <RevisionTag caption="cluster" text={context ?? ""} />
      </div>

      <span
        className={`text-sm ${
          release.status === DeploymentStatus.FAILED ? "text-red-600" : ""
        }`}
      >
        {release.description}
      </span>
      <Tabs tabs={revisionTabs} selectedTab={selectedTab} />
    </div>
  );
}

function RevisionTag({ caption, text }: RevisionTagProps) {
  return (
    <span className="rounded-sm bg-revision p-1 px-2 text-sm">
      <span>{caption}:</span>
      <span className="font-bold"> {text}</span>
    </span>
  );
}

const Rollback = ({
  release,
  installedRevision,
}: {
  release: Release;
  installedRevision: ReleaseRevision;
}) => {
  const { chart, namespace, revision } = useParams();
  const navigate = useNavigateWithSearchParams();

  const [showRollbackDiff, setShowRollbackDiff] = useState(false);
  const revisionInt = parseInt(revision || "", 10);

  const { mutate: rollbackRelease, isPending: isRollingBackRelease } =
    useRollbackRelease({
      onSuccess: async () => {
        await navigate(
          `/${namespace}/${chart}/installed/revision/${revisionInt + 1}`
        );
        window.location.reload();
      },
    });

  const handleRollback = () => {
    setShowRollbackDiff(true);
  };

  if (!chart || !namespace || !revision) {
    return null;
  }

  if (release.revision <= 1) return null;

  const rollbackRevision =
    installedRevision.revision === release.revision
      ? installedRevision.revision - 1
      : revisionInt;

  const rollbackTitle = (
    <div className="text-lg font-semibold">
      Rollback <span className="text-red-500">{chart}</span> from revision{" "}
      {installedRevision.revision} to {rollbackRevision}
    </div>
  );

  const RollbackModal = () => {
    const response = useGetReleaseInfoByType(
      {
        chart,
        namespace,
        revision: rollbackRevision.toString(),
        tab: "manifests",
      },
      `&revisionDiff=${installedRevision.revision}`
    );

    return (
      <Modal
        title={rollbackTitle}
        isOpen={showRollbackDiff}
        onClose={() => setShowRollbackDiff(false)}
        containerClassNames="w-4/5"
        actions={[
          {
            id: "1",
            callback: () => {
              rollbackRelease({
                ns: namespace,
                name: String(chart),
                revision: release.revision,
              });
            },
            variant: ModalButtonStyle.info,
            isLoading: isRollingBackRelease,
            text: isRollingBackRelease ? "Rolling back" : "Confirm",
          },
        ]}
      >
        <RollbackModalContent dataResponse={response} />
      </Modal>
    );
  };

  const RollbackModalContent = ({
    dataResponse,
  }: {
    dataResponse: UseQueryResult<string, unknown>;
  }) => {
    const {
      data,
      isLoading,
      isSuccess: fetchedDataSuccessfully,
    } = dataResponse;
    const diffElement = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (data && fetchedDataSuccessfully && diffElement?.current) {
        const diff2htmlUi = new Diff2HtmlUI(
          diffElement.current,
          data,
          diffConfiguration
        );
        diff2htmlUi.draw();
        diff2htmlUi.highlightCode();
      }
    }, [data, isLoading, fetchedDataSuccessfully]);

    return (
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex gap-2 text-sm">
            <Spinner />
            <p>Loading changes that will happen to cluster</p>
          </div>
        ) : data ? (
          <p className="text-sm">Following changes will happen to cluster:</p>
        ) : (
          <p className="text-base">No changes will happen to cluster</p>
        )}
        <div className="relative leading-5" ref={diffElement} />
      </div>
    );
  };

  return (
    <>
      <Button
        onClick={handleRollback}
        className="flex h-1/2 items-center gap-2 text-sm font-semibold"
      >
        <BsArrowRepeat />
        Rollback to #{rollbackRevision}
      </Button>
      {showRollbackDiff && <RollbackModal />}
    </>
  );
};

const Uninstall = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { namespace = "", chart = "" } = useParams();
  const { data: resources } = useGetResources(namespace, chart, isOpen);

  const uninstallMutation = useMutation({
    mutationKey: ["uninstall", namespace, chart],
    mutationFn: () =>
      apiService.fetchWithDefaults(
        "/api/helm/releases/" + namespace + "/" + chart,
        {
          method: "delete",
        }
      ),
    onSuccess: () => {
      window.location.href = "/";
    },
  });
  const uninstallTitle = (
    <div className="text-lg font-semibold">
      Uninstall <span className="text-red-500">{chart}</span> from namespace{" "}
      <span className="text-red-500">{namespace}</span>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex h-1/2 items-center gap-2 text-sm font-semibold hover:bg-red-200"
      >
        <BsTrash3 />
        Uninstall
      </Button>
      {resources?.length ? (
        <Modal
          title={uninstallTitle}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          actions={[
            {
              id: "1",
              callback: uninstallMutation.mutate,
              variant: ModalButtonStyle.info,
              isLoading: uninstallMutation.isPending,
            },
          ]}
          containerClassNames="w-[800px]"
        >
          <div>Following resources will be deleted from the cluster:</div>
          <div>
            {resources?.map((resource) => (
              <div
                key={
                  resource.apiVersion + resource.kind + resource.metadata.name
                }
                className="mb-3 flex w-full justify-start gap-1"
              >
                <span
                  style={{
                    textAlign: "end",
                    paddingRight: "30px",
                  }}
                  className="w-3/5 italic"
                >
                  {resource.kind}
                </span>
                <span className="w-4/5 font-semibold">
                  {resource.metadata.name}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </>
  );
};
