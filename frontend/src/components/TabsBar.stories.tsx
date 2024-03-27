import { Meta } from "@storybook/react";
import TabsBar from "./TabsBar";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "TabsBar",
  component: TabsBar,
} satisfies Meta<typeof TabsBar>;

export default meta;

export const Default = {
  args: {
    tabs: [
      {
        name: "tab1",
        component: <div className="w-250 h-250 bg-green-400">tab1</div>,
      },
      {
        name: "tab2",
        component: <div className="w-250 h-250 bg-red-400">tab2</div>,
      },
      {
        name: "tab3",
        component: <div className="w-250 h-250 bg-blue-400">tab3</div>,
      },
    ],
    activeTab: "tab1",
  },
};
