import { ChartValues } from "./ChartValues";
import { UserDefinedValues } from "./UserDefinedValues";

interface DefinedValuesProps {
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
}: DefinedValuesProps) => {
  return (
    <div className="flex w-full gap-6 mt-4">
      <UserDefinedValues
        initialValue={initialValue}
        onValuesChange={onUserValuesChange}
      />
      <ChartValues chartValues={chartValues} loading={loading} />
    </div>
  );
};
