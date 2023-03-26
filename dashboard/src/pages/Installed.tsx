import InstalledPackagesHeader from '../components/InstalledPackagesArea.tsx/InstalledPackagesHeader';
import InstalledPackagesList from '../components/InstalledPackagesArea.tsx/InstalledPackagesList';

function Installed() {

  // const [installedPackages, setInstalledPackages] = useState([]);

  return (
    <div
      className='p-5'
    >
      <InstalledPackagesHeader />

      <InstalledPackagesList/>

      
    </div>
  )
}

export default Installed;