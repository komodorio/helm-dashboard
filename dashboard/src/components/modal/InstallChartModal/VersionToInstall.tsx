import { isNewerVersion } from "../../../utils";

interface Props {
  chartVersion: string;
  selectedVersion: string;
  setSelectedVersion: (version: string) => void;
  versions: { repository: string; version: string }[];
  isInstall: boolean;
}

export const VersionToInstall = ({
  chartVersion,
  selectedVersion,
  setSelectedVersion,
  versions,
  isInstall,
}: Props) => {
  const currentVersion = (
    <p className="text-xl text-muted font-medium	">
      (current version is:{" "}
      <span className="text-green-700">{chartVersion}</span>)
    </p>
  );

  return (
    <div className="flex gap-2 text-xl">
      {versions?.length ? (
        <>
          Version to install:{" "}
          <select
            className=" py-1 border-2 border-gray-200 text-blue-500 rounded"
            onChange={(e) => {
              setSelectedVersion(e.target.value);
            }}
            value={selectedVersion}
          >
            {versions
              ?.sort((a, b) => (isNewerVersion(a.version, b.version) ? 1 : -1))
              .map(({ repository, version }) => (
                <option
                  value={version}
                  key={repository + version}
                >{`${repository} @ ${version}`}</option>
              ))}
          </select>{" "}
        </>
      ) : null}

      {!isInstall ? currentVersion : null}
    </div>
  );
};
