import { InstalledReleases } from "../../API/releases";
import HeaderLogo from "../../assets/packges-header.svg";

type InstalledPackagesHeaderProps = {
  installedPackages?: InstalledReleases[];
  setFilterKey: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean;
};

export default function InstalledPackagesHeader({
  installedPackages,
  setFilterKey,
  isLoading
}: InstalledPackagesHeaderProps) {
  const numOfPackages = installedPackages?.length;
  const showNoPackageAlert = Boolean(!isLoading && (numOfPackages == undefined || numOfPackages == 0));
  return (
    <div className="drop-shadow">
      <div className="flex items-center justify-between bg-white rounded-md p-2">
        <div className="flex items-center">
          <img
            src={HeaderLogo}
            alt="Helm-DashBoard"
            className="display-inline h-12 ml-3 w-[140px] "
          />
          <h2 className="display-inline font-bold text-xl ">{`Installed Charts (${numOfPackages || "0"})`}</h2>
        </div>

        <div className="w-1/4">
          <input
            className="border-2 border-inherit rounded-md p-1 placeholder:text-black w-11/12"
            placeholder="Filter..."
            type="text"
            onChange={ev => setFilterKey(ev.target.value)}
          />
        </div>
      </div>


      {showNoPackageAlert && <div className="bg-white rounded shadow display-none no-charts mt-3 text-sm p-4">Looks like you don't have any charts
          installed. "Repository" section may be a good place to start.
      </div>}
    </div>
  );
}