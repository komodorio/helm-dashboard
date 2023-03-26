import HeaderLogo from "../../assets/packges-header.svg";

export default function InstalledPackageCard() {
    const currentPackage = {
        version: "0.1.0",
        name: "airflow",
        revision: "1",
        versions: ["0.1.0", "0.1.1", "0.1.2", "0.1.3"],
        default: "",
        lastUpdated: "9d",
        description: "Apache Airflow is a tool th express and execute workflows as directed acyclic graphs (DAGs) it",
    }
    return (
        <div
        className="flex items-center justify-between bg-white rounded-md p-2 my-5 drop-shadow border-l-8 border-l-emerald-400"
        >
            <img src={HeaderLogo} alt="Helm-DashBoard" className="display-inline h-20 mx-1 mr-8"/>
            

            <table className="w-11/12  border-spacing-1">
                <thead>
                    <tr>
                        <td><h2 className="font-bold text-2xl p-l-2 max-w-1/5">{currentPackage.name}</h2></td>
                        <td className="text-green-800 font-bold w-1/6 ">&#8226; Installed</td>
                        <td className="w-1/6 m-2 "><small className=" font-bold ">{currentPackage.name} - {currentPackage.version}</small></td>
                        <td className=" "><small className=" font-bold ">#{currentPackage.revision}</small></td>
                        <td className=" "><small className=" font-bold ">default</small></td>
                        <td className=" "><small className=" font-bold ">{currentPackage.lastUpdated}</small></td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="pr-12"><span className="p w-11/12">{currentPackage.description}</span></td>
                        <td></td>
                        <td className="font-light mx-3">chart version</td>
                        <td className="font-light mx-5 ">revision </td>
                        <td className="font-light "> namespace </td>
                        <td className="font-light "> updated</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}


{/* <div className="w-1/5">
<h2 className="font-bold text-xl w-1/5 ">{currentPackage.name}</h2>
<small>{currentPackage.description}</small>
</div>

<div>
<span className="text-green-800 font-bold w-1/6 p-5">
    &#8226; Installed
</span>
</div>

<div>
{currentPackage.name} - {currentPackage.version}
</div>
<div>
#{currentPackage.revision}
</div>

<div>
default
</div>

<div>
{currentPackage.lastUpdated}
</div> */}