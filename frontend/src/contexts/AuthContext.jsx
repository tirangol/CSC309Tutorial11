import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token)
            return;
        fetch(`${BACKEND_URL}/user/me`, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'}
        }).then(x => x.json())
        .then(x => {
            setUser(x.user); 
        })
        .catch(x => {
            localStorage.clear();
        });
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        // TODO: complete me
        setUser(null);
        localStorage.clear();
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        let response = await fetch(`${BACKEND_URL}/login`, {
            method: 'POST',
            body: JSON.stringify({username: username, password: password}),
            headers: {'Content-Type': 'application/json'}
        });
        if (!response.ok)
            return `Invalid credentials`;
        response = await response.json();
        localStorage.setItem('token', response.token);
        
        response = await fetch(`${BACKEND_URL}/user/me`, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'}
        })
        if (!response.ok)
            return `${response.status}: ${response.statusText}`;
        response = await response.json();

        setUser(response.user);
        navigate('/profile');
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        let response = await fetch(`${BACKEND_URL}/register`, {
            method: 'POST',
            body: JSON.stringify(userData),
            headers: {'Content-Type': 'application/json'}
        })
        if (!response.ok)
            return `User Name already exists`;
        navigate('/success');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
