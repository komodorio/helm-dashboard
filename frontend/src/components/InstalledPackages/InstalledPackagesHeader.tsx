import HeaderLogo from "../../assets/packges-header.svg";
import { Release } from "../../data/types";

type InstalledPackagesHeaderProps = {
  filteredReleases?: Release[];
  setFilterKey: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
};

export default function InstalledPackagesHeader({
  filteredReleases,
  setFilterKey,
  isLoading,
}: InstalledPackagesHeaderProps) {
  const numOfPackages = filteredReleases?.length;
  const showNoPackageAlert = Boolean(
    !isLoading && (numOfPackages === undefined || numOfPackages === 0)
  );
  return (
    <div className="custom-shadow rounded-t-md  ">
      <div className="flex items-center justify-between bg-white px-2 py-0.5 font-inter rounded-t-md ">
        <div className="flex items-center">
          <img
            src={HeaderLogo}
            alt="Helm-DashBoard"
            className="display-inline h-12 ml-3 mr-3 w-[28px] "
          />
          <h2 className="display-inline font-bold text-base ">{`Installed Charts (${
            numOfPackages || "0"
          })`}</h2>
        </div>

        <div className="w-1/3">
          <input
            className="border-installed-charts-filter  rounded p-1 text-sm w-11/12"
            placeholder="Filter..."
            type="text"
            onChange={(ev) => setFilterKey(ev.target.value)}
          />
        </div>
      </div>

      {showNoPackageAlert && (
        <div className="bg-white rounded shadow display-none no-charts mt-3 text-sm p-4">
          Looks like you don&apos;t have any charts installed.
          &quot;Repository&quot; section may be a good place to start.
        </div>
      )}
    </div>
  );
}
