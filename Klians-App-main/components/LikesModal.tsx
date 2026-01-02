import React from 'react';
import { Modal } from './ui/Modal';
import { Avatar } from './ui/Avatar';
import { User } from '../types';

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  likes: User[];
  title?: string;
}

export const LikesModal: React.FC<LikesModalProps> = ({ 
  isOpen, 
  onClose, 
  likes,
  title = 'Likes'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="max-h-96 overflow-y-auto">
        {likes.length > 0 ? (
          <div className="space-y-3">
            {likes.map((user: any) => {
              // Handle both frontend User type and backend user object
              const userId = user.id || user._id;
              const userName = user.name;
              const userUsername = user.username || user.email?.split('@')[0] || '';
              const userAvatar = user.avatar || user.profilePicture || '';
              
              return (
                <div key={userId} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar src={userAvatar} alt={userName} size="md" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {userName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        @{userUsername}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">No likes yet</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
