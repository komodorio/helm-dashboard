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
    <div className="w-1/2">
      <label
        className="mb-2 block text-xl font-medium tracking-wide text-gray-700"
        htmlFor="grid-user-defined-values"
      >
        User-Defined Values:
      </label>
      <textarea
        value={userDefinedValues}
        defaultValue={initialValue}
        onChange={(e) => setUserDefinedValues(e.target.value)}
        rows={14}
        className="text-md font-monospace block w-full resize-none rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      ></textarea>
    </div>
  );
};
