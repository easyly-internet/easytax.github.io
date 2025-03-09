import React, { ReactNode, useState } from "react";
import { LoginCredentials, RegisterData, User, UserRole, UserStatus, AuthContext} from "../shared/src/types/auth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = !!user;

    const login = async (credentials: LoginCredentials) => {
        setLoading(true);
        setError(null);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const mockUser: User = {
                id: "1",
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                mobile: "9876543210",
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                createdAt: "2024-03-09T12:00:00Z",
                updatedAt: "2024-03-09T12:00:00Z",
            };

            setUser(mockUser);
            localStorage.setItem("user", JSON.stringify(mockUser));
            window.location.href = "/dashboard";
        } catch (err) {
            setError("Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        setLoading(true);
        setError(null);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newUser: User = {
                id: "3",
                firstName: "Bob",
                lastName: "Marley",
                email: "bob.marley@example.com",
                mobile: "8765432109",
                role: UserRole.MEMBER,
                status: UserStatus.ACTIVE,
                createdAt: "2022-06-20T10:45:00Z",
                updatedAt: "2024-02-01T09:15:00Z",
            };

            setUser(newUser);
            localStorage.setItem("user", JSON.stringify(newUser));
            window.location.href = "/dashboard";
        } catch (err) {
            setError("Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                loading,
                login,
                register,
                logout,
                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
