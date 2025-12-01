/**
 *
 * @file TextInput.tsx
 * @description This is a single-lined text field.
 *              You can choose a placeholder, label,
 *              and whether the field is mandatory.
 * @interface TextInputProps:
 * - label: the label to be displayed
 * - placeholder: placeholder text
 * - isMandatory: adds a red star if is.
 *
 * @return JSX.Element
 *
 */
import type { ChangeEvent, JSX } from "react";

export interface TextInputProps {
  label: string;
  placeholder: string;
  isMandatory?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function TextInput(props: TextInputProps): JSX.Element {
  return (
    <div className="mb-6">
      <label className="text-gray-900dark:text-white mb-1 ml-1 block text-sm font-medium">
        {props.label}
        {/* if prop.isMandatory is true, add a whitespace and a red star to signify it*/}
        {props.isMandatory ? <span className="text-red-500"> *</span> : ""}
      </label>
      <input
        type="text"
        placeholder={props.placeholder}
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}
