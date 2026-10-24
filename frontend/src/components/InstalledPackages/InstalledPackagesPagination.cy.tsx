import { mount } from "cypress/react";
import { useState } from "react";

import InstalledPackagesPagination from "./InstalledPackagesPagination";

function TestPaginationWrapper({
  totalItems = 45,
  initialPageSize = 10,
}: {
  totalItems?: number;
  initialPageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  return (
    <InstalledPackagesPagination
      currentPage={currentPage}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={(newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
      }}
    />
  );
}

describe("InstalledPackagesPagination component tests", () => {
  it("renders range and total count", () => {
    mount(<TestPaginationWrapper totalItems={45} initialPageSize={10} />);
    cy.get("[data-cy='installed-packages-pagination']").should("exist");
    cy.contains("Showing 1 to 10 of 45 releases").should("exist");
  });

  it("changes page when pagination button is clicked", () => {
    mount(<TestPaginationWrapper totalItems={45} initialPageSize={10} />);
    cy.contains("button", "2").click();
    cy.contains("Showing 11 to 20 of 45 releases").should("exist");
  });

  it("updates page size when per-page selector changes", () => {
    mount(<TestPaginationWrapper totalItems={45} initialPageSize={10} />);
    cy.get("[data-cy='page-size-select']").select("25");
    cy.contains("Showing 1 to 25 of 45 releases").should("exist");
  });

  it("does not render when totalItems is 0", () => {
    mount(<TestPaginationWrapper totalItems={0} initialPageSize={10} />);
    cy.get("[data-cy='installed-packages-pagination']").should("not.exist");
  });
});
