// InstalledPackagesList.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import InstalledPackagesList from "./InstalledPackagesList";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "InstalledPackagesList",
  component: InstalledPackagesList,
} as ComponentMeta<typeof InstalledPackagesList>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof InstalledPackagesList> = (args) => (
  <InstalledPackagesList {...args} />
);

export const Default = Template.bind({});

Default.args = {
  installedReleases: [
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
