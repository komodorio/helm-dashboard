import HeaderLogo from "../../assets/packges-header.svg";
import { Release } from "../../data/types";

type InstalledPackagesHeaderProps = {
  installedPackages: Release[];
};

export default function InstalledPackagesHeader({
  installedPackages,
}: InstalledPackagesHeaderProps) {
  return (
    <div className="drop-shadow">
      <div className="flex items-center justify-between bg-white rounded-t-md p-2">
        <div className="flex items-center">
          <img
            src={HeaderLogo}
            alt="Helm-DashBoard"
            className="display-inline h-12 ml-3 w-[140px] "
          />
          <h2 className="display-inline font-bold text-xl ">{`Installed Charts (${installedPackages.length})`}</h2>
        </div>

        <div className="w-1/4">
          <input
            className="border-2 border-inherit rounded-md p-1 placeholder:text-black w-11/12"
            placeholder="Filter..."
            type="text"
          />
        </div>
      </div>
      <div className="grid grid-cols-12 text-xs font-medium bg-[#ECEFF2] p-2">
        <span className="col-span-1" />
        <span className="col-span-3">NAME</span>
        <span className="col-span-3">RELEASE STATUS</span>
        <span className="col-span-2">CHART</span>
        <span className="col-span-1">REVISION</span>
        <span className="col-span-1">NAMESPACE</span>
        <span className="col-span-1">UPDATED</span>
      </div>
    </div>
  );
}