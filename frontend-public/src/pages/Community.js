import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient, { API_DOMAIN } from '../utils/apiClient';
import {
  FaThumbtack,
  FaRegCalendarAlt,
  FaRegEye,
  FaRegComment,
  FaComment,
  FaUser,
  FaStar,
  FaRegStar,
  FaTrash,
  FaReply,
  FaEdit,
  FaCheckCircle
} from 'react-icons/fa';
import './Community.css';



const initialPosts = [
  {
    id: 1,
    title: "New Recipe Categories Added",
    summary: "We've added new categories including Desserts, Breakfast, and Healthy Options. Check them out and discover new recipes! Each category is carefully curated with recipes that have been tested...",
    author: "Admin",
    authorRole: "ADMIN",
    date: "2025-10-28",
    views: 892,
    comments: 8,
    isPinned: false,
    averageRating: 4,
  },
  {
    id: 2,
    title: "Community Recipe Contest",
    summary: "Submit your best original recipe for a chance to win! The winning recipe will be featured on our homepage. Contest ends November 30th. We're looking for creative, delicious, and easy-to-...",
    author: "Recipe Team",
    authorRole: "USER",
    date: "2025-10-25",
    views: 634,
    comments: 23,
    isPinned: false,
    averageRating: 4.5,
  },
];

// Helper function to convert relative image URLs to absolute URLs
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  // If already absolute URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // If relative path, prepend API domain
  return `${API_DOMAIN}${imageUrl}`;
};

const VerifiedBadge = () => (
  <span className="verified-badge" title="Verified Admin">
    <FaCheckCircle />
  </span>
);

// --- Star Rating Component (Read-only) ---
const StarRating = ({ rating, ratingCount }) => {
  const totalStars = 5;

  return (
    <div className="star-rating-container">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span key={index} className="star">
            {starValue <= Math.round(rating) ? (
              <FaStar className="star-filled" />
            ) : (
              <FaRegStar className="star-empty" />
            )}
          </span>
        );
      })}
      {ratingCount !== undefined && (
        <span className="rating-count-text">({ratingCount})</span>
      )}
    </div>
  );
};

// --- Post Card Component ---
const PostCard = ({ post, onOpenDetail, onTogglePin, isAdmin }) => (
  <div
    className="post-link"
    role="button"
    tabIndex={0}
    onClick={() => onOpenDetail(post)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') onOpenDetail(post);
    }}
  >
    <div className={`post-card ${post.isPinned ? 'pinned-post-card' : ''}`}>
      {post.isPinned && (
        <div className="pinned-label">
          <FaThumbtack className="icon-small" /> Pinned
        </div>
      )}

      {/* Admin Pin Toggle Button */}
      {isAdmin && (
        <button
          className="pin-toggle-button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(post.id, post.isPinned);
          }}
          title={post.isPinned ? 'Unpin Post' : 'Pin Post'}
        >
          <FaThumbtack className={post.isPinned ? 'pinned-icon' : 'unpinned-icon'} />
        </button>
      )}

      {post.image && (
        <div className="post-image-preview">
          <img
            src={post.image}
            alt={post.title}
            style={{
              width: '100%',
              height: '220px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '10px'
            }}
          />
        </div>
      )}

      <div className="post-rating-section">
        <StarRating
          rating={post.averageRating}
          ratingCount={post.ratingCount}
        />
        <span className="rating-value">{post.averageRating.toFixed(1)}</span>
      </div>
      {post.prefix && (
        <div className={`prefix-badge prefix-${post.prefix.toLowerCase()}`}>
          {post.prefix}
        </div>
      )}
      <h2>{post.title}</h2>
      <p>{post.summary}</p>
      <div className="post-metadata">
        <div className="meta-item">
          <FaUser className="icon-small" /> {post.author}
          {post.authorRole === 'ADMIN' && <VerifiedBadge />}
        </div>
        <div className="meta-item"><FaRegCalendarAlt className="icon-small" /> {post.date}</div>
        <div className="meta-item"><FaRegEye className="icon-small" /> {post.views}</div>
        <div className="meta-item"><FaRegComment className="icon-small" /> {post.comments}</div>
      </div>
    </div>
  </div>
);

