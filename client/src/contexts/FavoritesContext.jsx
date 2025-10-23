import React, { createContext, useContext, useReducer, useEffect } from "react";

const FavoritesContext = createContext();

// Favorites actions
const FAVORITES_ACTIONS = {
  ADD_TO_FAVORITES: "ADD_TO_FAVORITES",
  REMOVE_FROM_FAVORITES: "REMOVE_FROM_FAVORITES",
  LOAD_FAVORITES: "LOAD_FAVORITES",
  CLEAR_FAVORITES: "CLEAR_FAVORITES",
};

// Favorites reducer
function favoritesReducer(state, action) {
  switch (action.type) {
    case FAVORITES_ACTIONS.ADD_TO_FAVORITES:
      const existingFavorite = state.items.find(
        (item) => item._id === action.payload._id
      );

      if (existingFavorite) {
        return state; // Already in favorites
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
        };
      }

    case FAVORITES_ACTIONS.REMOVE_FROM_FAVORITES:
      return {
        ...state,
        items: state.items.filter((item) => item._id !== action.payload),
      };

    case FAVORITES_ACTIONS.LOAD_FAVORITES:
      return {
        ...state,
        items: action.payload || [],
      };

    case FAVORITES_ACTIONS.CLEAR_FAVORITES:
      return {
        ...state,
        items: [],
      };

    default:
      return state;
  }
}

// Initial state
const initialState = {
  items: [],
};

// Favorites provider component
export function FavoritesProvider({ children }) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      try {
        const favoritesData = JSON.parse(savedFavorites);
        dispatch({
          type: FAVORITES_ACTIONS.LOAD_FAVORITES,
          payload: favoritesData,
        });
      } catch (error) {
        console.error("Error loading favorites from localStorage:", error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(state.items));
  }, [state.items]);

  // Favorites actions
  const addToFavorites = (product) => {
    dispatch({
      type: FAVORITES_ACTIONS.ADD_TO_FAVORITES,
      payload: product,
    });
  };

  const removeFromFavorites = (productId) => {
    dispatch({
      type: FAVORITES_ACTIONS.REMOVE_FROM_FAVORITES,
      payload: productId,
    });
  };

  const clearFavorites = () => {
    dispatch({ type: FAVORITES_ACTIONS.CLEAR_FAVORITES });
  };

  const isFavorite = (productId) => {
    return state.items.some((item) => item._id === productId);
  };

  const toggleFavorite = (product) => {
    if (isFavorite(product._id)) {
      removeFromFavorites(product._id);
    } else {
      addToFavorites(product);
    }
  };

  const value = {
    ...state,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    isFavorite,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Custom hook to use favorites context
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}


