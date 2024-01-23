import { useState } from "react";
import { Chart } from "../../data/types";
import { InstallRepoChartModal } from "../modal/InstallChartModal/InstallRepoChartModal";

type ChartViewerProps = {
  chart: Chart;
};

function ChartViewer({ chart }: ChartViewerProps) {
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleMouseOver = () => {
    setShowInstallButton(true);
  };
  const handleMouseOut = () => {
    setShowInstallButton(false);
  };

  return (
    <>
      <div
        data-cy="chart-viewer-install-button"
        className="grid grid-cols-10 gap-3 hover:bg-body-background p-4 text-sm"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <span className="col-span-2 font-semibold flex flex-row items-center gap-1 text-base">
          <img src={chart.icon} className="h-4" />
          {chart.name}
        </span>
        <span className="col-span-6 text-sm">{chart.description}</span>
        <span className="col-span-1 text-center">{chart.version}</span>
        <span className="col-span-1 text-center">
          <button
            className={`bg-white border border-gray-300 px-2 p-1 rounded-md font-semibold ${
              showInstallButton ? "visible" : "invisible"
            }`}
            onClick={() => setShowInstallModal(true)}
          >
            Install
          </button>
        </span>
      </div>
      {showInstallModal && (
        <InstallRepoChartModal
          chartName={chart.name}
          currentlyInstalledChartVersion={chart.version}
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
        />
      )}
    </>
  );
}

export default ChartViewer;
