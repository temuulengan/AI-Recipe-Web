import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaRegStar, FaReply, FaEdit, FaTrash, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import './PostDetail.css';
import apiClient, { API_DOMAIN } from '../utils/apiClient';

const VerifiedBadge = () => (
  <span className="verified-badge" title="Verified Admin">
    <FaCheckCircle />
  </span>
);

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [myRating, setMyRating] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // All ratings state
  const [allRatings, setAllRatings] = useState([]);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [allRatingsLoading, setAllRatingsLoading] = useState(false);

  // Post editing state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostData, setEditPostData] = useState({ title: '', content: '', prefix: 'General' });

  // Markdown view toggle
  const [isMarkdownView, setIsMarkdownView] = useState(false);

  // Helper function to get absolute image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If already absolute URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If relative path, prepend API domain
    return `${API_DOMAIN}${imageUrl}`;
  };

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const user = await apiClient.getAuthMe(token);
          console.log('Current user from API:', user); // Debug log
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
      const result = await apiClient.listComments(id, { page: 1, limit: 50 });
      setComments(result.data || []);
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadMyRating = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const result = await apiClient.getMyRating(id, token);
      if (result.rating !== null) {
        setMyRating(result);
        setRating(result.rating);
        setReviewText(result.comment || '');
      }
    } catch (e) {
      console.error('Failed to load my rating:', e);
    }
  };

  // Fetch post, comments and my rating
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken') || null;
        const board = await apiClient.getBoard(id, token);
        if (board) {
          const imageUrl = board.img_url || board.imageUrl || board.image || null;
          setPost({
            id: board.id,
            title: board.title || board.subject || 'Untitled',
            content: board.content || board.summary || '',
            author: board.author?.nickname || board.author?.username || 'Unknown',
            authorId: board.authorId || board.author?.id,  // Store author UUID
            authorRole: board.author?.role, // Store author role
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            views: board.views || 0,
            averageRating: parseFloat(board.averageRating) || 0,
            ratingCount: board.ratingCount || 0,
            image: getImageUrl(imageUrl),
            prefix: board.prefix || 'General',
          });
          await loadComments();
          await loadMyRating();
          return;
        }
      } catch (e) {
        console.error('Failed to fetch post:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Please log in to submit a rating');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      const payload = {
        rating,
        comment: reviewText.trim() || undefined
      };

      await apiClient.postRating(id, payload, token);
      alert('Rating submitted successfully!');

      // Reload post data to get updated average rating
      const board = await apiClient.getBoard(id, token);
      setPost(prev => ({
        ...prev,
        averageRating: parseFloat(board.averageRating) || 0,
        ratingCount: board.ratingCount || 0,
      }));

      // Reload my rating
      await loadMyRating();
    } catch (err) {
      console.error('Failed to submit rating:', err);
      alert('Failed to submit rating: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteRating = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    if (!window.confirm('Are you sure you want to delete your rating?')) return;

    try {
      await apiClient.deleteRating(id, token);
      alert('Rating deleted successfully!');

      // Reset rating state
      setMyRating(null);
      setRating(0);
      setReviewText('');

      // Reload post data to get updated average rating
      const board = await apiClient.getBoard(id, token);
      setPost(prev => ({
        ...prev,
        averageRating: parseFloat(board.averageRating) || 0,
        ratingCount: board.ratingCount || 0,
      }));
    } catch (err) {
      console.error('Failed to delete rating:', err);
      alert('Failed to delete rating: ' + (err.message || 'Unknown error'));
    }
  };

  const handleToggleAllRatings = async () => {
    if (!showAllRatings) {
      // If opening, fetch data if not already loaded (or always fetch to be fresh)
      setAllRatingsLoading(true);
      try {
        const ratings = await apiClient.getAllRatings(id);
        setAllRatings(ratings || []);
      } catch (err) {
        console.error('Failed to fetch all ratings:', err);
        alert('Failed to load ratings');
      } finally {
        setAllRatingsLoading(false);
      }
    }
    setShowAllRatings(!showAllRatings);
  };

  // Check if current user can edit the post
  const canEditPost = () => {
    if (!currentUser || !post) return false;
    const postAuthorId = post.authorId || post.author?.id;
    const userId = currentUser.id || currentUser.user_id;

    console.log('Can edit post check:', {
      userId,
      postAuthorId,
      currentUserRole: currentUser.role,
      match: userId === postAuthorId,
      isAdmin: currentUser.role === 'ADMIN'
    });

    return userId === postAuthorId || currentUser.role === 'ADMIN';
  };

  const handleEditPost = () => {
    setEditPostData({
      title: post.title,
      content: post.content,
      prefix: post.prefix || 'General'
    });
    setIsEditingPost(true);
  };

  const handleSavePost = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Please log in to edit posts');
      return;
    }

    if (!editPostData.title.trim() || !editPostData.content.trim()) {
      alert('Title and content cannot be empty');
      return;
    }

    try {
      const payload = {
        title: editPostData.title,
        content: editPostData.content,
        prefix: editPostData.prefix
      };

      await apiClient.updateBoard(id, payload, token);

      // Update local state
      setPost(prev => ({
        ...prev,
        title: editPostData.title,
        content: editPostData.content,
        prefix: editPostData.prefix
      }));

      setIsEditingPost(false);
      alert('Post updated successfully!');
    } catch (err) {
      console.error('Failed to update post:', err);
      alert('Failed to update post: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPost(false);
    setEditPostData({ title: '', content: '', prefix: 'General' });
  };

  const handleDeletePost = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Please log in to delete posts');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteBoard(id, token);
      alert('Post deleted successfully');
      navigate('/community');
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post: ' + (err.message || 'Unknown error'));
    }
  };

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
      await apiClient.createComment(id, { content }, token);
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
      await apiClient.createComment(id, { content, parentId }, token);
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
      await apiClient.updateComment(id, commentId, { content }, token);
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
      await apiClient.deleteComment(id, commentId, token);
      await loadComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment: ' + (err.message || 'Unknown error'));
    }
  };

  const canModifyComment = (comment) => {
    if (!currentUser) return false;

    // Get comment author ID (try different possible field names)
    const commentAuthorId = comment.author?.id || comment.author?.user_id || comment.authorId;

    // Get current user ID - we confirmed currentUser.id contains the UUID
    const userId = currentUser.id || currentUser.user_id;

    // Debug logging
    console.log('Can modify comment check:', {
      currentUser,  // Log entire object to see structure
      userId,
      commentAuthorId,
      currentUserRole: currentUser.role,
      match: userId === commentAuthorId,
      isAdmin: currentUser.role === 'ADMIN'
    });

    return userId === commentAuthorId || currentUser.role === 'ADMIN';
  };

  const renderComment = (comment, depth = 0) => {
    const isEditing = editingComment === comment.id;
    const isReplying = replyTo === comment.id;
    const isDeleted = !comment.content || comment.isDeleted;
    const isTopLevel = depth === 0; // Only top-level comments can have replies

    return (
      <div key={comment.id} className="comment">
        {isDeleted ? (
          // Show [Deleted Comment] placeholder
          <>
            <div className="deleted-comment-placeholder">
              <span className="deleted-text">[Deleted Comment]</span>
            </div>
          </>
        ) : (
          <>
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
                  {/* Only show Reply button on top-level comments */}
                  {isTopLevel && (
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="comment-action-btn"
                    >
                      <FaReply /> Reply
                    </button>
                  )}
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
          </>
        )}

        {comment.children && comment.children.length > 0 && (
          <div className="comment-replies">
            {comment.children.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!post) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading post...</p>;

  return (
    <div className="post-detail-container">
      <button onClick={() => navigate('/community')} className="back-button">
        <FaArrowLeft /> Back to Community
      </button>

      <div className="post-detail-layout">
        {/* Left Column: Post Content + Comments */}
        <div className="post-content-column">
          <div className="post-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {isEditingPost ? (
                <input
                  type="text"
                  value={editPostData.title}
                  onChange={(e) => setEditPostData(prev => ({ ...prev, title: e.target.value }))}
                  className="edit-post-title-input"
                  placeholder="Post title"
                />
              ) : (
                <h1>{post.title}</h1>
              )}

              {canEditPost() && !isEditingPost && (
                <div className="post-actions-header">
                  <button onClick={handleEditPost} className="edit-post-button">
                    <FaEdit /> Edit Post
                  </button>
                  <button onClick={handleDeletePost} className="delete-post-button">
                    <FaTrash /> Delete Post
                  </button>
                </div>
              )}
            </div>

            {!isEditingPost && post.prefix && (
              <div className={`prefix-badge prefix-${post.prefix.toLowerCase()}`} style={{ marginTop: '10px', marginBottom: '10px' }}>
                {post.prefix}
              </div>
            )}

            <div className="post-meta">
              <span>
                by {post.author}
                {post.authorRole === 'ADMIN' && <VerifiedBadge />}
              </span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <>
                  <span>•</span>
                  <span style={{ fontStyle: 'italic', color: '#666' }}>
                    Edited: {new Date(post.updatedAt).toLocaleString()}
                  </span>
                </>
              )}
              <span>•</span>
              <span>{post.views} views</span>
            </div>
          </div>

          <div className="post-content">
            {post.image && !isEditingPost && (
              <div className="post-featured-image">
                <img src={post.image} alt={post.title} />
              </div>
            )}

            {isEditingPost ? (
              <div className="edit-post-form">
                <div className="prefix-select-section" style={{ marginBottom: '15px' }}>
                  <label htmlFor="edit-prefix-select">Prefix:</label>
                  <select
                    id="edit-prefix-select"
                    value={editPostData.prefix}
                    onChange={(e) => setEditPostData(prev => ({ ...prev, prefix: e.target.value }))}
                    className="prefix-select"
                  >
                    <option value="General">General</option>
                    <option value="Notice">Notice</option>
                    <option value="Recipe">Recipe</option>
                    <option value="Question">Question</option>
                    <option value="Tip">Tip</option>
                  </select>
                </div>
                <textarea
                  value={editPostData.content}
                  onChange={(e) => setEditPostData(prev => ({ ...prev, content: e.target.value }))}
                  className="edit-post-content-textarea"
                  placeholder="Post content"
                  rows="10"
                />
                <div className="edit-post-actions">
                  <button onClick={handleSavePost} className="save-post-button">
                    Save Changes
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-edit-button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="content-view-toggle">
                  <button
                    onClick={() => setIsMarkdownView(!isMarkdownView)}
                    className="toggle-view-button"
                  >
                    {isMarkdownView ? '📝 To Plain Text' : '📄 To Markdown'}
                  </button>
                </div>

                {isMarkdownView ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{post.content}</p>
                )}
              </>
            )}
          </div>

          {/* Comments Section */}
          <div className="comments-section">
            <h2>Comments ({comments.length})</h2>

            {/* Add Comment Form */}
            {currentUser ? (
              <form onSubmit={handleAddComment} className="add-comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  required
                />
                <button type="submit">Post Comment</button>
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
        </div>

        {/* Right Column: Ratings */}
        <div className="post-ratings-column">
          <div className="ratings-summary">
            <h3>Average Rating</h3>
            <div className="average-rating-display">
              <div className="rating-number">{post.averageRating.toFixed(1)}</div>
              <div className="rating-stars-large">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <span key={index}>
                      {starValue <= Math.round(post.averageRating)
                        ? <FaStar className="star-filled" />
                        : <FaRegStar className="star-empty" />}
                    </span>
                  );
                })}
              </div>
              <div className="rating-count">({post.ratingCount} ratings)</div>
            </div>
          </div>

          {/* My Rating Display & Submit/Update Rating Form */}
          <div className="submit-rating-section">
            {myRating ? (
              <>
                <h3>Your Rating</h3>
                <div className="my-rating-display">
                  <div className="rating-stars">
                    {[...Array(5)].map((_, index) => {
                      const starValue = index + 1;
                      return (
                        <span key={index}>
                          {starValue <= myRating.rating
                            ? <FaStar className="star-filled" />
                            : <FaRegStar className="star-empty" />}
                        </span>
                      );
                    })}
                  </div>
                  {myRating.comment && (
                    <p className="my-rating-comment">{myRating.comment}</p>
                  )}
                  <button
                    onClick={handleDeleteRating}
                    className="delete-rating-btn"
                  >
                    Delete My Rating
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Rate this post</h3>
                <form onSubmit={handleSubmitRating} className="rating-form">
                  <div className="rating-stars">
                    {[...Array(5)].map((_, index) => {
                      const starValue = index + 1;
                      return (
                        <span
                          key={index}
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHover(starValue)}
                          onMouseLeave={() => setHover(0)}
                          style={{ cursor: 'pointer' }}
                        >
                          {starValue <= (hover || rating)
                            ? <FaStar className="star-filled" />
                            : <FaRegStar className="star-empty" />}
                        </span>
                      );
                    })}
                  </div>

                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review (optional)..."
                    rows="3"
                  />

                  <button type="submit">Submit Rating</button>
                </form>
              </>
            )}
          </div>

          {/* View All Ratings Section */}
          <div className="all-ratings-section">
            <button
              onClick={handleToggleAllRatings}
              className="toggle-all-ratings-btn"
            >
              {showAllRatings ? 'Hide All Ratings' : 'View All Ratings'}
            </button>

            {showAllRatings && (
              <div className="all-ratings-container">
                {allRatingsLoading ? (
                  <p className="loading-text">Loading ratings...</p>
                ) : allRatings.length === 0 ? (
                  <p className="no-ratings-text">No ratings yet.</p>
                ) : (
                  <div className="all-ratings-list">
                    {allRatings.map((r) => (
                      <div key={r.id} className="rating-item">
                        <div className="rating-item-header">
                          <span className="rating-user">{r.username || 'Anonymous'}</span>
                          <span className="rating-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="rating-item-stars">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < r.score ? "star-filled" : "star-empty"}>
                              {i < r.score ? <FaStar /> : <FaRegStar />}
                            </span>
                          ))}
                        </div>
                        {r.comment && <p className="rating-comment">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


      </div>
    </div>

  );
}

export default PostDetail;
