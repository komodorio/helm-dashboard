/*/**
 * @file Status.tsx
 * The Status component:
 * This component is used to display the status of a deployment.
 * It uses the tailwindcss classes to implement the status.
 * There are 3 possible statuses:
 * 1. Deployed
 * 2. Superseded
 * 3. Failed
 * The status is indicated by a green orb, a neutral grey orb , or a red orb.
 *
 * @param statusCode: enum StatusCode
 *
 *
 */
import React from "react";
export default function Status({
  statusCode,
  isRefreshable = false
}: {
  statusCode: "Deployed" | "Superseded" | "Failed";
  isRefreshable: boolean;
}): JSX.Element {
  const statusVariants = {
    Deployed: "text-green-500",
    Superseded: "text-gray-500",
    Failed: "text-red-500"
  };
  /* the text should be bold. we can use tailwind utility class for that */
  const baseTextElem = "inline-flex font-bold";
  // this const is used to display the refresh icon
  const refreshIcon = (
    <>
      &nbsp;<button className="hover:text-blue-400">&#8635;</button>
    </>
  );
  return (
    <div className="inline-flex items-center rounded font-light text-base">
      {/* a unicode circle is displayed with the correct color is displayed according to the status code using svg */}
      <span className={`${baseTextElem} ${statusVariants[statusCode]}`}>
        {"\u25c9"} {statusCode}
        {isRefreshable ? refreshIcon : ""}
      </span>
    </div>
  );
}
