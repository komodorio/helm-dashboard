import { useState } from 'react';
import InstalledPackagesHeader from '../components/InstalledPackagesArea.tsx/InstalledPackagesHeader';
import InstalledPackagesList from '../components/InstalledPackagesArea.tsx/InstalledPackagesList';
export class InstalledPackage{
  version: string
  name: string;
  revision: number;
  lastUpdated: string;
  description: string;
  constructor(
    version: string,
    name: string,
    revision: number,
    lastUpdated: string,
    description: string
  ){ 
    this.version = version;
    this.name = name;
    this.revision = revision;
    this.lastUpdated = lastUpdated;
    this.description = description;
   };
}
const currentPackage = {
  version: "0.1.0",
  name: "airflow",
  revision: 1,
  lastUpdated: "9d",
  description: "Apache Airflow is a tool th express and execute workflows as directed acyclic graphs (DAGs) it",
}

function Installed() {

  const [installedPackages, setInstalledPackages] = useState([currentPackage, currentPackage]);

  return (
    <div
      className='p-5'
    >
      <InstalledPackagesHeader installedPackages={installedPackages} />

      <InstalledPackagesList installedPackages={installedPackages} setInstalledPackages={setInstalledPackages} />

      
    </div>
  )
}

export default Installed;