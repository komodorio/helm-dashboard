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

import React from "react";
// this is a type declaration for the action prop.
// it is a function that takes a string as an argument and returns void.
export interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}
export default function Button(props: ButtonProps): JSX.Element {
  return (
    <>
      <button
        onClick={props.onClick}
        className={
          "border border-gray-500 bg-gray-100 hover:bg-gray-200 text-black  py-2 px-4 rounded " +
            props.className || ""
        }
      >
        {props.children}
      </button>
    </>
  );
}
