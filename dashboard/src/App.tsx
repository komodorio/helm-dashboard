import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
// import the Badge component from the components folder
import Badge from './components/Badge'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <h1 className="text-4xl text-center">hello world</h1>
    <Badge type="warning">Warning</Badge>
    <Badge type="error" >Error</Badge>
    <Badge type="success">Success</Badge>
    <Badge type='info'>Info</Badge>
    </>
  )
}

export default App
