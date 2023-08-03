/* eslint-disable no-console */
// DropDown.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import DropDown from "./DropDown";
import { BsSlack, BsGithub } from "react-icons/bs";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "DropDown",
  component: DropDown,
} as ComponentMeta<typeof DropDown>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof DropDown> = (args) => (
  <DropDown {...args} />
);

export const Default = Template.bind({});

const onClick = () => {
  console.log("drop down clicked");
};

Default.args = {
  items: [
    { id: "1", text: "Menu Item 1", onClick: onClick, icon: <BsSlack /> },
    { id: "2 ", isSeparator: true },
    { id: "3", text: "Menu Item 3", isDisabled: true, icon: <BsGithub /> },
  ],
};
