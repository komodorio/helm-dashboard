import "../App.css"
import Body_content from './Body_content'
import Body_header from './Body_header'

function Body():JSX.Element {
  return (
    <div className="card-right">
          <Body_header/>
          <Body_content/>
    </div>
  )
}

export default Body