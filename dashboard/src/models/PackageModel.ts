export default class InstalledPackage{
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