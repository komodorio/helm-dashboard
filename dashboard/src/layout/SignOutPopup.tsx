import React from 'react'
import "./SignOutPopup.css"
function SignOutPopup():JSX.Element {
  return (
    <div className='signout-background'>
      <div className='signout'>
        <h1>Session Ended</h1>
        <hr/>
        <p>The Helm Dashboard application has been shutdown. You can now close the browser tab.</p>
      </div>  
    </div>
  )
}

export default SignOutPopup
