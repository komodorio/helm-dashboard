import { useQuery } from "@tanstack/react-query";
import apiService from "./apiService";

export const getVersionManifestFormData = ({
  version,
  userValues,
  chart,
  releaseValues,
  releaseName,
}: {
  version: string;
  userValues?: string;
  chart: string;
  releaseValues?: string;
  releaseName?: string;
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
  if (releaseName) {
    formData.append("name", releaseName);
  }

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
  selectedVerData: { [key: string]: string };
  chart: string;
}) => {
  return useQuery(
    [selectedRepo, versionsError, chart, currentVerManifest, selectedVerData],
    async () => {
      const formData = new FormData();
      formData.append("a", currentVerManifest);
      formData.append("b", selectedVerData.manifest);

      const diff = await apiService.fetchWithDefaults("/diff", {
        method: "post",
        body: formData,
      });

      return diff;
    },
    {
      enabled: Boolean(selectedVerData),
    }
  );
};
