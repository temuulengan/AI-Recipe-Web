import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import apiClient from '../utils/apiClient';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [message, setMessage] = useState(null);

  // Log viewer states
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(10);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // Log filter states (actual filters applied)
  const [logSource, setLogSource] = useState('');
  const [logPath, setLogPath] = useState('');
  const [logLimit, setLogLimit] = useState(100);

  // Log filter input states (temporary, not yet applied)
  const [logSourceInput, setLogSourceInput] = useState('');
  const [logPathInput, setLogPathInput] = useState('');
  const [logLimitInput, setLogLimitInput] = useState(100);

  // Role-based access check and load users from backend
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          if (isMounted) {
            setMessage('Login is required to access this page.');
            setTimeout(() => navigate('/login'), 1600);
          }
          return;
        }

        // Verify admin role via /auth/me
        const me = await apiClient.getAuthMe(token);
        if (isMounted) {
          if (!me || me.role !== 'ADMIN') {
            setMessage('Only administrators can access this page.');
            setTimeout(() => navigate('/'), 1600);
            return;
          }

          // Fetch all users from backend
          const usersList = await apiClient.listUsers(token);
          setUsers(Array.isArray(usersList) ? usersList : []);
        }
      } catch (e) {
        console.error('Admin access check failed:', e);
        if (isMounted) {
          setMessage('Access denied or login expired.');
          setTimeout(() => navigate('/login'), 1600);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Fetch logs when logs tab is active or filters change
  useEffect(() => {
    if (activeTab !== 'logs') return;

    let isMounted = true;
    setLogsLoading(true);

    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const params = {
          limit: logLimit || 100
        };
        if (logSource) params.source = logSource;
        if (logPath) params.path = logPath;

        const logsList = await apiClient.getLogs(params, token);
        if (isMounted) {
          setLogs(Array.isArray(logsList) ? logsList : []);
          setLogsPage(1); // Reset to first page when filters change
        }
      } catch (e) {
        console.error('Failed to fetch logs:', e);
        if (isMounted) {
          setLogs([]);
        }
      } finally {
        if (isMounted) {
          setLogsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [activeTab, logSource, logPath, logLimit]);

  // Apply log filters
  const handleApplyLogFilters = () => {
    setLogSource(logSourceInput);
    setLogPath(logPathInput);
    setLogLimit(logLimitInput);
  };

  // Clear log filters
  const handleClearLogFilters = () => {
    setLogSourceInput('');
    setLogPathInput('');
    setLogLimitInput(100);
    setLogSource('');
    setLogPath('');
    setLogLimit(100);
  };

  useEffect(() => {
    // Client-side filtering & sorting of backend users
    if (!users || users.length === 0) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users.filter(u => {
      const lower = query.toLowerCase();
      return (
        (u.username || u.name || '').toLowerCase().includes(lower) ||
        (u.email || '').toLowerCase().includes(lower) ||
        (u.role || '').toLowerCase().includes(lower) ||
        (u.created_at || '').includes(lower)
      );
    });

    if (sortBy === 'name') {
      filtered = filtered.sort((a, b) => (a.username || a.name || '').localeCompare(b.username || b.name || ''));
    } else { // recent
      filtered = filtered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }

    setFilteredUsers(filtered);
    setPage(1);
  }, [query, sortBy, users]);

  const start = (page - 1) * pageSize;
  const paged = filteredUsers.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const handleUserClick = (id) => {
    navigate(`/admin/users/${id}`);
  };

  if (message) {
    return (
      <div className="admin-wrapper">
        <div className="admin-message">{message}</div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <h1 className="admin-title">Admin Dashboard</h1>

      <div className="admin-tabs">
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
        <button className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Log Viewer</button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' ? (
          <div className="users-panel">
            <div className="users-controls">
              <input
                className="search-field"
                placeholder="Search by name, email, role, or date..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="recent">Recent</option>
                <option value="name">Name</option>
              </select>
              <div className="page-size">
                <label>Page size:</label>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>
            </div>

            <div className="users-list">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(u => (
                    <tr key={u.id} className="user-row" onClick={() => handleUserClick(u.id)}>
                      <td>{u.username || u.name || 'N/A'}</td>
                      <td>{u.email || 'N/A'}</td>
                      <td>{u.role || 'USER'}</td>
                      <td>{u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
              <span>Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
            </div>
          </div>
        ) : (
          <div className="logs-panel">
            {logsLoading ? (
              <p>Loading logs...</p>
            ) : (
              <>
                {/* Filter controls - always visible */}
                <div className="logs-controls" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Source:</label>
                    <input
                      type="text"
                      className="search-field"
                      placeholder="e.g., nest-api, flask-api"
                      value={logSourceInput}
                      onChange={(e) => setLogSourceInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyLogFilters()}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Path:</label>
                    <input
                      type="text"
                      className="search-field"
                      placeholder="e.g., /api/v1/auth/login"
                      value={logPathInput}
                      onChange={(e) => setLogPathInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyLogFilters()}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Limit:</label>
                    <select
                      value={logLimitInput}
                      onChange={(e) => setLogLimitInput(Number(e.target.value))}
                      className="sort-select"
                      style={{ width: '100%' }}
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </select>
                  </div>
                  <div className="page-size" style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Page size:</label>
                    <select value={logsPageSize} onChange={(e) => setLogsPageSize(Number(e.target.value))}>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', minWidth: '200px' }}>
                    <button
                      onClick={handleApplyLogFilters}
                      className="dashboard-button"
                      style={{
                        flex: '1',
                        padding: '10px 12px',
                        margin: 0,
                        height: 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleClearLogFilters}
                      className="dashboard-button logout"
                      style={{
                        flex: '1',
                        padding: '10px 12px',
                        margin: 0,
                        height: 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Log list or empty message */}
                {logs.length === 0 ? (
                  <p>No logs available. Try adjusting your filters.</p>
                ) : (
                  <>
                    <div className="logs-list">
                      <table className="users-table">
                        <thead>
                          <tr>
                            <th>Level</th>
                            <th>Source</th>
                            <th>Message</th>
                            <th>Path</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.slice((logsPage - 1) * logsPageSize, logsPage * logsPageSize).map(log => (
                            <tr
                              key={log.id}
                              className="user-row"
                              onClick={() => setSelectedLog(log)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <span
                                  className={`role-badge ${log.level}`}
                                  style={{
                                    backgroundColor: log.level === 'error' ? '#f44336' : '#ff9800',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.85em'
                                  }}
                                >
                                  {log.level || 'N/A'}
                                </span>
                              </td>
                              <td>{log.source || 'N/A'}</td>
                              <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.message || 'N/A'}
                              </td>
                              <td>{log.path || 'N/A'}</td>
                              <td>
                                {log.createdAt ? new Date(log.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pagination">
                      <button
                        onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                        disabled={logsPage <= 1}
                      >
                        Prev
                      </button>
                      <span>Page {logsPage} / {Math.max(1, Math.ceil(logs.length / logsPageSize))}</span>
                      <button
                        onClick={() => setLogsPage(p => Math.min(Math.ceil(logs.length / logsPageSize), p + 1))}
                        disabled={logsPage >= Math.ceil(logs.length / logsPageSize)}
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div >
        )}
      </div >

      {/* Log Detail Modal */}
      {
        selectedLog && (
          <div className="edit-modal-overlay" onClick={() => setSelectedLog(null)}>
            <div
              className="edit-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}
            >
              <h2>Log Details</h2>
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Level:</strong> <span className={`role-badge ${selectedLog.level}`}>{selectedLog.level}</span></p>
                <p><strong>Source:</strong> {selectedLog.source}</p>
                <p><strong>Message:</strong> {selectedLog.message}</p>
                <p><strong>Method:</strong> {selectedLog.method || 'N/A'}</p>
                <p><strong>Path:</strong> {selectedLog.path || 'N/A'}</p>
                <p><strong>User ID:</strong> {selectedLog.userId || 'N/A'}</p>
                <p><strong>Time:</strong> {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : 'N/A'}</p>

                {selectedLog.context && (
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Context:</strong></p>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '0.9em'
                    }}>
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.stack && (
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Stack Trace:</strong></p>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '0.85em',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}>
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="cancel-button"
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default AdminDashboard;
