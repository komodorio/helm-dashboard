import '../App.css'

function Body_header() :JSX .Element{
  return (
    <div className="card-right-header">
            <div className="card-right-header-left">
              <h6>Repo</h6>
              <h3>bitnami</h3>
              <p>URL:<a href=""/></p>
            </div>
            <div className="card-right-header-right">
              <div className="card-right-header-right-btn">
                <button>Update</button>
                <button>Remove</button>
              </div>
              <input placeholder="Filter" type='text'/>
            </div>
    </div>
  )
}

export default Body_header
