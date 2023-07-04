import {
  Diff2HtmlUI,
  Diff2HtmlUIConfig,
} from "diff2html/lib/ui/js/diff2html-ui-base";
import hljs from "highlight.js";

import { useEffect, useRef } from "react";
import Spinner from "../../Spinner";

interface ManifestDiffProps {
  diff: string;
  fetchDiff: () => void;
  versionsError: unknown;
  isLoading: boolean;
}

export const ManifestDiff = ({
  diff,
  fetchDiff,
  versionsError,
  isLoading,
}: ManifestDiffProps) => {
  useEffect(() => {
    fetchDiff();
  }, [fetchDiff]);

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
        configuration,
        hljs
      );
      diff2htmlUi.draw();
      diff2htmlUi.highlightCode();
    }
  }, [diff, diffContainerRef.current]);

  if (isLoading) {
    return (
      <div>
        <Spinner />
        Loading diff...
      </div>
    );
  }

  if (versionsError !== null) {
    return (
      <div className="flex ">
        <p className="text-red-600 text-lg">{String(versionsError)}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-lg">Manifest changes:</h4>
      {diff ? (
        <div ref={diffContainerRef} className="relative overflow-y-auto "></div>
      ) : (
        <pre>No changes will happen to the cluster</pre>
      )}
    </div>
  );
};
