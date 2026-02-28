import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Admin.css';
import apiClient from '../utils/apiClient';

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const user = await apiClient.getUserById(id, token);
        if (user) {
          setUserDetail({
            id: user.id,
            name: user.username || user.name || 'N/A',
            email: user.email || 'N/A',
            nickname: user.nickname || user.username || 'N/A',
            role: user.role || 'USER',
            createdAt: user.created_at || user.createdAt,
            updatedAt: user.updated_at || user.updatedAt,
            lastLoginAt: user.last_login_at || user.lastLoginAt,
            llmCount: user.llm_count || user.llmCount || 0
          });
        } else {
          setUserDetail({
            id,
            name: 'User not found',
            email: 'N/A',
            nickname: 'N/A',
            role: 'N/A',
            createdAt: null,
            updatedAt: null,
            lastLoginAt: null,
            llmCount: 0
          });
        }
      } catch (e) {
        console.error('Failed to fetch user detail:', e);
        setUserDetail({
          id,
          name: 'Error loading user',
          email: 'N/A',
          nickname: 'N/A',
          role: 'N/A',
          createdAt: null,
          updatedAt: null,
          lastLoginAt: null,
          llmCount: 0
        });
      }
    })();
  }, [id, navigate]);

  if (!userDetail) return <p>Loading...</p>;

  return (
    <div className="admin-wrapper">
      <button className="back-btn" onClick={() => navigate('/admin')}>Back to User List</button>
      <h1 className="admin-title">User Detail</h1>

      <div className="detail-grid">
        <div className="card">
          <h3>Basic Info</h3>
          <p><strong>ID:</strong> {id}</p>
          <p><strong>Name:</strong> {userDetail.name}</p>
          <p><strong>Nickname:</strong> {userDetail.nickname}</p>
          <p><strong>Email:</strong> {userDetail.email}</p>
          <p><strong>Role:</strong> {userDetail.role}</p>
          <p><strong>AI Recipe Count:</strong> {userDetail.llmCount}</p>
        </div>

        <div className="card">
          <h3>Activity</h3>
          {userDetail.createdAt || userDetail.lastLoginAt || userDetail.updatedAt || userDetail.llmCount > 0 ? (
            <ul>
              {userDetail.createdAt && (
                <li>
                  Account created: {new Date(userDetail.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </li>
              )}
              {userDetail.lastLoginAt && (
                <li>
                  Last login: {new Date(userDetail.lastLoginAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </li>
              )}
              {userDetail.updatedAt && (
                <li>
                  Profile updated: {new Date(userDetail.updatedAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </li>
              )}
              {userDetail.llmCount > 0 && (
                <li>
                  AI Recipe generations: {userDetail.llmCount}
                </li>
              )}
            </ul>
          ) : (
            <p>No recent activity data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetail;
