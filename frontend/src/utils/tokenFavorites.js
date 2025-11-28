// Token Favorites Utility
// Stores favorite tokens in localStorage

const STORAGE_KEY = 'boing_token_favorites';

export const tokenFavorites = {
  // Get all favorites
  getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading favorites:', error);
      return [];
    }
  },

  // Add a favorite
  add(token) {
    try {
      const favorites = this.getAll();
      const tokenKey = `${token.network}_${token.address}`.toLowerCase();
      
      // Check if already exists
      if (favorites.find(f => `${f.network}_${f.address}`.toLowerCase() === tokenKey)) {
        return false;
      }

      const favorite = {
        ...token,
        addedAt: Date.now(),
        id: token.id || tokenKey
      };

      favorites.push(favorite);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  },

  // Remove a favorite
  remove(network, address) {
    try {
      const favorites = this.getAll();
      const tokenKey = `${network}_${address}`.toLowerCase();
      const filtered = favorites.filter(
        f => `${f.network}_${f.address}`.toLowerCase() !== tokenKey
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  },

  // Check if token is favorite
  isFavorite(network, address) {
    const favorites = this.getAll();
    const tokenKey = `${network}_${address}`.toLowerCase();
    return favorites.some(
      f => `${f.network}_${f.address}`.toLowerCase() === tokenKey
    );
  },

  // Get favorites by network
  getByNetwork(network) {
    const favorites = this.getAll();
    return favorites.filter(f => f.network === network);
  },

  // Clear all favorites
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }
};

export default tokenFavorites;

