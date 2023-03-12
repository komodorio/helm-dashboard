/**
 * @file Button.tsx
 * This component is a generic button component using tailwind.
 * You can include an optional icon.
 * You can pass the action to be done when the button is clicked using
 *    the action prop.
 *
 * Props:
 *
 * @param children: children
 * @param action: 
 * 
 *
 */

import React from 'react'
import '../index.css'
type ClickHandler = (arg: string) => void;
export default function Button({children, action}: {children: React.ReactNode, action: ClickHandler}): JSX.Element{
return(<>
    <button className="border border-gray-500 bg-gray-100 hover:bg-gray-200 text-black font-bold py-2 px-4 rounded">
        {children}
    </button>
</>);
}