import { useState } from "react";
import { Chart } from "../../data/types";
import { InstallVersionModal } from "../revision/RevisionDetails";

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
        className="grid grid-cols-6 gap-3 hover:bg-[#f4f7fa] p-4"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <span className="col-span-1 font-semibold flex flex-row items-center gap-1">
          <img src={chart.icon} className="h-4" />
          {chart.name}
        </span>
        <span className="col-span-3 text-sm">{chart.description}</span>
        <span className="col-span-1 text-center">{chart.version}</span>
        <span className="col-span-1 text-center">
          {showInstallButton && (
            <button
              className="bg-white border border-gray-300 p-1 px-2 rounded-md font-semibold"
              onClick={() => setShowInstallModal(true)}
            >
              Install
            </button>
          )}
        </span>
      </div>
      {showInstallModal && (
        <InstallVersionModal
          chartName={chart.name}
          chartVersion={chart.version}
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          isInstall={true}
        />
      )}
    </>
  );
}

export default ChartViewer;
