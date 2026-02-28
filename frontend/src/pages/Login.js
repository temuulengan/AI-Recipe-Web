import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginStyles.css';
import axios from 'axios';

// 🔥 백엔드 로그인 API URL
const LOGIN_API = "https://api.findflavor.site/api/v1/auth/login";

function LoginPage() {
  const [userId, setUserId] = useState('');   // email or username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(LOGIN_API, {
        user_id: userId,
        password,
      },
      {
        headers: {'Content-Type': 'application/json'}
      });

      const { accessToken, refreshToken, user } = res.data;

      // 저장
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      // 🔥 role 기반 페이지 이동
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <h2>User Login</h2>
      
      <form onSubmit={handleSubmit} className="login-form">
        
        {/* Username or Email Input */}
        <input 
          type="text" 
          placeholder="User ID" 
          value={userId} 
          onChange={(e) => setUserId(e.target.value)} 
          required 
          className="login-input"
        />
        <br />
        
        {/* Password Input */}
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          className="login-input"
        />
        <br />
        
        {/* Submission Button */}
        <button type="submit" className="login-button">
          Login
        </button>
      </form>

      {error && <div className="login-error">{error}</div>}
      
      <p className="signup-prompt">
        Don't have an account? 
        {' '}
        <Link to="/signuppage" className="signup-link">
          Sign Up Here
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
