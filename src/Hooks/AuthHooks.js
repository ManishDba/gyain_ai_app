import React, {useState} from 'react';
import { useNavigation } from '@react-navigation/native';
import axios from "../../services/axios";
import { useDispatch } from 'react-redux';
import { setUsers, setConfig } from '../reducers/users.slice';
import endpoint from '../../services/endpoint';
import { setUserAuthCred } from '../reducers/auth.slice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { ENV } from "../../env";

const AuthHooks = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [otpAttempts, setOtpAttempts] = useState(0);
    const [maxOtpAttempts] = useState(3);

    // AsyncStorage keys
    const AUTH_TOKEN_KEY = 'auth_token';
    const USER_DATA_KEY = 'user_data';

    // Check if token is valid (not expired)
    const isTokenValid = (token) => {
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp > currentTime;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    };

    // Store auth data in AsyncStorage
    const storeAuthData = async (token, userData) => {
        try {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        } catch (error) {
            console.error('Error storing auth data:', error);
        }
    };

    // Retrieve auth data from AsyncStorage
    const getStoredAuthData = async () => {
        try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
            
            if (token && userDataString) {
                const userData = JSON.parse(userDataString);
                return { token, userData };
            }
            return null;
        } catch (error) {
            console.error('Error retrieving auth data:', error);
            return null;
        }
    };

    // Clear auth data from AsyncStorage
    const clearStoredAuthData = async () => {
        try {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
            await AsyncStorage.removeItem(USER_DATA_KEY);
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    };

    // Check for existing valid session
    const checkExistingSession = async () => {
        try {
            const authData = await getStoredAuthData();
            
            if (authData && authData.token) {
                if (isTokenValid(authData.token)) {
                    // Token is valid, restore session
                    dispatch(setUserAuthCred({ 
                        token: authData.token,
                        username: authData.userData.username,
                        mfa: false 
                    }));
                    
                    // Navigate to appropriate screen based on config
                    const config = await fetchConfig();
                    const botLevel = Number(config?.[0]?.bot_level);
                    let destination = 'BotCategory';
                    if (botLevel === 1) {
                        destination = 'BotCategory';
                    } else if (botLevel !== 1) {
                        destination = 'DataScreen';
                    }
                    navigation.navigate(destination);
                    return true;
                } else {
                    // Token expired, clear stored data
                    await clearStoredAuthData();
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('Error checking existing session:', error);
            return false;
        }
    };

    // Clear errors
    const clearErrors = () => {
        setErrors({});
    };

    // Validate login fields
    const validateLoginFields = () => {
        const newErrors = {};

        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else {
            // allow numbers OR letters (or both together)
            const usernameRegex = /^[a-zA-Z0-9]+$/; 
            if (!usernameRegex.test(username.trim())) {
                newErrors.username = 'Username must be numeric ID or letters (no special characters)';
            }
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate OTP
    const validateOtp = (otpArray) => {
        const otpString = otpArray.join('');
        if (otpString.length !== 4) {
            setErrors({ otp: 'Please enter complete 4-digit OTP' });
            return false;
        }
        if (!/^\d{4}$/.test(otpString)) {
            setErrors({ otp: 'OTP must contain only numbers' });
            return false;
        }
        clearErrors();
        return true;
    };

    const handleLogin = async () => {
        // Clear previous errors
        clearErrors();
        
        // Validate fields
        if (!validateLoginFields()) {
            return;
        }

        const body = {
            subdomain: ENV.SUBDOMAIN,
            username: username.trim(),
            password: password.trim()
        };

        setLoading(true);

        try {
            const response = await fetch(endpoint.login(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 400) {
                    setErrors({ general: 'Invalid credentials. Please check your username and password.' });
                } else if (response.status === 422) {
                    setErrors({ general: data.message || 'Validation error. Please check your input.' });
                } else {
                    setErrors({ general: 'Login failed. Please try again.' });
                }
                return;
            }

            if (data.status === 'mfa_required') {
                // MFA is required, redirect to OTP screen
                dispatch(setUserAuthCred({ 
                    partialToken: data.partial_token || data.token,
                    username: username.trim(),
                    mfa: true 
                }));
                
                setOtpAttempts(0);
                return { success: true, mfaRequired: true };
            } else if (data.status === 'success') {
                // Direct login success - store auth data and navigate
                const userData = {
                    username: username.trim(),
                    loginTime: new Date().toISOString()
                };

                await storeAuthData(data.token, userData);

                dispatch(setUserAuthCred({ 
                    token: data.token,
                    username: username.trim(),
                    mfa: false 
                }));
                
                // Clear form
                setUsername('');
                setPassword('');
                
                const config = await fetchConfig();                
                const botLevel = Number(config?.[0]?.bot_level);                                
                let destination = 'BotCategory';
                if (botLevel === 1) {
                    destination = 'BotCategory';
                } else if (botLevel !== 1) {
                    destination = 'DataScreen';
                }
                navigation.navigate(destination);
                return { success: true, mfaRequired: false };   
            } else {
                setErrors({ general: data.message || 'Login failed. Please try again.' });
                return { success: false };
            }

        } catch (error) {
            console.error("Login error:", error);
            if (error.name === 'TypeError' && error.message.includes('Network')) {
                setErrors({ general: 'Network error. Please check your internet connection.' });
            } else {
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otpArray) => {
        // Clear previous errors
        clearErrors();
        
        // Validate OTP
        if (!validateOtp(otpArray)) {
            return;
        }

        // Check attempts limit
        if (otpAttempts >= maxOtpAttempts) {
            setErrors({ otp: `Maximum ${maxOtpAttempts} attempts exceeded. Please login again.` });
            return { success: false, maxAttemptsExceeded: true };
        }

        const otpCode = otpArray.join('');
        setLoading(true);

        try {
            const response = await fetch(endpoint.verifyOtp(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    otp_code: otpCode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const newAttempts = otpAttempts + 1;
                setOtpAttempts(newAttempts);
                
                if (newAttempts >= maxOtpAttempts) {
                    setErrors({ otp: `Invalid OTP. Maximum ${maxOtpAttempts} attempts exceeded. Please login again.` });
                    return { success: false, maxAttemptsExceeded: true };
                } else {
                    const remainingAttempts = maxOtpAttempts - newAttempts;
                    setErrors({ otp: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` });
                    return { success: false, attemptsRemaining: remainingAttempts };
                }
            }

            if (data.status === 'success') {
                // OTP verification successful - store auth data
                const userData = {
                    username: username.trim(),
                    loginTime: new Date().toISOString(),
                    mfaVerified: true
                };

                const finalToken = data.token || data.access_token;
                await storeAuthData(finalToken, userData);

                dispatch(setUserAuthCred({ 
                    token: finalToken,
                    username: username.trim(),
                    mfa: false 
                }));
                
                // Clear form data
                setUsername('');
                setPassword('');
                setOtpAttempts(0);
                
                const config = await fetchConfig();                
                const botLevel = Number(config?.[0]?.bot_level);                                
                let destination = 'BotCategory';
                if (botLevel === 1) {
                    destination = 'BotCategory';
                } else if (botLevel !== 1) {
                    destination = 'DataScreen';
                }
                navigation.navigate(destination);
                return { success: true };
            } else {
                const newAttempts = otpAttempts + 1;
                setOtpAttempts(newAttempts);
                
                if (newAttempts >= maxOtpAttempts) {
                    setErrors({ otp: `Invalid OTP. Maximum ${maxOtpAttempts} attempts exceeded. Please login again.` });
                    return { success: false, maxAttemptsExceeded: true };
                } else {
                    const remainingAttempts = maxOtpAttempts - newAttempts;
                    setErrors({ otp: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` });
                    return { success: false, attemptsRemaining: remainingAttempts };
                }
            }

        } catch (error) {
            console.error("OTP verification error:", error);
            
            const newAttempts = otpAttempts + 1;
            setOtpAttempts(newAttempts);
            
            if (error.name === 'TypeError' && error.message.includes('Network')) {
                setErrors({ otp: 'Network error. Please check your internet connection.' });
            } else {
                setErrors({ otp: 'An unexpected error occurred. Please try again.' });
            }
            
            return { success: false, networkError: true };
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Clear AsyncStorage
            await clearStoredAuthData();
            
            // Clear Redux state
            dispatch(setUserAuthCred({ 
                token: null,
                username: null,
                mfa: false 
            }));
            
            // Clear form data
            setUsername('');
            setPassword('');
            setOtpAttempts(0);
            clearErrors();
            
            // Navigate to login screen
            navigation.navigate('Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const resetOtpAttempts = () => {
        setOtpAttempts(0);
        clearErrors();
    };

    const handleBackToLogin = () => {
        setUsername('');
        setPassword('');
        setOtpAttempts(0);
        clearErrors();
    };

    const fetchUser = async () => { 
        try {
            const response = await axios.get(endpoint.users());
            dispatch(setUsers(response.data));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchConfig = async () => { 
        try {
            const response = await axios.get(endpoint.config());
            dispatch(setConfig(response.data));
            return response.data;
        } catch (error) {
            console.error(error);
        }
    };

    return ({
        handleLogin,
        username,
        password,
        setUsername,
        setPassword,
        fetchUser,
        fetchConfig,
        errors,
        loading,
        otpAttempts,
        maxOtpAttempts,
        
        // Functions
        handleVerifyOtp,
        handleLogout,
        clearErrors,
        resetOtpAttempts,
        handleBackToLogin,
        checkExistingSession,
        
        // Validation
        validateLoginFields,
        validateOtp,
        
        // Storage utilities
        isTokenValid,
        getStoredAuthData,
        clearStoredAuthData
    });
}

export default AuthHooks;