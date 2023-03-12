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
import React from 'react'
import '../index.css'
export default function Status({statusCode}: {statusCode: 'Deployed' | 'Superseded' | 'Failed'}): JSX.Element {
  const statusVariants = {
    Deployed: 'text-green-500',
    Superseded: 'text-gray-300',
    Failed: 'text-red-500'
  };
  /* the text should be bold. we can use tailwind utility class for that */
  const baseTextElem = 'inline-flex h-2 w-2 font-bold';
  /* this const is the tailwind classes that should be used for displaying the small status orb correctly,
      regardless of status */
  const baseOrbElem = 'inline-flex h-2 w-2'
  return (
    <div className='inline-flex items-center px-2.5 py-0.5 rounded text-xs font-light'>
      {/* an orb with the correct color is displayed according to the status code using svg */}
      {/* this orb should be position right beside the left of the status text */}
        <span>
          <svg className={`${baseOrbElem} ${statusVariants[statusCode]}`} viewBox="0 0 8 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="4" r="3" />
          </svg>
        </span>
      {/* the status text is displayed */}
      {/* this text should be position right beside the right of the orb */}
      {/* the color of the text is the same as the color of the orb */}
      {/* the text should be bold */}
        <span className={`${baseTextElem} ${statusVariants[statusCode]}`}>
          {statusCode}
        </span>
    </div>
)
}
