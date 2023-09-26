import { type ReactElement, cloneElement } from "react";

export default function Tooltip({
  id,
  title,
  element,
}: {
  title: string;
  id: string;
  element: ReactElement;
}) {
  return (
    <>
      {cloneElement(element, { "data-tooltip-target": id })}
      <div
        id={id}
        role="tooltip"
        className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
      >
        {title}
        <div className="tooltip-arrow" data-popper-arrow></div>
      </div>

      <button
        data-tooltip-target="tooltip-default"
        type="button"
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Default tooltip
      </button>
      <div
        id="tooltip-default"
        role="tooltip"
        className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
      >
        Tooltip content
        <div className="tooltip-arrow" data-popper-arrow></div>
      </div>
    </>
  );
}
