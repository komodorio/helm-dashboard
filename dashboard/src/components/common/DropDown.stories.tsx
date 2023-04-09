// TabsBar.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import DropDown from "./DropDown";

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

Default.args = {
  items: [
    {
      id: "1",
      text: "item1",
      icon: "ArrowDownIcon",
    },
    {
      id: "2",
      text: "item2",
      icon: "ArrowDownIcon",
    },
    {
      id: "3",
      text: "item3",
      icon: "ArrowDownIcon",
    },
    {
      id: "4",
      text: "item4",
      icon: "ArrowDownIcon",
    },
    {
      id: "5",
      text: "item5",
      icon: "ArrowDownIcon",
    },
  ],
};
