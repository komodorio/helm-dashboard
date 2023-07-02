import { useAppContext } from "../../../context/AppContext";

export const GeneralDetails = ({
  chartName,
  namespace,
  isUpgrade,
  onNamespaceInput,
  onChartNameInput,
}: {
  chartName: string;
  namespace?: string;
  isUpgrade: boolean;
  onNamespaceInput: (namespace: string) => void;
  onChartNameInput: (chartName: string) => void;
}) => {
  const { selectedCluster } = useAppContext();
  const inputClassName = ` text-lg py-1 px-2 ${
    isUpgrade ? "bg-gray-200" : "bg-white border-2 border-gray-300"
  } rounded`;
  return (
    <div className="flex gap-8">
      <div>
        <h4 className="text-lg">Release name:</h4>
        <input
          className={inputClassName}
          value={chartName}
          disabled={isUpgrade}
          onChange={(e) => onChartNameInput(e.target.value)}
        ></input>
      </div>
      <div>
        <h4 className="text-lg">Namespace (optional):</h4>
        <input
          className={inputClassName}
          value={namespace}
          disabled={isUpgrade}
          onChange={(e) => onNamespaceInput(e.target.value)}
        ></input>
      </div>
      {selectedCluster ? (
        <div className="flex">
          <h4 className="text-lg">Cluster:</h4>
          <p className="text-lg">{selectedCluster}</p>
        </div>
      ) : null}
    </div>
  );
};
