// TabsBar.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import TabsBar from "./TabsBar";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "TabsBar",
  component: TabsBar,
} as ComponentMeta<typeof TabsBar>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof TabsBar> = (args) => (
  <TabsBar {...args} />
);

export const Default = Template.bind({});

Default.args = {
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
};
