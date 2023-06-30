import { useState } from "react";
import { ChartVersion, Cluster, Release } from "../../data/types";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { getAge } from "../../timeUtils";
import StatusLabel from "../common/StatusLabel";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../API/apiService";
import HealthStatus from "./HealthStatus";
import HelmGrayIcon from "../../assets/helm-gray-50.svg";
import Spinner from "../Spinner";

type InstalledPackageCardProps = {
  release: Release;
};

export default function InstalledPackageCard({
  release,
}: InstalledPackageCardProps) {
  const navigate = useNavigate();

  const [isMouseOver, setIsMouseOver] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(true);

  const { data: clusters } = useQuery<Cluster[]>({
    queryKey: ["clusters"],
    queryFn: () => apiService.getClusters(),
  });

  const { data: latestVersionResult } = useQuery<ChartVersion>({
    queryKey: ["chartName", release.name],
    queryFn: () => apiService.getRepositoryLatestVersion(release.name),
  });

  const { data: statusData } = useQuery<any>({
    queryKey: ["resourceStatus", release],
    queryFn: () => apiService.getResourceStatus({ release }),
  });

  const handleMouseOver = () => {
    setIsMouseOver(true);
  };
  const handleMouseOut = () => {
    setIsMouseOver(false);
  };

  const handleOnClick = () => {
    const { name, namespace } = release;
    const selectedCluster = clusters?.find((cluster) => cluster.IsCurrent);

    if (!selectedCluster) {
      throw new Error(
        "Couldn't find selected cluster! cannot navigate to revision page"
      );
    }

    navigate(
      `/installed/revision/${selectedCluster?.Name}/${namespace}/${name}/${release.revision}`,
      { state: release }
    );
  };

  return (
    <div
      className={`grid grid-cols-12 items-center bg-white rounded-md p-2 py-6 my-5 drop-shadow border-l-4 border-l-[#1BE99A] cursor-pointer ${
        isMouseOver && "drop-shadow-lg"
      }`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleOnClick}
    >
      <img
        src={release.icon || HelmGrayIcon}
        alt="helm release icon"
        className="w-[40px] mx-4 col-span-1"
      />

      <div className="col-span-11 text-sm">
        <div className="grid grid-cols-11">
          <div className="col-span-3 font-bold text-xl mr-0.5">
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
          <div className="col-span-1 font-bold text-xs">
            {getAge(release.updated)}
          </div>
        </div>
        <div className="grid grid-cols-11 text-xs mt-3">
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
            {showUpgrade && (
              <span
                className="text-[#0d6efd] flex flex-row items-center gap-1 font-bold"
                title={`upgrade available: ${latestVersionResult?.version} from ${latestVersionResult?.repository}`}
              >
                <BsArrowUpCircleFill />
                UPGRADE
              </span>
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
