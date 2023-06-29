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
  BsCheckCircle,
} from "react-icons/bs";
import { Release } from "../../data/types";
import StatusLabel from "../common/StatusLabel";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetReleaseInfoByType } from "../../API/releases";

import RevisionDiff from "./RevisionDiff";
import RevisionResource from "./RevisionResource";
import Tabs from "../Tabs";
import {
  useGetChartValues,
  useGetLatestVersion,
  useGetResources,
  useGetVersions,
  useRollbackRelease,
  useTestRelease,
} from "../../API/releases";
import { useMutation } from "@tanstack/react-query";
import Modal, { ModalButtonStyle } from "../modal/Modal";
import Spinner from "../Spinner";
import { marked } from "marked";
import hljs from "highlight.js";
import useAlertError from "../../hooks/useAlertError";

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

    runTests({
      ns: namespace,
      name: chart,
    });
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

  return (
    <div className="flex flex-col px-16 pt-5 gap-3">
      <StatusLabel status="deployed" />
      <div className="flex justify-between">
        <span className="text-[#3d4048] text-4xl">{chart}</span>
        <div className="flex flex-row gap-3">
          <div className="flex flex-col">
            <button onClick={() => setIsReconfigureModalOpen(true)}>
              <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                {isLoadingLatestVersion || isRefetchingLatestVersion ? (
                  <>
                    <BsHourglassSplit />
                    Checking...
                  </>
                ) : (
                  <>
                    <BsPencil />
                    Reconfigure
                  </>
                )}
              </span>
            </button>
            <ReconfigureModal
              isOpen={isReconfigureModalOpen}
              release={release}
              onClose={() => {
                setIsReconfigureModalOpen(false);
              }}
            />
            {latestVerData?.[0]?.isSuggestedRepo ? (
              <a
                onClick={() => {
                  console.log("implement redirect to repository");
                }}
                className="underline text-sm cursor-pointer"
              >
                Add repository for it: {latestVerData[0].repository}
              </a>
            ) : (
              <span
                onClick={() => refetchLatestVersion()}
                className="underline text-sm cursor-pointer"
              >
                check for new version
              </span>
            )}
          </div>

          <Rollback release={release} refetchRevisions={refetchRevisions} />
          {release.has_tests ? (
            <>
              {" "}
              <div className="h-1/2">
                <button onClick={handleRunTests}>
                  <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                    <BsCheckCircle />
                    Run tests
                  </span>
                </button>
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
      </div>
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
      <span>{release.description}</span>
      <Tabs tabs={revisionTabs} selectedTab={selectedTab} />
    </div>
  );
}

function RevisionTag({ caption, text }: RevisionTagProps) {
  return (
    <span className="bg-[#d6effe] px-2">
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
        <button onClick={handleRollback}>
          <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
            <BsArrowRepeat />
            Rollback to #{release.revision - 1}
          </span>
        </button>
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
                ns: namespace,
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

const RollbackModalContent = ({dataResponse}) => {
  const {data, isLoading, isSuccess: fetchedDataSuccessfully} = dataResponse;
  const diffElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data && fetchedDataSuccessfully && diffElement?.current) {
      const configuration : Diff2HtmlUIConfig = {
        matching: 'lines',
        outputFormat: 'side-by-side',
        highlight: true,
        renderNothingWhenEmpty: false,
        rawTemplates: {
          "file-summary-wrapper": '<div class="hidden"></div>', // hide this element
          "generic-line":
            '<tr><td class="{{lineClass}} {{type}}">{{{lineNumber}}}</td><td class="{{type}}"><div class="{{contentClass}} w-auto">{{#prefix}}<span class="d2h-code-line-prefix">{{{prefix}}}</span>{{/prefix}}{{^prefix}}<span class="d2h-code-line-prefix">&nbsp;</span>{{/prefix}}{{#content}}<span class="d2h-code-line-ctn">{{{content}}}</span>{{/content}}{{^content}}<span class="d2h-code-line-ctn"><br></span>{{/content}}</div></td></tr>', // added "w-auto" to most outer div to prevent horizontal scroll
        },
      };
      const diff2htmlUi = new Diff2HtmlUI(diffElement.current, data, configuration);
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
      fetch(
        // Todo: Change to BASE_URL from env
        "/api/helm/releases/" + namespace + "/" + chart,
        {
          method: "delete",
        }
      ),
    {
      onSuccess: () => {
        window.location.href = "/";
      },
      onError: () => {
        // An error happened!
        console.log(`rolling back optimistic update with id `);
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
      <button onClick={() => setIsOpen(true)}>
        <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
          <BsTrash3 />
          Uninstall
        </span>
      </button>
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
                <span className=" w-3/5  italic">{resource.kind}</span>
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

const ReconfigureModal = ({
  isOpen,
  onClose,
  release,
}: {
  isOpen: boolean;
  onClose: () => void;
  release: Release;
}) => {
  const navigate = useNavigate();
  const { chart_ver } = release;
 
  const [selectedRepo, setSelectedRepo] = useState("");
  const [userValues, setUserValues] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { chart_name } = release;
  const { data: versions } = useGetVersions(chart_name);
  const { context: clusterName, namespace, chart } = useParams();

  const [selectedVersion, setSelectedVersion] = useState(chart_ver);

  const { data: chartValues, refetch: refetchChartValues } = useGetChartValues(
    namespace || "",
    chart_name,
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
      formData.append("chart", `${selectedRepo}/${chart_name}`);
      formData.append("version", selectedVersion);
      formData.append("values", userValues);

      const res = await fetch(
        // Todo: Change to BASE_URL from env
        "/api/helm/releases/" + namespace + "/" + chart,
        {
          method: "post",
          body: formData,
        }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    {
      onSuccess: async (res) => {
        onClose();
        navigate(`/`);
      },
      onError: (error, variables, context) => {
        setErrorMessage(error?.message || "Failed to update");
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
  }, [selectedRepo, selectedVersion]);

  const VersionToInstall = () => {
    const currentVersion = `current version is: ${chart_ver}`;

    return (
      <div>
        {versions?.length ? (
          <>
            Version to install:{" "}
            <select
              className="border-2 text-blue-500 rounded"
              onChange={(e) => setSelectedVersion(e.target.value)}
              value={selectedVersion}
              defaultValue={chart_ver}
            >
              {versions?.map(({ repository, version }) => (
                <option
                  value={version}
                  key={version}
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
      onClose={onClose}
      title={`Upgrade ${release.chart_name}`}
      containerClassNames="w-5/6"
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
      <GeneralDetails {...release} />
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues val={userValues} setVal={setUserValues} />
        <ChartValues chartValues={chartValues} />
      </div>

      <ManifestDiff
        currentVersion={chart_ver}
        selectedVersion={selectedVersion}
        selectedRepo={selectedRepo}
        chart_name={chart_name}
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
const UserDefinedValues = ({ val, setVal }: { val: string; setVal: any }) => {
  return (
    <div className="w-1/2">
      <label
        className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
        htmlFor="grid-user-defined-values"
      >
        User defined values:
      </label>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={14}
        className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none"
      ></textarea>
    </div>
  );
};

const GeneralDetails = ({ chart_name }: { chart_name: string }) => {
  const { context, namespace } = useParams();

  return (
    <div className="flex gap-8">
      <div>
        <h4>Release name:</h4>
        <div className="p-2 bg-gray-200 rounded">{chart_name}</div>
      </div>
      <div>
        <h4>Namespace (optional):</h4>
        <div className="p-2 bg-gray-200 rounded">{namespace}</div>
      </div>
      <div>
        <h4>Cluster:</h4>
        <div className="p-2 bg-gray-200 rounded">{context}</div>
      </div>
    </div>
  );
};

const ChartValues = ({ chartValues }: { chartValues: string }) => {
  return (
    <div className="w-1/2">
      <label
        className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
        htmlFor="grid-user-defined-values"
      >
        Chart value reference
      </label>
      <pre
        className=" w-1/2 bg-gray-100 rounded p-4 font-medium text-md w-full max-h-[300px] block overflow-y-auto"
        dangerouslySetInnerHTML={{
          __html: marked(
            hljs.highlight(chartValues || "", { language: "yaml" }).value
          ),
        }}
      />
    </div>
  );
};

const ManifestDiff = ({
  currentVersion,
  selectedVersion,
  selectedRepo,
  chart_name,
}: {
  currentVersion: string;
  selectedVersion: string;
  selectedRepo: string;
  chart_name: string;
}) => {
  const { namespace, chart } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const [diff, setDiff] = useState("");
  const getVersionManifestFormData = (version: string) => {
    const formData = new FormData();
    formData.append("chart", `${selectedRepo}/${chart_name}`);
    formData.append("version", version);
    formData.append("values", "");
    formData.append("preview", "true");

    return formData;
  };

  const fetchVersionData = async (version: string) => {
    const formData = getVersionManifestFormData(version);
    const response = await fetch(
      `/api/helm/releases/${namespace}/${chart}`,
      {
        method: "post",
        body: formData,
      }
    );
    const data = await response.json();
    return data;
  };

  const fetchDiff = async () => {
    const [currentVerData, selectedVerData] = await Promise.all([
      fetchVersionData(currentVersion),
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
  };

  useEffect(() => {
    if (selectedVersion !== currentVersion) {
      fetchDiff();
    }
  }, [selectedVersion]);
  const diffContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (diff && diffContainerRef.current) {
      const configuration: Diff2HtmlUIConfig = {
        matching: "lines",
        outputFormat: "side-by-side",
        highlight: true,
        renderNothingWhenEmpty: false,
      };
      const diff2htmlUi = new Diff2HtmlUI(
        diffContainerRef.current,
        diff,
        configuration
      );
      diff2htmlUi.draw();
      diff2htmlUi.highlightCode();
    }
  }, [diff]);
  if (isLoading) {
    return (
      <div>
        <Spinner />
        Loading diff...
      </div>
    );
  }
  return (
    <div ref={diffContainerRef} className="relative overflow-y-auto"></div>
  );
};
