import { Meta } from "@storybook/react-vite";
// import { Meta, StoryObj, PlayFunctionContext } from "@storybook/react-vite";
// import { within, userEvent } from "@storybook/test"; // no v10 as result has version mismatch
import { Page } from "./Page";

const meta = {
  title: "Example/Page",
  component: Page,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: "fullscreen",
  },
} satisfies Meta<typeof Page>;

export default meta;

export const LoggedOut = {};

// export const LoggedIn: StoryObj<typeof Page> = {
//   play: async ({ canvasElement }: PlayFunctionContext) => {
//     const canvas = within(canvasElement);
//     const loginButton = await canvas.getByRole("button", { name: /Log in/i });
//     await userEvent.click(loginButton);
//   },
// };
