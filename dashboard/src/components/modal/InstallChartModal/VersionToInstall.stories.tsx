import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { VersionToInstall } from "./VersionToInstall";

export default {
    title: 'VersionToInstall',
    component: VersionToInstall,
} as Meta<typeof VersionToInstall>;


type Story = StoryObj<typeof VersionToInstall>

export const Primary: Story = {
    args: {
        versions: [
            { repository: "repo1", version: "1.0.0", isChartVersion: false },
            { repository: "repo2", version: "1.0.1", isChartVersion: false },
            { repository: "repo3", version: "1.0.2", isChartVersion: false },
            { repository: "repo4", version: "1.0.3", isChartVersion: false },
            { repository: "repo5", version: "1.0.4", isChartVersion: false },
            { repository: "repo6", version: "1.0.5", isChartVersion: false },
            { repository: "repo7", version: "1.0.6", isChartVersion: false },
            { repository: "repo8", version: "1.0.7", isChartVersion: true },
        ],
        onSelectVersion: (version: string) => console.log(version),
    }
}


