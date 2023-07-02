import { marked } from "marked";
import hljs from "highlight.js";
import Spinner from "../../Spinner";

export const ChartValues = ({
  chartValues,
  loading,
}: {
  chartValues: string;
  loading: boolean;
}) => {
  return (
    <div className="w-1/2">
      <label
        className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
        htmlFor="grid-user-defined-values"
      >
        Chart value reference
      </label>
      <pre
        className="bg-gray-100 rounded p-4 font-medium text-md w-full max-h-[300px] block overflow-y-auto"
        dangerouslySetInnerHTML={
          chartValues && !loading
            ? {
                __html: marked(
                  hljs.highlight(chartValues, { language: "yaml" }).value
                ),
              }
            : undefined
        }
      >
        {loading ? (
          <Spinner />
        ) : !chartValues && !loading ? (
          "No original values information found"
        ) : null}
      </pre>
    </div>
  );
};
