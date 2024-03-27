/**
 * @file SelectMenu.stories.tsx
 * @description This file contains the SelectMenu
 *    component stories.
 * currently there is only the default story.
 * The default story renders the component with the default props.
 */

import { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import SelectMenu, { SelectMenuItem } from "./SelectMenu";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "SelectMenu",
  component: SelectMenu,
} satisfies Meta<typeof SelectMenu>;

export default meta;

export const Default: StoryObj<typeof SelectMenu> = {
  args: {
    header: "Header",
    children: [
      <SelectMenuItem label="Item 1" id={1} key="item1" />,
      <SelectMenuItem label="Item 2" id={2} key="item2" />,
      <SelectMenuItem label="Item 3" id={3} key="item3" />,
    ],
    selected: 1,
    onSelect: (id: number) => action("onSelect")(id),
  },
};
