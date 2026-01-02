import React from 'react';
import { User, Role } from '../types';
import { Avatar } from './ui/Avatar';

interface CreatePostCardProps {
    user: User;
    onComposeClick: () => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ user, onComposeClick }) => {
    // Only render the create post card for faculty users
    if (user.role !== Role.TEACHER && user.role !== 'faculty') {
        return null;
    }
    
    return (
        // The main clickable trigger with a group class for hover effects
        <div 
            className="mb-4 group"
            onClick={onComposeClick}
            role="button"
            aria-label="Create a new post"
        >
            {/* This outer div creates the gradient border on hover */}
            <div className="p-px rounded-full bg-slate-200 dark:bg-slate-700 
                           group-hover:bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to 
                           transition-all duration-300">
                {/* This is the inner element with the actual content */}
                <div className="bg-white dark:bg-slate-800 rounded-full px-3 py-2 cursor-pointer">
                    <div className="flex items-center gap-3">
                        <Avatar src={user.avatar} alt={user.name} size="md" />
                        <div className="flex-grow text-left text-slate-500 dark:text-slate-400">
                            Start a post...
                        </div>
                        {/* A subtle visual cue on the right */}
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 
                                        text-slate-500 dark:text-slate-400 
                                        group-hover:bg-red-500 group-hover:text-white 
                                        transition-colors duration-300">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
