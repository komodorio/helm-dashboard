// InstalledPackageCard.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import InstalledPackageCard from "./InstalledPackageCard";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "InstalledPackageCard",
  component: InstalledPackageCard,
} as ComponentMeta<typeof InstalledPackageCard>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof InstalledPackageCard> = (args) => (
  <InstalledPackageCard {...args} />
);

export const Default = Template.bind({});

Default.args = {
  installedPackage: {
    id: "package1",
    image: "img",
    version: "1.0.0",
    name: "package1",
    revision: 1,
    lastUpdated: "2021-01-01",
    description: "package1 description",
  },
};
