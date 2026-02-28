import React, { useEffect, useState } from 'react';
import './Home.css';
import { FaBell, FaRegCalendarAlt, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { GiMagicLamp } from 'react-icons/gi';
import apiClient from '../utils/apiClient';

// Helper function to get full image URL
const getImageUrl = (imgPath) => {
  if (!imgPath) return null;
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  return `https://api.findflavor.site${imgPath}`;
};

const StarRating = ({ rating, onRate }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= rating ? 'star-filled' : 'star-empty'}
        onClick={() => onRate && onRate(i)}
        style={{ cursor: onRate ? 'pointer' : 'default' }}
      >
        ★
      </span>
    );
  }
  return <span>{stars}</span>;
};


const AnnouncementCard = ({ announcement, onOpenDetail }) => (
  <div className="announcement-link" onClick={() => onOpenDetail(announcement)}>
    <div className="announcement-card">

      {announcement.image && (
        <div className="announcement-image-wrapper">
          <img
            src={announcement.image}
            alt={announcement.title}
            className="announcement-post-image"
          />
        </div>
      )}

      <h3 className="announcement-title">{announcement.title}</h3>
      <p className="announcement-summary">{announcement.summary}</p>
      <div className="announcement-metadata">
        <div className="meta-item"><FaUser className="icon-small" /> {announcement.author}</div>
        <div className="meta-item"><FaRegCalendarAlt className="icon-small" /> {announcement.date}</div>
      </div>
    </div>
  </div>
);

function Home() {
  // eslint-disable-next-line no-unused-vars
  const [communityPosts, setCommunityPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');

  const navigate = useNavigate();

  // Load posts + announcements from backend
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken') || null;
        const response = await apiClient.listBoards({ page: 1, limit: 20, token });
        const boards = response?.data || [];

        const mappedPosts = boards.map(b => ({
          id: b.id,
          title: b.title || 'Untitled',
          summary: b.content ? (b.content.length > 200 ? b.content.slice(0, 200) + '...' : b.content) : 'No description provided',
          author: b.author?.nickname || b.author?.username || 'Anonymous',
          date: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          user: b.author?.nickname || b.author?.username || 'Anonymous',
          image: getImageUrl(b.img_url),
          commentCount: b.commentCount || 0,
          isPinned: b.isPinned || false,
          rating: parseFloat(b.averageRating) || 0,
          review: b.content || 'No review provided',
          category: b.prefix || 'General',
        }));

        const topAnnouncements = mappedPosts.slice(0, 4);
        setAnnouncements(topAnnouncements);

        // Get top rated posts for community highlights and fetch their comments
        const topRatedPosts = mappedPosts
          .filter(p => p.rating > 0)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5);

        // Fetch comments for each top rated post to get reviewer info
        const postsWithReviewers = await Promise.all(
          topRatedPosts.map(async (post) => {
            try {
              const commentsResponse = await apiClient.listComments(post.id, { page: 1, limit: 1 });
              const comments = commentsResponse?.data || [];
              if (comments.length > 0) {
                const firstComment = comments[0];
                return {
                  ...post,
                  user: firstComment.author?.nickname || firstComment.author?.username || firstComment.user?.nickname || firstComment.user?.username || post.author,
                  review: firstComment.content || post.review,
                  date: firstComment.createdAt ? new Date(firstComment.createdAt).toISOString().split('T')[0] : post.date,
                };
              }
              return post;
            } catch (err) {
              console.error(`Failed to fetch comments for post ${post.id}:`, err);
              return post;
            }
          })
        );

        setCommunityPosts(postsWithReviewers);
      } catch (e) {
        console.error('Failed to load boards from backend:', e);
        setAnnouncements([]);
        setCommunityPosts([]);
      }
    })();
  }, []);


  // Navigate to post detail page
  const openPostDetail = (post) => {
    navigate(`/community/${post.id}`);
  };



  const handleGetAIRecommendations = () => {
    if (!aiPrompt.trim()) return;

    // Clear the input immediately
    const promptToSend = aiPrompt.trim();
    setAiPrompt('');

    // Include a unique navId so AIRecipe can create a new session each time
    const navId = Date.now();
    // Pass ONLY the prompt (not messages) so AIRecipe creates a brand new session
    // and auto-generates the response immediately
    navigate('/airecipe', { state: { prompt: promptToSend, navId } });
  };

  return (
    <div className="home-page-wrapper">

      {/* --- Hero Banner with AI --- */}
      <div className="hero-banner">
        <p className="pre-heading">✨ AI-POWERED RECIPE DISCOVERY</p>
        <h1 className="main-heading">Discover, Share, and Create Amazing Recipes</h1>
        <p className="sub-heading">
          Join our community of food lovers and let AI help you find the perfect recipe.
        </p>

        <div className="banner-ai-chat">
          <textarea
            className="banner-ai-input"
            placeholder="Ask the AI (e.g., 'I have chicken and rice...')"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGetAIRecommendations();
              }
            }}
          />

          <div className="banner-ai-actions">
            <button
              className="ai-btn recommend-btn"
              onClick={handleGetAIRecommendations}
            >
              <GiMagicLamp className="btn-icon" /> Get AI Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* --- Two Column Section --- */}
      <div className="home-columns">

        {/* Left: Announcements */}
        <div className="announcements-section">
          <div className="announcements-header">
            <FaBell className="announcement-icon" />
            <h2 className="announcements-title">Posts</h2>
          </div>

          <div className="announcements-list">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onOpenDetail={openPostDetail}
              />
            ))}
          </div>
        </div>

        {/* Right: Community Highlights */}
        <div className="community-highlight-section">
          <h2 className="community-title">🍽️ Community Highlights</h2>

          <ul className="community-list">
            {communityPosts.length > 0 ? communityPosts.map((post) => (
              <li key={post.id} className="community-item">
                <div className="community-link" onClick={() => openPostDetail(post)}>
                  <h4>{post.title}</h4>
                  <p>
                    <span className="community-user">by {post.user}</span> |{' '}
                    <span className="community-date">{post.date}</span>
                  </p>
                  <p className="community-rating">
                    <StarRating rating={Math.round(post.rating)} />
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>({post.rating.toFixed(1)})</span>
                  </p>
                  <p className="community-review-preview">
                    {post.review && post.review.length > 60 ? post.review.slice(0, 60) + '...' : post.review}
                  </p>
                </div>
              </li>
            )) : (
              <li className="community-item">
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No rated posts yet. Be the first to rate!</p>
              </li>
            )}

          </ul>
        </div>
      </div>



    </div>
  );
}

export default Home;
