import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Keyboard,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import AuthHooks from "../Hooks/AuthHooks";
import useProfileHooks from "../Hooks/ProfileHooks";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Iconchat from "react-native-vector-icons/Entypo";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 30; // Adjusted for list view with padding

const BotCategory = () => {
  const navigation = useNavigation();
  const { fetchConfig } = AuthHooks();
  const { fetchProfile } = useProfileHooks();
  const searchInputRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [categoryStack, setCategoryStack] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchText, setSearchText] = useState("");

  const correspondents = useSelector(
    (state) => state.askSlice.Category?.results || []
  );

  const rootCategories = useMemo(() => {
    const mbotItem = correspondents.find((item) =>
      item.name.toLowerCase().includes("mbot")
    );
    if (mbotItem === -1) {
      throw Error("Item not found");
    }
    return correspondents
      .filter((item) => item.division === mbotItem.id && item.visible !== false)
      .sort((a, b) => a.sequence - b.sequence);
  }, [correspondents]);

  const displayData = useMemo(() => {
    const baseData = categoryStack.length > 0 ? filteredItems : rootCategories;

    if (searchText.trim()) {
      return baseData.filter(
        (item) =>
          item.display?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return baseData;
  }, [categoryStack.length, filteredItems, rootCategories, searchText]);

  useEffect(() => {
    fetchConfig();
    fetchProfile();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  const normalize = (text) => text?.toLowerCase().trim().replace(/\s+/g, "-");

  const handleCategoryPress = useCallback(
    (item) => {
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      navigation.navigate("DataScreen", { Cat_name: item.id || 0 });
    },
    [navigation]
  );

  const clearSearch = useCallback(() => {
    setSearchText("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              <Iconchat name="chat" size={22} color="#000" /> {item.display}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleCategoryPress]
  );

  const handleBackPress = useCallback(() => {
    const newStack = categoryStack.slice(0, categoryStack.length - 1);
    setCategoryStack(newStack);

    if (newStack.length === 0) {
      setFilteredItems([]);
    } else {
      const lastItem = newStack[newStack.length - 1];
      const matched = correspondents.filter(
        (subItem) => normalize(subItem.division) === normalize(lastItem.name)
      );
      setFilteredItems(matched);
    }
  }, [categoryStack, correspondents]);

  const keyExtractor = useCallback(
    (item, index) => `${item.id || index}-${item.name || index}`,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

  const SearchBar = useMemo(
    () => (
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={22} color="#000" />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search bots..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearchChange}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          blurOnSubmit={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>
              <Icon name="close" size={22} color="#000" />
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [searchText, handleSearchChange, clearSearch]
  );

  const Breadcrumb = useMemo(() => {
    if (categoryStack.length === 0) return null;

    return (
      <View style={styles.breadcrumbContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbText}>
          {categoryStack.map((cat) => cat.display).join(" / ")}
        </Text>
      </View>
    );
  }, [categoryStack, handleBackPress]);

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>Select the Master Bot</Text>
        {/* {SearchBar} */}
        {Breadcrumb}
      </View>
    ),
    [SearchBar, Breadcrumb]
  );

  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {searchText ? "No bots found" : ""}
        </Text>
        <Text style={styles.emptyText}>
          {searchText
            ? `No bots match "${searchText}". Try a different search term.`
            : ""}
        </Text>
      </View>
    ),
    [searchText, clearSearch]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={displayData}
        keyExtractor={keyExtractor}
        numColumns={1}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        windowSize={10}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={null}
        ListEmptyComponent={EmptyComponent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  headerContainer: {
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "start",
    marginBottom: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
    marginLeft: 10,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "bold",
  },
  breadcrumbContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  backButton: {
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#007bff",
  },
  backButtonText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#fff",
  },
  breadcrumbText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flexShrink: 1,
  },
  separator: {
    height: 15,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#f1f3f4" /* Light gray background from image */,
    borderRadius: 16,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#072c70",
    overflow: "hidden",
  },
  cardContent: {
    padding: 10,
    minHeight: 55,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "500",
    color: "#1a1a1a",
    textAlign: "left",
    marginBottom: 5,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
});

export default BotCategory;
