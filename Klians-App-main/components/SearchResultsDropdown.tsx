
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import usersAPI from '../api/users';

interface SearchResultsDropdownProps {
  searchTerm: string;
  onClose: () => void;
}

export const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({ searchTerm, onClose }) => {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<User[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
        setRecentSearches([]);
      }
    }
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length >= 2) {
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

  const suggestedTopics = ['#KLIASFest2024', '#NewResearch'];

  const handleUserClick = (user: User) => {
    // Save to recent searches
    const updatedRecentSearches = [user, ...recentSearches.filter(s => s._id !== user._id)].slice(0, 5);
    setRecentSearches(updatedRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecentSearches));
    onClose();
  };

  const renderContent = () => {
    if (searchTerm.trim().length < 2) {
      return (
        <div className="space-y-4">
          {recentSearches.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm px-4 mb-2 text-slate-500 dark:text-slate-400">Recent Searches</h3>
              <div className="space-y-1">
                {recentSearches.map(user => (
                  <Link 
                    key={user._id} 
                    to={`/profile/${user._id}`} 
                    onClick={() => handleUserClick(user)} 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Avatar 
                      src={user.profilePicture || '/default-avatar.png'} 
                      alt={user.name} 
                      size="sm" 
                    />
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{user.email?.split('@')[0]}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm px-4 mb-2 text-slate-500 dark:text-slate-400">Suggested Topics</h3>
            <div className="space-y-1">
              {suggestedTopics.map(topic => (
                <a key={topic} href="#" onClick={onClose} className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <p className="font-bold text-red-600">{topic}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recent topic</p>
                </a>
              ))}
            </div>
          </div>
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
          {searchResults.map(user => (
            <Link 
              key={user._id} 
              to={`/profile/${user._id}`} 
              onClick={() => handleUserClick(user)} 
              className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Avatar 
                src={user.profilePicture || '/default-avatar.png'} 
                alt={user.name} 
                size="sm"
              />
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">@{user.email?.split('@')[0]}</p>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center p-8 text-sm text-slate-500 dark:text-slate-400">
        <p>No results found for "{searchTerm}"</p>
      </div>
    );
  };

  return (
    <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto py-2 z-50">
      {renderContent()}
    </Card>
  );
};