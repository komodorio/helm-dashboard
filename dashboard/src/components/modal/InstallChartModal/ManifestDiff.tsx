import { Diff2HtmlUI } from "diff2html/lib/ui/js/diff2html-ui-base";
import hljs from "highlight.js";

import { useEffect, useRef } from "react";
import Spinner from "../../Spinner";
import { diffConfiguration } from "../../../utils";
import { Loadable } from "../../../types";

interface ManifestDiffProps {
  diff: Loadable<string>;
}

export const ManifestDiff = ({ diff }: ManifestDiffProps) => {
  const diffContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (diff.state === 'hasValue' && diffContainerRef.current) {
      const diff2htmlUi = new Diff2HtmlUI(
        diffContainerRef.current,
        diff.value,
        diffConfiguration,
        hljs
      );
      diff2htmlUi.draw();
      diff2htmlUi.highlightCode();
    }
  }, [diff.state, diff, diffContainerRef.current]);

  if (diff.state === 'loading') {
    return (
      <div className="flex text-lg items-end">
        <Spinner />
        Calculating diff...
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xl">Manifest changes:</h4>

      {diff.state === 'error' ? (
        <p className="text-red-600 text-lg">
          Failed to get upgrade info: {diff.error}
        </p>
      ) : diff ? (
        <div
          ref={diffContainerRef}
          className="relative overflow-y-auto leading-5"
        ></div>
      ) : (
        <pre className="font-roboto text-base">
          No changes will happen to the cluster
        </pre>
      )}
    </div>
  );
};
