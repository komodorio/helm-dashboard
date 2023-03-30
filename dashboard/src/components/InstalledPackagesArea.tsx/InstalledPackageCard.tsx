import HeaderLogo from "../../assets/packges-header.svg";
import InstalledPackage from "../../models/PackageModel";

type Props = {
    installedPackage: InstalledPackage;
}

export default function InstalledPackageCard(props: Props){
    
    const {installedPackage} = props;

    return (
        <div
        className="flex items-center justify-between bg-white rounded-md p-2 my-5 drop-shadow border-l-8 border-l-emerald-400"
        >
            <img src={HeaderLogo} alt="Helm-DashBoard" className="display-inline h-20 mx-1 mr-8"/>
            

            <table className="w-11/12  border-spacing-1">
                <thead>
                    <tr>
                        <td><h2 className="font-bold text-2xl p-l-2">{installedPackage.name}</h2></td>
                        <td className=" text-green-800 font-bold w-1/6 "><small>&#8226; DEPLOYED</small></td>
                        <td className=" w-1/6 m-2 "><small >{installedPackage.name} - {installedPackage.version}</small></td>
                        <td className=" font-bold m-2"><small >#{installedPackage.revision}</small></td>
                        <td className=" font-bold m-2"><small >default</small></td>
                        <td className=" font-bold m-2"><small >{installedPackage.lastUpdated}</small></td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="pr-10 max-w-xs text-sm">{installedPackage.description}</td>
                        <td></td>
                        <td className="font-light mx-3 py-0">chart version</td>
                        <td className="font-light mx-5 py-0">revision </td>
                        <td className="font-light  py-0"> namespace </td>
                        <td className="font-light  py-0"> updated</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
