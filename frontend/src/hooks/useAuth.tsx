// Custom hook to use AuthContext
import {useContext} from "react";
import {AuthContext} from '../shared/src/types/auth'

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};