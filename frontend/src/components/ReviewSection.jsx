import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThumbsUp, MessageSquare, CornerDownRight, Send } from 'lucide-react';

const ReviewSection = ({ tmdbId, movieTitle }) => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [commentsMap, setCommentsMap] = useState({}); // reviewId -> comments list
  const [showCommentsMap, setShowCommentsMap] = useState({}); // reviewId -> boolean
  const [newCommentTextMap, setNewCommentTextMap] = useState({}); // reviewId -> text
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/social/reviews/${tmdbId}`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [tmdbId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    if (!user) return;

    setError('');
    try {
      const res = await fetch('/api/social/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tmdb_id: parseInt(tmdbId),
          title: movieTitle,
          content: newReviewText
        })
      });

      if (res.ok) {
        const created = await res.json();
        setReviews((prev) => [created, ...prev]);
        setNewReviewText('');
      } else {
        setError('Failed to post review. Please try again.');
      }
    } catch (err) {
      setError('Social API is offline.');
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/social/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, likes_count: data.likes_count } : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle review like:', err);
    }
  };

  const toggleComments = async (reviewId) => {
    const isShowing = showCommentsMap[reviewId];
    setShowCommentsMap((prev) => ({ ...prev, [reviewId]: !isShowing }));

    if (!isShowing && !commentsMap[reviewId]) {
      // Fetch comments if not loaded
      try {
        const res = await fetch(`/api/social/reviews/${reviewId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setCommentsMap((prev) => ({ ...prev, [reviewId]: data }));
        }
      } catch (err) {
        console.error('Failed to load review comments:', err);
      }
    }
  };

  const handleCommentSubmit = async (e, reviewId) => {
    e.preventDefault();
    const commentText = newCommentTextMap[reviewId] || '';
    if (!commentText.trim() || !user) return;

    try {
      const res = await fetch('/api/social/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          review_id: reviewId,
          content: commentText
        })
      });

      if (res.ok) {
        const createdComment = await res.json();
        setCommentsMap((prev) => ({
          ...prev,
          [reviewId]: [...(prev[reviewId] || []), createdComment]
        }));
        setNewCommentTextMap((prev) => ({ ...prev, [reviewId]: '' }));
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  const handleCommentTextChange = (reviewId, text) => {
    setNewCommentTextMap((prev) => ({ ...prev, [reviewId]: text }));
  };

  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-4 bg-neutral-800 rounded w-24 pulse-skeleton"></div>
        <div className="h-20 bg-neutral-800 rounded w-full pulse-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white pl-3 relative">
        Member Reviews ({reviews.length})
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5/6 bg-brand-red rounded-r-md"></span>
      </h3>

      {/* Write a Review */}
      {user ? (
        <form onSubmit={handleReviewSubmit} className="space-y-3 bg-neutral-900/40 border border-white/5 p-4 rounded-xl">
          <textarea
            value={newReviewText}
            onChange={(e) => setNewReviewText(e.target.value)}
            placeholder="Share your thoughts about this movie..."
            className="w-full bg-neutral-950/80 text-white border border-white/5 rounded-lg p-3 text-sm focus:border-brand-red outline-none min-h-[90px] resize-y"
          />
          {error && <p className="text-xs text-brand-red font-medium">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newReviewText.trim()}
              className={`px-5 py-2 rounded font-bold text-sm transition cursor-pointer ${
                newReviewText.trim()
                  ? 'bg-brand-red text-white hover:bg-brand-dark-red'
                  : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              Post Review
            </button>
          </div>
        </form>
      ) : (
        <p className="text-neutral-500 text-xs text-center border border-white/5 p-4 rounded-lg bg-neutral-950/20">
          Please <a href="/login" className="text-brand-red hover:underline font-semibold">login</a> to write a review.
        </p>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-neutral-500 text-sm italic">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="border-b border-white/5 pb-4 space-y-3 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center text-xs font-bold border border-white/5">
                    {rev.user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold leading-none">{rev.user.username}</h4>
                    <span className="text-[10px] text-neutral-500 mt-1 inline-block">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-neutral-300 text-sm leading-relaxed pl-10 whitespace-pre-wrap">{rev.content}</p>

              {/* Action row (Likes & Comments counts) */}
              <div className="flex items-center gap-4 text-xs font-semibold pl-10">
                <button
                  onClick={() => handleLike(rev.id)}
                  disabled={!user}
                  className={`flex items-center gap-1.5 transition ${
                    user ? 'hover:text-brand-red text-neutral-400 cursor-pointer' : 'text-neutral-600'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{rev.likes_count} Like{rev.likes_count !== 1 ? 's' : ''}</span>
                </button>

                <button
                  onClick={() => toggleComments(rev.id)}
                  className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {showCommentsMap[rev.id] ? 'Hide Comments' : 'Comments'} 
                    {commentsMap[rev.id] && ` (${commentsMap[rev.id].length})`}
                  </span>
                </button>
              </div>

              {/* Comments Thread (Expandable) */}
              {showCommentsMap[rev.id] && (
                <div className="pl-10 space-y-3 pt-2">
                  <div className="border-l border-white/10 pl-4 space-y-3">
                    {commentsMap[rev.id] && commentsMap[rev.id].map((com) => (
                      <div key={com.id} className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[9px] font-bold">
                          {com.user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="bg-neutral-900/60 p-2.5 rounded-lg text-xs leading-relaxed border border-white/5 flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-white">{com.user.username}</span>
                            <span className="text-[9px] text-neutral-500">{new Date(com.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-neutral-300">{com.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add a comment reply */}
                  {user && (
                    <form
                      onSubmit={(e) => handleCommentSubmit(e, rev.id)}
                      className="flex items-center gap-2 pl-4 pt-1"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={newCommentTextMap[rev.id] || ''}
                        onChange={(e) => handleCommentTextChange(rev.id, e.target.value)}
                        placeholder="Reply to this review..."
                        className="flex-grow bg-neutral-900/90 text-white rounded px-3 py-1.5 text-xs border border-white/5 focus:border-brand-red outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!(newCommentTextMap[rev.id] || '').trim()}
                        className={`p-1.5 rounded transition ${
                          (newCommentTextMap[rev.id] || '').trim()
                            ? 'bg-brand-red text-white hover:bg-brand-dark-red cursor-pointer'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
