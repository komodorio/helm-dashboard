
import "./Repo_Manage_Section.css"
function Repo_Manage_Section():JSX.Element {
  return (
    <div className='Card'>
        <h2>Repositories</h2>
        <form>
          <label className="repo_options"><input type="radio" className="radio-btn" name="select_repo" value="bitnami"/><span className="option">bitnami</span></label> 
          <label className="repo_options"><input type="radio" className="radio-btn" name="select_repo" value="brigade"/><span className="option">brigade</span></label>
        </form>
        <button>
            <div className="btn-element">
                <div className="btn-logo">
                    +
                </div>
                <div className="btn-title">
                    Add Repository
                </div>
            </div>
        </button>
        <p>Charts developers: you can also add local directories as chart source. Use <a href="" className="chart">--local-chart</a> CLI switch to specify it.</p>
    </div>
  )
}

export default Repo_Manage_Section
