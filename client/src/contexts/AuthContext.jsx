import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../auth/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { fetchProfile } from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("buyer");
  const [sellerStatus, setSellerStatus] = useState("none");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userProfile = await fetchProfile();
          setProfile(userProfile);
          setRole(userProfile?.role || "buyer");
          setSellerStatus(userProfile?.sellerStatus || "none");
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
          setRole("buyer");
          setSellerStatus("none");
        }
      } else {
        setProfile(null);
        setRole("buyer");
        setSellerStatus("none");
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    role,
    sellerStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
