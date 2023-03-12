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

import React from 'react';
import '../index.css';
import Status from './Status';
export default function RevisionCard({revision, revisionDate,
 previousVersion, currentVersion, statusCode}:
 { revision: string, revisionDate: Date, 
previousVersion: string, currentVersion: string, 
statusCode: 'Deployed' | 'Superseded' | 'Failed' }):
 JSX.Element {
    return (
      <div className="card">

        {/* the status is displayed in the top left corner, using the Status component */}
        <div className="flex flex-row justify-start items-start">
          <Status statusCode={statusCode} />
        </div>

        {/* the revision number is displayed in the top right corner */}
        <div className="flex flex-row justify-end items-start">
          <span className="text-sm font-bold">#{revision}</span>
        </div>

        {/* the version-change sub part is displayed in the bottom left corner */}
        <div className="flex flex-row justify-start items-end">
          <span className="text-sm font-light">{previousVersion}</span>
          {/* the correct symbol is displayed based on the previous and current */}
          {/* automatically, and the symbol is displayed directly */}
          {/* it's an up-arrow if the current version is higher than the previous, */}
          {/* and a down-arrow if the current version is lower than the previous */}
          {currentVersion > previousVersion ? <span className="text-sm font-light"> &#8593; </span> : <span className="text-sm font-light"> &#8595; </span>}
          <span className="text-sm font-light">{currentVersion}</span>
        </div>

        {/* if the revision was made longer than 60 seconds ago, the time is displayed in minutes */}
        {/* if the revision was made longer than 60 minutes ago, the time is displayed in hours */}
        <div className="flex flex-row justify-end items-end">
          <span className="text-sm font-light"> 
            {Math.floor((Date.now() - revisionDate.getTime()) / 1000) < 60 ?
              Math.floor((Date.now() - revisionDate.getTime()) / 1000) + 's' :
              Math.floor((Date.now() - revisionDate.getTime()) / 1000 / 60) < 60 ?
                Math.floor((Date.now() - revisionDate.getTime()) / 1000 / 60) + 'm' :
                Math.floor((Date.now() - revisionDate.getTime()) / 1000 / 60 / 60) + 'h'
            }
          </span>
        </div>

      </div> 
    );
}
