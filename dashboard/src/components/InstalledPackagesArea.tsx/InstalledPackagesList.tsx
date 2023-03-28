import { Dispatch, SetStateAction } from "react";
import { InstalledPackage } from "../../pages/Installed";
import InstalledPackageCard from "./InstalledPackageCard";

type Props = {
    installedPackages: InstalledPackage[];
    setInstalledPackages: Dispatch<SetStateAction< InstalledPackage[]>>;
}

export default function InstalledPackagesList(props: Props) {

    const {installedPackages, setInstalledPackages} = props;

    return (
        <div>
            {installedPackages.map((installedPackage: InstalledPackage) => <InstalledPackageCard installedPackage={installedPackage} />)}
        </div>
    )
}