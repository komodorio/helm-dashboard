import { useParams } from "react-router-dom";

export const GeneralDetails = ({
  releaseName,
  namespace = "",
  disabled,
  onNamespaceInput,
  onReleaseNameInput,
  clusterName,
}: {
  releaseName: string;
  namespace?: string;
  disabled: boolean;
  clusterName: string;

  onNamespaceInput: (namespace: string) => void;
  onReleaseNameInput: (chartName: string) => void;
}) => {
  const inputClassName = ` text-lg py-1 px-2 border border-1 border-gray-300 ${disabled ? "bg-gray-200" : "bg-white "
    } rounded`;
  return (
    <div className="flex gap-8">
      <div>
        <h4 className="text-xl">Release name:</h4>
        <input
          className={inputClassName}
          value={releaseName}
          disabled={disabled}
          onChange={(e) => onReleaseNameInput(e.target.value)}
        ></input>
      </div>
      <div>
        <h4 className="text-xl">Namespace (optional):</h4>
        <input
          className={inputClassName}
          value={namespace}
          disabled={disabled}
          onChange={(e) => onNamespaceInput(e.target.value)}
        ></input>
      </div>
      <div className="flex">
        <h4 className="text-xl">Cluster:</h4>
        <p className="text-xl">{clusterName}</p>
      </div>
    </div>
  );
};
