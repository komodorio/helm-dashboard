/* eslint-disable no-console */
/**
 * @file SelectMenu.stories.tsx
 * @description This file contains the SelectMenu
 *    component stories.
 * currently there is only the default story.
 * The default story renders the component with the default props.
 */

import { ComponentStory, ComponentMeta } from "@storybook/react";
import SelectMenu, { SelectMenuItem, SelectMenuProps } from "./SelectMenu";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "SelectMenu",
  component: SelectMenu,
} as ComponentMeta<typeof SelectMenu>;

//👇 We create a "template" of how args map to rendering
const Template: ComponentStory<typeof SelectMenu> = (args: SelectMenuProps) => (
  <SelectMenu {...args} />
);

export const Default = Template.bind({});
Default.args = {
  header: "Header",
  children: [
    <SelectMenuItem label="Item 1" id={1} key="item1" />,
    <SelectMenuItem label="Item 2" id={2} key="item2" />,
    <SelectMenuItem label="Item 3" id={3} key="item3" />,
  ],
  selected: 1,
  onSelect: (id: number) => console.log(id),
};
