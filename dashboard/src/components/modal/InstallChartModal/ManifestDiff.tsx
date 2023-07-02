import {
  Diff2HtmlUI,
  Diff2HtmlUIConfig,
} from "diff2html/lib/ui/js/diff2html-ui-base";
import hljs from "highlight.js";

import { useCallback, useEffect, useRef, useState } from "react";
import Spinner from "../../Spinner";

interface ManifestDiffProps {
  currentVersion: string;
  selectedVersion: string;
  selectedRepo: string;
  chartName: string;
  namespace?: string;
  isUpgrade: boolean;
  versionsError: unknown;
}

export const ManifestDiff = ({
  currentVersion,
  selectedVersion,
  selectedRepo,
  chartName,
  namespace,
  isUpgrade,
  versionsError,
}: ManifestDiffProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [diff, setDiff] = useState("");
  const getVersionManifestFormData = (version: string) => {
    const formData = new FormData();
    formData.append("chart", `${selectedRepo}/${chartName}`);
    formData.append("version", version);
    formData.append("values", "");
    formData.append("preview", "true");
    formData.append("name", chartName);

    return formData;
  };

  const fetchVersionData = async (version: string) => {
    const formData = getVersionManifestFormData(version);
    const fetchUrl = `/api/helm/releases/${namespace ? namespace : "[empty]"}`;
    const response = await fetch(fetchUrl, {
      method: "post",
      body: formData,
    });
    const data = await response.json();
    return data;
  };

  const fetchDiff = useCallback(async () => {
    if (!selectedRepo || versionsError) {
      return;
    }

    if (isUpgrade && selectedVersion === currentVersion) {
      return;
    }

    setIsLoading(true);
    try {
      const [currentVerData, selectedVerData] = await Promise.all([
        selectedVersion !== currentVersion
          ? fetchVersionData(currentVersion)
          : { manifest: "" },
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRepo, selectedVersion, chartName, namespace, isUpgrade]);

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
  }, [diff]);

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
      <div className="flex h-full">
        <p className="text-red-600 text-lg">{String(versionsError)}</p>
      </div>
    );
  }
  return (
    <div ref={diffContainerRef} className="relative overflow-y-auto"></div>
  );
};
