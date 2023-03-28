import { useState } from "react";
import { BsPencil, BsTrash3 } from "react-icons/bs";
import UninstallModal from "./modal/UninstallModal";

type RevisionTagProps = {
  caption: string;
  text: string;
};

function RevisionTag({ caption, text }: RevisionTagProps) {
  return (
    <span className="bg-[#d6effe] px-2">
      <span>{caption}:</span>
      <span className="font-bold"> {text}</span>
    </span>
  );
}

function RevisionDetails() {
  const [isOpenUninstallModal, setIsOpenUninstallModal] = useState(false);

  const checkUpgradeable = () => {
    console.error("checkUpgradeable not implemented"); //todo: implement
  };

  const unInstall = () => {
    setIsOpenUninstallModal(true);
  };

  const checkForNewVersion = () => {
    console.error("checkForNewVersion not implemented"); //todo: implement
  };

  const unInstallConfirmed = () => {
    setIsOpenUninstallModal(false);
    console.error("unInstallConfirmed not implemented"); //todo: implement
  };

  return (
    <div className="flex flex-col px-16 pt-5">
      <span className="text-[#1FA470] font-semibold">● DEPLOYED</span>
      <div className="flex justify-between">
        <span className="text-[#3d4048] text-4xl">airFlow</span>
        <div className="flex flex-row gap-3">
          <div className="flex flex-col">
            <button onClick={checkUpgradeable}>
              <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                <BsPencil />
                Reconfigure
              </span>
            </button>
            <a
              onClick={checkForNewVersion}
              className="underline text-sm cursor-pointer"
            >
              check for new version
            </a>
          </div>
          <div className="h-1/2">
            <button onClick={unInstall}>
              <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                <BsTrash3 />
                Uninstall
              </span>
            </button>
          </div>
        </div>
      </div>
      <div>
        <label>Revision #1</label>
        <label>3/26/2023, 2:19:39 PM</label>
      </div>
      <div className="flex flex-wrap gap-4">
        <RevisionTag caption="chart version" text="airflow-14.0.16" />
        <RevisionTag caption="app version" text="2.5.2" />
        <RevisionTag caption="namespace" text="default" />
        <RevisionTag caption="cluster" text="docker" />
      </div>
      <label>Install complete</label>
      <UninstallModal
        uninstallTarget="airflow"
        namespace="default"
        isOpen={isOpenUninstallModal}
        resources={[
          { id: "1", type: "ServiceAccount", name: "airflow-redis" },
          { id: "2", type: "Secret", name: "postgresql" },
          { id: "3", type: "Secret", name: "airflow-redis" },
          { id: "4", type: "Secret", name: "airflow" },
          { id: "5", type: "ConfigMap", name: "airflow-redis-configuration" },
        ]}
        onConfirm={unInstallConfirmed}
      />
    </div>
  );
}

export default RevisionDetails;
