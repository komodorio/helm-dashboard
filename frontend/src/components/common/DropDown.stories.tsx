import { Meta } from "@storybook/react";
import DropDown from "./DropDown";
import { BsSlack, BsGithub } from "react-icons/bs";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "DropDown",
  component: DropDown,
} as Meta<typeof DropDown>;

export default meta;

const onClick = () => {
  // eslint-disable-next-line no-console
  console.log("drop down clicked");
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
