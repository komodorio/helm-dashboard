import { useEffect, useState } from "react";
import Modal from "./Modal";
import { ModalAction, ModalButtonStyle } from "./Modal";
import { Chart } from "../../data/types";

interface InstallModalProps {
  isOpen: boolean;
  chart?:Partial<Chart>;
  onConfirm: () => void;
}

interface VersionToInstall {
  id: string;
  name: string;
}

const versionsToInstall: VersionToInstall[] = [
  { id: "1", name: "bitnami @ 14.0.14" },
  { id: "2", name: "bitnami @ 15.0.15" },
  { id: "3", name: "bitnami @ 16.0.16" },
];

const cluster = "kind-kind";

export default function InstallModal({
  chart,
  isOpen,
  onConfirm,
}: InstallModalProps) {
  const uninstallTitle = (
    <div className="font-medium text-2xl">
      Install <span className="text-green-700 font-bold">{chart?.name}</span>
    </div>
  );

  const [confirmModalActions, setConfirmModalActions] =
    useState<ModalAction[]>();

  useEffect(() => {
    setConfirmModalActions([
      {
        id: "1",
        text: "Confirm",
        callback: onConfirm,
        variant: ModalButtonStyle.info,
      },
    ]);
  }, [onConfirm]);

  return (
    <Modal
      title={uninstallTitle}
      isOpen={isOpen}
      onClose={onConfirm}
      actions={confirmModalActions}
    >
      <div>
        <div>
          <label className="text-xl font-medium">Version to install:</label>
          <div className="inline-block relative mb-6">
            <select className="block appearance-none w-full font-semibold bg-white border border-gray-400 hover:border-gray-500 ml-2 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline text-green-700">
              {versionsToInstall.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap mb-2 gap-2">
          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <label
              className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
              htmlFor="grid-release-name"
            >
              Release Name:
            </label>
            <input
              className="appearance-none block w-full text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="grid-release-name"
              type="text"
              placeholder="Airflow"
            />
          </div>

          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <label
              className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
              htmlFor="grid-namespace"
            >
              Namespace (optional):
            </label>
            <input
              className="appearance-none block w-full text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="grid-namespace"
              type="text"
            />
          </div>
          <div className="md:w-1/3  mb-6 md:mb-0">
            <label
              className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
              htmlFor="grid-zip"
            >
              Cluster: {cluster}
            </label>
          </div>
          <div className="flex w-full gap-6 mt-4">
            <div className="w-1/2">
              <label
                className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
                htmlFor="grid-user-defined-values"
              >
                User-Defined Values:
              </label>
              <textarea
                id="message"
                rows={16}
                className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none"
              ></textarea>
            </div>
            <div className="w-1/2">
              <label
                className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
                htmlFor="grid-user-defined-values"
              >
                Chart Values Reference:
              </label>
              <div className="border border-gray-200 bg-slate-200 h-8"></div>
            </div>
          </div>
        </div>
        <label className="block tracking-wide text-gray-700 text-xl font-medium mt-4 mb-2">
          Manifest changes:
        </label>
        <div className="bg-gray-200 w-full h-7"></div>
      </div>
    </Modal>
  );
}
