import { ChartValues } from "./ChartValues";
import { UserDefinedValues } from "./UserDefinedValues";

interface DefinedValues {
  initialValue: string;
  onUserValuesChange: (values: string) => void;
  chartValues: string;
  loading: boolean;
}

export const DefinedValues = ({
  initialValue,
  chartValues,
  onUserValuesChange,
  loading,
}: DefinedValues) => {
  return (
    <div className="flex w-full gap-6 mt-4">
      <UserDefinedValues
        initialValue={initialValue}
        onValuesChang={onUserValuesChange}
      />
      <ChartValues chartValues={chartValues} loading={loading} />
    </div>
  );
};
