export default class InstalledPackage{
  version: string
  name: string;
  revision: number;
  lastUpdated: string;
  description: string;

  constructor(installedPackage: InstalledPackage){ 
    this.version = installedPackage.version;
    this.name = installedPackage.name;
    this.revision = installedPackage.revision;
    this.lastUpdated = installedPackage.lastUpdated;
    this.description = installedPackage.description;
  };
}