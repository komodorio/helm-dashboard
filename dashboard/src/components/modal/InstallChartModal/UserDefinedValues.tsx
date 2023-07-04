import { useEffect, useRef, useState } from "react";

export const UserDefinedValues = ({
  val,
  setVal,
}: {
  val: string;
  setVal: any;
}) => {
  const [localState, setLocalState] = useState(val);

  const prevValueRef = useRef(val);
  const timeoutRef = useRef<any>(null);
  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (prevValueRef.current !== localState) {
      timeoutRef.current = setTimeout(() => {
        setVal(localState);
        clearTimeout(timeoutRef.current);
      }, 400);
    }
  }, [localState]);

  return (
    <div className="w-1/2">
      <label
        className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
        htmlFor="grid-user-defined-values"
      >
        User Defined Values:
      </label>
      <textarea
        value={localState}
        onChange={(e) => setLocalState(e.target.value)}
        rows={14}
        className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none"
      ></textarea>
    </div>
  );
};
