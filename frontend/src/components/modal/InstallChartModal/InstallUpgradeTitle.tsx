import { FC } from "react";

interface InstallUpgradeProps {
  isUpgrade: boolean;
  releaseValues: boolean;
  chartName: string;
}

export const InstallUpgradeTitle: FC<InstallUpgradeProps> = ({
  isUpgrade,
  releaseValues,
  chartName,
}) => {
  const text = isUpgrade ? "Upgrade" : "Install";

  return (
    <div className="font-bold">
      {`${text}`}
      {(isUpgrade || releaseValues) && (
        <span className="text-green-700">{chartName}</span>
      )}
    </div>
  );
};
