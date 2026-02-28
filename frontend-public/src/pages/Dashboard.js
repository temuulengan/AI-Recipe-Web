import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '../utils/auth';
import './Dashboard.css';
import apiClient from '../utils/apiClient';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: '', nickname: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          if (isMounted) {
            setError('No authentication token found');
            setLoading(false);
            // Clear any stale data
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setTimeout(() => navigate('/login'), 1000);
          }
          return;
        }

        const me = await apiClient.getAuthMe(token);
        if (isMounted) {
          if (me) {
            setUser(me);
            localStorage.setItem('user', JSON.stringify(me));
            setLoading(false);
          } else {
            setError('Failed to load user profile');
            setLoading(false);
            setTimeout(() => navigate('/login'), 1000);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user profile:', e);
        if (isMounted) {
          // If 401, clear tokens and redirect to login
          if (e.status === 401) {
            setError('Your session has expired. Please log in again.');
            setLoading(false);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setTimeout(() => navigate('/login'), 1500);
          } else {
            setError('Authentication failed. Please log in again.');
            setLoading(false);
            setTimeout(() => navigate('/login'), 1000);
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleEditProfile = () => {
    setEditFormData({
      username: user.username || '',
      nickname: user.nickname || '',
      email: user.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        navigate('/login');
        return;
      }

      // Only send fields that have changed
      const updates = {};
      if (editFormData.username !== user.username) updates.username = editFormData.username;
      if (editFormData.nickname !== user.nickname) updates.nickname = editFormData.nickname;
      if (editFormData.email !== user.email) updates.email = editFormData.email;

      if (Object.keys(updates).length === 0) {
        alert('No changes to save.');
        setIsSaving(false);
        return;
      }

      const updatedUser = await apiClient.updateMyProfile(updates, token);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        navigate('/login');
        return;
      }

      // Validate passwords
      if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
        alert('New passwords do not match!');
        setIsChangingPassword(false);
        return;
      }

      if (passwordFormData.newPassword.length < 8) {
        alert('New password must be at least 8 characters long.');
        setIsChangingPassword(false);
        return;
      }

      // Check password strength (at least one uppercase, lowercase, number, special char)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(passwordFormData.newPassword)) {
        alert('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
        setIsChangingPassword(false);
        return;
      }

      await apiClient.changePassword({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword
      }, token);

      alert('Password changed successfully!');
      setIsPasswordModalOpen(false);
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to change password:', err);
      alert(`Failed to change password: ${err.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'This is your final warning. All your recipes, sessions, and data will be permanently deleted. Continue?'
    );

    if (!doubleConfirm) return;

    setIsDeleting(true);

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        alert('Authentication token not found. Please log in again.');
        navigate('/login');
        return;
      }

      await apiClient.deleteMyAccount(token);

      // Clear all user data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('jwt');
      localStorage.removeItem('token');
      localStorage.removeItem('airecipe_sessions_v1');
      localStorage.removeItem('airecipe_current_session');

      alert('Your account has been successfully deleted.');
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(`Failed to delete account: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <h2>Loading your dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <h2>{error}</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <h2>You are not logged in.</h2>
        <p>Please <a href="/login">log in</a> to view your account dashboard.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* --- Profile Section --- */}
      <div className="profile-section">
        <img
          src={user.profileImage || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
          alt="User avatar"
          className="profile-avatar"
        />
        <h1>Welcome back, {user.username || user.name || 'User'} 👋</h1>
        {user.nickname && <p className="user-nickname">@{user.nickname}</p>}
      </div>

      <section className="account-info">
        <h2>Account Information</h2>
        <p><strong>User ID:</strong> {user.user_id || 'N/A'}</p>
        <p><strong>Username:</strong> {user.username || 'N/A'}</p>
        <p><strong>Nickname:</strong> {user.nickname || 'N/A'}</p>
        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
        <p><strong>Role:</strong> <span className={`role-badge ${user.role?.toLowerCase()}`}>{user.role || 'USER'}</span></p>
        <p><strong>Member since:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
        {user.last_login_at && (
          <p><strong>Last login:</strong> {new Date(user.last_login_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        )}
        {user.llm_count !== null && user.llm_count !== undefined && (
          <p><strong>AI Recipe Generations:</strong> {user.llm_count}</p>
        )}
      </section>

      <section className="recent-activity">
        <h2>Recent Activity</h2>
        {user.llm_count > 0 ? (
          <ul>
            <li>You generated {user.llm_count} AI recipe{user.llm_count !== 1 ? 's' : ''}</li>
            <li>Account last updated: {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}</li>
          </ul>
        ) : (
          <p>No recent activity yet. Start exploring recipes!</p>
        )}
      </section>

      <section className="account-settings">
        <h2>Settings</h2>
        <button onClick={handleEditProfile} className="dashboard-button">
          Edit Profile
        </button>
        {isAdmin() && (
          <button
            onClick={() => navigate('/admin')}
            className="dashboard-button admin-button"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600'
            }}
          >
            🔐 Admin Dashboard
          </button>
        )}
        <button onClick={handleOpenPasswordModal} className="dashboard-button">
          Change Password
        </button>
        <button onClick={async () => {
          try {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            // Try to call logout API if tokens exist
            if (token && refreshToken) {
              try {
                await apiClient.logout(refreshToken, token);
              } catch (err) {
                // Ignore 401 errors on logout - tokens already invalid
                if (err.status !== 401) {
                  console.error('Logout API error:', err);
                }
              }
            }
          } finally {
            // Always clear local storage and redirect, even if API call fails
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('jwt');
            localStorage.removeItem('token');
            window.location.href = '/';
          }
        }} className="dashboard-button logout">
          Log Out
        </button>
      </section>

      <section className="account-danger-zone">
        <h2>Danger Zone</h2>
        <p className="danger-warning">Once you delete your account, there is no going back. Please be certain.</p>
        <button
          onClick={handleDeleteAccount}
          className="dashboard-button delete-account"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </section>

      {/* --- Edit Profile Modal --- */}
      {isEditModalOpen && (
        <div className="edit-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditFormChange}
                  required
                  minLength={2}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nickname">Nickname *</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={editFormData.nickname}
                  onChange={handleEditFormChange}
                  required
                  minLength={2}
                  placeholder="Your display name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="cancel-button"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Change Password Modal --- */}
      {isPasswordModalOpen && (
        <div className="edit-modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password *</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordFormChange}
                  required
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password *</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordFormChange}
                  required
                  minLength={8}
                  placeholder="Min 8 characters, mix of upper, lower, number, special char"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordFormChange}
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="password-requirements">
                <p><strong>Password Requirements:</strong></p>
                <ul>
                  <li>At least 8 characters long</li>
                  <li>At least one uppercase letter (A-Z)</li>
                  <li>At least one lowercase letter (a-z)</li>
                  <li>At least one number (0-9)</li>
                  <li>At least one special character (@$!%*?&#)</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="cancel-button"
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-button"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
