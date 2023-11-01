import { StoryFn, Meta } from "@storybook/react";
import RepositoryViewer from "./RepositoryViewer";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "RepositoryViewer",
  component: RepositoryViewer,
} satisfies Meta<typeof RepositoryViewer>;

export default meta;

//👇 We create a “template” of how args map to rendering
const Template: StoryFn<typeof RepositoryViewer> = () => (
  <RepositoryViewer repository={undefined} />
);

export const Default = {
  render: Template,
};
