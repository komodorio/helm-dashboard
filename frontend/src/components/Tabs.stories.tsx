// TabsBar.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import Tabs from "./Tabs";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "Tabs",
  component: Tabs,
} as ComponentMeta<typeof Tabs>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Tabs> = (args) => <Tabs {...args} />;

export const Default = Template.bind({});

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

//@ts-ignore
Default.args = defaultArgs;
