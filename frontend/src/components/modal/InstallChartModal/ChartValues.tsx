import hljs from "highlight.js/lib/core";
import Spinner from "../../Spinner";
import yaml from "highlight.js/lib/languages/yaml";

hljs.registerLanguage("yaml", yaml);

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
        className="mb-2 block text-xl font-medium tracking-wide text-gray-700"
        htmlFor="grid-user-defined-values"
      >
        Chart Value Reference:
      </label>
      <pre
        className="block max-h-[330px] w-full overflow-y-auto rounded-sm bg-chart-values p-2 font-sf-mono text-base font-medium"
        dangerouslySetInnerHTML={
          chartValues && !loading
            ? {
                __html: hljs.highlight(chartValues, {
                  language: "yaml",
                }).value,
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
