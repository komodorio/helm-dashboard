import { ChangeEvent, useEffect, useState } from "react";
import Modal, { ModalAction, ModalButtonStyle } from "./Modal";
import { Chart, ChartVersion } from "../../data/types";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../API/apiService";

interface InstallModalProps {
  isOpen: boolean;
  chart?: Partial<Chart>;
  onConfirm: () => void;
}

const cluster = "kind-kind";
const namespace = "bitnami"; // todo: use context API to get this param

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

  const { data: chartVersions, refetch: refetchVersions } = useQuery<
    ChartVersion[]
  >({
    queryKey: ["chartVersions", chart],
    queryFn: apiService.getChartVersions,
    enabled: false,
  });

  const [confirmModalActions, setConfirmModalActions] =
    useState<ModalAction[]>();

  const [versionToInstall, setVersionToInstall] = useState<string>();

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

  useEffect(() => {
    if (isOpen) {
      refetchVersions();
    }
  }, [isOpen]);

  const { data: chartValues, refetch } = useQuery(
    ["values", { namespace, chart, version: versionToInstall }],
    apiService.getValues,
    {
      refetchOnWindowFocus: false,
      enabled: false,
    }
  );

  useEffect(() => {
    refetch();
  }, [versionToInstall]);

  const handleVersionToInstallChanged = (e: ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    setVersionToInstall(e.target.value);
  };

  return (
    <Modal
      title={uninstallTitle}
      isOpen={isOpen}
      onClose={onConfirm}
      actions={confirmModalActions}
      containerClassNames="w-4/5 2xl:w-2/3"
    >
      <div>
        <div>
          <label className="text-xl font-medium">Version to install:</label>
          <div className="inline-block relative mb-6">
            <select
              onChange={handleVersionToInstallChanged}
              className="block appearance-none w-full font-semibold bg-white border border-gray-400 hover:border-gray-500 ml-2 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline text-green-700"
            >
              {chartVersions?.map((charVersion: ChartVersion) => (
                <option key={charVersion.version} value={charVersion.version}>
                  {charVersion.version}
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
              <div className="border border-gray-200 bg-slate-200">
                {chartValues}
              </div>
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
