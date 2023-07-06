import { useState } from "react";
import Select, { components } from "react-select";
import { BsCheck2 } from "react-icons/bs";
import { NonEmptyArray } from "../../../data/types";
import { isNewerVersion } from "../../../utils";

export const VersionToInstall: React.FC<{
  versions: NonEmptyArray<{
    repository: string;
    version: string;
    isChartVersion: boolean;
  }>;
  onSelectVersion: (props: { version: string; repository: string }) => void;
}> = ({ versions, onSelectVersion }) => {
  const chartVersion = versions.find(
    ({ isChartVersion }) => isChartVersion
  )!.version;

  const currentVersion = (
    <p className="text-xl text-muted ml-2">
      {`(current version is `}
      <span className="text-green-700">{`${chartVersion}`}</span>
      {`)`}
    </p>
  );

  // Prepare your options for react-select
  const options =
    versions.map(({ repository, version }) => ({
      value: { repository, version },
      label: `${repository} @ ${version}`,
      check: chartVersion === version,
    })) || [];
  const checkedOpt = options.find(({ check }) => check)!;
  const [selectedOption, setSelectedOption] = useState(checkedOpt);

  return (
    <div className="flex gap-2 text-xl items-center">
      {versions?.length ? (
        <>
          Version to install:{" "}
          <Select
            className="basic-single cursor-pointer min-w-[272px]"
            classNamePrefix="select"
            isClearable={false}
            isSearchable={false}
            name="version"
            options={options}
            onChange={(selectedOption) => {
              if (selectedOption) {
                setSelectedOption(selectedOption);
                onSelectVersion(selectedOption.value);
              }
            }}
            value={selectedOption}
            components={{
              SingleValue: ({ children, ...props }) => (
                <components.SingleValue {...props}>
                  <span className="text-green-700 font-bold">{children}</span>
                  {props.data.check && (
                    <BsCheck2 className="inline-block ml-2 text-green-700 font-bold" />
                  )}
                </components.SingleValue>
              ),
              Option: ({ children, isSelected, innerProps, data }) => (
                <div
                  className={`flex items-center py-2 pl-4 pr-2 text-green-700 hover:bg-blue-100`}
                  {...innerProps}
                >
                  <div className="width-auto">{children}</div>
                  {data.check && (
                    <BsCheck2
                      fontWeight={"bold"}
                      className="inline-block ml-2 text-green-700 font-bold"
                    />
                  )}
                </div>
              ),
            }} // Use the custom Option component
          />
        </>
      ) : null}

      {currentVersion}
    </div>
  );
};
