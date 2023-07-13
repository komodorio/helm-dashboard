import { useGetVersions } from "../../../API/releases";
import { isNewerVersion } from "../../../utils";
import { Version } from "./VersionToInstall";

export const useVersions = ({chartName, currentlyInstalledChartVersion}: {chartName: string, currentlyInstalledChartVersion?: string}) => {
  const { error: versionsError, data: _versions } = useGetVersions(chartName, {
    select: (data) => {
      return data?.sort((a, b) =>
        isNewerVersion(a.version, b.version) ? 1 : -1
      );
    },
  });

  return _versions?.map((v) => ({
    ...v,
    isInstalledVersion: v.version === currentlyInstalledChartVersion,
  }) as Version);
}