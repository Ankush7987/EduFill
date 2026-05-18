import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FEEDBACK_TYPE_MAP = {
  bug: 'bug',
  feature: 'feature',
  feedback: 'feedback',
};

export default function FeedbackModal({
  isOpen,
  type = 'feedback',
  onClose,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const safeType = FEEDBACK_TYPE_MAP[type] || 'feedback';

    navigate(`/feedback?type=${safeType}`, {
      replace: false,
      state: { feedbackType: safeType },
    });

    if (typeof onClose === 'function') {
      onClose();
    }
  }, [isOpen, type, navigate, onClose]);

  return null;
}