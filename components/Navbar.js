import React, { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';
import { useRouter } from 'next/router';
function Navbar({noBack}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('cosmo_token');
    const user = jwt.decode(token);
    setUser(user);
    if (!token) {
      router.push('/');

    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const menuLinks = [{ href: 'app/dashboard', title: 'Dashboard' }, { href: 'app/accounting', title: 'Obracuni' }, { href: 'app/manageUsers', title: 'Upravljanje Korisnicima' }, { href: 'app/reports', title: 'Report/Baza' }, { href: 'app/accounting', title: 'Accounting' }, { href: 'app/statistics', title: 'Statistike Mjeseci' }, { href: 'app/statisticsByDest', title: 'Statistike Destinacije' }, { href: 'app/tables', title: 'Cijene/Lokacije' },];
  return (
    <div className="navbar">

      {noBack != true ? <div className="navbar__left">
        <div onClick={() => window.history.back()} style={{ cursor: 'pointer' }}>&larr; Back</div>
      </div> : <div></div>}
      <h1 className="navbar__title">Cosmopolitan Management Panel</h1>
      {user?.isAdmin && (<div className="navbar__right">
        <button className="navbar__hamburger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        {isMenuOpen && (
          <div className="navbar__menu">
            {menuLinks.map((link, index) => (
              <div key={index} className='navbar__menu-link' onClick={() => {
                router.push(`/${link.href}`);
                setIsMenuOpen(false);
              }} >
                {link.title}
              </div>
            ))}
            <div className='navbar__menu-link' onClick={() => {
              localStorage.removeItem('cosmo_token');
              router.push('/');
            }} >
              Sign Out
            </div>
          </div>
        )}
      </div>)}
      <style jsx>{`
        .navbar {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 70px;
          background: #ffffff;
          z-index: 1;
          border-bottom: 1px solid #eaeaea;
        }

        .navbar__left {
          margin-left: 20px;
        }

        .navbar__title {
          margin: 0;
        }

        .navbar__right {
          margin-right: 20px;
          position: relative;
        }

        .navbar__hamburger {
          display: block;
          width: 30px;
          height: 20px;
          position: relative;
          cursor: pointer;
          padding: 0;
          border: none;
          background: transparent;
        }

        .navbar__hamburger span {
          display: block;
          width: 100%;
          height: 3px;
          background-color: #000;
          position: absolute;
          left: 0;
          transition: all 0.3s ease-in-out;
        }

        .navbar__hamburger span:first-child {
          top: 0;
        }

        .navbar__hamburger span:nth-child(2) {
          top: 50%;
          transform: translateY(-50%);
        }

        .navbar__hamburger span:last-child {
          bottom: 0;
        }

        .navbar__menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: #ffffff;
          border: 1px solid #eaeaea;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          z-index: 2;
          min-width: 150px;
        }

        .navbar__menu-link {
          display: block;
          padding: 10px 20px;
          text-decoration: none;
          color: #000000;
          transition: background 0.3s }

          .navbar__menu-link:hover {
            background: #eaeaea;
          }
      
          @media (max-width: 768px) {
            .navbar {
              flex-direction: column;
              height: auto;
            }
      
            .navbar__left,
            .navbar__right {
              margin: 10px 0;
            }
      
            .navbar__title {
              margin: 10px 0;
            }
      
            .navbar__menu {
              position: static;
              box-shadow: none;
              border: none;
              min-width: auto;
              margin-top: 10px;
            }
      
            .navbar__menu-link {
              display: inline-block;
              padding: 10px 20px;
              margin-right: 10px;
              margin-bottom: 10px;
            }
          }
        `}</style>
    </div>
  );
}

export default Navbar;
