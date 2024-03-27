import { StoryFn, Meta } from "@storybook/react";
import AddRepositoryModal from "./AddRepositoryModal";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "AddRepositoryModal",
  component: AddRepositoryModal,
} satisfies Meta<typeof AddRepositoryModal>;

export default meta;

//👇 We create a “template” of how args map to rendering
const Template: StoryFn<typeof AddRepositoryModal> = (args) => (
  <AddRepositoryModal {...args} isOpen={true} />
);

export const Default = {
  render: Template,

  args: {
    isOpen: true,
  },
};
