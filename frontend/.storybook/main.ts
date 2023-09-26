// .storybook/main.ts

import type { StorybookViteConfig } from "@storybook/builder-vite";
import path from "path";
const config: StorybookViteConfig = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-styling",
    {
      name: "@storybook/addon-styling",
    },
    "@storybook/addon-mdx-gfm",
  ],
  core: {},
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: true,
  },
};
export default config;
