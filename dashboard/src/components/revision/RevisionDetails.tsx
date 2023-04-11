import axios from "axios";
import { useState } from "react";
import { BsPencil, BsTrash3, BsHourglassSplit } from "react-icons/bs";
import { ReleaseRevision } from "../../data/types";
import UninstallModal from "../modal/UninstallModal";
import RevisionTabs from "./RevisionTabs";

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

type RevisionDetailsProps = {
  release: ReleaseRevision;
};

function RevisionDetails({ release }: RevisionDetailsProps) {
  const [isOpenUninstallModal, setIsOpenUninstallModal] = useState(false);
  const [isChecking, setChecking] = useState(false);

  const checkUpgradeable = async () => {
    try {
      const response = await axios.get(
        "/api/helm/repositories/latestver?name=" + release.chart_name
      );
      const data = response.data;

      let elm = { name: "", version: "0" };
      // const btnUpgradeCheck = $("#btnUpgradeCheck");
      if (!data || !data.length) {
        //     btnUpgradeCheck.prop("disabled", true)
        //     btnUpgradeCheck.text("")
        //     $("#btnAddRepository").text("Add repository for it").data("suggestRepo", "")
      } else if (data[0].isSuggestedRepo) {
        //     btnUpgradeCheck.prop("disabled", true)
        //     btnUpgradeCheck.text("")
        //     $("#btnAddRepository").text("Add repository for it: "+data[0].repository).data("suggestRepo", data[0].repository).data("suggestRepoUrl", data[0].urls[0])
      } else {
        //     $("#btnAddRepository").text("")
        //     btnUpgradeCheck.text("Check for new version")
        elm = data[0];
      }

      // $("#btnUpgrade .icon").removeClass("bi-arrow-up bi-pencil").addClass("bi-hourglass-split")
      // const verCur = $("#specRev").data("last-chart-ver");
      // btnUpgradeCheck.data("repo", elm.repository)
      // btnUpgradeCheck.data("chart", elm.name)

      // const canUpgrade = isNewerVersion(verCur, elm.version);
      // btnUpgradeCheck.prop("disabled", false)
      // if (canUpgrade) {
      //     $("#btnUpgrade span").text("Upgrade to " + elm.version)
      //     $("#btnUpgrade .icon").removeClass("bi-hourglass-split").addClass("bi-arrow-up")
      // } else {
      //     $("#btnUpgrade span").text("Reconfigure")
      //     $("#btnUpgrade .icon").removeClass("bi-hourglass-split").addClass("bi-pencil")
      // }

      // $("#btnUpgrade").off("click").click(function () {
      //     popUpUpgrade(elm, getHashParam("namespace"), getHashParam("chart"), verCur, $("#specRev").data("last-rev"))
      // })
    } catch (error) {
      //errorAlert-"Failed to find chart in repo"
    }

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
    <div className="flex flex-col px-16 pt-5 gap-3">
      <span className="text-[#1FA470] font-semibold">● DEPLOYED</span>
      <div className="flex justify-between">
        <span className="text-[#3d4048] text-4xl">airFlow</span>
        <div className="flex flex-row gap-3">
          <div className="flex flex-col">
            <button onClick={checkUpgradeable}>
              <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                {isChecking ? (
                  <>
                    <BsHourglassSplit />
                    Checking...
                  </>
                ) : (
                  <>
                    <BsPencil />
                    Reconfigure
                  </>
                )}
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
      <div className="flex flex-row gap-6">
        <span>
          Revision <span className="font-semibold">#{release.revision}</span>
        </span>
        <span>
          {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          }).format(new Date(release.updated))}
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        <RevisionTag caption="chart version" text={release.chart} />
        <RevisionTag caption="app version" text={release.app_version} />
        <RevisionTag caption="namespace" text="release.namespace" />
        <RevisionTag caption="cluster" text="docker" />
      </div>
      <span>{release.description}</span>
      <RevisionTabs />
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
