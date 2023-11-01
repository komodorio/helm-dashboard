/* eslint-disable no-console */
import { StoryFn, Meta } from "@storybook/react";
import ClustersList from "./ClustersList";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ClustersList",
  component: ClustersList,
} satisfies Meta<typeof ClustersList>;

export default meta;

//👇 We create a “template” of how args map to rendering
const Template: StoryFn<typeof ClustersList> = () => (
  <ClustersList
    filteredNamespaces={[""]}
    installedReleases={[]}
    onClusterChange={() => {
      console.log("onClusterChange called");
    }}
    selectedCluster={""}
  />
);

export const Default = {
  render: Template,
};
