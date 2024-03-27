import { ChangeEvent, useMemo, useState, useRef, useEffect } from "react";
import { Diff2HtmlUI } from "diff2html/lib/ui/js/diff2html-ui-slim.js";
import { useGetReleaseInfoByType } from "../../API/releases";
import { useParams } from "react-router-dom";
import useCustomSearchParams from "../../hooks/useCustomSearchParams";

import parse from "html-react-parser";

import hljs from "highlight.js";
import Spinner from "../Spinner";
import { diffConfiguration } from "../../utils";

type RevisionDiffProps = {
  includeUserDefineOnly?: boolean;
  latestRevision: number;
};

const VIEW_MODE_VIEW_ONLY = "view";
const VIEW_MODE_DIFF_PREV = "diff-with-previous";
const VIEW_MODE_DIFF_SPECIFIC = "diff-with-specific-revision";

function RevisionDiff({
  includeUserDefineOnly,
  latestRevision,
}: RevisionDiffProps) {
  const params = useParams();

  const [specificVersion, setSpecificVersion] = useState(latestRevision);
  const {
    searchParamsObject: searchParams,
    upsertSearchParams,
    removeSearchParam,
  } = useCustomSearchParams();
  const {
    tab,
    mode: viewMode = VIEW_MODE_VIEW_ONLY,
    "user-defined": userDefinedValue,
  } = searchParams;

  //@ts-ignore
  const diffElement = useRef<HTMLElement>({});

  const handleChanged = (e: ChangeEvent<HTMLInputElement>) => {
    upsertSearchParams("mode", e.target.value);
  };

  const handleUserDefinedCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      upsertSearchParams("user-defined", `${e.target.checked}`);
    } else {
      removeSearchParam("user-defined");
    }
  };
  const revisionInt = parseInt(params.revision || "", 10);
  const hasMultipleRevisions = revisionInt > 1;

  const additionalParams = useMemo(() => {
    let additionalParamStr = "";
    if (userDefinedValue) {
      additionalParamStr += "&userDefined=true";
    }
    if (viewMode === VIEW_MODE_DIFF_PREV && hasMultipleRevisions) {
      additionalParamStr += `&revisionDiff=${revisionInt - 1}`;
    }
    const specificRevisionInt = parseInt(specificVersion?.toString() || "", 10);
    if (
      viewMode === VIEW_MODE_DIFF_SPECIFIC &&
      hasMultipleRevisions &&
      !Number.isNaN(specificRevisionInt)
    ) {
      additionalParamStr += `&revisionDiff=${specificVersion}`;
    }
    return additionalParamStr;
  }, [
    viewMode,
    userDefinedValue,
    specificVersion,
    revisionInt,
    hasMultipleRevisions,
  ]);
  const hasRevisionToDiff = !!additionalParams;

  const {
    data,
    isLoading,
    isSuccess: fetchedDataSuccessfully,
  } = useGetReleaseInfoByType({ ...params, tab }, additionalParams);

  const content = useMemo(() => {
    if (
      data &&
      !isLoading &&
      (viewMode === VIEW_MODE_VIEW_ONLY || !hasRevisionToDiff)
    ) {
      return hljs.highlight(data, { language: "yaml" }).value;
    }
    if (fetchedDataSuccessfully && !data && viewMode === VIEW_MODE_VIEW_ONLY) {
      return "No value to display";
    }
    return "";
  }, [data, isLoading, viewMode, hasRevisionToDiff, fetchedDataSuccessfully]);

  useEffect(() => {
    if (
      viewMode !== VIEW_MODE_VIEW_ONLY &&
      hasRevisionToDiff &&
      data &&
      !isLoading
    ) {
      const diff2htmlUi = new Diff2HtmlUI(
        diffElement!.current!,
        data,
        diffConfiguration
      );
      diff2htmlUi.draw();
      diff2htmlUi.highlightCode();
    } else if (viewMode === VIEW_MODE_VIEW_ONLY && diffElement.current) {
      diffElement.current.innerHTML = "";
    } else if (
      fetchedDataSuccessfully &&
      (!hasRevisionToDiff || !data) &&
      diffElement.current
    ) {
      diffElement.current.innerHTML = "No differences to display";
    }
  }, [
    viewMode,
    hasRevisionToDiff,
    data,
    isLoading,
    fetchedDataSuccessfully,
    diffElement,
  ]);

  return (
    <div>
      <div className="flex mb-3 p-2 border border-revision flex-row items-center justify-between w-full bg-white rounded">
        <div className="flex items-center">
          <input
            checked={viewMode === "view"}
            onChange={handleChanged}
            id="view"
            type="radio"
            value="view"
            name="notes-view"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
          />
          <label
            htmlFor="view"
            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            View
          </label>
        </div>
        <div className="flex items-center">
          <input
            checked={viewMode === "diff-with-previous"}
            onChange={handleChanged}
            id="diff-with-previous"
            type="radio"
            value="diff-with-previous"
            name="notes-view"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
          />
          <label
            htmlFor="diff-with-previous"
            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Diff with previous
          </label>
        </div>
        <div className="flex items-center">
          <input
            checked={viewMode === "diff-with-specific-revision"}
            onChange={handleChanged}
            id="diff-with-specific-revision"
            type="radio"
            value="diff-with-specific-revision"
            name="notes-view"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
          />
          <label
            htmlFor="diff-with-specific-revision"
            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            <div>
              Diff with specific revision:
              <input
                className="border ml-2 border-gray-500 w-10 p-1 rounded-sm"
                type="text"
                value={specificVersion}
                onChange={(e) => setSpecificVersion(Number(e.target.value))}
              ></input>
            </div>
          </label>
        </div>
        {includeUserDefineOnly && (
          <div className="flex items-center">
            <input
              id="user-define-only-checkbox"
              type="checkbox"
              onChange={handleUserDefinedCheckbox}
              checked={!!userDefinedValue}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor="user-define-only-checkbox"
              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              User-defined only
            </label>
          </div>
        )}
      </div>
      {isLoading ? <Spinner /> : ""}
      {viewMode === VIEW_MODE_VIEW_ONLY && content ? (
        <div className="bg-white overflow-x-auto w-full p-3 relative">
          <pre className="bg-white rounded font-sf-mono">{parse(content)}</pre>
        </div>
      ) : (
        ""
      )}
      <div
        className="bg-white w-full relative leading-5 font-sf-mono"
        //@ts-ignore
        ref={diffElement}
      ></div>
    </div>
  );
}

export default RevisionDiff;
