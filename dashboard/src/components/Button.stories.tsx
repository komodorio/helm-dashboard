/* eslint-disable no-console */
// Status.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import Button, { ButtonProps } from "./Button";
//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "Button",
  component: Button,
} as ComponentMeta<typeof Button>;

// Recall that Button has 'props' which is of type ButtonProps
// We want to past theme to the story with the name 'Default', so we
// create a template for it.
// We want to declare default values for the props, so we create a
// default args object.
const Template: ComponentStory<typeof Button> = (args: ButtonProps) => (
  <Button {...args} />
);
export const Default = Template.bind({});
Default.args = {
  children: (
    <>
      <span>&uarr;</span>
      <span>Update</span>
    </>
  ),
  onClick: () => {
    console.log("click");
  },
};
