/* eslint-disable no-console */
// ClustersListBar.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import ClustersList from "./ClustersList";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ClustersList",
  component: ClustersList,
} as ComponentMeta<typeof ClustersList>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof ClustersList> = () => (
  <ClustersList
    filteredNamespaces={[""]}
    installedReleases={[]}
    onClusterChange={() => {
      console.log("onClusterChange called");
    }}
    selectedCluster={""}
  />
);

export const Default = Template.bind({});
