import hljs from "highlight.js";
import Spinner from "../../Spinner";
import { Loadable } from "../../../types";

export const ChartValues = ({
  chartValues,
}: {
  chartValues: Loadable<string>;
}) => {
  if (chartValues.state === 'error') {
    throw chartValues.error;
  }
  return (
    <div className="w-1/2">
      <label
        className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
        htmlFor="grid-user-defined-values"
      >
        Chart Value Reference:
      </label>
      <pre
        className="text-base bg-[#ECEFF2] p-2 rounded font-medium w-full max-h-[330px] block overflow-y-auto font-sf-mono"
        dangerouslySetInnerHTML={
          chartValues.state === 'hasValue'
            ? {
              __html: hljs.highlight(chartValues.value, { language: "yaml" }).value,
            }
            : undefined
        }
      >
        {chartValues.state === 'loading' ? (
          <Spinner />
        ) : !chartValues.value ? (
          "No original values information found"
        ) : null}
      </pre>
    </div>
  );
};
