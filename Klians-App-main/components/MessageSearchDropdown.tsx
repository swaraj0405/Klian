import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';

interface MessageSearchDropdownProps {
  searchTerm: string;
  onClose: () => void;
  onSelectUser?: (user: User) => void;
}

export const MessageSearchDropdown: React.FC<MessageSearchDropdownProps> = ({ searchTerm, onClose, onSelectUser }) => {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length >= 1) {
        setIsLoading(true);
        
        try {
          // Get auth token
          const token = localStorage.getItem('token');
          
          if (!token) {
            setSearchResults([]);
            setIsLoading(false);
            return;
          }

          // Fetch all users from API
          const response = await fetch('http://192.168.32.2:5000/api/users', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const allUsers = await response.json();
            
            // Filter users based on search term
            const filteredUsers = allUsers.filter((user: any) => 
              user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            
            setSearchResults(filteredUsers);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleUserClick = (user: User) => {
    const id = (user as any).id || (user as any)._id;
    if (onSelectUser) {
      onSelectUser({ ...user, id } as User);
    } else if (id) {
      navigate(`/messages/${id}`);
    }
    onClose();
  };

  const renderContent = () => {
    if (searchTerm.trim().length < 1) {
      return (
        <div className="text-center p-8 text-sm text-slate-500 dark:text-slate-400">
          <p>Start typing to search for users</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="text-center p-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">Searching...</p>
        </div>
      );
    }

    if (searchResults.length > 0) {
      return (
        <div className="space-y-1">
          {searchResults.map(user => {
            const id = (user as any).id || (user as any)._id;
            const avatarSrc = (user as any).avatar || (user as any).profilePicture || '/default-avatar.png';
            return (
              <button
                key={id || user.email}
                onClick={() => handleUserClick(user)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <Avatar 
                  src={avatarSrc} 
                  alt={user.name} 
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">@{user.email?.split('@')[0]}</p>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="text-center p-8 text-sm text-slate-500 dark:text-slate-400">
        <p>No users found for "{searchTerm}"</p>
      </div>
    );
  };

  return (
    <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto py-2 z-50">
      {renderContent()}
    </Card>
  );
};
