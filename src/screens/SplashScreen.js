import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, StatusBar, Animated, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { restoreAuthState } from '../reducers/auth.slice';
import { CommonActions } from "@react-navigation/native";
import AuthHooks from "../Hooks/AuthHooks";
 
const SplashScreen = ({ navigation }) => {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const dispatch = useDispatch();
  const {fetchConfig}=AuthHooks()
 
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
 
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          dispatch(restoreAuthState({ token }));
          const config = await fetchConfig();
          const botLevel = Number(config?.[0]?.bot_level);
          const destination = botLevel === 1 ? "BotCategory" : "DataScreen";
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: destination }],
            })
          );
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        }
      } catch (err) {
        console.log("❌ Error in checkAuth:", err);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
      }
    };
    
    
 
    // wait splash animation, then check auth
    const timer = setTimeout(() => {
      setShowSplash(false);
      checkAuth();
    }, 3000);
 
    return () => clearTimeout(timer);
  }, [fadeAnim, translateYAnim, dispatch, navigation]);
 
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#142440" />
      {showSplash ? (
        <View style={styles.splashContainer}>
          <Animated.Text
            style={[
              styles.splashText,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            Welcome to IFFCO AI Gyan Hub
          </Animated.Text>
        </View>
      ) : (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#142440" />
        </View>
      )}
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: { flex: 1 },
  splashContainer: {
    flex: 1,
    backgroundColor: "#142440",
    justifyContent: "center",
    alignItems: "center",
  },
  splashText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
 
export default SplashScreen;