// --- Detail Modal with Comments ---
const PostDetailModal = ({ post, onClose }) => {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const user = await apiClient.getAuthMe(token);
          setCurrentUser(user);
        }
      } catch (e) {
        console.error('Failed to fetch current user:', e);
      }
    })();
  }, []);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const result = await apiClient.listComments(post.id, { page: 1, limit: 50 });
      setComments(result.data || []);
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Load comments when modal opens
  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    const content = newComment.trim();
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Please log in to comment');
      return;
    }

    if (!content) return;

    try {
      await apiClient.createComment(post.id, { content }, token);
      setNewComment('');
      await loadComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment: ' + (err.message || 'Unknown error'));
    }
  };

  const handleReply = async (e, parentId) => {
    e.preventDefault();
    const content = replyText.trim();
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Please log in to reply');
      return;
    }

    if (!content) return;

    try {
      await apiClient.createComment(post.id, { content, parentId }, token);
      setReplyText('');
      setReplyTo(null);
      await loadComments();
    } catch (err) {
      console.error('Failed to reply:', err);
      alert('Failed to reply: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditComment = async (commentId) => {
    const content = editText.trim();
    const token = localStorage.getItem('accessToken');

    if (!token || !content) return;

    try {
      await apiClient.updateComment(post.id, commentId, { content }, token);
      setEditingComment(null);
      setEditText('');
      await loadComments();
    } catch (err) {
      console.error('Failed to edit comment:', err);
      alert('Failed to edit comment: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiClient.deleteComment(post.id, commentId, token);
      await loadComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment: ' + (err.message || 'Unknown error'));
    }
  };

  const canModifyComment = (comment) => {
    if (!currentUser) return false;
    return currentUser.user_id === comment.author?.id || currentUser.role === 'ADMIN';
  };

  const renderComment = (comment) => {
    const isEditing = editingComment === comment.id;
    const isReplying = replyTo === comment.id;

    return (
      <div key={comment.id} className="comment">
        <div className="comment-header">
          <span className="comment-author">
            {comment.author?.nickname || comment.author?.username || 'Anonymous'}
            {comment.author?.role === 'ADMIN' && <VerifiedBadge />}
          </span>
          <span className="comment-date">
            {new Date(comment.createdAt).toLocaleString()}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
              <span style={{ fontStyle: 'italic', color: '#666', marginLeft: '8px' }}>
                (Edited: {new Date(comment.updatedAt).toLocaleString()})
              </span>
            )}
          </span>
        </div>

        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="comment-edit-textarea"
            />
            <div className="comment-edit-actions">
              <button onClick={() => handleEditComment(comment.id)} className="btn-save">
                Save
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditText('');
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="comment-content">{comment.content}</p>
            <div className="comment-actions">
              <button
                onClick={() => setReplyTo(comment.id)}
                className="comment-action-btn"
              >
                <FaReply /> Reply
              </button>
              {canModifyComment(comment) && (
                <>
                  <button
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditText(comment.content);
                    }}
                    className="comment-action-btn"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="comment-action-btn delete"
                  >
                    <FaTrash /> Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {isReplying && (
          <form onSubmit={(e) => handleReply(e, comment.id)} className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              required
            />
            <div className="reply-form-actions">
              <button type="submit" className="btn-submit">
                Submit Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setReplyText('');
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {comment.children && comment.children.length > 0 && (
          <div className="comment-replies">
            {comment.children.map((reply) => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{post.title}</h2>
        <p className="post-author">
          by {post.author}
          {post.authorRole === 'ADMIN' && <VerifiedBadge />}
        </p>
        <p className="post-summary">{post.summary}</p>

        {/* Comments Section */}
        <div className="comments-section" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            <FaComment /> Comments ({comments.length})
          </h3>

          {/* Add Comment Form */}
          {currentUser ? (
            <form onSubmit={handleAddComment} className="add-comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                required
              />
              <button type="submit" className="submit-button">Post Comment</button>
            </form>
          ) : (
            <p className="login-prompt">Please log in to comment</p>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <p>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="no-comments">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>

        <button onClick={onClose} className="submit-button" style={{ marginTop: '1rem' }}>Close</button>
      </div>
    </div>
  );
};

// --- Review Modal (updated to show userRating) ---
const ReviewModal = ({ post, userRating, onClose }) => {
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to submit a review');
      return;
    }

    const content = reviewText.trim();
    if (!content) {
      alert('Please write a review before submitting');
      return;
    }

    try {
      // Submit comment/review to API
      await apiClient.createComment(post.id, { content }, token);
      alert('Review submitted successfully!');
      setReviewText('');
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      if (err.status === 401) {
        alert('Your session has expired. Please log in again.');
      } else {
        alert('Failed to submit review. Please try again.');
      }
    }
  };

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Review & Rate: {post.title}</h2>

        <div className="rating-stars">
          {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <span key={index}>
                {starValue <= userRating
                  ? <FaStar className="star-filled" />
                  : <FaRegStar className="star-empty" />}
              </span>
            );
          })}
        </div>

        <textarea
          placeholder="Write your review..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows="5"
        />
        <div className="form-actions">
          <button onClick={onClose} className="cancel-button">Close</button>
          <button onClick={handleSubmit} className="submit-button">Submit Review</button>
        </div>
      </div>
    </div>
  );
};

function Community({ initialSelectedPost = null, initialOpenModal = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState(null);

  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', summary: '', prefix: 'General' });

  const [selectedPost, setSelectedPost] = useState(initialSelectedPost);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(initialOpenModal);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [userRating, setUserRating] = useState(0);

  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch current user to check admin status
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const user = await apiClient.getAuthMe(token);
          setCurrentUser(user);
        }
      } catch (e) {
        console.error('Failed to fetch current user:', e);
      }
    })();
  }, []);

  // Load posts from backend with pagination
  const loadPosts = async (page = 1) => {
    try {
      const token = localStorage.getItem('accessToken') || null;
      const response = await apiClient.listBoards({ page, limit: postsPerPage, token });

      // API returns { data: [...], meta: {...} }
      if (response?.data && Array.isArray(response.data)) {
        // Update pagination metadata
        if (response.meta) {
          setTotalPages(response.meta.totalPages || 1);
          setTotalPosts(response.meta.total || 0);
          setCurrentPage(response.meta.page || 1);
        }

        // adapt backend shape to local post shape if needed
        const mapped = response.data.map((b) => {
          const relativeImageUrl = b.img_url || b.imageUrl || b.image || null;
          const absoluteImageUrl = getImageUrl(relativeImageUrl);

          return {
            id: b.id,
            title: b.title || b.subject || 'Untitled',
            summary: b.content ? (b.content.length > 200 ? b.content.slice(0, 200) + '...' : b.content) : '',
            author: b.author?.nickname || b.author?.username || b.author || 'User',
            authorRole: b.author?.role, // Extract role
            date: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : (b.date || new Date().toISOString().split('T')[0]),
            views: b.views || 0,
            comments: b.commentCount || 0,
            isPinned: !!b.isPinned,
            averageRating: parseFloat(b.averageRating) || 0,
            ratingCount: b.ratingCount || 0,
            image: absoluteImageUrl,
            prefix: b.prefix || 'General',
          };
        });

        // Sort posts: pinned first, then by date
        mapped.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0; // Keep original order for same pin status
        });

        setPosts(mapped);
        return;
      }
    } catch (e) {
      console.error('Failed to fetch boards from API:', e);
      // fetch failed; will fall back to localStorage below
      const stored = JSON.parse(localStorage.getItem('communityPosts')) || initialPosts;
      setPosts(stored);
    }
  };

  // Load posts on mount and when page changes
  useEffect(() => {
    loadPosts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  React.useEffect(() => {
    if (initialSelectedPost && initialOpenModal) {
      setSelectedPost(initialSelectedPost);
      setIsDetailModalOpen(true);
    }
  }, [initialSelectedPost, initialOpenModal]);

  // Handle navigation from AI Recipe page
  useEffect(() => {
    if (location.state?.createPost) {
      setIsCreatingPost(true);
      // Clear state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const openDetailModal = (post) => {
    // Navigate to post detail page instead of opening modal
    navigate(`/community/${post.id}`);
  };

  const togglePinPost = async (postId, currentPinStatus) => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Please log in to pin posts');
      return;
    }

    if (currentUser?.role !== 'ADMIN') {
      alert('Only administrators can pin posts');
      return;
    }

    try {
      await apiClient.updateBoard(postId, { isPinned: !currentPinStatus }, token);

      // Reload posts to reflect the change
      await loadPosts(currentPage);

      alert(`Post ${!currentPinStatus ? 'pinned' : 'unpinned'} successfully!`);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      alert('Failed to toggle pin: ' + (err.message || 'Unknown error'));
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedPost(null);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedPost(null);
    setUserRating(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPostData(prev => ({ ...prev, [name]: value }));
  };
  const handlePostSubmit = (e) => {
    e.preventDefault();

    const targetLength = Math.max(...initialPosts.map(p => p.summary.length));
    let summaryText = newPostData.summary;

    if (summaryText.length < targetLength) {
      summaryText = summaryText.padEnd(targetLength, '.');
    } else if (summaryText.length > targetLength) {
      summaryText = summaryText.slice(0, targetLength);
    }
    (async () => {
      // try backend create first when token available
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || null;
      console.log('=== POST CREATION DEBUG ===');
      console.log('Token:', token ? `Present (${token.substring(0, 20)}...)` : 'MISSING');
      console.log('All localStorage keys:', Object.keys(localStorage));
      console.log('accessToken:', localStorage.getItem('accessToken') ? 'exists' : 'missing');
      console.log('jwt:', localStorage.getItem('jwt') ? 'exists' : 'missing');

      if (!token) {
        alert('You must be logged in to create a post. Please log in first.');
        return;
      }

      if (token) {
        try {
          const form = new FormData();
          form.append('title', newPostData.title);
          form.append('content', newPostData.summary);
          form.append('prefix', newPostData.prefix || 'General');
          if (selectedImage) form.append('image', selectedImage);

          console.log('FormData contents:', {
            title: newPostData.title,
            content: newPostData.summary.substring(0, 50) + '...',
            prefix: '일반',
            hasImage: !!selectedImage
          });
          console.log('Calling apiClient.createBoard...');
          const created = await apiClient.createBoard(form, token);
          console.log('✅ Post created successfully:', created);

          // Reload posts from backend to get updated pagination
          await loadPosts(1); // Go to first page to see the new post
          setCurrentPage(1);
        } catch (err) {
          console.error('❌ Failed to create post on backend:', err);
          console.error('Error details:', {
            status: err.status,
            message: err.message,
            body: err.body,
            fullError: err
          });

          // Check if it's an auth error
          if (err.status === 401) {
            alert('Your session has expired (401 Unauthorized). Please log in again.');
            setNewPostData({ title: '', summary: '' });
            setSelectedImage(null);
            setIsCreatingPost(false);
            return;
          }

          // backend failed — fall back to local create
          alert(`Failed to save to server (${err.status || 'Network Error'}). Saving locally only.\nError: ${err.message || 'Unknown error'}`);
          const newPost = {
            id: Date.now(),
            title: newPostData.title,
            summary: summaryText,
            author: "Current User",
            date: new Date().toISOString().split('T')[0],
            views: 0,
            comments: 0,
            isPinned: false,
            averageRating: 0,
            image: selectedImage ? URL.createObjectURL(selectedImage) : null,
          };
          setPosts(prev => [newPost, ...prev]);
          localStorage.setItem('communityPosts', JSON.stringify([newPost, ...posts]));
        }
      } else {
        // no token — local only
        const newPost = {
          id: Date.now(),
          title: newPostData.title,
          summary: summaryText,
          author: "Current User",
          date: new Date().toISOString().split('T')[0],
          views: 0,
          comments: 0,
          isPinned: false,
          averageRating: 0,
          image: selectedImage ? URL.createObjectURL(selectedImage) : null,
        };
        setPosts(prev => [newPost, ...prev]);
        localStorage.setItem('communityPosts', JSON.stringify([newPost, ...posts]));
      }

      setNewPostData({ title: '', summary: '', prefix: 'General' });
      setSelectedImage(null);
      setIsCreatingPost(false);
    })();
  };

  return (
    <div className='community-page-wrapper'>

      {isCreatingPost && (
        <div className="create-post-modal-overlay" onClick={() => setIsCreatingPost(false)}>
          <div className="create-post-modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Post</h2>
            <form onSubmit={handlePostSubmit}>
              <input
                type="text"
                name="title"
                placeholder="Post Title"
                value={newPostData.title}
                onChange={handleInputChange}
                required
              />
              <textarea
                name="summary"
                placeholder="Post Summary/Content..."
                value={newPostData.summary}
                onChange={handleInputChange}
                rows="5"
                required
              />

              <div className="prefix-select-section">
                <label htmlFor="prefix-select">Prefix:</label>
                <select
                  id="prefix-select"
                  name="prefix"
                  value={newPostData.prefix}
                  onChange={handleInputChange}
                  className="prefix-select"
                >
                  <option value="General">General</option>
                  <option value="Notice">Notice</option>
                  <option value="Recipe">Recipe</option>
                  <option value="Question">Question</option>
                  <option value="Tip">Tip</option>
                </select>
              </div>

              <div className="image-upload-section">
                <label className="image-upload-label">
                  Upload Image:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>


                {selectedImage && (
                  <div className="image-preview">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      style={{
                        width: '180px',
                        height: '140px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginTop: '10px'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className='form-actions'>
                <button type="button" onClick={() => {
                  setIsCreatingPost(false);
                  setSelectedImage(null);
                }} className="cancel-button">Cancel</button>
                <button type="submit" className="submit-button">Publish Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="community-banner">
        <h1 className="banner-title">Community Board</h1>
        <p className="banner-subtitle">Share your cooking experiences, ask questions, and connect with fellow food enthusiasts</p>
      </div>

      <div className="community-content-area">
        <div className="action-buttons-container">
          <button className="write-post-button" onClick={() => setIsCreatingPost(true)}>
            <span style={{ fontWeight: '900' }}>+</span> Write Post
          </button>


        </div>
        <h2 className="section-title all-posts-title">All Posts ({totalPosts})</h2>
        <div className="all-posts-list">
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No posts available</p>
          ) : (
            posts.map(post => (
              <div key={post.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>


                <PostCard
                  key={post.id}
                  post={post}
                  onOpenDetail={openDetailModal}
                  onTogglePin={togglePinPost}
                  isAdmin={currentUser?.role === 'ADMIN'}
                />
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            margin: '30px 0',
            padding: '20px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                background: currentPage === 1 ? '#f5f5f5' : '#fff',
                color: currentPage === 1 ? '#999' : '#333',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              Previous
            </button>

            <div style={{ display: 'flex', gap: '5px' }}>
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        background: currentPage === pageNum ? '#FF6B35' : '#fff',
                        color: currentPage === pageNum ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontWeight: currentPage === pageNum ? '700' : '500',
                        minWidth: '40px'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 3 ||
                  pageNum === currentPage + 3
                ) {
                  return <span key={pageNum} style={{ padding: '8px 4px' }}>...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                color: currentPage === totalPages ? '#999' : '#333',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              Next
            </button>
          </div>
        )}

        {isDetailModalOpen && selectedPost && (
          <PostDetailModal post={selectedPost} onClose={closeDetailModal} />
        )}

        {isReviewModalOpen && selectedPost && (
          <ReviewModal
            post={selectedPost}
            userRating={userRating}   // <--- NEW
            onClose={closeReviewModal}
          />
        )}
      </div>
    </div>
  );
}

export default Community;
