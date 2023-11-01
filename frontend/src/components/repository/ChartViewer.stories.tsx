// ChartViewer.stories.ts|tsx

import { StoryFn, Meta } from "@storybook/react";
import ChartViewer from "./ChartViewer";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ChartViewer",
  component: ChartViewer,
} as Meta<typeof ChartViewer>;

export const Default = {
  args: defaultArgs,
};

const defaultArgs = {
  chart: {
    name: "chart1",
    description: "chart1 description",
    version: "v1.0.0",
  },
};
