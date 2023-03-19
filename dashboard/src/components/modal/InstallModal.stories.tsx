// Modal.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import InstallModal from "./InstallModal";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "InstallModal",
  component: InstallModal,
} as ComponentMeta<typeof InstallModal>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof InstallModal> = (args) => (
  <InstallModal
    {...args}
    isOpen={true}
    onConfirm={() => console.log("confirm clicked")}
  ></InstallModal>
);

export const Default = Template.bind({});

Default.args = {
  installTarget: "airflow",
  isOpen: true,
};
