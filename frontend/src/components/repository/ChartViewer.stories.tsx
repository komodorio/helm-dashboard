import { Meta } from "@storybook/react";
import ChartViewer from "./ChartViewer";

//👇 This default export determines where your story goes in the story list
const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ChartViewer",
  component: ChartViewer,
} satisfies Meta<typeof ChartViewer>;

export default meta;

const defaultArgs = {
  chart: {
    name: "chart1",
    description: "chart1 description",
    version: "v1.0.0",
  },
};

export const Default = {
  args: defaultArgs,
};
