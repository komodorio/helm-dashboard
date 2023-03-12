import './App.css'
import Badge from './components/Badge'
import Status from './components/Status'
import Button from './components/Button'
function App() {
  return (
    <div>
      <br />
      <Badge type="error"> Hello </Badge>
      <br />
      <Badge type="success"> Hello </Badge>
      <br />
      <Status statusCode="Deployed" />
      <br />
      <Button> hello</Button>
      <br />
    </div>
  )
}

export default App
