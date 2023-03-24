import '../App.css'

function Body_header() :JSX .Element{
  return (
    <div>
            <div >
              <h6>Repo</h6>
              <h3>bitnami</h3>
              <p>URL:<a href=""/></p>
            </div>
            <div >
              <div>
                <button>Update</button>
                <button>Remove</button>
              </div>
              <input placeholder="Filter" type='text'/>
            </div>
    </div>
  )
}

export default Body_header
