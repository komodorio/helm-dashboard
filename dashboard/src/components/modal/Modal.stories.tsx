// Modal.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import Modal, { ModalAction } from "./Modal";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "Modal",
  component: Modal,
} as ComponentMeta<typeof Modal>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Modal> = (args) => (
  <Modal {...args}>
    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
    Lorem Ipsum has been the industry's standard dummy text ever since the
    1500s, when an unknown printer took a galley of type and scrambled it to
    make a type specimen book.
  </Modal>
);

export const ConfirmModal = Template.bind({});

const confirmModalActions: ModalAction[] = [
  {
    text: "Confirm",
    callback: () => {
      console.log("confirmModal clicked Confirm");
    },
  },
];

ConfirmModal.args = {
  title: "Standard title",
  isOpen: true,
  actions: confirmModalActions,
};
