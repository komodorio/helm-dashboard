/**
 * @file Button.tsx
 * This component is a generic button component using tailwind.
 * You can include an optional icon.
 * You can pass the action to be done when the button is clicked using
 *    the onClick prop.
 *
 * Props:
 *
 * @param children: children
 * @param onClick: () => void
 * 
 *
 */

import React from 'react'
import '../index.css'
// this is a type declaration for the action prop.
// it is a function that takes a string as an argument and returns void.

export default function Button({children, onClick}: {children: React.ReactNode, onClick: ()=>void}): JSX.Element{
return(
  <>
    <button onClick={onClick} className="border border-gray-500 bg-gray-100 hover:bg-gray-200 text-black font-bold py-2 px-4 rounded">
        {children}
    </button>
  </>
);
}
