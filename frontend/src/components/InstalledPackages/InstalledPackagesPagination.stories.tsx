import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import InstalledPackagesPagination, {
  type InstalledPackagesPaginationProps,
} from "./InstalledPackagesPagination";

const meta = {
  title: "InstalledPackages/InstalledPackagesPagination",
  component: InstalledPackagesPagination,
} satisfies Meta<typeof InstalledPackagesPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationWithState(args: InstalledPackagesPaginationProps) {
  const [currentPage, setCurrentPage] = useState(args.currentPage);
  const [pageSize, setPageSize] = useState(args.pageSize);

  return (
    <InstalledPackagesPagination
      {...args}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={(page) => {
        setCurrentPage(page);
        args.onPageChange(page);
      }}
      onPageSizeChange={(newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
        args.onPageSizeChange(newSize);
      }}
    />
  );
}

export const Default: Story = {
  args: {
    currentPage: 1,
    totalItems: 45,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
  render: (args) => <PaginationWithState {...args} />,
};

export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalItems: 8,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
  render: (args) => <PaginationWithState {...args} />,
};

export const ManyPages: Story = {
  args: {
    currentPage: 1,
    totalItems: 240,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
  render: (args) => <PaginationWithState {...args} />,
};
