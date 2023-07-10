import { Diff2HtmlUI } from "diff2html/lib/ui/js/diff2html-ui-base";
import hljs from "highlight.js";

import { useEffect, useRef } from "react";
import Spinner from "../../Spinner";
import { diffConfiguration } from "../../../utils";

interface ManifestDiffProps {
  diff: string;
  versionsError: unknown;
  isLoading: boolean;
}

export const ManifestDiff = ({
  diff,
  versionsError,
  isLoading,
}: ManifestDiffProps) => {
  const diffContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (diff && diffContainerRef.current) {
      const diff2htmlUi = new Diff2HtmlUI(
        diffContainerRef.current,
        diff,
        diffConfiguration,
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
      <h4 className="text-xl">Manifest changes:</h4>
      {diff ? (
        <div
          ref={diffContainerRef}
          className="relative overflow-y-auto leading-5"
        ></div>
      ) : (
        <pre className="font-roboto text-lg">
          No changes will happen to the cluster
        </pre>
      )}
    </div>
  );
};
