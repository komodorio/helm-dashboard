import { Dispatch, SetStateAction } from "react";
import InstalledPackageCard from "./InstalledPackageCard";
import { InstalledPackage } from "../../data/types";

type InstalledPackagesListProps = {
  installedPackages: InstalledPackage[];
  setInstalledPackages: Dispatch<SetStateAction<InstalledPackage[]>>;
};

export default function InstalledPackagesList({
  installedPackages,
}: InstalledPackagesListProps) {
  return (
    <div>
      {installedPackages.map((installedPackage: InstalledPackage) => (
        <InstalledPackageCard
          key={installedPackage.id}
          release={installedPackage}
        />
      ))}
    </div>
  );
}
