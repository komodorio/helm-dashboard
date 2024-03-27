/**
 * @file TextInput.stories.tsx
 * @description This file contains the TextInput component stories.
 * the first story simply renders the component with the default props.
 */

import { Meta } from "@storybook/react";
import TextInput from "./TextInput";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "TextInput",
  component: TextInput,
} satisfies Meta<typeof TextInput>;

export default meta;

export const Default = {
  args: {
    label: "Label",
    placeholder: "Placeholder",
    isMandatory: false,
  },
};
