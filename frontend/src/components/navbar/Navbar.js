import React, { useState, useEffect, useRef } from 'react';
import { BsPerson } from 'react-icons/bs';
import { HiOutlineMenuAlt4 } from 'react-icons/hi';
import { AiOutlineClose } from 'react-icons/ai';
import { Link, useNavigate } from 'react-router-dom';
import { getUser } from '../../utils/auth';
import axios from 'axios';
import './NavbarStyles.css';

const LOGOUT_API = "https://api.findflavor.site/api/v1/auth/logout";

function Navbar() {
  const [nav, setNav] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleNav = () => setNav(!nav);

  // Handle Escape key to close dropdown
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) setDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    const user = getUser();
    if (!user) {
      navigate('/login');
      setDropdownOpen(false);
      return;
    }

    // Both admin and regular users go to their profile page
    navigate('/dashboard');
    setDropdownOpen(false);
  };

  //modified logout for api call
  const handleLogout = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      try {
        await axios.post(
          LOGOUT_API,
          {
            refreshToken: refreshToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    navigate('/login');
    setDropdownOpen(false);
  }

  const user = getUser();

  return (
    <div name="home" className={nav ? 'navbar navbar-bg' : 'navbar'}>
      <Link to="/">
        <div className={nav ? 'logo dark' : 'logo'}>
          <h2>Flavor Finder</h2>
        </div>
      </Link>

      <ul className="nav-menu">
        <Link to="/"><li>Home</li></Link>
        <Link to="/community"><li>Community</li></Link>
        <Link to="/airecipe"><li>AI Recipe</li></Link>
      </ul>

      <div className="nav-icons">

        {/* Profile Dropdown */}
        <div className="profile-dropdown" ref={dropdownRef}>
          <div
            className="profile-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <BsPerson className="icon" />
            {user && (
              <span className="user-nickname">
                {user.nickname || user.username || 'User'}
              </span>
            )}
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={handleProfileClick}>Profile</button>
              {user ? (
                <button onClick={handleLogout}>Logout</button>
              ) : (
                <button onClick={() => navigate('/login')}>Login</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hamburger" onClick={handleNav}>
        {!nav ? (
          <HiOutlineMenuAlt4 className="icon" />
        ) : (
          <AiOutlineClose style={{ color: '#000' }} className="icon" />
        )}
      </div>

      <div className={nav ? 'mobile-menu active' : 'mobile-menu'}>
        <ul className="mobile-nav">
          <Link onClick={() => setNav(false)} to="/"><li>Home</li></Link>
          <Link onClick={() => setNav(false)} to="/community"><li>Community</li></Link>
          <Link onClick={() => setNav(false)} to="/airecipe"><li>AI Recipe</li></Link>

        </ul>
        <div className="mobile-menu-bottom">
          <div className="menu-icons">
            <button
              onClick={() => {
                user ? handleProfileClick() : navigate('/login');
                setNav(false);
              }}
            >
              Account
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Navbar;
