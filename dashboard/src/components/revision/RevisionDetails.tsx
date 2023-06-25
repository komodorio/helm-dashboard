import axios from "axios";
import { useEffect, useState } from "react";
import {
  BsPencil,
  BsTrash3,
  BsHourglassSplit,
  BsArrowRepeat,
} from "react-icons/bs";
import { Release } from "../../data/types";
import UninstallModal from "../modal/UninstallModal";
import StatusLabel from "../common/StatusLabel";
import { useParams } from "react-router-dom";
import RevisionDiff from "./RevisionDiff";
import RevisionResource from "./RevisionResource";
import Tabs from "../Tabs";
import { callApi, useGetResources } from "../../API/releases";
import { useMutation, useQuery } from "@tanstack/react-query";
import Modal, { ModalButtonStyle } from "../modal/Modal";

type RevisionTagProps = {
  caption: string;
  text: string;
};

type RevisionDetailsProps = {
  release: Release;
};

export default function RevisionDetails({ release }: RevisionDetailsProps) {
  const revisionTabs = [
    { value: 'resources', label: "Resources", content: <RevisionResource /> },
    { value: "manifests", label: "Manifests", content: <RevisionDiff tab="manifests" /> },
    { value: 'values', label: "Values", content: <RevisionDiff includeUserDefineOnly={true} tab="values" /> },
    { value: 'notes', label: "Notes", content: <RevisionDiff tab="notes" /> },
  ];
  const [isChecking, setChecking] = useState(false);
  const { context, namespace, chart, tab } = useParams();

  const selectedTab = revisionTabs.find(t => t.value === tab) || revisionTabs[0];

  const checkUpgradeable = async () => {
    try {
      const response = await axios.get(
        "/api/helm/repositories/latestver?name=" + release.chartName
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
    } catch (error) {
      //errorAlert-"Failed to find chart in repo"
    }

    console.error("checkUpgradeable not implemented"); //todo: implement
  };

  const runTests = () => {};

  const rollback = () => {
    throw new Error("not implemented");
  };

  const checkForNewVersion = () => {
    throw new Error("checkForNewVersion not implemented"); //todo: implement
  };

  return (
    <div className="flex flex-col px-16 pt-5 gap-3">
      <StatusLabel status="deployed" />
      <div className="flex justify-between">
        <span className="text-[#3d4048] text-4xl">{chart}</span>
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
            <button onClick={rollback}>
              <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                <BsArrowRepeat />
                Rollback to #1
              </span>
            </button>
          </div>
          <div className="h-1/2">
            <Uninstall />
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
        <RevisionTag
          caption="app version"
          text={release.app_version || "N/A"}
        />
        <RevisionTag caption="namespace" text={namespace ?? ""} />
        <RevisionTag caption="cluster" text={context ?? ""} />
      </div>
      <span>{release.description}</span>
      <Tabs tabs={revisionTabs} selectedTab={selectedTab} />
    </div>
  );
}

function RevisionTag({ caption, text }: RevisionTagProps) {
  return (
    <span className="bg-[#d6effe] px-2">
      <span>{caption}:</span>
      <span className="font-bold"> {text}</span>
    </span>
  );
}

const RunTests = () => {};

const Uninstall = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { namespace = "", chart = "" } = useParams();
  const { data: resources } = useGetResources(namespace, chart, {
    enabled: isOpen,
  });

  const uninstallMutation = useMutation(
    ["uninstall", namespace, chart],
    () =>
      fetch(
        // Todo: Change to BASE_URL from env
        "http://localhost:8080/api/helm/releases/" + namespace + "/" + chart,
        {
          method: "delete",
        }
      ),
    {
      onSuccess: () => {
        window.location.href = "/";
      },
      onError: (error, variables, context) => {
        // An error happened!
        console.log(`rolling back optimistic update with id `);
      },
    }
  );
  const uninstallTitle = (
    <div className="font-semibold text-lg">
      Uninstall <span className="text-red-500">{chart}</span> from namespace{" "}
      <span className="text-red-500">{namespace}</span>
    </div>
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
          <BsTrash3 />
          Uninstall
        </span>
      </button>
      {resources?.length ? (
        <Modal
          title={uninstallTitle}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          actions={[
            {
              id: "1",
              text: uninstallMutation.isLoading
                ? "Uninstalling..."
                : "Uninstall",
              callback: uninstallMutation.mutate,
              variant: ModalButtonStyle.error,
              disabled: uninstallMutation.isLoading,
            },
          ]}
        >
          <div>Following resources will be deleted from the cluster:</div>
          <div>
            {resources?.map((resource) => (
              <div className="flex justify-start gap-1 w-full mb-3">
                <span className=" w-1/5  italic">{resource.kind}</span>
                <span className=" w-4/5 font-semibold">
                  {resource.metadata.name}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </>
  );
};
