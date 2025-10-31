import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AuthHooks from "../Hooks/AuthHooks";

// In-memory storage to simulate "Remember Me" without AsyncStorage
const inMemoryStorage = {
  savedUsername: null,
  savedPassword: null,
  rememberMe: null,
};

const LoginScreen = () => {
  const {
    handleLogin,
    handleVerifyOtp,
    handleBackToLogin,
    username,
    password,
    setUsername,
    setPassword,
    errors,
    loading,
    otpAttempts,
    maxOtpAttempts,
    clearErrors,
  } = AuthHooks();

  const [screen, setScreen] = useState("login");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // Load saved credentials from in-memory storage when component mounts
  // useEffect(() => {
  //   if (inMemoryStorage.rememberMe === true && inMemoryStorage.savedUsername && inMemoryStorage.savedPassword) {
  //     setUsername(inMemoryStorage.savedUsername);
  //     setPassword(inMemoryStorage.savedPassword);
  //     setRememberMe(true);
  //   }
  // }, []);

  // Reset OTP when screen changes
  useEffect(() => {
    if (screen === "otp") {
      setOtp(["", "", "", ""]);
      setTimeout(() => {
        otpRefs[0].current?.focus();
      }, 100);
    }
  }, [screen]);

  const resetAllFields = () => {
    setUsername("");
    setPassword("");
    setOtp(["", "", "", ""]);
    clearErrors();
  };

  const handleLoginSubmit = async () => {
    const result = await handleLogin();

    if (result?.success) {
      // Save credentials to in-memory storage if "Remember Me" is checked
      if (rememberMe) {
        inMemoryStorage.savedUsername = username;
        inMemoryStorage.savedPassword = password;
        inMemoryStorage.rememberMe = true;
      } else {
        // Clear in-memory storage if "Remember Me" is unchecked
        inMemoryStorage.savedUsername = null;
        inMemoryStorage.savedPassword = null;
        inMemoryStorage.rememberMe = null;
      }

      if (result?.mfaRequired) {
        setScreen("otp");
      }
    }
  };

  const handleVerifyOtpSubmit = async () => {
    const result = await handleVerifyOtp(otp);

    if (result?.maxAttemptsExceeded) {
      Alert.alert(
        "Max Attempts Exceeded",
        "You have exceeded the maximum number of OTP attempts. Please login again.",
        [
          {
            text: "OK",
            onPress: () => {
              handleBackToLogin();
              setScreen("login");
            },
          },
        ]
      );
    } else if (result?.success) {
      resetAllFields();
    } else {
      setOtp(["", "", "", ""]);
      setTimeout(() => {
        otpRefs[0].current?.focus();
      }, 100);
    }
  };

  const handleOtpChange = (value, index) => {
    // If user pastes multiple digits
    if (value.length > 1) {
      const newOtp = value.split("").slice(0, 4); // take only 4 digits
      setOtp(newOtp);

      // Move focus to the last box
      if (newOtp.length === 4) {
        otpRefs[3].current?.focus();
        setTimeout(() => {
          handleVerifyOtp(newOtp);
        }, 100);
      }
      return;
    }

    // Normal single-digit flow
    if (value && !/^\d$/.test(value)) {
      return;
    }

    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (errors.otp) {
      clearErrors();
    }

    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    if (value && index === 3) {
      const completeOtp = [...newOtp];
      if (completeOtp.every((digit) => digit !== "")) {
        setTimeout(() => {
          handleVerifyOtp(completeOtp);
        }, 100);
      }
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && index > 0 && otp[index] === "") {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleBackToLoginPress = () => {
    Alert.alert(
      "Go Back to Login",
      "Are you sure you want to go back? You will need to enter your credentials again.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Go Back",
          onPress: () => {
            handleBackToLogin();
            setScreen("login");
            resetAllFields();
          },
        },
      ]
    );
  };

  // Handle "Remember Me" checkbox toggle
  // const handleRememberMeToggle = () => {
  //   const newRememberMe = !rememberMe;
  //   setRememberMe(newRememberMe);

  //   if (!newRememberMe) {
  //     // Clear fields and in-memory storage when "Remember Me" is unchecked
  //     setUsername('');
  //     setPassword('');
  //     inMemoryStorage.savedUsername = null;
  //     inMemoryStorage.savedPassword = null;
  //     inMemoryStorage.rememberMe = null;
  //     clearErrors();
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="never"
      >
        {screen === "login" && (
          <View style={styles.loginContainer}>
            {/* Header */}
            <Text style={styles.logo}>IFFCO AI</Text>
            <Text style={styles.logosubtital}>Gyan Hub</Text>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Sign in to your account to continue
            </Text>

            {/* Error Message */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username / Personal Number </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.username && styles.inputError,
                  ]}
                >
                  <Icon
                    name="account"
                    size={24}
                    color="#174054"
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder=" Username"
                    placeholderTextColor="#D3D3D3"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (errors.username) clearErrors();
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>
                {errors.username && (
                  <Text style={styles.fieldErrorText}>{errors.username}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.inputLabel}>Password</Text>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.password && styles.inputError,
                  ]}
                >
                  <Icon
                    name="lock"
                    size={24}
                    color="#174054"
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder=" Password"
                    placeholderTextColor="#D3D3D3"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) clearErrors();
                    }}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Icon
                      name={showPassword ? "eye" : "eye-off"}
                      size={22}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.fieldErrorText}>{errors.password}</Text>
                )}
              </View>

              {/* Remember Me */}
              {/* <TouchableOpacity
                  style={styles.rememberContainer}
                  onPress={handleRememberMeToggle}
                  disabled={loading}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity> */}

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, loading && styles.buttonDisabled]}
                onPress={handleLoginSubmit}
                disabled={loading}
              >
                <Text style={styles.signInButtonText}>
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {screen === "otp" && (
          <View style={styles.otpScreenContainer}>
            <Text style={styles.logo}>IFFCO AI</Text>
            <Text style={styles.logosubtital}>Gyan Hub</Text>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              A 4-digit code has been sent to your registered email or phone
              number
            </Text>

            {/* OTP Attempts Info */}
            <View style={styles.attemptsContainer}>
              <Text style={styles.attemptsText}>
                Attempts: {otpAttempts}/{maxOtpAttempts}
              </Text>
            </View>

            {/* Error Message */}
            {errors.otp && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.otp}</Text>
              </View>
            )}

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={otpRefs[index]}
                  style={[
                    styles.otpInput,
                    errors.otp && styles.otpInputError,
                    digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={index === 0 ? 4 : 1} // first input allows 4 chars
                  selectTextOnFocus={true}
                  editable={!loading && otpAttempts < maxOtpAttempts}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.signInButton,
                (loading || otpAttempts >= maxOtpAttempts) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleVerifyOtpSubmit}
              disabled={loading || otpAttempts >= maxOtpAttempts}
            >
              <Text style={styles.signInButtonTextVerify}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackToLoginPress}
              style={styles.backToLoginButton}
              disabled={loading}
            >
              <Text style={styles.backToLoginText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  loginContainer: {
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "400",
    color: "#333",
    letterSpacing: 2,
  },
  logosubtital: {
    fontSize: 22,
    fontWeight: "300",
    color: "#333",
    marginBottom: 20,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 40,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    color: "#9CA3AF",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    marginLeft: 5,
  },
  eyeIcon: {
    padding: 4,
  },
  eyeIconText: {
    fontSize: 18,
    color: "#9CA3AF",
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  rememberText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signInButton: {
    backgroundColor: "#142440",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signInButtonTextVerify: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    width: 100,
    textAlign: "center",
  },
  // Error Styles
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: "100%",
    maxWidth: 400,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  fieldErrorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  // OTP Screen Styles
  otpScreenContainer: {
    alignItems: "center",
    width: "100%",
  },
  attemptsContainer: {
    marginVertical: 16,
  },
  attemptsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 32,
    gap: 12,
  },
  otpInput: {
    width: 56,
    height: 64,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    color: "#1F2937",
  },
  otpInputError: {
    borderColor: "#EF4444",
  },
  otpInputFilled: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F9FF",
  },
  backToLoginButton: {
    marginTop: 24,
    alignItems: "center",
    padding: 12,
  },
  backToLoginText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "500",
  },
});

export default LoginScreen;
