import './App.css'
import Badge from './components/Badge'
import Status from './components/Status'
import Button from './components/Button'
import RevisionCard from './components/RevisionCard'
function App() {
  return (
    <div>
      <hr />
      <Badge type="error"> Hello </Badge>
      <hr />
      <Badge type="success"> Hello </Badge>
      <hr />
      <Status statusCode="Deployed" />
      <hr />
      <Button onClick={()=>{return}}> hello</Button>
      <hr />
      <RevisionCard revisionDate={new Date('August 19, 1975 23:15:30')} 
        revision={"8"} previousVersion={"1.0.0"} currentVersion={"1.0.1"} statusCode={"Superseded"}/>
    </div>
  )
}

export default App
