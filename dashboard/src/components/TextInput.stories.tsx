/**
 * @file TextInput.stories.tsx
 * @description This file contains the TextInput component stories.
 * the first story simply renders the component with the default props.
 */

import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import TextInput from "./TextInput";
import { TextInputProps } from "./TextInput";
import {Story} from "@storybook/react/types-6-0";

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
const Template: ComponentStory<typeof TextInput> = (args) => (
  <TextInput {...args} />
);
// we create another template that will enable us to pass the props
// using 'props' as the argument. recall that TextInput has 'props',
// which is of type TextInputProps. we want to pass them to the story
// with the name 'Primary', so we create a template for it.
const Template2: Story<TextInputProps> = (args) => <TextInput props={args} />;
export const Primary = Template2.bind({});
Primary.args = {
  label: "Label",
  placeholder: "Write something here...",
  isMandatory: false,
  onChange: () => {},
};

export const FirstStory = Template.bind({});
FirstStory.args = {
  props: {
    label: "Label",
    placeholder: "Write something here...",
    isMandatory: false,
    onChange: () => {},
  },
};