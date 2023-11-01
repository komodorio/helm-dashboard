import { Meta } from "@storybook/react";
import InstalledPackagesHeader from "./InstalledPackagesHeader";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "InstalledPackagesHeader",
  component: InstalledPackagesHeader,
} satisfies Meta<typeof InstalledPackagesHeader>;

export default meta;

export const Default = {
  args: {
    filteredReleases: [
      {
        id: "",
        name: "",
        namespace: "",
        revision: 1,
        updated: "",
        status: "",
        chart: "",
        chart_name: "",
        chart_ver: "",
        app_version: "",
        icon: "",
        description: "",
        has_tests: false,
        chartName: "", // duplicated in some cases in the backend, we need to resolve this
        chartVersion: "", // duplicated in some cases in the
      },
      {
        id: "",
        name: "",
        namespace: "",
        revision: 1,
        updated: "",
        status: "",
        chart: "",
        chart_name: "",
        chart_ver: "",
        app_version: "",
        icon: "",
        description: "",
        has_tests: false,
        chartName: "", // duplicated in some cases in the backend, we need to resolve this
        chartVersion: "", // duplicated in some cases in the
      },
    ],
  },
};
