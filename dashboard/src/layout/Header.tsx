import "../App.css"

function Header():JSX.Element {
  return (
    <header className="app-header">
    <div className="header-left">
      <div className="logo">
        <img src="" alt='Helm-DashBoard'/>
      </div>
      <div className="vertical-seperator">
        |
      </div>
      <div className="header-items">
        <h3>Installed</h3>
        <h3>Repository</h3>
        <h3>Help</h3>
        <h3>Upgrade</h3>
      </div>
    </div>
    <div className="header-right">
        <div className="redirect">
          <img className='komodor-img'src="" alt='Komodor'/>  
          <span>
            <a href="" />
            <p>Some Content</p>
          </span>
        </div>
        <div className="vertical-seperator">
          |
        </div>
        <div className="signout-btn">
          <button>Signout</button>
        </div>
    </div>
  </header>
  )
}

export default Header
