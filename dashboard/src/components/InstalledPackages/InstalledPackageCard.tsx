import { InstalledPackage } from "../../data/types";

type InstalledPackageCardProps = {
  installedPackage: InstalledPackage;
};

export default function InstalledPackageCard({
  installedPackage,
}: InstalledPackageCardProps) {
  return (
    <div className="grid grid-cols-12 items-center bg-white rounded-md p-2 py-6 my-5 drop-shadow border-l-4 border-l-[#1BE99A]">
      <img
        src={installedPackage.image}
        alt="Helm-DashBoard"
        className="w-[40px] mx-4 col-span-1"
      />

      <div className="col-span-10">
        <div className="grid grid-cols-10">
            <div className="col-span-3 font-medium text-lg">
              {installedPackage.name}
            </div>
            <div className="col-span-2">
              <span className="text-[#1FA470] font-semibold">● DEPLOYED</span>
            </div>
            <div className="col-span-1">#{installedPackage.revision}</div>
            <div className="col-span-1">default</div>
            <div className="col-span-1">{installedPackage.lastUpdated}</div>
        </div>
        <div className="grid grid-cols-10 text-xs">
          <div className="col-span-3">{installedPackage.description}</div>
          <div className="col-span-3"></div>
          <div className="col-span-2 text-[#707583]">CHART VERSION</div>
          <div className="col-span-1 text-[#707583]">REVISION</div>
          <div className="col-span-1 text-[#707583]">NAMESPACE</div>
          <div className="col-span-1 text-[#707583]">UPDATED</div>
        </div>
      </div>
    </div>
  );
}
