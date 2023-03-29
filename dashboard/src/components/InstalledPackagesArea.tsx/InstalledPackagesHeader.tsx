import HeaderLogo from "../../assets/packges-header.svg";
import { InstalledPackage } from "../../pages/Installed";

type Props = {
    installedPackages: InstalledPackage[];
}

export default function InstalledPackagesHeader(props: Props) {
    const {installedPackages} = props;
    return (
        <div
            className="flex items-center justify-between bg-white rounded-md p-2 drop-shadow"
        >
            <div className="flex items-center">
                <img src={HeaderLogo} alt="Helm-DashBoard" className="display-inline h-12 ml-3 w-[140px] "/>
                <h2 className="display-inline font-bold text-xl ">Installed Charts({installedPackages.length})</h2>
            </div>
             
            <div className="w-1/4">
                <input className="border-2 border-inherit rounded-md p-1 placeholder:text-black w-11/12" placeholder="Filter..." type="text" />
            </div>
        </div>
    )
} 