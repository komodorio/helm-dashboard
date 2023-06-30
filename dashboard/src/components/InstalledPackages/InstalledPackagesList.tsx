import InstalledPackageCard from "./InstalledPackageCard";
import { Release } from "../../data/types";

type InstalledPackagesListProps = {
  filteredReleases: Release[];
};

export default function InstalledPackagesList({
  filteredReleases,
}: InstalledPackagesListProps) {
  return (
    <div>
      {filteredReleases.map((installedPackage: Release) => {
        return (
          <InstalledPackageCard
            key={installedPackage.name}
            release={installedPackage}
          />
        );
      })}
    </div>
  );
}
