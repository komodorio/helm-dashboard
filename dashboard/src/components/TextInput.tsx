import React from "react";

export default function TextInput({
  label,
  placeholder,
  onChange,
  isMandatory=false,
}: {
  label: string;
  placeholder: string;
  isMandatory?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}): JSX.Element {
  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {label}
        {/*if isMandatory is true, add a red star to the label*/}
        {isMandatory && <span className="text-red-500">&nbsp;*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-8 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      />
    </div>
  );
}
