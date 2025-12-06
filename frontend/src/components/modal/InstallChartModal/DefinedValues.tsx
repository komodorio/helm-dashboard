import { ChartValues } from "./ChartValues";
import { UserDefinedValues } from "./UserDefinedValues";

interface DefinedValuesProps {
  initialValue: string;
  onUserValuesChange: (values: string) => void;
  chartValues: string;
  loading: boolean;
}

const DefinedValues = ({
  initialValue,
  chartValues,
  onUserValuesChange,
  loading,
}: DefinedValuesProps) => {
  return (
    <div className="mt-4 flex w-full gap-6">
      <UserDefinedValues
        initialValue={initialValue}
        onValuesChange={onUserValuesChange}
      />
      <ChartValues chartValues={chartValues} loading={loading} />
    </div>
  );
};

export default DefinedValues;
