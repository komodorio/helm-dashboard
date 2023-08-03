// Modal.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import AddRepositoryModal from "./AddRepositoryModal";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "AddRepositoryModal",
  component: AddRepositoryModal,
} as ComponentMeta<typeof AddRepositoryModal>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof AddRepositoryModal> = (args) => (
  <AddRepositoryModal {...args} isOpen={true} />
);

export const Default = Template.bind({});

Default.args = {
  isOpen: true,
};
