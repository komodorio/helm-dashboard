import { useEffect, useRef, useState } from "react";
import {
  Diff2HtmlUI,
  Diff2HtmlUIConfig,
} from "diff2html/lib/ui/js/diff2html-ui-slim.js";

import {
  BsPencil,
  BsTrash3,
  BsHourglassSplit,
  BsArrowRepeat,
  BsArrowUp,
  BsCheckCircle,
} from "react-icons/bs";
import { Release } from "../../data/types";
import StatusLabel, { DeploymentStatus } from "../common/StatusLabel";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetReleaseInfoByType } from "../../API/releases";

import RevisionDiff from "./RevisionDiff";
import RevisionResource from "./RevisionResource";
import Tabs from "../Tabs";
import {
  useGetLatestVersion,
  useGetResources,
  useRollbackRelease,
  useTestRelease,
} from "../../API/releases";
import { useMutation } from "@tanstack/react-query";
import Modal, { ModalButtonStyle } from "../modal/Modal";
import Spinner from "../Spinner";
import useAlertError from "../../hooks/useAlertError";
import Button from "../Button";
import { InstallChartModal } from "../modal/InstallChartModal/InstallChartModal";
import { isNewerVersion } from "../../utils";
import { useAppContext } from "../../context/AppContext";

type RevisionTagProps = {
  caption: string;
  text: string;
};

type RevisionDetailsProps = {
  release: Release;
  refetchRevisions: () => void;
};

