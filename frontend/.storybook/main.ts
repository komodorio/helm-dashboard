import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs"
  ],
  core: {},

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  features: {
    mdx2Csf: true,
  }
};

export default config;
