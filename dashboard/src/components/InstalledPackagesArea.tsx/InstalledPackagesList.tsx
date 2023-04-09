import { Dispatch, SetStateAction } from "react";
import InstalledPackageCard from "./InstalledPackageCard";
import InstalledPackage from "../../models/PackageModel";

type Props = {
    installedPackages: InstalledPackage[];
    setInstalledPackages: Dispatch<SetStateAction< InstalledPackage[]>>;
}

export default function InstalledPackagesList(props: Props) {

    const {installedPackages} = props;

    return (
        <div>
            {installedPackages.map((installedPackage: InstalledPackage) => <InstalledPackageCard installedPackage={installedPackage} />)}
        </div>
    )
}