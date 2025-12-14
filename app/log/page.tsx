'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitLog } from '@/lib/submitLog';

export default function LogPage() {
  const [logText, setLogText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await submitLog(logText);
      router.push('/mission/select');
    } catch (err) {
      console.error('Failed to submit log:', err);
      setError('Failed to analyze your log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <h1 className="page-title">📝 Daily Log</h1>
      <div className="card">
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Take a moment to reflect on your day. How are you feeling?  
          What happened? Our AI will analyze your mood and create a  
          personalized mini-game experience for you.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            className="textarea"
            placeholder="How was your day? What's on your mind?"
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            disabled={isSubmitting}
          />

          {error && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!logText.trim() || isSubmitting}
              style={{
                opacity: !logText.trim() || isSubmitting ? 0.5 : 1,
                cursor: !logText.trim() || isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <span className="loading">
                  <span className="spinner"></span> Analyzing...
                </span>
              ) : (
                '🚀 Analyze & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
