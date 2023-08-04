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

// this is a type declaration for the action prop.
// it is a function that takes a string as an argument and returns void.
export interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}
export default function Button(props: ButtonProps): JSX.Element {
  return (
    <>
      <button
        onClick={props.onClick}
        className={`${props.className} bg-white border border-gray-300  hover:bg-gray-50 text-black  py-1 px-4 rounded `}
        disabled={props.disabled}
      >
        {props.children}
      </button>
    </>
  );
}
