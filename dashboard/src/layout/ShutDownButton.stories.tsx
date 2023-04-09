// TabsBar.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import ShutDownButton from "./ShutDownButton";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ShutDownButton",
  component: ShutDownButton,
} as ComponentMeta<typeof ShutDownButton>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof ShutDownButton> = () => (
  <ShutDownButton />
);

export const Default = Template.bind({});
