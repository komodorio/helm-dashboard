// ChartViewer.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import ChartViewer from "./ChartViewer";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ChartViewer",
  component: ChartViewer,
} as ComponentMeta<typeof ChartViewer>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof ChartViewer> = (args) => (
  <ChartViewer {...args} />
);

export const Default = Template.bind({});

const defaultArgs = {
  chart: {
    name: "chart1",
    description: "chart1 description",
    version: "v1.0.0",
  },
};

//@ts-ignore
Default.args = defaultArgs;
