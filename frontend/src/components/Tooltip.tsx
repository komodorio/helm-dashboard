import { type ReactElement, cloneElement, HTMLAttributes } from "react";

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
      {cloneElement(
        element as ReactElement<HTMLAttributes<HTMLElement>>,
        {
          "data-tooltip-target": id,
        } as HTMLAttributes<HTMLElement>
      )}
      <div
        id={id}
        role="tooltip"
        className="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xs transition-opacity duration-300 dark:bg-gray-700"
      >
        {title}
        <div className="tooltip-arrow" data-popper-arrow></div>
      </div>

      <button
        data-tooltip-target="tooltip-default"
        type="button"
        className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-hidden dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Default tooltip
      </button>
      <div
        id="tooltip-default"
        role="tooltip"
        className="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xs transition-opacity duration-300 dark:bg-gray-700"
      >
        Tooltip content
        <div className="tooltip-arrow" data-popper-arrow></div>
      </div>
    </>
  );
}
