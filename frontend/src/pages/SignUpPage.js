import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignUpStyles.css';
// 1. Import axios
import axios from 'axios'; 

const SIGNUP_API = "https://api.findflavor.site/api/v1/auth/register"; // Endpoint: /api/v1/auth/register

function SignUpPage() {
  const [name, setName] = useState('');          // Maps to 'username' (Full Name) in API
  const [userId, setUserId] = useState('');      // Maps to 'user_id' (Login ID) in API
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Rename the 'username' state variable to 'userId' for clarity and API alignment
  // Note: The input still uses the variable name that matches the input placeholder.
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous error

    // 1. Client-side Password Check
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    try {
      // 2. API POST Request
      const res = await axios.post(SIGNUP_API, {
        // Map frontend state to backend API fields:
        user_id: userId,        // Input field labeled 'Username' (johndoe123)
        email: email,
        password: password,
        username: name,         // Input field labeled 'Full Name' (John Doe)
        nickname: nickname,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      // Sign up succeeded; navigate to login

      // 3. Handle Success (201 Created)
      if (res.status) {
        alert('회원가입이 성공적으로 완료되었습니다! 로그인 페이지로 이동합니다.');
        // The API returns tokens and user data, but we only need to navigate to login
        navigate('/login');
      }

    } catch (err) {
      console.error("Sign Up Error:", err);
      
      if (err.response) {
      console.error("Server Response Status:", err.response.status);
      console.error("Server Response Data:", err.response.data);
    }

      // 4. Handle API Errors (e.g., 400 Bad Request, 409 Conflict)
      let errorMessage = "An unexpected error occurred during sign up.";

      if (err.response) {
        // API response errors (4xx, 5xx)
        const data = err.response.data;
        
        if (data.message && Array.isArray(data.message)) {
          // 400 Bad Request (Validation errors) returns an array of messages
          errorMessage = data.message.join('; ');
        } else if (data.message) {
          // 409 Conflict (e.g., duplicate user_id) or 401/404/500
          errorMessage = data.message;
        } else if (data.error) {
           // Fallback for LLM-style error object if it were used
           errorMessage = data.error;
        }
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create an Account</h2>
      
      <form onSubmit={handleSubmit} className="signup-form">
        
        {/* Full Name Input (Maps to 'username' in API) */}
        <input 
          type="text" 
          placeholder="Full Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          className="signup-input"
        />
        <br />
        {/* Username Input (Maps to 'user_id' in API - the login ID) */}
        <input
          type="text"
          placeholder="User ID (for login)"
          value={userId} // Use new state variable
          onChange={(e) => setUserId(e.target.value)} // Use new state setter
          required
          className="signup-input"
        />
        <br />
        <input
          type="text"
          placeholder="Nickname (display name)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          className="signup-input"
        />
        <br />
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          className="signup-input"
        />
        <br />
        {/* Password Input */}
        <input 
          type="password" 
          placeholder="Password (Min 8 chars, incl. special, case, number)" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          className="signup-input"
        />
        <br />
        {/* Confirm Password Input */}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="signup-input"
        />
        <br />
        
        <button type="submit" className="signup-button">
          Sign Up
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
      
      <p className="login-prompt">
        Already have an account?{' '}
        <Link to="/login" className="login-link">
          Log In
        </Link>
      </p>
    </div>
  );
}

export default SignUpPage;