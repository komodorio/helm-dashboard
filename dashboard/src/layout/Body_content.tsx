import "../App.css"

function Body_content():JSX.Element {
  return (
    <div className="card-right-content">
              <div className="content-header">
                <h3 className="title">ChartName</h3>
                <h3 className="description">Description</h3>
                <h3 className="version">Version</h3>
              </div>
              <div className="charts">
                <h3>Airflow</h3>
                <p className="description">Desccription about chart</p>
                <p className="version">14.0.14</p>
              </div>
    </div>
  )
}

export default Body_content
