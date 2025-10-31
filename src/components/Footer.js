import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, InteractionManager } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icons from '../../env/icons';
import { useSelector } from "react-redux";

const Footer = () => {
  const navigation = useNavigation();
  const [activeButton, setActiveButton] = useState('HomeScreen');
  const configData = useSelector((state) => state.usersSlice.config || {}); 

  useFocusEffect(
    useCallback(() => {
      try {
        const state = navigation.getState();
        if (state && state.routes && state.index >= 0) {
          const currentRouteName = state.routes[state.index].name;
          setActiveButton(currentRouteName);
        }
      } catch (error) {
        console.log("Navigation state error:", error);
      }
    }, [navigation])
  );

const handlePress = (navigateTo) => {
  let destination = navigateTo;

  if (navigateTo === 'BotCategory') {
    const botLevel = configData[0]?.bot_level;
    if (botLevel === 1) {
      destination = 'DataScreen';
    } else if (botLevel === 2) {
      destination = 'BotCategory';
    }
  }

  setActiveButton(destination);
  InteractionManager.runAfterInteractions(() => {
    if (destination !== activeButton) {
      navigation.navigate(destination);
    }
  });
};

  const FooterButton = ({ title, iconName, navigateTo }) => {
    const isActive = activeButton === navigateTo 
    || (activeButton === 'DocumentScreen' && navigateTo=== 'DocumentCategory' ) 
    || (activeButton === 'DataSetsScreen' && navigateTo=== 'DataSetCategory' ) 
    || (activeButton === 'DataScreen' && navigateTo=== 'BotCategory' );

    return (
      <TouchableOpacity
        activeOpacity={0.5}
        style={[styles.button, isActive && styles.activeButton]}
        onPress={() => handlePress(navigateTo)}
      >
        <View style={styles.iconContainer}>
          <Image source={iconName} style={[styles.icon, { tintColor: isActive ? '#ffcc00' : '#fff' }]} />
        </View>
        <Text style={[styles.buttonText, isActive && styles.activeText]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.footer}>
      <View style={styles.buttonContainer}>
        <FooterButton title="Home" iconName={Icons.Icon15} navigateTo="HomeScreen" />
        <FooterButton title="Bot" iconName={Icons.Icon14} navigateTo="BotCategory" />
        <FooterButton title="Documents" iconName={Icons.Icon16} navigateTo="DocumentCategory" />
        <FooterButton title="Data Sets" iconName={Icons.Icon20} navigateTo="DataSetCategory" />
        <FooterButton title="Dashboard" iconName={Icons.Icon17} navigateTo="DashboardScreen" />
        <FooterButton title="Saved Query" iconName={Icons.Icon18} navigateTo="IndicatorScreen" />
        <FooterButton title="Bulk Search" iconName={Icons.Icon21} navigateTo="BulkSearchScreen" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#174054',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingBottom: 10,
    borderTopColor: '#ffffff',
    elevation: 4,
    paddingTop: 11
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    padding: 12
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeButton: {
    backgroundColor: '#112d3a', 
    borderRadius: 10, 
    padding: 5
  },
  buttonText: {
    color: '#fff',
    fontSize: 8,
    marginTop: 5,
  },
  activeText: {
    fontWeight: 'bold',
    color: '#ffcc00', // Highlight active button text
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});

export default Footer;
