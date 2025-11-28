// Deployment History Utility
// Stores token deployment history in localStorage

const STORAGE_KEY = 'boing_token_deployments';
const MAX_HISTORY = 50; // Keep last 50 deployments

export const deploymentHistory = {
  // Get all deployment history
  getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading deployment history:', error);
      return [];
    }
  },

  // Add a new deployment
  add(deployment) {
    try {
      const history = this.getAll();
      const newDeployment = {
        ...deployment,
        id: deployment.id || Date.now().toString(),
        timestamp: deployment.timestamp || Date.now(),
        date: deployment.date || new Date().toISOString()
      };

      // Add to beginning of array
      history.unshift(newDeployment);

      // Keep only last MAX_HISTORY entries
      const trimmed = history.slice(0, MAX_HISTORY);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return newDeployment;
    } catch (error) {
      console.error('Error saving deployment history:', error);
      return null;
    }
  },

  // Get deployment by ID
  getById(id) {
    const history = this.getAll();
    return history.find(d => d.id === id) || null;
  },

  // Get deployments by network
  getByNetwork(network) {
    const history = this.getAll();
    return history.filter(d => d.network === network);
  },

  // Get deployments by address
  getByAddress(address) {
    const history = this.getAll();
    return history.filter(d => 
      d.contractAddress?.toLowerCase() === address.toLowerCase() ||
      d.deployerAddress?.toLowerCase() === address.toLowerCase()
    );
  },

  // Update deployment status
  updateStatus(id, status, txHash = null) {
    try {
      const history = this.getAll();
      const index = history.findIndex(d => d.id === id);
      
      if (index !== -1) {
        history[index].status = status;
        history[index].updatedAt = Date.now();
        if (txHash) {
          history[index].txHash = txHash;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history[index];
      }
      return null;
    } catch (error) {
      console.error('Error updating deployment status:', error);
      return null;
    }
  },

  // Delete a deployment
  delete(id) {
    try {
      const history = this.getAll();
      const filtered = history.filter(d => d.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting deployment:', error);
      return false;
    }
  },

  // Clear all history
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing deployment history:', error);
      return false;
    }
  },

  // Export history as JSON
  export() {
    return JSON.stringify(this.getAll(), null, 2);
  },

  // Get statistics
  getStats() {
    const history = this.getAll();
    return {
      total: history.length,
      byNetwork: history.reduce((acc, d) => {
        acc[d.network] = (acc[d.network] || 0) + 1;
        return acc;
      }, {}),
      byStatus: history.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {}),
      latest: history[0] || null,
      oldest: history[history.length - 1] || null
    };
  }
};

export default deploymentHistory;

