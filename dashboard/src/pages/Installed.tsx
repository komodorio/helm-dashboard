import { useState } from "react";
import InstalledPackagesHeader from "../components/InstalledPackages/InstalledPackagesHeader";
import InstalledPackagesList from "../components/InstalledPackages/InstalledPackagesList";
import ClustersList from "../components/ClustersList";
import { Release } from "../data/types";

const installedReleases: Release[] = [
  {
    id: "1",
    name: "argo-cd",
    namespace: "default",
    revision: "2",
    updated: "2023-04-05T08:00:07.7821687+03:00",
    status: "deployed",
    chart: "argo-cd-4.5.3",
    chartName: "argo-cd",
    chartVersion: "4.5.3",
    app_version: "2.6.7",
    icon: "https://bitnami.com/assets/stacks/argo-cd/img/argo-cd-stack-220x234.png",
    description:
      "Argo CD is a continuous delivery tool for Kubernetes based on GitOps.",
  },
  {
    id: "2",
    name: "mailhog",
    namespace: "default",
    revision: "1",
    updated: "2023-04-05T08:07:06.3105917+03:00",
    status: "deployed",
    chart: "mailhog-5.2.3",
    chartName: "mailhog",
    chartVersion: "5.2.3",
    app_version: "v1.0.1",
    icon: "https://raw.githubusercontent.com/mailhog/MailHog-UI/master/assets/images/hog.png",
    description: "An e-mail testing tool for developers",
  },
];

function Installed() {
  const [installedPackages, setInstalledPackages] =
    useState<Release[]>(installedReleases);

  return (
    <div className="flex flex-row">
      <ClustersList />
      <div className="p-5 w-4/5">
        <InstalledPackagesHeader installedPackages={installedPackages} />

        <InstalledPackagesList
          installedPackages={installedPackages}
          setInstalledPackages={setInstalledPackages}
        />
      </div>
    </div>
  );
}

export default Installed;
