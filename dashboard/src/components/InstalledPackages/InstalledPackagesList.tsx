import InstalledPackageCard from "./InstalledPackageCard";
import { Release } from "../../data/types";

type InstalledPackagesListProps = {
  installedReleases: Release[] | undefined;
  filterKey: string,
};

export default function InstalledPackagesList({
  installedReleases,
  filterKey
}: InstalledPackagesListProps) {
  return (
    <div>
      {installedReleases?.filter(i => i.name.includes(filterKey)).map((installedPackage: Release) => (
        <InstalledPackageCard
          key={installedPackage.name}
          release={installedPackage}
        />
      ))}
    </div>
  );
}
