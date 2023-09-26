/**
 * @file TextInput.stories.tsx
 * @description This file contains the TextInput component stories.
 * the first story simply renders the component with the default props.
 */

import { ComponentStory, ComponentMeta } from "@storybook/react";
import TextInput, { TextInputProps } from "./TextInput";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "TextInput",
  component: TextInput,
} as ComponentMeta<typeof TextInput>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof TextInput> = (args: TextInputProps) => (
  <TextInput {...args} />
);

export const Default = Template.bind({});
Default.args = {
  label: "Label",
  placeholder: "Placeholder",
  isMandatory: false,
};
