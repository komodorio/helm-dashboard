import { ChangeEvent, useMemo, useState, useRef, useEffect } from "react";
import { Diff2HtmlUI, Diff2HtmlUIConfig } from 'diff2html/lib/ui/js/diff2html-ui-slim.js';
import { useGetReleaseInfoByType } from "../../API/releases";
import { useParams, useSearchParams } from "react-router-dom";
import parse from 'html-react-parser';

import hljs from "highlight.js";
import Spinner from "../Spinner";

type RevisionDiffProps = {
  includeUserDefineOnly?: boolean;
};

const TAB_VIEW_VIEW_ONLY = 'view';
const TAB_VIEW_DIFF_PREV = 'diff-with-previous';
const TAB_VIEW_DIFF_SPECIFIC = 'diff-with-specific-revision';

function RevisionDiff({ includeUserDefineOnly }: RevisionDiffProps) {
  const [tabView, setTabView] = useState(TAB_VIEW_VIEW_ONLY);
  const [specificVersion, setSpecificVersion] = useState("1");
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const diffElement = useRef<HTMLElement>({});

  const handleChanged = (e: ChangeEvent<HTMLInputElement>) => {
    setTabView(e.target.value);
  };
  const params = useParams();
  const revisionInt = parseInt(params.revision || '', 10)
  const hasMultipleRevisions = revisionInt > 1;

  const additionalParams = useMemo(() => {
      if (tabView === TAB_VIEW_DIFF_PREV && hasMultipleRevisions) {
        return `&revisionDiff=${revisionInt - 1}`
      }
      const specificRevisionInt = parseInt(specificVersion || '', 10);
      if (tabView === TAB_VIEW_DIFF_SPECIFIC && hasMultipleRevisions && !Number.isNaN(specificRevisionInt)) {
        return `&revisionDiff=${specificVersion}`
      }
  }, [tabView, specificVersion, revisionInt, hasMultipleRevisions]);

  const hasRevisionToDiff = !!additionalParams;

  const {data, isLoading, isSuccess: fetchedDataSuccessfully} = useGetReleaseInfoByType({...params, tab}, additionalParams);

  const content = useMemo(() => {
    if (data && !isLoading && (tabView === TAB_VIEW_VIEW_ONLY || !hasRevisionToDiff)) {  
      return hljs.highlight(data, { language: "yaml" }).value;
    }
    return '';
  }, [data, tabView, isLoading]);

  useEffect(() => {
    if (tabView !== TAB_VIEW_VIEW_ONLY && hasRevisionToDiff && data && !isLoading) {
      const configuration : Diff2HtmlUIConfig = {
        
        matching: 'lines',
        outputFormat: 'side-by-side',
      
        highlight: true,
        renderNothingWhenEmpty: false,
      };
      const diff2htmlUi = new Diff2HtmlUI(diffElement.current, data, configuration);
      diff2htmlUi.draw();
      diff2htmlUi.highlightCode();
      
    } else if (tabView === TAB_VIEW_VIEW_ONLY) {
      diffElement.current.innerHTML = '';
      
    } else if (fetchedDataSuccessfully && (!hasRevisionToDiff || !data)) {
      diffElement.current.innerHTML = 'No differences to display';
      
    }
  }, [tabView, hasRevisionToDiff, data, isLoading, fetchedDataSuccessfully, diffElement]);
  return (
    <div>
      <div className="flex mb-3 p-2 border border-[#DCDDDF] flex-row items-center justify-between w-full bg-white rounded">
        <div className="flex items-center">
          <input
            checked={tabView === "view"}
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
            checked={tabView === "diff-with-previous"}
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
            checked={tabView === "diff-with-specific-revision"}
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
                onChange={e => setSpecificVersion(e.target.value)}
              ></input>
            </div>
          </label>
        </div>
        {includeUserDefineOnly && (
          <div className="flex items-center">
            <input
              id="user-define-only-checkbox"
              type="checkbox"
              value=""
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
      {isLoading ? <Spinner /> : ''}
      {tabView  === TAB_VIEW_VIEW_ONLY && content ? (
        <div className="bg-white overflow-x-auto w-full relative">
          <pre className="bg-white rounded p-3">
                {parse(content)}
          </pre>  
        </div>
      ) : ''}
      <div className="bg-white overflow-x-auto w-full relative" ref={diffElement}>
        
      </div>
    </div>
  );
}

export default RevisionDiff;
