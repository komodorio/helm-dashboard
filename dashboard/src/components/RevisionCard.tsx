/**
 * @file RevisionCard.tsx
 *
 * @description RevisionCard component.
 * This componenent is used to display the revision card.
 * It consists of the Status element, the revision number,
 * the revision age, the previous version, the current
 * version, and a symbol in between to indicate if this is
 * an update or a downgrade.
 * It uses tailwind css classes for styling.
 * The Status element is sticked to the top left corner.
 * The revision number is sticked to the top right corner.
 * The revision age is sticked to the bottom right corner.
 * The version-change sub part is sticked to the
 * bottom left corner.
 * The card is bordered with
 * slightly rounded corners and includes the aformentioned parts.
 * The card is clickable and will redirect to the revision, with additional
 * information about the revision.
 *
 * The Status is displayed using the Status component.
 * The Status component needs the following props:
 * - statusCode: the status code of the revision, which
 *     can be one of the following:
 *     - 'Deployed' (green)
 *     - 'Superseded' (grey)
 *     - 'Failed' (red)
 * The revision number is displayed directly, and
 * a revision prop with the revision number needs to be
 * passed to the RevisionCard component.
 *
 * The revision age is displayed directly, and is
 * calculated from the revivision date prop.
 * - the calculation is take the current date and time
 *    and subtract the revision date and time from it.
 * - the result is then converted to a string and
 *   displayed.
 * - the revision date prop needs to be passed to the
 *  RevisionCard component.
 * - the revision date prop is a Date object.
 *
 * The version-change sub part is displayed directly, and the previous
 * and current version props need to be passed to the RevisionCard.
 * the correct symbol is displayed based on the previous and current
 * automatically, and the symbol is displayed directly.
 * it's an up-arrow if the current version is higher than the previous,
 * and a down-arrow if the current version is lower than the previous.
 *
 * Props:
 * @param {string} revision - the revision number
 * @param {Date} revisionDate - the revision date
 * @param {string} previousVersion - the previous version
 * @param {string} currentVersion - the current version
 * @param {string} statusCode - the status code
 *
 * @returns {JSX.Element} - the RevisionCard component
 *
 * TODO: implement correct comparison of version strings.
 *
 */

import React from "react";
import "../index.css";
import Status from "./Status";
/** 
 * This function creates the AGE part that will be displayed
 * on the bottom right corner.
 * it uses condiiontal rendering logic to display time in different formats,
 * according to the revision age. If the revision age is in an order of seconds
 * it'll be displayed as seconds, if minutes than minutes etc.
 *
 * @param {Date} revisionDate: the date of the creation of the revision
 * @return JSX.element
 */ 
function getRevisionAgeJSX(revisionDate: Date):JSX.Element {
  return (
    <span className="text-sm font-light">
      AGE:{" "}
      {Math.floor((Date.now() - revisionDate.getTime()) / 1000) < 60
        ? Math.floor((Date.now() - revisionDate.getTime()) / 1000) + "s"
        : Math.floor((Date.now() - revisionDate.getTime()) / 1000 / 60) < 60
        ? Math.floor((Date.now() - revisionDate.getTime()) / 1000 / 60) + "m"
        : Math.floor((Date.now() - revisionDate.getTime()) / 1000 / 60 / 60) <
          24
        ? Math.floor((Date.now() - revisionDate.getTime()) / 1000 / 60 / 60) +
          "h"
        : Math.floor(
            (Date.now() - revisionDate.getTime()) / 1000 / 60 / 60 / 24
          ) + "d"}
    </span>
  );
}
export default function RevisionCard({
  revision,
  revisionDate,
  previousVersion,
  currentVersion,
  statusCode,
  isActive = "false",
  isRefreshable = false,
  onClick
}: {
  revision: string;
  revisionDate: Date;
  previousVersion: string;
  currentVersion: string;
  statusCode: "Deployed" | "Superseded" | "Failed";
  isActive: "true" | "false";
  isRefreshable: boolean;
  onClick: () => void;
}): JSX.Element {
  const activeVariants = {
    true: "border-1 border-blue-500",
    false: "border-1 border-gray-300"
  };
  return (
    <div
      className={`card ${activeVariants[isActive]} relative h-24 w-64 hover:card-hover m-1`}
      onClick={onClick}
    >
      {/* the status is displayed in the top left corner, using the Status component */}
      <div className="absolute top-0 left-0 mt-4 ml-4">
        <Status isRefreshable={isRefreshable} statusCode={statusCode} />
      </div>

      {/* the revision number is displayed in the top right corner */}
      <div className="absolute top-0 right-0 mt-4 mr-4">
        <span className="text-sm font-bold">#{revision}</span>
      </div>
      {/* the version-change sub part is displayed in the bottom left corner */}
      <div className="absolute bottom-0 left-0 mb-4 ml-4">
        <span className="text-sm font-light">{previousVersion}</span>
        {/* the correct symbol is displayed based on the previous and current */}
        {/* automatically, and the symbol is displayed directly */}
        {/* it's an up-arrow if the current version is higher than the previous, */}
        {/* and a down-arrow if the current version is lower than the previous */}
        {currentVersion > previousVersion ? (
          <span className="text-sm font-light"> &#8593; </span>
        ) : (
          <span className="text-sm font-light"> &#8595; </span>
        )}
        <span className="text-sm font-light">{currentVersion}</span>
      </div>


      <div className="absolute bottom-0 right-0 mb-4 mr-4">
        {getRevisionAgeJSX(revisionDate)}
      </div>
    </div>
  );
}
