import HeaderLogo from "../../assets/packges-header.svg";
import { InstalledPackage } from "../../data/types";

type InstalledPackagesHeaderProps = {
  installedPackages: InstalledPackage[];
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
      <div className="flex flex-row text-xs font-medium justify-between bg-[#ECEFF2] p-2">
        <span className="w-1/7" />
        <span className="w-1/7">NAME</span>
        <span className="w-1/7">RELEASE STATUS</span>
        <span className="w-1/7">CHART</span>
        <span className="w-1/7">REVISION</span>
        <span className="w-1/7">NAMESPACE</span>
        <span className="w-1/7">UPDATED</span>
      </div>
    </div>
  );
}
