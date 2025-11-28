import "tailwindcss/tailwind.css";
import "../src/index.css";

import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Preview, StoryFn } from "@storybook/react";

import { AppContextProvider } from "../src/context/AppContext";

const queryClient = new QueryClient();

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators: Preview["decorators"] = [
    (Story: StoryFn) => (
        <BrowserRouter>
          <AppContextProvider>
            <QueryClientProvider client={queryClient}>
              <Story />
            </QueryClientProvider>
          </AppContextProvider>
        </BrowserRouter>
    ),
];

export const tags = ["autodocs"];
