import API from './index';

// Users API services
export const usersAPI = {
  // Get all users
  getUsers: () => {
    return API.get('/users');
  },
  
  // Search users
  searchUsers: (query: string) => {
    return API.get(`/users/search?q=${encodeURIComponent(query)}`);
  },
  
  // Get user by ID
  getUser: (userId: string) => {
    return API.get(`/users/${userId}`);
  },

  // Update user profile
  updateUser: (userId: string, data: { name?: string; bio?: string; profilePicture?: string }) => {
    return API.put(`/users/${userId}`, data);
  }
};

export default usersAPI;