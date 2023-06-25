import React, { ChangeEvent, useMemo, useState, useRef } from "react";
import { Diff2HtmlUI, Diff2HtmlUIConfig } from 'diff2html/lib/ui/js/diff2html-ui-slim.js';
import { useGetReleaseInfoByType } from "../../API/releases";
import { useParams } from "react-router-dom";

import hljs from "highlight.js";
import { marked } from "marked";

type RevisionDiffProps = {
  includeUserDefineOnly?: boolean;
};

function RevisionDiff({ includeUserDefineOnly }: RevisionDiffProps) {
  const [notesContent, setNotesContent] = useState("view");
  const diffElement = useRef<HTMLElement>({});
  const handleChanged = (e: ChangeEvent<HTMLInputElement>) => {
    setNotesContent(e.target.value);
  };
  const params = useParams();
  
  const additionalParams = useMemo(() => {
      const revisionInt = parseInt(params.revision || '', 10)
      if (notesContent === "diff-with-previous" && revisionInt > 1) {
        return `&revisionDiff=${revisionInt - 1}`
      }
  }, [notesContent, params]);
  const {data, isLoading} = useGetReleaseInfoByType(params, additionalParams)

  const content = useMemo(() => {
    if (data && !isLoading) {
      switch (notesContent) {
        case "view": {
          const val = hljs.highlight(data, { language: "yaml" }).value;
          return (
            <pre
              className="bg-white rounded p-3"
              dangerouslySetInnerHTML={{
                __html: marked(val),
              }}
            >
              </pre>
          );
        }
        case "diff-with-previous": {
          const configuration : Diff2HtmlUIConfig = {
          
            matching: 'lines',
            outputFormat: 'side-by-side',
          
            highlight: true,
            renderNothingWhenEmpty: false,
          };
          const diff2htmlUi = new Diff2HtmlUI(diffElement.current, data, configuration);
          diff2htmlUi.draw();
          diff2htmlUi.highlightCode();
        }
      }
    }
    return '';
  }, [data, notesContent, isLoading]);

  return (
    <div>
      <div className="flex mb-3 p-2 border border-[#DCDDDF] flex-row items-center justify-between w-full bg-white rounded">
        <div className="flex items-center">
          <input
            checked={notesContent === "view"}
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
            checked={notesContent === "diff-with-previous"}
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
            checked={notesContent === "diff-with-specific-revision"}
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
                value="1"
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
      <div className="bg-white w-full relative" ref={diffElement}>
        {content}
      </div>
    </div>
  );
}

export default RevisionDiff;
