import React from 'react'

function Navbar() {
  return (
    <div className="navbar">
        <h1>Cosmopolitan Management Panel</h1>
        <style jsx>{`

            .navbar {
                display: flex;
                flex-direction: row;
                justify-content: center;
                width: 100%;
                height: 70px;
                background: #ffffff;
                z-index: 1;
                align-items: center;
                border-bottom: 1px solid #eaeaea;
            }
        `}</style>
    </div> 

  )
}

export default Navbar