import { StoryFn, Meta } from "@storybook/react";
import RepositoriesList from "./RepositoriesList";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "RepositoriesList",
  component: RepositoriesList,
} satisfies Meta<typeof RepositoriesList>;

export default meta;

//👇 We create a “template” of how args map to rendering
const Template: StoryFn<typeof RepositoriesList> = () => (
  <RepositoriesList
    selectedRepository={undefined}
    // in this case we allow Unexpected empty method
    //eslint-disable-next-line @typescript-eslint/no-empty-function
    onRepositoryChanged={() => {}}
    repositories={[]}
  />
);

export const Default = {
  render: Template,
};
