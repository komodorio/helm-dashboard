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

export interface TextInputProps {
  label: string;
  placeholder: string;
  isMandatory?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TextInput(props: TextInputProps): JSX.Element {
  return (
    <div className="mb-6">
      <label className="block ml-1 mb-1 text-sm font-medium text-gray-900dark:text-white">
        {props.label}
        {/* if prop.isMandatory is true, add a whitespace and a red star to signify it*/}
        {props.isMandatory ? <span className="text-red-500"> *</span> : ""}
      </label>
      <input
        type="text"
        placeholder={props.placeholder}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
      />
    </div>
  );
}
