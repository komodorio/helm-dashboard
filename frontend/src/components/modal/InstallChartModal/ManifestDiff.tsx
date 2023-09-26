import { Diff2HtmlUI } from "diff2html/lib/ui/js/diff2html-ui-base";
import hljs from "highlight.js";

import { useEffect, useRef } from "react";
import Spinner from "../../Spinner";
import { diffConfiguration } from "../../../utils";

interface ManifestDiffProps {
  diff?: string;
  isLoading: boolean;
  error: string;
}

export const ManifestDiff = ({ diff, isLoading, error }: ManifestDiffProps) => {
  const diffContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoading) {
      // we're listening to isLoading to draw new diffs which are not
      // always rerender, probably because of the use of ref
      return;
    }

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
  }, [diff, isLoading]);

  if (isLoading && !error) {
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

      {error ? (
        <p className="text-red-600 text-lg">
          Failed to get upgrade info: {error.toString()}
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
