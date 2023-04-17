import { useState } from "react";
import { Chart } from "../../data/types";
import InstallModal from "../modal/InstallModal";

type ChartViewerProps = {
  chart: Partial<Chart>;
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
        className="grid grid-cols-5 hover:bg-[#f4f7fa] p-4"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <span className="col-span-1 font-semibold flex flex-row items-center gap-1">
          <img
            src= {chart.icon}
            className="h-4"
          />
          {chart.name}
        </span>
        <span className="col-span-2 text-sm">{chart.description}</span>
        <span className="col-span-1">{chart.version}</span>
        <span className="col-span-1">
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
      <InstallModal
        chart={chart}
        isOpen={showInstallModal}
        onConfirm={() => setShowInstallModal(false)}
      />
    </>
  );
}

export default ChartViewer;
