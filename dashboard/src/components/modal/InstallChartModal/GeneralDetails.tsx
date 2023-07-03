import { useParams } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";

export const GeneralDetails = ({
  chartName,
  namespace = "default",
  disabled,
  onNamespaceInput,
  onChartNameInput,
}: {
  chartName: string;
  namespace?: string;
  disabled: boolean;

  onNamespaceInput: (namespace: string) => void;
  onChartNameInput: (chartName: string) => void;
}) => {
  const { context } = useParams();
  const inputClassName = ` text-lg py-1 px-2 ${
    disabled ? "bg-gray-200" : "bg-white border-2 border-gray-300"
  } rounded`;
  return (
    <div className="flex gap-8">
      <div>
        <h4 className="text-lg">Release name:</h4>
        <input
          className={inputClassName}
          value={chartName}
          disabled={disabled}
          onChange={(e) => onChartNameInput(e.target.value)}
        ></input>
      </div>
      <div>
        <h4 className="text-lg">Namespace (optional):</h4>
        <input
          className={inputClassName}
          value={namespace}
          disabled={disabled}
          onChange={(e) => onNamespaceInput(e.target.value)}
        ></input>
      </div>
      {context ? (
        <div className="flex">
          <h4 className="text-lg">Cluster:</h4>
          <p className="text-lg">{context}</p>
        </div>
      ) : null}
    </div>
  );
};
