import InstalledPackageCard from "./InstalledPackageCard";
import { Release } from "../../data/types";

type InstalledPackagesListProps = {
  installedReleases: Release[] | undefined;
};

export default function InstalledPackagesList({
  installedReleases,
}: InstalledPackagesListProps) {
  return (
    <div>
      {installedReleases?.map((installedPackage: Release) => (
        <InstalledPackageCard
          key={installedPackage.id}
          release={installedPackage}
        />
      ))}
    </div>
  );
}
