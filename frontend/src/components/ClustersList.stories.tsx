import { Meta, StoryObj } from "@storybook/react";
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
export const Default: StoryObj<typeof ClustersList> = {
  args: {
    filteredNamespaces: [""],
    installedReleases: [],
    selectedCluster: "",
  },

  argTypes: {
    onClusterChange: { actions: "onClusterChange called" },
  },
};
