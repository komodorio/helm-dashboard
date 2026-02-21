import type { Meta } from "@storybook/react-vite";
import { BsSlack, BsGithub } from "react-icons/bs";
import { action } from "storybook/actions";

import DropDown from "./DropDown";

const meta = {
  title: "DropDown",
  component: DropDown,
} satisfies Meta<typeof DropDown>;

export default meta;

const onClick = () => {
  action("onClick")("drop down clicked");
};

export const Default = {
  args: {
    items: [
      { id: "1", text: "Menu Item 1", onClick: onClick, icon: <BsSlack /> },
      { id: "2 ", isSeparator: true },
      { id: "3", text: "Menu Item 3", isDisabled: true, icon: <BsGithub /> },
    ],
  },
};
