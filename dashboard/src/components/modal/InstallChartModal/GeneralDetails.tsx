import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useDebounce from "../../../hooks/useDebounce";

export const GeneralDetails = ({
  releaseName,
  namespace = "",
  disabled,
  onNamespaceInput,
  onReleaseNameInput,
}: {
  releaseName: string;
  namespace?: string;
  disabled: boolean;

  onNamespaceInput: (namespace: string) => void;
  onReleaseNameInput: (chartName: string) => void;
}) => {
  const [namespaceInputValue, setNamespaceInputValue] = useState(namespace);
  const namespaceInputValueDebounced = useDebounce<string>(namespaceInputValue, 500);
  useEffect(() => {
      onNamespaceInput(namespaceInputValueDebounced);
  }, [namespaceInputValueDebounced, onNamespaceInput]);
  const { context } = useParams();
  const inputClassName = ` text-lg py-1 px-2 border border-1 border-gray-300 ${
    disabled ? "bg-gray-200" : "bg-white "
  } rounded`;
  return (
    <div className="flex gap-8">
      <div>
        <h4 className="text-lg">Release name:</h4>
        <input
          className={inputClassName}
          value={releaseName}
          disabled={disabled}
          onChange={(e) => onReleaseNameInput(e.target.value)}
        ></input>
      </div>
      <div>
        <h4 className="text-lg">Namespace (optional):</h4>
        <input
          className={inputClassName}
          value={namespaceInputValue}
          disabled={disabled}
          onChange={(e) => setNamespaceInputValue(e.target.value)}
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
