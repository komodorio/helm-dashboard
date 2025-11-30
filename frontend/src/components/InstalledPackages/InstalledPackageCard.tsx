import { useState } from "react";
import { Release, ReleaseHealthStatus } from "../../data/types";
import { BsArrowUpCircleFill, BsPlusCircleFill } from "react-icons/bs";
import { getAge } from "../../timeUtils";
import StatusLabel, {
  DeploymentStatus,
  getStatusColor,
} from "../common/StatusLabel";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../API/apiService";
import HealthStatus from "./HealthStatus";
import HelmGrayIcon from "../../assets/helm-gray-50.svg";
import Spinner from "../Spinner";
import { useGetLatestVersion } from "../../API/releases";
import { isNewerVersion } from "../../utils";
import { LatestChartVersion } from "../../API/interfaces";
import useNavigateWithSearchParams from "../../hooks/useNavigateWithSearchParams";
import { useInView } from "react-intersection-observer";

type InstalledPackageCardProps = {
  release: Release;
};

export default function InstalledPackageCard({
  release,
}: InstalledPackageCardProps) {
  const navigate = useNavigateWithSearchParams();

  const [isMouseOver, setIsMouseOver] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });
  const { data: latestVersionResult } = useGetLatestVersion(release.chartName, {
    queryKey: ["chartName", release.chartName],
  });

  const { data: statusData } = useQuery<ReleaseHealthStatus[] | null>({
    queryKey: ["resourceStatus", release],
    queryFn: () => apiService.getResourceStatus({ release }),
    enabled: inView,
  });

  const latestVersionData: LatestChartVersion | undefined =
    latestVersionResult?.[0];

  const canUpgrade =
    !latestVersionData?.version || !release.chartVersion
      ? false
      : isNewerVersion(release.chartVersion, latestVersionData?.version);

  const installRepoSuggestion = latestVersionData?.isSuggestedRepo
    ? latestVersionData.repository
    : null;

  const handleMouseOver = () => {
    setIsMouseOver(true);
  };

  const handleMouseOut = () => {
    setIsMouseOver(false);
  };

  const handleOnClick = () => {
    const { name, namespace } = release;
    navigate(`/${namespace}/${name}/installed/revision/${release.revision}`, {
      state: release,
    });
  };

  const statusColor = getStatusColor(release.status as DeploymentStatus);
  const borderLeftColor: { [key: string]: string } = {
    [DeploymentStatus.DEPLOYED]: "border-l-border-deployed",
    [DeploymentStatus.FAILED]: "border-l-text-danger",
    [DeploymentStatus.PENDING]: "border-l-border",
  };

  return (
    <div
      ref={ref}
      className={`${
        borderLeftColor[release.status]
      } custom-shadow my-2 grid grid-cols-12 items-center rounded-md border-l-4 bg-white p-2 py-6 text-xs border-l-[${statusColor}] cursor-pointer ${
        isMouseOver && "custom-shadow-lg"
      }`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleOnClick}
    >
      <img
        src={release.icon || HelmGrayIcon}
        alt="helm release icon"
        className="col-span-1 mx-4 w-[45px] min-w-[45px]"
      />

      <div className="col-span-11 -mb-5">
        <div className="grid grid-cols-11">
          <div className="col-span-3 mr-0.5 font-roboto-slab text-xl font-bold">
            {release.name}
          </div>
          <div className="col-span-3">
            <StatusLabel status={release.status} />
          </div>
          <div className="col-span-2 font-bold">{release.chart}</div>
          <div className="col-span-1 text-xs font-bold">
            #{release.revision}
          </div>
          <div className="col-span-1 text-xs font-bold">
            {release.namespace}
          </div>
          <div className="col-span-1 text-xs font-bold">{getAge(release)}</div>
        </div>
        <div
          className="mt-3 grid grid-cols-11 text-xs"
          style={{ marginBottom: "12px" }}
        >
          <div className="col-span-3 mr-1 line-clamp-3 h-12">
            {release.description}
          </div>
          <div className="col-span-3 mr-2">
            {statusData ? (
              <HealthStatus statusData={statusData} />
            ) : (
              <Spinner size={4} />
            )}
          </div>
          <div className="items col-span-2 flex flex-col text-muted">
            <span>CHART VERSION</span>
            {(canUpgrade || installRepoSuggestion) && (
              <div
                className="flex flex-row items-center gap-1 font-bold text-upgradable"
                title={`upgrade available: ${latestVersionData?.version} from ${latestVersionData?.repository}`}
              >
                {canUpgrade && !installRepoSuggestion ? (
                  <>
                    <BsArrowUpCircleFill />
                    UPGRADE
                  </>
                ) : (
                  <>
                    <BsPlusCircleFill />
                    ADD REPO
                  </>
                )}
              </div>
            )}
          </div>
          <div className="col-span-1 text-muted">REVISION</div>
          <div className="col-span-1 text-muted">NAMESPACE</div>
          <div className="col-span-1 text-muted">UPDATED</div>
        </div>
      </div>
    </div>
  );
}
