import { useMemo, useState } from "react";
import Select, { components } from "react-select";
import { BsCheck2 } from "react-icons/bs";
import { NonEmptyArray } from "../../../data/types";

interface Version {
  repository: string;
  version: string;
  isChartVersion: boolean;
  urls: string[];
}

export const VersionToInstall: React.FC<{
  versions: NonEmptyArray<Version>;
  initialVersion?: {
    repository?: string;
    version?: string;
  };
  onSelectVersion: (props: {
    version: string;
    repository: string;
    urls: string[];
  }) => void;
  showCurrentVersion: boolean;
}> = ({ versions, onSelectVersion, showCurrentVersion, initialVersion }) => {
  const chartVersion = useMemo(
    () => versions.find(({ isChartVersion }) => isChartVersion)?.version,
    [versions]
  );

  const currentVersion =
    chartVersion && showCurrentVersion ? (
      <p className="text-xl text-muted ml-2">
        {"(current version is "}
        <span className="text-green-700">{`${chartVersion}`}</span>
        {")"}
      </p>
    ) : null;

  // Prepare your options for react-select
  const options = useMemo(
    () =>
      versions.map(({ repository, version, urls }) => ({
        value: { repository, version, urls },
        label: `${repository} @ ${version}`,
        check: chartVersion === version,
      })) || [],
    [chartVersion, versions]
  );
  const [selectedOption, setSelectedOption] =
    useState<(typeof options)[number]>();
  const initOpt = useMemo(
    () =>
      options.find(
        ({ value }) =>
          value.version === initialVersion?.version &&
          value.repository === initialVersion?.repository
      ),
    [options, initialVersion]
  );
  return (
    <div className="flex gap-2 text-xl items-center">
      {versions?.length && (selectedOption || initOpt) ? (
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
            value={selectedOption ?? initOpt}
            components={{
              SingleValue: ({ children, ...props }) => (
                <components.SingleValue {...props}>
                  <span className="text-green-700 font-bold">{children}</span>
                  {props.data.check && showCurrentVersion && (
                    <BsCheck2 className="inline-block ml-2 text-green-700 font-bold" />
                  )}
                </components.SingleValue>
              ),
              Option: ({ children, innerProps, data }) => (
                <div
                  className={
                    "flex items-center py-2 pl-4 pr-2 text-green-700 hover:bg-blue-100"
                  }
                  {...innerProps}
                >
                  <div className="width-auto">{children}</div>
                  {data.check && showCurrentVersion && (
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
