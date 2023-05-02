import { useState } from "react";
import { ChartVersion, Release } from "../../data/types";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { getAge } from "../../timeUtils";
import StatusLabel from "../common/StatusLabel";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../API/apiService";
import HealthStatus from "./HealthStatus";

type InstalledPackageCardProps = {
  release: Release;
};

export default function InstalledPackageCard({
  release,
}: InstalledPackageCardProps) {
  const navigate = useNavigate();

  const [isMouseOver, setIsMouseOver] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(true);

  const { data: latestVersionResult } = useQuery<ChartVersion>({
    queryKey: ["chartName", release.chartName],
    queryFn: () => apiService.getRepositoryLatestVersion(release.chartName),
  });

  const handleMouseOver = () => {
    setIsMouseOver(true);
  };
  const handleMouseOut = () => {
    setIsMouseOver(false);
  };

  const handleOnClick = () => {
    navigate(
      `/revision/${"docker-desktop"}/${"default"}/${release.name}/${
        release.revision
      }/${"resources"}`,
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
        src={release.icon}
        alt="Helm-DashBoard"
        className="w-[40px] mx-4 col-span-1"
      />

      <div className="col-span-11 text-sm">
        <div className="grid grid-cols-11">
          <div className="col-span-3 font-medium text-lg">{release.name}</div>
          <div className="col-span-3">
            <StatusLabel status={release.status} />
          </div>
          <div className="col-span-2">{release.chart}</div>
          <div className="col-span-1 font-semibold text-xs">
            #{release.revision}
          </div>
          <div className="col-span-1 font-semibold text-xs">
            {release.namespace}
          </div>
          <div className="col-span-1 font-semibold text-xs">
            {getAge(release.updated)}
          </div>
        </div>
        <div className="grid grid-cols-11 text-xs">
          <div className="col-span-3">{release.description}</div>
          <div className="col-span-3">
            <HealthStatus />
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
