import { useQuery } from "@tanstack/react-query";
import apiService from "./apiService";

export const getVersionManifestFormData = ({
  version,
  userValues,
  chart,
  releaseValues,
}: {
  version: string;
  userValues?: string;
  chart: string;
  releaseValues?: string;
}) => {
  const formData = new FormData();
  // preview needs to come first, for some reason it has a meaning at the backend
  formData.append("preview", "true");
  formData.append("chart", chart);
  formData.append("version", version);
  formData.append(
    "values",
    userValues ? userValues : releaseValues ? releaseValues : ""
  );
  return formData;
};

export const useDiffData = ({
  selectedRepo,
  versionsError,
  currentVerManifest,
  selectedVerData,
  chart,
}: {
  selectedRepo: string;
  versionsError: string;
  currentVerManifest: string;
  selectedVerData: Promise<any>;
  chart: string;
}) => {
  return useQuery(
    [selectedRepo, versionsError, chart, currentVerManifest, selectedVerData],
    async () => {
      const formData = new FormData();
      formData.append("a", currentVerManifest);
      formData.append("b", (selectedVerData as any).manifest);

      const response = await apiService.fetchWithDefaults("/diff", {
        method: "post",
        body: formData,
      });

      const diff = await response.text();

      return diff;
    },
    {
      enabled:
        Boolean(selectedRepo) &&
        !versionsError &&
        Boolean(chart) &&
        Boolean(currentVerManifest) &&
        Boolean(selectedVerData),
    }
  );
};