export default function RevisionDetails({
  release,
  refetchRevisions,
}: RevisionDetailsProps) {
  const [searchParams] = useSearchParams();
  const revisionTabs = [
    { value: "resources", label: "Resources", content: <RevisionResource /> },
    { value: "manifests", label: "Manifests", content: <RevisionDiff /> },
    {
      value: "values",
      label: "Values",
      content: <RevisionDiff includeUserDefineOnly={true} />,
    },
    { value: "notes", label: "Notes", content: <RevisionDiff /> },
  ];
  const { context, namespace, chart } = useParams();
  const tab = searchParams.get("tab");
  const selectedTab =
    revisionTabs.find((t) => t.value === tab) || revisionTabs[0];
  const { selectedCluster } = useAppContext();

  const [isReconfigureModalOpen, setIsReconfigureModalOpen] = useState(false);

  const {
    data: latestVerData,
    refetch: refetchLatestVersion,
    isLoading: isLoadingLatestVersion,
    isRefetching: isRefetchingLatestVersion,
  } = useGetLatestVersion(release.chart_name, { cacheTime: 0 });

  const [showTestsResults, setShowTestResults] = useState(false);

  const { setShowErrorModal } = useAlertError();
  const {
    mutate: runTests,
    isLoading: isRunningTests,
    data: testResults,
  } = useTestRelease({
    onSuccess: () => {
      setShowTestResults(true);
    },
    onError: (error) => {
      setShowErrorModal({
        title: "Failed to run tests for chart " + chart,
        msg: error as string,
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
    } catch (error: any) {
      setShowErrorModal({
        title: "Test failed to run",
        msg: error.message,
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
          {(testResults as string).split("\n").map((line, index) => (
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
    return (
      <header className="flex flex-wrap justify-between">
        <h1 className="text-[#3d4048] text-4xl float-left mb-1">{chart}</h1>
        <div className="flex flex-row flex-wrap gap-3 float-right h-fit">
          <div className="flex flex-col">
            <Button
              className="flex justify-center items-center gap-2 min-w-[150px]"
              onClick={() => setIsReconfigureModalOpen(true)}
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
              <InstallChartModal
                isOpen={isReconfigureModalOpen}
                chartName={release.chart_name}
                chartVersion={release.chart_ver}
                latestVersion={latestVerData?.[0]?.version}
                isUpgrade={canUpgrade}
                onClose={() => {
                  setIsReconfigureModalOpen(false);
                }}
              />
            )}
            {latestVerData?.[0]?.isSuggestedRepo ? (
              <span
                onClick={() => {
                  navigate(
                    `/repository/${selectedCluster}?add_repo=true&repo_url=${latestVerData[0].urls[0]}&repo_name=${latestVerData[0].name}`
                  );
                }}
                className="underline text-sm cursor-pointer text-blue-600"
              >
                Add repository for it: {latestVerData[0].repository}
              </span>
            ) : (
              <span
                onClick={() => refetchLatestVersion()}
                className="underline text-xs cursor-pointer"
              >
                {"check for new version".toUpperCase()}
              </span>
            )}
          </div>

          <Rollback release={release} refetchRevisions={refetchRevisions} />
          {release.has_tests ? (
            <>
              {" "}
              <div className="h-1/2">
                <Button
                  onClick={handleRunTests}
                  className="flex items-center gap-2"
                >
                  <BsCheckCircle />
                  Run tests
                </Button>
              </div>
              <Modal
                containerClassNames="w-3/5"
                title="Test results"
                isOpen={showTestsResults}
                onClose={() => setShowTestResults(false)}
              >
                {isRunningTests ? <Spinner /> : displayTestResults()}
              </Modal>{" "}
            </>
          ) : null}

          <div className="h-1/2">
            <Uninstall />
          </div>
        </div>
      </header>
    );
  };

  const canUpgrade = !latestVerData?.[0]?.version
    ? false
    : isNewerVersion(release.chart_ver, latestVerData?.[0]?.version);

  return (
    <div className="flex flex-col px-16 pt-5 gap-3">
      <StatusLabel status={DeploymentStatus.DEPLOYED} />
      <Header />
      <div className="flex flex-row gap-6">
        <span>
          Revision <span className="font-semibold">#{release.revision}</span>
        </span>
        <span>
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
    <span className="bg-[#d6effe] px-2 text-sm">
      <span>{caption}:</span>
      <span className="font-bold"> {text}</span>
    </span>
  );
}

const Rollback = ({
  release,
  refetchRevisions,
}: {
  release: Release;
  refetchRevisions: () => void;
}) => {
  const { chart, namespace, revision } = useParams();
  if (!chart || !namespace || !revision) {
    return null;
  }

  const [showRollbackDiff, setShowRollbackDiff] = useState(false);
  const revisionInt = parseInt(revision || "", 10);
  const prevRevision = revisionInt - 1;
  const response = useGetReleaseInfoByType(
    { chart, namespace, revision, tab: "manifests" },
    `&revisionDiff=${prevRevision}`
  );

  const { mutate: rollbackRelease, isLoading: isRollingBackRelease } =
    useRollbackRelease({
      onSettled: () => {
        refetchRevisions();
      },
    });
  const handleRollback = () => {
    setShowRollbackDiff(true);
  };

  const rollbackTitle = (
    <div className="font-semibold text-lg">
      Rollback <span className="text-red-500">{chart}</span> from revision{" "}
      {release.revision} to {release.revision - 1}
    </div>
  );

  if (release.revision <= 1) return null;

  return (
    <>
      <div className="h-1/2">
        <Button onClick={handleRollback} className="flex items-center gap-2">
          <BsArrowRepeat />
          Rollback to #{release.revision - 1}
        </Button>
      </div>
      <Modal
        title={rollbackTitle}
        isOpen={showRollbackDiff}
        onClose={() => setShowRollbackDiff(false)}
        containerClassNames="w-[800px]"
        actions={[
          {
            id: "1",
            callback: () => {
              rollbackRelease({
                ns: namespace as string,
                name: String(chart),
                revision: release.revision,
              });
              setShowRollbackDiff(false);
            },
            variant: ModalButtonStyle.info,
            isLoading: isRollingBackRelease,
          },
        ]}
      >
        <RollbackModalContent dataResponse={response} />
      </Modal>{" "}
    </>
  );
};

const RollbackModalContent = ({ dataResponse }: { dataResponse: any }) => {
  const { data, isLoading, isSuccess: fetchedDataSuccessfully } = dataResponse;
  const diffElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data && fetchedDataSuccessfully && diffElement?.current) {
      const configuration: Diff2HtmlUIConfig = {
        matching: "lines",
        outputFormat: "side-by-side",
        highlight: true,
        renderNothingWhenEmpty: false,
        rawTemplates: {
          "file-summary-wrapper": '<div class="hidden"></div>', // hide this element
          "generic-line":
            '<tr><td class="{{lineClass}} {{type}}">{{{lineNumber}}}</td><td class="{{type}}"><div class="{{contentClass}} w-auto">{{#prefix}}<span class="d2h-code-line-prefix">{{{prefix}}}</span>{{/prefix}}{{^prefix}}<span class="d2h-code-line-prefix">&nbsp;</span>{{/prefix}}{{#content}}<span class="d2h-code-line-ctn">{{{content}}}</span>{{/content}}{{^content}}<span class="d2h-code-line-ctn"><br></span>{{/content}}</div></td></tr>', // added "w-auto" to most outer div to prevent horizontal scroll
        },
      };
      const diff2htmlUi = new Diff2HtmlUI(
        diffElement.current,
        data,
        configuration
      );
      diff2htmlUi.draw();
      diff2htmlUi.highlightCode();
    }
  }, [data, isLoading, fetchedDataSuccessfully, diffElement?.current]);
  return (
    <div className="flex flex-col space-y-4">
      {data ? (
        <p>Following changes will happen to cluster:</p>
      ) : (
        <p>No changes will happen to cluster</p>
      )}
      <div className="relative" ref={diffElement} />
    </div>
  );
};

const Uninstall = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { namespace = "", chart = "" } = useParams();
  const { data: resources } = useGetResources(namespace, chart, {
    enabled: isOpen,
  });

  const uninstallMutation = useMutation(
    ["uninstall", namespace, chart],
    () =>
      fetch("/api/helm/releases/" + namespace + "/" + chart, {
        method: "delete",
      }),
    {
      onSuccess: () => {
        window.location.href = "/";
      },
    }
  );
  const uninstallTitle = (
    <div className="font-semibold text-lg">
      Uninstall <span className="text-red-500">{chart}</span> from namespace{" "}
      <span className="text-red-500">{namespace}</span>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 hover:bg-red-200"
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
              isLoading: uninstallMutation.isLoading,
            },
          ]}
          containerClassNames="w-[800px]"
        >
          <div>Following resources will be deleted from the cluster:</div>
          <div>
            {resources?.map((resource) => (
              <div className="flex justify-start gap-1 w-full mb-3">
                <span
                  style={{
                    textAlign: "end",
                    paddingRight: "30px",
                  }}
                  className=" w-3/5  italic"
                >
                  {resource.kind}
                </span>
                <span className=" w-4/5 font-semibold">
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
