import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import InstalledPackagesPagination from "./InstalledPackagesPagination";

const meta = {
  title: "InstalledPackages/InstalledPackagesPagination",
  component: InstalledPackagesPagination,
} satisfies Meta<typeof InstalledPackagesPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationWithState(props: {
  totalItems: number;
  initialPageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(props.initialPageSize ?? 10);

  return (
    <InstalledPackagesPagination
      currentPage={currentPage}
      totalItems={props.totalItems}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={(newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
      }}
    />
  );
}

export const Default: Story = {
  render: () => <PaginationWithState totalItems={45} initialPageSize={10} />,
};

export const SinglePage: Story = {
  render: () => <PaginationWithState totalItems={8} initialPageSize={10} />,
};

export const ManyPages: Story = {
  render: () => <PaginationWithState totalItems={240} initialPageSize={10} />,
};
