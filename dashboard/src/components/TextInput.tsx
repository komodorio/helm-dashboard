import React from "react";

export interface TextInputProps {
  label: string;
  placeholder: string;
  isMandatory?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
const defaultProps = {
  label:'Label',
  placeholder:'Write something here...',
  isMandatory:false,
  onChange:()=>{}
}
export default function TextInput({props}: {props: TextInputProps}): JSX.Element {
  return (
    <div className="mb-6">
      <label className="block ml-1 mb-1 text-sm font-medium text-gray-900dark:text-white">
        {props.label}
      </label>
      <input
        type="text"
        placeholder={props.placeholder}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
      />
    </div>
  );
}
