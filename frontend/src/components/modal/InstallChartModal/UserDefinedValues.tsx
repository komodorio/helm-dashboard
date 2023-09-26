import { useEffect, useState } from "react";
import useDebounce from "../../../hooks/useDebounce";

export const UserDefinedValues = ({
  initialValue,
  onValuesChange,
}: {
  initialValue: string;
  onValuesChange: (val: string) => void;
}) => {
  const [userDefinedValues, setUserDefinedValues] = useState(initialValue);
  const debouncedValue = useDebounce<string>(userDefinedValues, 500);

  useEffect(() => {
    if (!debouncedValue || debouncedValue === initialValue) {
      return;
    }

    onValuesChange(debouncedValue);
  }, [debouncedValue, onValuesChange, initialValue]);

  return (
    <div className="w-1/2 ">
      <label
        className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
        htmlFor="grid-user-defined-values"
      >
        User-Defined Values:
      </label>
      <textarea
        value={userDefinedValues}
        defaultValue={initialValue}
        onChange={(e) => setUserDefinedValues(e.target.value)}
        rows={14}
        className="block p-2.5 w-full text-md text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none font-monospace"
      ></textarea>
    </div>
  );
};
