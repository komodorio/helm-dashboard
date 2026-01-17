import type { FC } from "react";
import { useMemo, useState } from "react";
import type { GroupBase, SingleValueProps } from "react-select";
import Select, { components } from "react-select";
import { BsCheck2 } from "react-icons/bs";
import type { NonEmptyArray } from "../../../data/types";

interface Version {
  repository: string;
  version: string;
  isChartVersion: boolean;
  urls: string[];
}

type VersionOptionType = {
  value: Omit<Version, "isChartVersion">;
  label: string;
  check: boolean;
};

type SpecificSingleValueProps = SingleValueProps<
  VersionOptionType,
  false, // IsMulti
  GroupBase<VersionOptionType>
>;

export const VersionToInstall: FC<{
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
      <p className="ml-2 text-xl text-muted">
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
    <div className="flex items-center gap-2 text-xl">
      {versions?.length && (selectedOption || initOpt) ? (
        <>
          Version to install:{" "}
          <Select
            className="basic-single min-w-[272px] cursor-pointer"
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
              SingleValue: ({ children, ...props }) => {
                const OriginalSingleValue =
                  components.SingleValue as FC<SpecificSingleValueProps>;

                return (
                  <OriginalSingleValue {...props}>
                    <span className="font-bold text-green-700">{children}</span>
                    {props.data.check && showCurrentVersion && (
                      <BsCheck2 className="ml-2 inline-block font-bold text-green-700" />
                    )}
                  </OriginalSingleValue>
                );
              },
              Option: ({ children, innerProps, data }) => (
                <div
                  className={
                    "flex items-center py-2 pr-2 pl-4 text-green-700 hover:bg-blue-100"
                  }
                  {...innerProps}
                >
                  <div className="width-auto">{children}</div>
                  {data.check && showCurrentVersion && (
                    <BsCheck2
                      fontWeight={"bold"}
                      className="ml-2 inline-block font-bold text-green-700"
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
