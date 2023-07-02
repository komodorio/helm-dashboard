export const UserDefinedValues = ({
  val,
  setVal,
}: {
  val: string;
  setVal: any;
}) => {
  return (
    <div className="w-1/2">
      <label
        className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
        htmlFor="grid-user-defined-values"
      >
        User defined values:
      </label>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={14}
        className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none"
      ></textarea>
    </div>
  );
};
