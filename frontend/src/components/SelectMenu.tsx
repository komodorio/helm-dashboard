/**
 *
 * @file SelectMenu.tsx
 * @description SelectMenu component
 * This component is used to render a select menu. This is a component
 * with two parts: The menu header and the menu items. The menu header
 * is just text, and the menu items are radio toggles.
 * The menu items are passed as children of type SelectMenuItem,
 * which is an object with a label and id.
 * SelectMenuItem is defined in this file.
 * The menu header is a string.
 *
 * We use an interface to define the props that are passed to the component.
 * The interface name is SelectMenuProps. The interface is defined in the
 * same file as the component.
 *
 * @interface SelectMenuProps:
 * @property {string} header - The menu header
 * @property {SelectMenuItem[]} children - The menu items
 * @property {number} selected - The id of the selected menu item
 * @property {Function} onSelect - The function to call when a menu item is selected
 *
 * @return {JSX.Element} - The component
 *
 *
 */

// define the SelectMenuItem type:
// This is an object with a label and id.
// The label is a string, and the id is a number.
// The id is used to identify the selected menu item.
export interface SelectMenuItemProps {
  label: string;
  id: number;
}

// define the SelectMenuProps interface:

export interface SelectMenuProps {
  header: string;
  children: React.ReactNode;
  selected: number;
  onSelect: (id: number) => void;
}

// define the SelectMenu component:
// remember to use tailwind classes for styling
// recall that the menu items are radio buttons
// the selected menu item is the one that is checked
// the onSelect function is called when a menu item is selected
// the onSelect function is passed the id of the selected menu item

export function SelectMenuItem({
  label,
  id,
}: SelectMenuItemProps): JSX.Element {
  return (
    <div className="flex flex-row">
      <input
        type="radio"
        name="menu"
        id={id.toString()} // id must be a string
        value={id}
        checked={false}
        onChange={() => {
          return;
        }}
      />
      <label htmlFor={id.toString()}>{label}</label>
    </div>
  );
}

export default function SelectMenu(props: SelectMenuProps): JSX.Element {
  const { header, children } = props;
  return (
    <div className="card flex flex-col">
      <h2 className="text-xl font-bold">{header}</h2>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
