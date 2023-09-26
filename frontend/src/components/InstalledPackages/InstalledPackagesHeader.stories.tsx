// InstalledPackagesHeader.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import InstalledPackagesHeader from "./InstalledPackagesHeader";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "InstalledPackagesHeader",
  component: InstalledPackagesHeader,
} as ComponentMeta<typeof InstalledPackagesHeader>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof InstalledPackagesHeader> = (args) => (
  <InstalledPackagesHeader {...args} />
);

export const Default = Template.bind({});

Default.args = {
  filteredReleases: [
    {
      id: "",
      name: "",
      namespace: "",
      revision: 1,
      updated: "",
      status: "",
      chart: "",
      chart_name: "",
      chart_ver: "",
      app_version: "",
      icon: "",
      description: "",
      has_tests: false,
      chartName: "", // duplicated in some cases in the backend, we need to resolve this
      chartVersion: "", // duplicated in some cases in the
    },
    {
      id: "",
      name: "",
      namespace: "",
      revision: 1,
      updated: "",
      status: "",
      chart: "",
      chart_name: "",
      chart_ver: "",
      app_version: "",
      icon: "",
      description: "",
      has_tests: false,
      chartName: "", // duplicated in some cases in the backend, we need to resolve this
      chartVersion: "", // duplicated in some cases in the
    },
  ],
};
