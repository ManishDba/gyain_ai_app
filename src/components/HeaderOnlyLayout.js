import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Header from './Header';

const HeaderOnlyLayout = ({ children, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
    await onRefresh?.();
  }, [onRefresh]);

  return (
    <View style={styles.container}>
      <Header showBackButton={true} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 2,
  },
});

export default HeaderOnlyLayout;
