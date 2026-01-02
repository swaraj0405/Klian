import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (recipient: string, message: string, shareType: 'email' | 'message') => Promise<void>;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!recipientEmail.trim()) {
      setError('Please enter a recipient email address');
      return;
    }
    
    if (!recipientEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Share via email (which will search for user by email and send message)
      await onShare(recipientEmail, message, 'email');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to share. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientEmail('');
    setMessage('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Share Post">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <Input
            type="email"
            placeholder="Enter recipient email (e.g., name@kluniversity.in)"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
            className="w-full"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            The recipient must be registered with this email address
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message (Optional)</label>
          <Input
            type="text"
            placeholder="Add a message with the post..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!recipientEmail.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Share'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};