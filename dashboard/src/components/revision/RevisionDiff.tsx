import React, { ChangeEvent, useState } from "react";

type RevisionDiffProps = {
  includeUserDefineOnly?: boolean;
};

function RevisionDiff({ includeUserDefineOnly }: RevisionDiffProps) {
  const [notesContent, setNotesContent] = useState("view");

  const handleChanged = (e: ChangeEvent<HTMLInputElement>) => {
    setNotesContent(e.target.value);
  };

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
      <div className="bg-white w-full min-h-[200px]">
        <pre className="bg-white rounded p-3">{notesContent}</pre>
      </div>
    </div>
  );
}

export default RevisionDiff;
