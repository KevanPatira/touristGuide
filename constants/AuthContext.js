// constants/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  logOut: async () => {},
  refreshProfile: async () => {},
  updateUserProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null); // Firestore profile data
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch Firestore user profile
  const fetchUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile({ uid, ...docSnap.data() });
      }
    } catch (e) {
      console.log('Error fetching profile:', e);
    }
  };

  // Sign up with email/password
  const signUp = async (email, password, username) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;

    // Update Firebase Auth display name
    await updateProfile(userCredential.user, { displayName: username });

    // Create Firestore user document
    const profileData = {
      displayName: username,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      email,
      avatarUrl: '',
      bio: '',
      isPrivate: false,
      gender: '',
      age: '',
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), profileData);
    setUserProfile({ uid, ...profileData });

    return userCredential.user;
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserProfile(userCredential.user.uid);
    return userCredential.user;
  };

  // Sign in with Google (using ID token from expo-auth-session)
  const signInWithGoogle = async (idToken) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const { uid, displayName, email, photoURL } = userCredential.user;

    // Check if user doc exists, create if first login
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const profileData = {
        displayName: displayName || 'Traveler',
        username: (displayName || 'traveler').toLowerCase().replace(/\s+/g, '_') + '_' + uid.slice(0, 4),
        email: email || '',
        avatarUrl: photoURL || '',
        bio: '',
        isPrivate: false,
        gender: '',
        age: '',
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, profileData);
      setUserProfile({ uid, ...profileData });
    } else {
      await fetchUserProfile(uid);
    }
    return userCredential.user;
  };

  // Sign out
  const logOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  // Refresh profile from Firestore
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  // Update user profile fields in Firestore
  const updateUserProfile = async (fields) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, fields);
    setUserProfile((prev) => ({ ...prev, ...fields }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        logOut,
        refreshProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
