import { useState } from "react";
import { Release } from "../../data/types";
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
import { useParams } from "react-router-dom";

type InstalledPackageCardProps = {
  release: Release;
};

export default function InstalledPackageCard({
  release,
}: InstalledPackageCardProps) {
  const navigate = useNavigateWithSearchParams();

  const { context: selectedCluster } = useParams();
  const [isMouseOver, setIsMouseOver] = useState(false);

  const { data: latestVersionResult } = useGetLatestVersion(release.chartName, {
    queryKey: ["chartName", release.chartName],
    cacheTime: 0,
  });

  const { data: statusData } = useQuery<any>({
    queryKey: ["resourceStatus", release],
    queryFn: () => apiService.getResourceStatus({ release }),
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

    navigate(
      `/${selectedCluster}/${namespace}/${name}/installed/revision/${release.revision}`,
      { state: release }
    );
  };

  const statusColor = getStatusColor(release.status as DeploymentStatus);
  const borderLeftColor: { [key: string]: string } = {
    [DeploymentStatus.DEPLOYED]: "border-l-deployed",
    [DeploymentStatus.FAILED]: "border-l-failed",
    [DeploymentStatus.PENDING]: "border-l-pending",
  };

  return (
    <div
      className={`${
        borderLeftColor[release.status]
      } text-xs grid grid-cols-12 items-center bg-white rounded-md p-2 py-6 my-4 drop-shadow border-l-4 border-l-[${statusColor}] cursor-pointer ${
        isMouseOver && "drop-shadow-lg"
      }`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleOnClick}
    >
      <img
        src={release.icon || HelmGrayIcon}
        alt="helm release icon"
        className="w-[45px] mx-4 col-span-1 min-w-[45px]"
      />

      <div className="col-span-11 -mb-5">
        <div className="grid grid-cols-11">
          <div className="col-span-3 font-bold text-xl mr-0.5 font-roboto-slab">
            {release.name}
          </div>
          <div className="col-span-3">
            <StatusLabel status={release.status} />
          </div>
          <div className="col-span-2 font-bold">{release.chart}</div>
          <div className="col-span-1 font-bold text-xs">
            #{release.revision}
          </div>
          <div className="col-span-1 font-bold text-xs">
            {release.namespace}
          </div>
          <div className="col-span-1 font-bold text-xs">{getAge(release)}</div>
        </div>
        <div
          className="grid grid-cols-11 text-xs mt-3"
          style={{ marginBottom: "12px" }}
        >
          <div className="col-span-3 h-12 line-clamp-3 mr-1">
            {release.description}
          </div>
          <div className="col-span-3">
            {statusData ? (
              <HealthStatus statusData={statusData} />
            ) : (
              <Spinner size={4} />
            )}
          </div>
          <div className="col-span-2 text-[#707583] flex flex-col items">
            <span>CHART VERSION</span>
            {(canUpgrade || installRepoSuggestion) && (
              <div
                className="text-[#0d6efd] flex flex-row items-center gap-1 font-bold"
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
          <div className="col-span-1 text-[#707583]">REVISION</div>
          <div className="col-span-1 text-[#707583]">NAMESPACE</div>
          <div className="col-span-1 text-[#707583]">UPDATED</div>
        </div>
      </div>
    </div>
  );
}
