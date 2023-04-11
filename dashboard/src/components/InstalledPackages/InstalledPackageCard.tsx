import { useState } from "react";
import { InstalledPackage } from "../../data/types";
import { BsArrowUpCircleFill } from "react-icons/bs";

type InstalledPackageCardProps = {
  installedPackage: InstalledPackage;
};

export default function InstalledPackageCard({
  installedPackage,
}: InstalledPackageCardProps) {
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(true);

  const handleMouseOver = () => {
    setIsMouseOver(true);
  };
  const handleMouseOut = () => {
    setIsMouseOver(false);
  };

  return (
    <div
      className={`grid grid-cols-12 items-center bg-white rounded-md p-2 py-6 my-5 drop-shadow border-l-4 border-l-[#1BE99A] cursor-pointer ${
        isMouseOver && "drop-shadow-lg"
      }`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <img
        src={installedPackage.image}
        alt="Helm-DashBoard"
        className="w-[40px] mx-4 col-span-1"
      />

      <div className="col-span-11 text-sm">
        <div className="grid grid-cols-11">
          <div className="col-span-3 font-medium text-lg">
            {installedPackage.name}
          </div>
          <div className="col-span-3">
            <span className="text-[#1FA470] font-bold text-xs">
              ● DEPLOYED
            </span>
          </div>
          <div className="col-span-2">
            {" "}
            {installedPackage.name}-{installedPackage.version}
          </div>
          <div className="col-span-1 font-semibold text-xs">#{installedPackage.revision}</div>
          <div className="col-span-1 font-semibold text-xs">default</div>
          <div className="col-span-1 font-semibold text-xs">{installedPackage.lastUpdated}</div>
        </div>
        <div className="grid grid-cols-11 text-xs">
          <div className="col-span-3">{installedPackage.description}</div>
          <div className="col-span-3"></div>
          <div className="col-span-2 text-[#707583] flex flex-col items">
            <span>CHART VERSION</span>
            {showUpgrade && (
              <span className="text-[#0d6efd] flex flex-row items-center gap-1 font-bold">
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
