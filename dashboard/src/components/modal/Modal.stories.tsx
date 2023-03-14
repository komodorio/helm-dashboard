// Modal.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import Modal, { ModalAction, ModalButtonStyle } from "./Modal";

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
  <Modal {...args}>Basic text content</Modal>
);

export const BasicModal = Template.bind({});

const confirmModalActions: ModalAction[] = [
  {
    text: "Cancel",
    callback: () => {
      console.log("confirmModal: clicked Cancel");
    },
  },
  {
    text: "Confirm",
    callback: () => {
      console.log("confirmModal: clicked Confirm");
    },
    btnStyle: ModalButtonStyle.primary,
  },
];

BasicModal.args = {
  title: "Basic text title",
  isOpen: true,
  actions: confirmModalActions,
};

export const CustomModal: ComponentStory<typeof Modal> = (args) => (
  <Modal {...args}>
    <div>
      <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
        Custom Modal Content
      </p>
      <button
        className="bg-cyan-500 p-2"
        type="button"
        onClick={() => alert("just a button")}
      >
        Just a button
      </button>
    </div>
  </Modal>
);

CustomModal.args = {
  title: (
    <div>
      Custom <span className="text-red-500"> Title</span>
    </div>
  ),
  isOpen: true,
  actions: confirmModalActions,
};

export const AutoScrollWhenContentIsMoreThan500Height: ComponentStory<typeof Modal> = (args) => (
  <Modal {...args}>
    <div style={{ height: "1000px",width:'50%',  backgroundColor: "skyblue" }}>
      This div height is 1000 px so we can see a vertical scroll to the right of it.
    </div>
  </Modal>
);

AutoScrollWhenContentIsMoreThan500Height.args = {
  title: 'Auto Scroll when content is more than height 500px ',
  isOpen: true,
  actions: confirmModalActions,
};
