/* eslint-disable no-console */
import { Meta } from "@storybook/react";
import Button from "./Button";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

export const Default = {
  args: {
    children: (
      <>
        <span>&uarr;</span>
        <span>Update</span>
      </>
    ),
    onClick: () => {
      console.log("click");
    },
  },
};
