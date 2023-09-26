// RepositoriesList.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import RepositoriesList from "./RepositoriesList";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "RepositoriesList",
  component: RepositoriesList,
} as ComponentMeta<typeof RepositoriesList>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof RepositoriesList> = () => (
  <RepositoriesList
    selectedRepository={undefined}
    // in this case we allow Unexpected empty method
    //eslint-disable-next-line @typescript-eslint/no-empty-function
    onRepositoryChanged={() => {}}
    repositories={[]}
  />
);

export const Default = Template.bind({});
