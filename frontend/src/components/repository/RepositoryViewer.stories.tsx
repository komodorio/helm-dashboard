// RepositoryViewer.stories.ts|tsx

import { StoryFn, Meta } from "@storybook/react";
import RepositoryViewer from "./RepositoryViewer";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "RepositoryViewer",
  component: RepositoryViewer,
} as Meta<typeof RepositoryViewer>;

//👇 We create a “template” of how args map to rendering
const Template: StoryFn<typeof RepositoryViewer> = () => (
  <RepositoryViewer repository={undefined} />
);

export const Default = {
  render: Template,
};
