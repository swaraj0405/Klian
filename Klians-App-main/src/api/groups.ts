import API from './index';

// Groups API services
export const groupsAPI = {
  // Get all groups
  getGroups: () => {
    return API.get('/groups');
  },
  
  // Get a single group by ID
  getGroup: (groupId: string) => {
    return API.get(`/groups/${groupId}`);
  },
  
  // Create a new group
  createGroup: (groupData: any) => {
    return API.post('/groups', groupData);
  },
  
  // Update a group
  updateGroup: (groupId: string, groupData: any) => {
    return API.put(`/groups/${groupId}`, groupData);
  },
  
  // Delete a group
  deleteGroup: (groupId: string) => {
    return API.delete(`/groups/${groupId}`);
  },
  
  // Join a group
  joinGroup: (groupId: string) => {
    return API.put(`/groups/${groupId}/join`);
  },
  
  // Leave a group
  leaveGroup: (groupId: string) => {
    return API.put(`/groups/${groupId}/leave`);
  }
};

export default groupsAPI;