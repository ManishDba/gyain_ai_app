import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import Footer from './Footer';
import Header from './Header';
import DataScreen from '../screens/DataScreen';

const MainLayout = ({ children, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const isDataScreen = children?.type === DataScreen;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
    await onRefresh?.();
  }, [onRefresh]);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#174054" />
      <View style={styles.container}>
        <Header showBackButton={isDataScreen} />
        <View style={styles.content}>
          {React.isValidElement(children) && children.props?.onRefresh ? (
            React.cloneElement(children, {
              refreshing,
              onRefresh: handleRefresh,
            })
          ) : (
            children
          )}
        </View>
        {/* <Footer /> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // Match your app background
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;
