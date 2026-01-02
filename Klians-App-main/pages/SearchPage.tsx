import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { ICONS } from '../constants';
import { Avatar } from '../components/ui/Avatar';
import { User } from '../types';
import usersAPI from '../src/api/users';

interface SearchPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
    if (isOpen) {
      // Auto-focus the input when the page opens
      inputRef.current?.focus();
    } else {
        // Clear search when closing
        setSearchTerm('');
        setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length >= 2) {
        setIsLoading(true);
        try {
          const response = await usersAPI.searchUsers(searchTerm);
          setSearchResults(response.data);
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
    const updatedRecentSearches = [user, ...recentSearches.filter(s => s._id !== user.id)].slice(0, 5);
    setRecentSearches(updatedRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecentSearches));
    onClose();
  };

  const handleRemoveRecentSearch = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedRecentSearches = recentSearches.filter(user => user._id !== userId);
    setRecentSearches(updatedRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecentSearches));
  };

  const renderContent = () => {
    if (searchTerm.trim().length < 2) {
      return (
        <div className="space-y-6">
          {recentSearches.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3">Recent Searches</h3>
              <div className="space-y-3">
                {recentSearches.map(user => (
                  <div key={user._id} className="flex items-center justify-between">
                    <Link 
                      to={`/profile/${user._id}`} 
                      onClick={() => handleUserClick(user)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar src={user.profilePicture || '/default-avatar.png'} alt={user.name} />
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">@{user.email?.split('@')[0]}</p>
                      </div>
                    </Link>
                    <button 
                      className="text-2xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={(e) => handleRemoveRecentSearch(user._id, e)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg mb-3">Suggested Topics</h3>
            <div className="space-y-3">
              {suggestedTopics.map(topic => (
                <div key={topic}>
                  <p className="font-bold text-red-600 hover:underline cursor-pointer">{topic}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Recent topic</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
              className="block p-2 -mx-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar src={user.profilePicture || '/default-avatar.png'} alt={user.name} />
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">@{user.email?.split('@')[0]}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center p-8 text-slate-500 dark:text-slate-400">
        <p>No results found for "{searchTerm}"</p>
      </div>
    );
  };


  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-slate-900 z-50 transform transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
    >
      <div className="flex flex-col h-full">
        <header className="p-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
              {React.cloneElement(ICONS.chevronLeft, { className: 'h-6 w-6' })}
          </button>
          <Input
            ref={inputRef}
            placeholder="Search KLIAS..."
            icon={React.cloneElement(ICONS.search, { className: 'h-5 w-5' })}
            className="flex-1 !bg-slate-100 dark:!bg-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </header>
        <main className="flex-1 p-4 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
