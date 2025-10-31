import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useProfileHooks from "../Hooks/ProfileHooks"; 
import { removeUserAuthCred } from "../reducers/auth.slice"; 
 
const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { fetchProfile } = useProfileHooks();
 
  const userdetails = useSelector(
    (state) => state.authSlice.userDetails || {}
  );
 
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };
 
  useEffect(() => {
    fetchProfile();
  }, []);
 
  const handleLogout = async () => {
    try {
      dispatch(removeUserAuthCred());
      await AsyncStorage.removeItem("auth_token");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    } catch (err) {
      console.log("❌ Logout error:", err);
    }
  };
 
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Icon name="account-circle" size={80} color="#142440" />
        <Text style={styles.title}>Profile Details</Text>
      </View>
 
      {/* Profile Fields */}
      <View style={styles.detailRow}>
        <Icon name="account" size={24} color="#142440" style={styles.icon} />
        <Text style={styles.label}>First Name:</Text>
        <Text style={styles.value}>{userdetails.first_name}</Text>
      </View>
      <View style={styles.detailRow}>
        <Icon
          name="account-outline"
          size={24}
          color="#142440"
          style={styles.icon}
        />
        <Text style={styles.label}>Last Name:</Text>
        <Text style={styles.value}>{userdetails.last_name}</Text>
      </View>
      <View style={styles.detailRow}>
        <Icon name="email" size={24} color="#142440" style={styles.icon} />
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userdetails.email}</Text>
      </View>
      <View style={styles.detailRow}>
        <Icon name="lock" size={24} color="#142440" style={styles.icon} />
        <Text style={styles.label}>Password:</Text>
        <Text style={styles.value}>********</Text>
      </View>
 
      {/* Buttons */}
      <View style={styles.buttonGroup}>
        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
 
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  profileHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "400",
    color: "#333",
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "400",
    color: "#888",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: "#333",
    flex: 2,
  },
  buttonGroup: {
    marginTop: 30,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 5,
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: "#142440",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#fff",
    textAlign: "center",
  },
});
 
export default ProfileScreen;