import { ChartValues } from "./ChartValues";
import { UserDefinedValues } from "./UserDefinedValues";

interface DefinedValues {
  initialValue: string;
  setValues: (values: string) => void;
  chartValues: string;
  loading: boolean;
}

export const DefinedValues = ({
  initialValue,
  chartValues,
  setValues,
  loading,
}: DefinedValues) => {
  return (
    <div className="flex w-full gap-6 mt-4">
      <UserDefinedValues initialValue={initialValue} setValues={setValues} />
      <ChartValues chartValues={chartValues} loading={loading} />
    </div>
  );
};
