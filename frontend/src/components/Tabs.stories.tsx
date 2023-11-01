import { Meta } from "@storybook/react";
import Tabs from "./Tabs";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;

const defaultArgs = {
  tabs: [
    {
      label: "tab1",
      content: <div>tab1</div>,
    },
    {
      label: "tab2",
      content: <div>tab2</div>,
    },
    {
      label: "tab3",
      content: <div>tab3</div>,
    },
  ],
};

export const Default = {
  args: defaultArgs,
};
