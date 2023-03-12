import './App.css'
import Badge from './components/Badge'
import Status from './components/Status'
function App() {
  return (
    <div>
      <Badge type="error"> Hello </Badge>
      <Badge type="success"> Hello </Badge>
      <Status statusCode="Deployed" /> 
    </div>
  )
}

export default App
