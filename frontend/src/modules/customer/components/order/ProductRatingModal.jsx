import React, { useState, useEffect } from "react";
import { Star, X, Check, ThumbsUp, AlertCircle, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { customerApi } from "../../services/customerApi";
import { useToast } from "@shared/components/ui/Toast";
import Modal from "@shared/components/ui/Modal";

const POSITIVE_TAGS = [
  { id: "GOOD_QUALITY", label: "Good Quality" },
  { id: "FRESH", label: "Fresh & Crisp" },
  { id: "GOOD_TASTE", label: "Great Taste" },
  { id: "GOOD_VALUE", label: "Good Value" },
  { id: "GOOD_PACKAGING", label: "Neat Packaging" },
  { id: "AS_EXPECTED", label: "As Expected" },
];

const NEGATIVE_TAGS = [
  { id: "POOR_QUALITY", label: "Poor Quality" },
  { id: "NOT_FRESH", label: "Not Fresh" },
  { id: "DAMAGED", label: "Damaged / Spoiled" },
  { id: "WRONG_PRODUCT", label: "Wrong Item" },
  { id: "PACKAGING_ISSUE", label: "Packaging Issue" },
  { id: "NOT_AS_EXPECTED", label: "Not as Expected" },
  { id: "EXPIRY_ISSUE", label: "Near Expiry" },
  { id: "OTHER", label: "Other Issue" },
];

const RATING_LABELS = {
  1: "Poor",
  2: "Below Average",
  3: "Okay",
  4: "Good",
  5: "Excellent",
};

const ProductRatingModal = ({ isOpen, onClose, orderId, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (isOpen && orderId) {
      fetchEligibility();
    } else {
      resetState();
    }
  }, [isOpen, orderId]);

  const resetState = () => {
    setRating(5);
    setSelectedTags([]);
    setComment("");
    setCurrentIndex(0);
    setEligibilityData(null);
  };

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getProductRatingEligibility(orderId);
      if (res.data.success) {
        const payload = res.data.result || {};
        setEligibilityData(payload);

        // Find first un-rated item
        const unratedIdx = (payload.items || []).findIndex(
          (i) => i.eligible && !i.alreadyRated
        );
        setCurrentIndex(unratedIdx !== -1 ? unratedIdx : 0);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load product rating eligibility", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const items = eligibilityData?.items || [];
  const activeItem = items[currentIndex];
  const rateableItems = items.filter((i) => i.eligible);
  const isFinished = !loading && rateableItems.every((i) => i.alreadyRated);

  const availableTags = rating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS;

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleRatingChange = (newStar) => {
    setRating(newStar);
    setSelectedTags([]); // Clear tags when switching between positive/negative
  };

  const handleSubmit = async () => {
    if (!activeItem) return;

    try {
      setSubmitting(true);
      const payload = {
        orderItemId: activeItem.orderItemId,
        rating,
        feedbackTags: selectedTags,
        comment: comment.trim(),
      };

      const res = await customerApi.submitProductRating(payload);
      if (res.data.success) {
        showToast("Product rating submitted! Thank you ⭐", "success");

        // Mark local item as rated
        const updatedItems = items.map((it, idx) =>
          idx === currentIndex ? { ...it, alreadyRated: true, eligible: false } : it
        );
        setEligibilityData((prev) => ({ ...prev, items: updatedItems }));

        // Move to next unrated item or finish
        const nextUnratedIdx = updatedItems.findIndex(
          (it, idx) => idx > currentIndex && it.eligible && !it.alreadyRated
        );

        if (nextUnratedIdx !== -1) {
          setCurrentIndex(nextUnratedIdx);
          setRating(5);
          setSelectedTags([]);
          setComment("");
        } else {
          if (onSuccess) onSuccess();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit rating", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Products">
      <div className="space-y-6 max-w-md mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="animate-spin text-brand-600" size={32} />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Checking eligibility...
            </p>
          </div>
        ) : isFinished || !activeItem ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900">All Products Rated!</h3>
            <p className="text-xs text-slate-500 font-medium">
              Thank you for sharing your feedback. Your reviews help us improve item quality.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Item Header & Pagination indicator */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeItem.image || "https://via.placeholder.com/60"}
                  alt={activeItem.productName}
                  className="w-12 h-12 object-contain rounded-xl bg-white border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">
                    {activeItem.productName}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {activeItem.variantSlot || `Qty: ${activeItem.quantity}`} • ₹{activeItem.price}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg shrink-0">
                {currentIndex + 1} of {items.length}
              </span>
            </div>

            {/* Interactive Stars */}
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                How was this product?
              </p>
              <div className="flex justify-center items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1 text-amber-400 focus:outline-none transition-transform active:scale-125 hover:scale-110"
                    aria-label={`${star} Star - ${RATING_LABELS[star]}`}
                  >
                    <Star
                      size={32}
                      className={cn(
                        "transition-all duration-200",
                        star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-50"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-wide">
                {RATING_LABELS[rating]}
              </p>
            </div>

            {/* Feedback Tags */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                {rating >= 4 ? "What did you like?" : "What could be better?"}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 flex items-center gap-1.5",
                        isSelected
                          ? rating >= 4
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                            : "bg-rose-50 text-rose-700 border-rose-300 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {isSelected && <Check size={12} />}
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  Tell us more (Optional)
                </label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {comment.length}/500
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Share specific details about freshness, quality, packaging..."
                rows={3}
                className="w-full p-3 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-slate-900 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Submit Rating</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductRatingModal;
