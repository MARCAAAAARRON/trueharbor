import React, { useState, useEffect, useCallback } from 'react';
import { Star, CheckCircle, Trash2, X, MessageSquare, AlertCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProductReviews, submitProductReview, deleteProductReview } from '../api/catalog';
import type { Product, ProductReview, ProductReviewsSummary } from '../types/api';

interface ProductReviewsProps {
  product: Product;
  onReviewsUpdated?: (newAvg: number, newCount: number) => void;
}

export default function ProductReviews({ product, onReviewsUpdated }: ProductReviewsProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductReviewsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const refreshReviews = useCallback(async () => {
    try {
      const res = await getProductReviews(product.id);
      setReviews(res.data);
      setSummary(res.summary);
      if (onReviewsUpdated) {
        onReviewsUpdated(res.summary.average_rating, res.summary.total_reviews);
      }
    } catch {
      setError('Unable to load customer reviews at this time.');
    }
  }, [product.id, onReviewsUpdated]);

  useEffect(() => {
    let ignore = false;
    getProductReviews(product.id)
      .then((res) => {
        if (!ignore) {
          setReviews(res.data);
          setSummary(res.summary);
          setLoading(false);
          if (onReviewsUpdated) {
            onReviewsUpdated(res.summary.average_rating, res.summary.total_reviews);
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('Unable to load customer reviews at this time.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [product.id, onReviewsUpdated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setSubmitError('Please provide a comment with your review.');
      return;
    }
    if (comment.trim().length < 3) {
      setSubmitError('Review comment must be at least 3 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitProductReview(product.id, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });

      setIsModalOpen(false);
      setTitle('');
      setComment('');
      setRating(5);
      // Refresh list
      await refreshReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit your review. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to remove this review?')) return;

    try {
      setDeleteId(reviewId);
      await deleteProductReview(reviewId);
      await refreshReviews();
    } catch {
      alert('Failed to delete review. Please try again.');
    } finally {
      setDeleteId(null);
    }
  };

  // Render Star Icons Helper
  const renderStars = (score: number, size = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = s <= score;
          return (
            <Star
              key={s}
              size={size}
              className={`${
                filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
              } transition-colors`}
            />
          );
        })}
      </div>
    );
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor — Not suitable for harbor service',
    2: 'Fair — Has noticeable flaws',
    3: 'Good — Standard quality',
    4: 'Very Good — Reliable & sea-worthy',
    5: 'Exceptional — Top-tier maritime craftsmanship',
  };

  return (
    <section className="bg-white rounded-xl border border-sand shadow-sm p-6 sm:p-8 mt-12 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-sand">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-deep flex items-center gap-2">
            <MessageSquare className="text-harbor" size={24} />
            Harbor Customer Reviews
          </h2>
          <p className="text-sm text-slate mt-1">
            Real feedback and field logs from mariners who tested this provision.
          </p>
        </div>

        <div>
          {user ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-harbor hover:bg-ocean text-white font-medium text-sm rounded-lg shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-harbor focus:ring-offset-2"
            >
              Write a Review
            </button>
          ) : (
            <Link
              to={`/login?redirect=/products/${product.slug}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-harbor text-harbor hover:bg-harbor/5 font-medium text-xs sm:text-sm rounded-lg transition"
            >
              Sign in to Review
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center text-slate">
          <div className="w-8 h-8 border-3 border-harbor border-t-transparent rounded-full animate-spin mr-3"></div>
          <span>Loading harbor logs...</span>
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red-600 bg-red-50 rounded-lg my-6">
          <p>{error}</p>
          <button
            type="button"
            onClick={refreshReviews}
            className="mt-3 text-sm text-harbor underline hover:text-ocean"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Summary Ratings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-mist/60 rounded-xl border border-sand">
            {/* Left Score Box */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-sand">
              <span className="text-5xl font-serif font-extrabold text-deep">
                {summary && summary.total_reviews > 0 ? summary.average_rating.toFixed(1) : '0.0'}
              </span>
              <div className="my-2">
                {renderStars(summary ? Math.round(summary.average_rating) : 0, 20)}
              </div>
              <p className="text-xs text-slate">
                Based on{' '}
                <span className="font-semibold text-deep">
                  {summary?.total_reviews || 0}
                </span>{' '}
                verified rating{summary?.total_reviews === 1 ? '' : 's'}
              </p>
            </div>

            {/* Right Distribution Bars */}
            <div className="md:col-span-8 flex flex-col justify-center space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const item = summary?.rating_distribution?.[stars] || {
                  stars,
                  count: 0,
                  percentage: 0,
                };
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs text-slate">
                    <span className="w-8 font-medium text-right text-deep">{stars} ★</span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right font-medium text-slate">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Reviews Feed */}
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-semibold text-deep">
              Customer Experiences ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-sand">
                <ShieldCheck className="mx-auto text-slate/40 mb-3" size={40} />
                <p className="text-slate font-medium">No reviews logged yet for this provision.</p>
                <p className="text-xs text-slate/80 mt-1 max-w-sm mx-auto">
                  Be the first seafarer to share firsthand experience with its build quality and resilience.
                </p>
                {user && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold text-harbor bg-harbor/10 hover:bg-harbor/15 rounded-lg transition"
                  >
                    Share Your Review
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-sand">
                {reviews.map((rev) => {
                  const canDelete = user && (user.id === rev.user.id || user.role === 'admin');

                  return (
                    <article key={rev.id} className="pt-6 pb-6 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            {renderStars(rev.rating, 15)}
                            {rev.title && (
                              <h4 className="font-semibold text-deep text-sm sm:text-base">
                                {rev.title}
                              </h4>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate flex-wrap">
                            <span className="font-medium text-tide">{rev.user.name}</span>
                            <span>•</span>
                            <time dateTime={rev.created_at}>{rev.formatted_date}</time>

                            {rev.is_verified_purchase && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle size={12} className="text-emerald-600" />
                                Verified Harbor Buyer
                              </span>
                            )}
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(rev.id)}
                            disabled={deleteId === rev.id}
                            className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-md hover:bg-red-50"
                            title="Remove review"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-sand animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-sand">
              <h3 className="text-lg font-serif font-bold text-deep">
                Write a Review
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-2">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = hoverRating ? star <= hoverRating : star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none focus:scale-115 transition"
                          title={`${star} Star`}
                        >
                          <Star
                            size={28}
                            className={`${
                              active
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200 fill-slate-100 hover:text-amber-200'
                            } transition-colors`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate ml-2 italic">
                    {ratingLabels[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* Review Headline */}
              <div>
                <label
                  htmlFor="review-title"
                  className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1"
                >
                  Headline (Optional)
                </label>
                <input
                  id="review-title"
                  type="text"
                  maxLength={150}
                  placeholder="e.g. Indispensable on rough waters"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-sand focus:border-harbor focus:ring-2 focus:ring-harbor/20 outline-none transition"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label
                  htmlFor="review-comment"
                  className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1"
                >
                  Comments & Field Experience *
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  required
                  placeholder="Tell other seafarers how this item performed, its durability, or sizing..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-sand focus:border-harbor focus:ring-2 focus:ring-harbor/20 outline-none transition resize-none"
                ></textarea>
                <p className="text-[11px] text-slate mt-1">
                  Reviews from verified harbor orders will carry a green badge of authenticity.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate hover:text-deep transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-harbor hover:bg-ocean text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting Log...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
