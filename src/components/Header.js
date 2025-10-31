import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Appbar } from "react-native-paper";
import Icons from "../../env/icons";
import Icon from "react-native-vector-icons/FontAwesome";
import { clearDataSetsDetails } from "../reducers/dataSets.slice";
import { clearIndicatorsDetails } from "../reducers/indicators.Slice";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import AuthHooks from "../Hooks/AuthHooks";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const Header = ({ showBackButton = false }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { fetchConfig } = AuthHooks();
  const configData = useSelector((state) => state.usersSlice.config || []);
  const botLevel = configData[0]?.bot_level;
  const shouldShowBackButton = showBackButton && botLevel === 1;

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleBackPress = () => {
    dispatch(clearDataSetsDetails());
    dispatch(clearIndicatorsDetails());
    navigation.goBack();
  };

  return (
    <>
      <StatusBar
        backgroundColor="#142440"
        barStyle="light-content"
        translucent={false}
      />
      <Appbar.Header style={styles.header}>
        <View style={styles.leftContainer}>
          {shouldShowBackButton && (
            <Appbar.Action
              icon={Icons.Icon13}
              onPress={handleBackPress}
              color="#ffffff"
              size={36}
              style={styles.iconStyle}
            />
          )}
          <View style={{ flexDirection: "column" }}>
            <Text style={styles.logoText}>IFFCO AI</Text>
            <Text style={styles.logoTextsmall}>
              Gy
              <Text style={styles.logoTextsmall}>a</Text>n Hub
            </Text>
          </View>
        </View>

        <Appbar.Content title="" />
        <View style={styles.rightContainer}>
          {/* <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('NotificationScreen')}
          >
            <Icon name="bell" size={22} color="#fff" />
          </TouchableOpacity> */}
          <Appbar.Action
            icon={Icons.Icon12}
            onPress={() => navigation.navigate("Profile")}
            color="#ffffff"
          />
        </View>
      </Appbar.Header>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    justifyContent: "space-between",
    backgroundColor: "#142440",
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff",
    height: 45,
    paddingVertical: 5,
    paddingHorizontal: 10,
    elevation: 4,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  logoTextsmall: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  logoAccent: {
    color: "#007BFF",
    fontSize: 24,
    fontWeight: "500",
  },
  iconStyle: {
    marginTop: 15,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 1,
  },
});

export default Header;
