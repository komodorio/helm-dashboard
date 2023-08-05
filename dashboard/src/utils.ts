import { Diff2HtmlUIConfig } from "diff2html/lib/ui/js/diff2html-ui-base";
import { NonEmptyArray } from "./data/types";

export const isNewerVersion = (oldVer: string, newVer: string) => {
  if (oldVer && oldVer[0] === "v") {
    oldVer = oldVer.substring(1);
  }

  if (newVer && newVer[0] === "v") {
    newVer = newVer.substring(1);
  }

  const oldParts = oldVer.split(".");
  const newParts = newVer.split(".");
  for (let i = 0; i < newParts.length; i++) {
    const a = ~~newParts[i]; // parse int
    const b = ~~oldParts[i]; // parse int
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
};

export function isNoneEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return Array.isArray(arr) && arr.length > 0;
}

export const diffConfiguration: Diff2HtmlUIConfig = {
  drawFileList: false,
  outputFormat: "side-by-side",
  matching: "lines",
  renderNothingWhenEmpty: false,
  highlight: true,
  fileContentToggle: false,
  stickyFileHeaders: false,
  rawTemplates: {
    "file-summary-wrapper": "<div class='hidden'></div>", // hide this element
    "generic-line":
      "<tr><td class='{{lineClass}} {{type}}'>{{{lineNumber}}}</td><td class='{{type}}'><div class='{{contentClass}} w-auto'>{{#prefix}}<span class='d2h-code-line-prefix'>{{{prefix}}}</span>{{/prefix}}{{^prefix}}<span class='d2h-code-line-prefix'>&nbsp;</span>{{/prefix}}{{#content}}<span class='d2h-code-line-ctn'>{{{content}}}</span>{{/content}}{{^content}}<span class='d2h-code-line-ctn'><br></span>{{/content}}</div></td></tr>", // added 'w-auto' to most outer div to prevent horizontal scroll
    "tag-file-changed": "",
    "tag-file-renamed": "",
    "tag-file-added": "",
    "tag-file-deleted": "",
  },
};
