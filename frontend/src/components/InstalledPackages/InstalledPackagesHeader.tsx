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
    <div className="custom-shadow rounded-t-md">
      <div className="flex items-center justify-between rounded-t-md bg-white px-2 py-0.5 font-inter">
        <div className="flex items-center">
          <img
            src={HeaderLogo}
            alt="Helm-DashBoard"
            className="display-inline mr-3 ml-3 h-12 w-[28px]"
          />
          <h2 className="display-inline text-base font-bold">{`Installed Charts (${
            numOfPackages || "0"
          })`}</h2>
        </div>

        <div className="w-1/3">
          <input
            className="w-11/12 rounded-sm border border-installed-charts-filter p-1 text-sm"
            placeholder="Filter..."
            type="text"
            onChange={(ev) => setFilterKey(ev.target.value)}
          />
        </div>
      </div>

      {showNoPackageAlert && (
        <div className="display-none no-charts mt-3 rounded-sm bg-white p-4 text-sm shadow-sm">
          Looks like you don&apos;t have any charts installed.
          &quot;Repository&quot; section may be a good place to start.
        </div>
      )}
    </div>
  );
}
