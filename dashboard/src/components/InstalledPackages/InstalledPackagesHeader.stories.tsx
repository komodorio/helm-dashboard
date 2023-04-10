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
  installedPackages: [
    {
      id: "package1",
      image: "img",
      version: "1.0.0",
      name: "package1",
      revision: 1,
      lastUpdated: "2021-01-01",
      description: "package1 description",
    },
    {
      id: "package2",
      image: "img",
      version: "1.0.0",
      name: "package2",
      revision: 1,
      lastUpdated: "2022-01-01",
      description: "package2 description",
    },
  ],
};
