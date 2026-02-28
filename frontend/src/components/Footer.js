import React from 'react';
import './Footer.css';
import { FaGithub } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">© 2025 Recipe Finder. All rights reserved.</p>

        <div className="footer-links">
          <a href="/about" className="footer-link">About</a>
          <a href="/community" className="footer-link">Community</a>
          <a href="/contact" className="footer-link">Contact</a>
        </div>

        <div className="footer-socials">
          <a href="https://github.com/AdvancedWebProgramming-6" target="_blank" rel="noreferrer"><FaGithub /></a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
