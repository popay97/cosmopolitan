import React from 'react'

function Navbar() {
  return (
   //create a floating navbar 100 pixels tall with company logo in center and a button to login ot logout if already logged in
    <div className="navbar">
        <style jsx>{`

            .navbar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100px;
                background: #ffffff;
                z-index: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                border-bottom: 1px solid #eaeaea;
            }
            .logo {
                width: 3.5rem;
                margin-left: 20px;
            }
            .login-button {
                margin-left: 20px;
            }


        `}</style>
        <img src="/trid-logo.jpg" alt="Trid Logo" className="logo" />
        <button className="login-button">Login</button>
    </div> 

  )
}

export default Navbar