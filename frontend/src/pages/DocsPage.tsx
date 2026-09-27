import SwaggerUI from "swagger-ui-react";

import "swagger-ui-react/swagger-ui.css";
import openapi from "../../public/openapi.json";

// API lives next to the page, which may be served under a path prefix
const server = new URL(".", window.location.href).href.replace(/\/$/, "");

const DocsPage = () => {
  return <SwaggerUI spec={{ ...openapi, servers: [{ url: server }] }} />;
};

export default DocsPage;
