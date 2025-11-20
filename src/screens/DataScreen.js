import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  useColorScheme,
  Modal,
  Linking,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "../../env/icons";
import RenderHtml from "react-native-render-html";
import UseBotScreenHooks from "../Hooks/UseBotScreenHooks";
import CustomHtmlTable from "../components/tablehtml";
import DynamicChart from "../components/botchart/DynamicChart";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";
import UseDataScreenHooks from "../Hooks/UseDataScreenHooks";
import { useNavigation } from "@react-navigation/native";
import { exportToExcelAndOpen } from '../components/ExportToExcel';
import { ENV } from "../../env";

export const isValidNumber = (value) => {
  // Handle null, undefined, empty string, or non-string/non-number types
  if (
    value == null ||
    value === "" ||
    (typeof value !== "number" && typeof value !== "string")
  ) {
    return false;
  }

  // If value is a number, check for NaN or Infinity
  if (typeof value === "number") {
    return Number.isFinite(value); // Excludes NaN, Infinity, -Infinity
  }

  // Handle string input
  // Remove common number formatting (e.g., commas for Indian locale, spaces)
  const cleanedValue = value
    .toString()
    .trim()
    .replace(/,/g, "") // Remove commas (e.g., "1,23,456.78" -> "123456.78")
    .replace(/\s/g, ""); // Remove spaces (e.g., "1 234" -> "1234")

  // Check if the cleaned string is a valid number format
  // Allows: "123", "-123", "123.45", "-123.45", etc.
  if (!/^[-+]?(\d*\.?\d+)$/.test(cleanedValue)) {
    return false;
  }

  // Convert to number and check if it's finite
  const parsedNumber = parseFloat(cleanedValue);
  return Number.isFinite(parsedNumber);
};

// Full-screen zoom container that wraps the entire content area
// Full-screen zoom container (2x max zoom, no zoom-out, pannable)
const FullScreenZoomableContainer = ({ children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const [isZooming, setIsZooming] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const resetTimeout = useRef(null);

  // Reset both scale + position
  const resetToOriginal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsZooming(false);
      setCurrentScale(1);
      setShowZoomIndicator(false);
    });
  };

  // Restart 3s timer
  const startResetTimer = () => {
    if (resetTimeout.current) clearTimeout(resetTimeout.current);
    resetTimeout.current = setTimeout(() => {
      resetToOriginal();
    }, 1500);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return (
        evt.nativeEvent.touches.length === 2 ||
        (isZooming &&
          (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5))
      );
    },
    onPanResponderGrant: (evt) => {
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
      if (evt.nativeEvent.touches.length === 2) {
        setIsZooming(true);
        setShowZoomIndicator(true);
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (evt.nativeEvent.touches.length === 2) {
        // Pinch zoom
        const touches = evt.nativeEvent.touches;
        const distance = Math.sqrt(
          Math.pow(touches[0].pageX - touches[1].pageX, 2) +
            Math.pow(touches[0].pageY - touches[1].pageY, 2)
        );
        const newScale = Math.min(Math.max(distance / 150, 1), 2);
        scaleAnim.setValue(newScale);
        setCurrentScale(newScale);
      } else if (isZooming && evt.nativeEvent.touches.length === 1) {
        // Pan
        translateXAnim.setValue(gestureState.dx * 0.8);
        translateYAnim.setValue(gestureState.dy * 0.8);
      }
    },
    onPanResponderRelease: () => {
      // Start reset countdown after user interaction ends
      startResetTimer();
    },
    onPanResponderTerminate: () => {
      startResetTimer();
    },
  });

  useEffect(() => {
    return () => {
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
    };
  }, []);

  return (
    <View style={styles.fullScreenZoomContainer} {...panResponder.panHandlers}>
      {showZoomIndicator && (
        <View style={styles.zoomIndicatorContainer}>
          <Text style={styles.zoomIndicator}>{currentScale.toFixed(1)}x</Text>
        </View>
      )}
      <Animated.View
        style={[
          styles.zoomableContent,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: translateXAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const DataScreen = ({ route }) => {
  const {
    messages,
    inputText,
    setInputText,
    filteredSlugs,
    currentPage,
    setCurrentPage,
    currentActiveSlug,
    refreshing,
    isRecording,
    sttStatus,
    partialText,
    pulseAnim,
    flatListRef,
    paginationState,
    isSpeaking,
    isPaused,
    filtersByTable,
    activeFilterColumnsByTable,
    lastTapRef,
    selectedKeyItems,
    periodTextsByTable,
    setSelectedKeyItems,
    toggleFilterInput,
    handleFilterChange,
    applyFilters,
    isGenerating,
    speak,
    pause,
    resume,
    stop,
    setPaginationState,
    handleRefresh,
    toggleRecording,
    sendMessage,
    handleSlugPress,
    renderPaginationControls,
    calculateColumnWidths,
    generateFooterRowWithInference,
    isOnlyTotalNonEmpty,
    handleUserMessageDoubleTap,
    formatCellValue,
    loadingDots,
  } = UseBotScreenHooks({ route });
  const { fetchCorrespondents } = UseDataScreenHooks();
  const navigation = useNavigation();

  const categoryId = route?.params?.Cat_name;

  // New state for key items modal and selection
  const [sortStateByTable, setSortStateByTable] = useState({});
  const [showKeyItemsModal, setShowKeyItemsModal] = useState(false);
  const [selectedKeyItemCategory, setSelectedKeyItemCategory] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAllSlugs, setShowAllSlugs] = useState(false);
  const correspondents = useSelector(
    (state) => state.askSlice.Category?.results || []
  );
  const configData = useSelector((state) => state.usersSlice.config || {});


  const allSlugs = [
    ...filteredSlugs,
    { id: 4383, name: "clear", display: "Clear All" },
  ];

  // Active slug (if any)
  const activeSlug = currentActiveSlug
    ? allSlugs.find((s) => s.id === currentActiveSlug.id)
    : null;

  // Other slugs (excluding active)
  const otherSlugs = activeSlug
    ? allSlugs.filter((s) => s.id !== activeSlug.id)
    : allSlugs;

  const displaySlugs = allSlugs.filter(
    (slug) => slug.display !== "Clear" && slug.display !== "Clear All"
  );

  useEffect(() => {
    fetchCorrespondents();
  }, []);

  // Function to parse key_items JSON string
  const parseKeyItems = (keyItemsString) => {
    try {
      return JSON.parse(keyItemsString);
    } catch (error) {
      console.error("Error parsing key_items:", error);
      return null;
    }
  };

  // Function to get matched category and its key items
  const getMatchedCategoryKeyItems = (item) => {
    const matchedCategory = correspondents.find((cat) => cat.id === item.id);
    if (matchedCategory && matchedCategory.key_items) {
      return parseKeyItems(matchedCategory.key_items);
    }
    return null;
  };

  // Function to handle key item category click (opens bottom sheet)
  const handleKeyItemCategoryPress = (categoryName, options) => {
    setSelectedKeyItemCategory({ name: categoryName, options });
    setShowKeyItemsModal(true);
  };
  // Function to handle key item option selection
  const handleKeyItemSelection = (categoryName, option) => {
    setSelectedKeyItems((prev) => ({
      ...prev, // keep previous selections
      [categoryName]: option, // update only the selected category
    }));
    setShowKeyItemsModal(false);
  };

  // Render key items filter buttons
  const renderKeyItemsRow = (item) => {
    const keyItems = getMatchedCategoryKeyItems(item);

    if (!keyItems) return null;

    return (
      <View style={styles.keyItemsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.keyItemsRow}>
            {Object.entries(keyItems).map(([categoryName, options]) => (
              <TouchableOpacity
                key={categoryName}
                style={[
                  styles.keyItemButton,
                  selectedKeyItems[categoryName] &&
                    styles.selectedKeyItemButton,
                ]}
                onPress={() =>
                  handleKeyItemCategoryPress(categoryName, options)
                }
              >
                <Text
                  style={[
                    styles.keyItemButtonText,
                    selectedKeyItems[categoryName] &&
                      styles.selectedKeyItemButtonText,
                  ]}
                >
                  {categoryName}
                  {selectedKeyItems[categoryName] &&
                    `: ${selectedKeyItems[categoryName]}`}
                </Text>
                <Icon
                  name="chevron-down"
                  size={16}
                  color={selectedKeyItems[categoryName] ? "#fff" : "#174054"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderSlug = ({ item }) => {
    const isClear = item.display === "Clear" || item.display === "Clear All";
    const isSelected = item.display === currentActiveSlug?.display;

    return (
      <TouchableOpacity
        style={[
          isClear ? styles.clearslug : styles.slugButton,
          isSelected && !isClear ? styles.selectedSlug : null,
        ]}
        onPress={() => handleSlugPress(item)}
      >
        <Text
          style={[
            isClear ? styles.clearslugText : styles.slugText,
            isSelected && !isClear ? styles.selectedSlugText : null,
          ]}
        >
          {item.display}
        </Text>
      </TouchableOpacity>
    );
  };

  // Bottom sheet modal for key item options
  const renderKeyItemsModal = () => {
    if (!selectedKeyItemCategory) return null;

    return (
      <Modal
        visible={showKeyItemsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowKeyItemsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectedKeyItemCategory.name}
              </Text>
              <TouchableOpacity
                onPress={() => setShowKeyItemsModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#174054" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalOptionsContainer}>
              {selectedKeyItemCategory.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    selectedKeyItems[selectedKeyItemCategory.name] === option &&
                      styles.selectedModalOption,
                  ]}
                  onPress={() =>
                    handleKeyItemSelection(selectedKeyItemCategory.name, option)
                  }
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedKeyItems[selectedKeyItemCategory.name] ===
                        option && styles.selectedModalOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                  {selectedKeyItems[selectedKeyItemCategory.name] ===
                    option && <Icon name="check" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const parseCssFromHtml = (html) => {
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (!styleMatch) {
      return {};
    }

    const rawCss = styleMatch[1];
    const tagsStyles = {};

    const rules = rawCss
      .split("}")
      .map((r) => r.trim())
      .filter(Boolean);

    rules.forEach((rule) => {
      const [selectorPart, bodyPart] = rule.split("{");
      if (!selectorPart || !bodyPart) return;

      const selector = selectorPart.trim();
      const body = bodyPart.trim();

      const styleObj = {};
      body.split(";").forEach((s) => {
        const [prop, value] = s.split(":").map((str) => str.trim());
        if (!prop || !value) return;

        const rnProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        let rnValue = value;
        if (/^\d+$/.test(value)) rnValue = parseInt(value, 10);
        if (/^\d+px$/.test(value))
          rnValue = parseInt(value.replace("px", ""), 10);
        if (rnProp === "marginLeft") {
          styleObj.paddingLeft = rnValue;
        } else {
          styleObj[rnProp] = rnValue;
        }
      });

      if (selector === "ul" || selector === "ol" || selector === "li") {
        tagsStyles[selector] = { ...tagsStyles[selector], ...styleObj };
      } else if (selector === "ul ul") {
        tagsStyles["ul"] = { ...tagsStyles["ul"], ...styleObj };
      } else if (selector === "li strong") {
        tagsStyles["strong"] = { ...tagsStyles["strong"], ...styleObj };
      }
    });
    return tagsStyles;
  };

  const customRenderers = {
    ul: ({ TDefaultRenderer, ...props }) => {
      const isNested = props.tnode.parent?.tagName === "ul";
      return (
        <TDefaultRenderer
          {...props}
          style={{
            ...props.style,
            paddingLeft: 20,
            marginVertical: 8,
            listStyleType: isNested ? "circle" : "disc",
          }}
        />
      );
    },
    p: ({ TDefaultRenderer, ...props }) => {
      const text = props.tnode.domNode.children[0]?.data || "";
      const isBullet = text.startsWith("•");
      return (
        <TDefaultRenderer
          {...props}
          style={{
            ...props.style,
            paddingLeft: isBullet ? 20 : 0,
            flexDirection: "row",
            flexWrap: "wrap",
          }}
          renderersProps={{
            ...props.renderersProps,
            text: {
              ...props.renderersProps?.text,
              onPress: isBullet
                ? () => {}
                : props.renderersProps?.text?.onPress,
            },
          }}
        />
      );
    },
  };

  const addBreaksAfterLinks = (html) => {
    html = html.replace(/<a /i, "<br/><br/><a ");
    html = html.replace(/<\/a>(?!\s*<br\s*\/?>)/gi, "</a><br/><br/>");
    return html;
  };

  const renderChat = ({ item, index }) => {
    const { type = "", text = "", data = {}, sender = "system" } = item;

    switch (type) {
      case "loading":
        return (
          <View
            style={{
              alignSelf: "flex-start",
              maxWidth: "95%",
              marginVertical: 4,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#e2e3e5",
            }}
          >
            <Text
              style={{
                fontFamily: "Helvetica",
                color: "black",
                fontStyle: "italic",
                fontSize: 15,
              }}
            >
              Generating{loadingDots}
            </Text>
          </View>
        );
      case "greeting": {
        const texts = text.split("~");
        return (
          <View
            style={{
              alignSelf: sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "95%",
              marginVertical: 4,
              padding: 12,
              borderRadius: 12,
              backgroundColor: sender === "user" ? "#007bff" : "#e2e3e5",
            }}
          >
            <Text
              style={{
                fontFamily: sender === "user" ? "Arial" : "Helvetica",
                color: sender === "user" ? "white" : "black",
                fontSize: 16,
              }}
            >
              {texts[0]}
              <Text style={{ fontWeight: "bold" }}>{texts[1]}</Text>
              {texts[2]}
            </Text>
          </View>
        );
      }

      case "text": {
        const cleanText = ((text?.display || text || "") + "")
          .trim()
          .toLowerCase();
        const isSystemHtmlText =
          sender !== "user" &&
          cleanText !== "" &&
          cleanText !== "<html><body></body></html>" &&
          cleanText !== "<p></p>";
        const shouldHideVoice = item?.hideVoice;

        const dynamicTagsStyles = parseCssFromHtml(text);
        return (
          <Pressable
            onPress={() =>
              handleUserMessageDoubleTap(sender, text, setInputText)
            }
          >
            <View
              style={{
                alignSelf: sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "95%",
                marginVertical: 4,
                padding: 12,
                borderRadius: 12,
                backgroundColor: sender === "user" ? "#007bff" : "#e2e3e5",
              }}
            >
              {isSystemHtmlText && !shouldHideVoice && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 8,
                    justifyContent: "flex-end",
                  }}
                />
              )}
              <RenderHtml
                contentWidth={Dimensions.get("window").width}
                source={{ html: addBreaksAfterLinks(text || "<p></p>") }}
                baseStyle={{
                  fontFamily: sender === "user" ? "Arial" : "Helvetica",
                  color: sender === "user" ? "white" : "black",
                  fontSize: 16,
                }}
                tagsStyles={{
                  h1: { fontWeight: "bold", fontSize: 24, marginBottom: 12 },
                  h2: {
                    fontWeight: "bold",
                    fontSize: 22,
                    marginTop: 16,
                    marginBottom: 10,
                  },
                  h3: {
                    fontWeight: "bold",
                    fontSize: 20,
                    marginTop: 14,
                    marginBottom: 8,
                  },
                  h4: {
                    fontWeight: "bold",
                    fontSize: 18,
                    marginTop: 12,
                    marginBottom: 6,
                  },
                  h5: {
                    color: "black",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginTop: 10,
                    marginBottom: 4,
                  },
                  h6: {
                    color: "black",
                    fontSize: 14,
                    fontWeight: "bold",
                    marginTop: 10,
                    marginBottom: 4,
                  },
                  p: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
                  strong: { color: "black", fontWeight: "bold" },
                  li: {
                    color: "#444",
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 6,
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                  },
                  ul: { marginVertical: 8, paddingLeft: 20 },
                  ol: {
                    marginVertical: 8,
                    paddingLeft: 20,
                    listStyleType: "decimal",
                  },
                  a: {
                    color: "blue",
                    textDecorationLine: "underline",
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 10,
                  },
                  br: { marginVertical: 6 },
                  ...dynamicTagsStyles,
                }}
                renderers={customRenderers}
                renderersProps={{
                  a: {
                    onPress: async (_, href) => {
                      console.log("Original href:", href);

                      let cleanHref = href.trim();
                      cleanHref = cleanHref.replace(/^about:\/\//, "");
                      cleanHref = cleanHref.replace(/^file:\/\//, "");

                      let finalUrl = cleanHref;
                      if (!cleanHref.startsWith("http")) {
                        finalUrl = `${ENV.PDF_URL}/${cleanHref.replace(
                          /^\/+/,
                          ""
                        )}`;
                        finalUrl = finalUrl.replace(/([^:])\/+/g, "$1/");
                      }

                      console.log(
                        "Navigating to PdfViewerScreen with URL:",
                        finalUrl
                      );

                      navigation.navigate("PdfViewerScreen", {
                        url: finalUrl,
                      });
                    },
                  },
                }}
              />
            </View>
          </Pressable>
        );
      }

      case "html_structured": {
        const { heading, tableData, footerHeading, notes, paragraph } =
          data || {};
        const hasTable = tableData?.Rows?.length > 0;

        return (
          <View style={{ marginVertical: 8 }}>
            {hasTable && (
              <View style={{ marginBottom: 8 }}>
                <CustomHtmlTable
                  heading={heading}
                  tableData={tableData}
                  footerHeading={footerHeading}
                  bulletPoints={notes}
                  paragraph={paragraph}
                />
              </View>
            )}
          </View>
        );
      }

      case "action":
        return (
          <View
            style={{
              alignSelf: sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              marginVertical: 4,
              padding: 12,
              borderRadius: 12,
              backgroundColor: sender === "user" ? "#007bff" : "#e2e3e5",
            }}
          >
            <RenderHtml
              contentWidth={Dimensions.get("window").width}
              source={{ html: data.text || "<p></p>" }}
              baseStyle={{
                fontFamily: sender === "user" ? "Arial" : "Helvetica",
                color: sender === "user" ? "white" : "black",
                fontSize: 16,
              }}
            />
          </View>
        );

      case "tab":
          const totalColumns = data?.Columns?.length || 0;
          const isTooLarge = totalColumns > 10; // skip table if more than 10 columns
        const totalRow =data?.Rows?.length || 0
          // Only format table data if ≤10 columns
          const formattedData = !isTooLarge
            ? {
                ...data,
                Rows: data?.Rows?.map((row) =>
                  row.slice(0, 10).map((cell, i) => {
                    const col = data?.Columns[i] || {};
                    return formatCellValue(cell, col.Name, col.Type);
                  })
                ),
              }
            : null;

            const formattedDataForExport = {
    ...data,
    Rows: data.Rows.map((row) =>
      row.map((cell, i) => {
        const col = data.Columns[i] || {};
        return formatCellValue(cell, col.Name, col.Type);
      })
    ),
  };
        
          // Use the original tableKey from item.data
          const tableKey = item.data?.tableKey;
        
          return (
            <View>
              {isTooLarge ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "95%",
                    marginVertical: 4,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#e2e3e5",
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#000", marginBottom: 10 }}>
                  Displaying {totalRow > totalColumns ? totalRow+` rows` :totalColumns+ ` columns`} exceeds the limit. Click View All to see the full table.       
                  </Text>
      
                    <TouchableOpacity
                    onPress={() => exportToExcelAndOpen(formattedDataForExport)}
                    style={[styles.downloadButton, { backgroundColor: "#217346" }]}
                  >
                    <Text style={[styles.downloadButtonText, { color: "#fff" }]}>
                    View in Excel             
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Table rendering with the same tableKey */}
                  {renderTable(formattedData, tableKey)}
        
                  {/* Chart rendering */}
                  {data?.Rows?.length > 0 && totalColumns > 1 && (
                    <DynamicChart data={formattedData} />
                  )}
                </>
              )}
            </View>
          );        
 
 

      default:
        return (
          <Text
            style={{
              fontFamily: "Helvetica",
              color: "black",
              fontSize: 14,
              padding: 8,
            }}
          >
            {JSON.stringify(item)}
          </Text>
        );
    }
  };

const renderTable = (data, tableKey) => {
    const periodTextData =
      data?.periodText || periodTextsByTable[tableKey] || "";
 
    const periodText = Array.isArray(periodTextData)
      ? periodTextData.join(", ")
      : typeof periodTextData === "object"
      ? JSON.stringify(periodTextData)
      : String(periodTextData || "");
 
    const columnWidths = calculateColumnWidths(data);
    const footerRow = generateFooterRowWithInference(data);
    const showFooter = !isOnlyTotalNonEmpty(footerRow);
 
    const totalRows = data?.Rows?.length || 0;
    const showPagination = totalRows > 7;
    const currentPage = paginationState[tableKey] || 1;
 
    // Filter rows based on all active filters
    const activeFilters = filtersByTable[tableKey] || {};
    const activeColumns = activeFilterColumnsByTable[tableKey] || [];
    const filteredRows = applyFilters(
      data?.Rows || [],
      data?.Columns || [],
      tableKey
    );
 
    // Get current sort state for this table
    const sortState = sortStateByTable[tableKey] || {
      column: null,
      direction: "asc",
    };
 
    // Sort filtered rows if a column is selected
    let sortedRows = [...filteredRows];
    if (sortState.column !== null) {
      sortedRows.sort((a, b) => {
        let aVal = a[sortState.column];
        let bVal = b[sortState.column];
 
        // Handle null/undefined/empty values
        if (
          aVal === null ||
          aVal === undefined ||
          aVal === "" ||
          aVal === "Unknown"
        )
          return 1;
        if (
          bVal === null ||
          bVal === undefined ||
          bVal === "" ||
          bVal === "Unknown"
        )
          return -1;
 
        // Convert to number if it's a valid number
        let aNum = null;
        let bNum = null;
 
        // Check if value is already a number
        if (typeof aVal === "number") {
          aNum = aVal;
        } else if (typeof aVal === "string") {
          // Remove commas and try to parse
          const cleanA = aVal.replace(/,/g, "");
          if (!isNaN(cleanA) && cleanA.trim() !== "") {
            aNum = parseFloat(cleanA);
          }
        }
 
        if (typeof bVal === "number") {
          bNum = bVal;
        } else if (typeof bVal === "string") {
          // Remove commas and try to parse
          const cleanB = bVal.replace(/,/g, "");
          if (!isNaN(cleanB) && cleanB.trim() !== "") {
            bNum = parseFloat(cleanB);
          }
        }
 
        // If both are numbers, do numeric comparison
        if (aNum !== null && bNum !== null) {
          return sortState.direction === "asc" ? aNum - bNum : bNum - aNum;
        }
 
        // If one is number and other is not, number comes first
        if (aNum !== null && bNum === null)
          return sortState.direction === "asc" ? -1 : 1;
        if (aNum === null && bNum !== null)
          return sortState.direction === "asc" ? 1 : -1;
 
        // String comparison for non-numeric values
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
 
        if (sortState.direction === "asc") {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }
 
    let paginatedRows, totalPages, itemsPerPage;
 
    if (showPagination) {
      const paginationData = renderPaginationControls(sortedRows.length);
      totalPages = paginationData.totalPages;
      itemsPerPage = paginationData.itemsPerPage;
      const startIndex = (currentPage - 1) * itemsPerPage;
      paginatedRows = sortedRows.slice(startIndex, startIndex + itemsPerPage);
    } else {
      paginatedRows = sortedRows;
      totalPages = 1;
      itemsPerPage = sortedRows.length;
    }
 
    const handlePageChange = (newPage) => {
      setPaginationState((prev) => ({ ...prev, [tableKey]: newPage }));
    };
 
    const handleSort = (columnIndex) => {
      setSortStateByTable((prev) => {
        const currentSort = prev[tableKey] || { column: null, direction: null };
 
        if (currentSort.column === columnIndex) {
          // Same column - cycle through: asc -> desc -> remove
          if (currentSort.direction === "asc") {
            return {
              ...prev,
              [tableKey]: {
                column: columnIndex,
                direction: "desc",
              },
            };
          } else if (currentSort.direction === "desc") {
            // Remove sorting
            return {
              ...prev,
              [tableKey]: {
                column: null,
                direction: null,
              },
            };
          }
        }
 
        // New column or no sort - start with ascending
        return {
          ...prev,
          [tableKey]: {
            column: columnIndex,
            direction: "asc",
          },
        };
      });
      // Reset to first page when sorting changes
      handlePageChange(1);
    };
 
    const getSortIcon = (columnIndex) => {
      if (sortState.column !== columnIndex) {
        return null;
      }
      return sortState.direction === "asc" ? (
        <Icon name="arrow-up" size={16} color="#fff" />
      ) : (
        <Icon name="arrow-down" size={16} color="#fff" />
      );
    };
 
    const getTextAlignment = (value) => {
      if (value === null || value === undefined || value === "") return "right";
 
      if (typeof value === "number") return "right";
 
      const stringValue = String(value).replace(/,/g, "");
      if (!isNaN(stringValue) && !isNaN(parseFloat(stringValue)))
        return "right";
 
      return "left";
    };
 
    const formatHeaderName = (name) => {
      if (!name) return "";
      // Replace underscores with spaces and capitalize words
      return name
        .replace(/_/g, " ")
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };
 
    const wrapLongText = (text, maxLength = 30) => {
      if (!text) return "";
      const str = String(text);
      return str.replace(new RegExp(`(.{${maxLength}})`, "g"), "$1\n");
    };
    return (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: "98%" }}>
            <View style={styles.tableContainer}>
              {periodText && (
                <Text style={styles.hedingPeriod}>{periodText}</Text>
              )}{" "}
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                {data?.Columns?.map((c, index) => (
                  <View
                    key={index}
                    style={[
                      styles.headerCell,
                      styles.borderRight,
                      {
                        width: columnWidths[index] || 100,
                        flex: data?.Columns?.length <= 10 ? 1 : 0,
                        minWidth:
                          data?.Columns?.length <= 10
                            ? 0
                            : columnWidths[index] || 100,
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent:
                          getTextAlignment(c?.Name) === "right"
                            ? "flex-end"
                            : "flex-start",
                        gap: 2,
                        paddingHorizontal: 4,
                        paddingTop: 4,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleFilterInput(tableKey, c.Name)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {activeColumns.includes(c.Name) ? (
                          <Icon name="close" size={20} color="#fff" />
                        ) : (
                          <Icon name="magnify" size={20} color="#fff" />
                        )}
                      </TouchableOpacity>
 
                      {activeColumns.includes(c.Name) ? (
                        <TextInput
                          style={[
                            styles.filterInput,
                            { flex: 1, textAlign: getTextAlignment(c?.Name) },
                          ]}
                          placeholder={`Filter ${formatHeaderName(c.Name)}`}
                          value={activeFilters[c.Name] || ""}
                          onChangeText={(text) =>
                            handleFilterChange(
                              tableKey,
                              c.Name,
                              text,
                              handlePageChange
                            )
                          }
                          autoFocus
                          placeholderTextColor="#999"
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleSort(index)}
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent:
                              getTextAlignment(c?.Name) === "right"
                                ? "flex-end"
                                : "flex-start",
                            gap: 4,
                          }}
                        >
                          <Text
                            style={[
                              styles.tableHeader,
                              { textAlign: getTextAlignment(c?.Name) },
                            ]}
                          >
                            {wrapLongText(formatHeaderName(c.Name), 30)}
                          </Text>
                          {getSortIcon(index)}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              {paginatedRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                  {row.map((cell, cellIndex) => {
                    const columnName = data?.Columns?.[cellIndex]?.Name || "";
                    const columnType = data?.Columns?.[cellIndex]?.Type || "";
 
                    const displayValue = formatCellValue(
                      cell,
                      columnName,
                      columnType
                    );
                    const wrappedValue = wrapLongText(String(displayValue), 40);
 
                    const numericValue = isValidNumber(cell)
                      ? typeof cell === "number"
                        ? cell
                        : parseFloat(String(cell).replace(/,/g, ""))
                      : null;
 
                    return (
                      <View
                        key={cellIndex}
                        style={[
                          styles.cell,
                          styles.borderRight,
                          {
                            width: columnWidths[cellIndex] || 100,
                            flex: data?.Columns?.length <= 10 ? 1 : 0,
                            minWidth:
                              data?.Columns?.length <= 10
                                ? 0
                                : columnWidths[cellIndex] || 100,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableCell,
                            { textAlign: getTextAlignment(cell) },
                            numericValue !== null && numericValue < 0
                              ? { color: "red" }
                              : null,
                          ]}
                        >
                          {wrappedValue}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
              {showFooter && (
                <View style={[styles.tableRow, styles.tableFooterRow]}>
                  {footerRow.map((cell, cellIndex) => (
                    <View
                      key={cellIndex}
                      style={[
                        styles.footerCell,
                        styles.borderRight,
                        {
                          width: columnWidths[cellIndex] || 100,
                          flex: data?.Columns?.length <= 10 ? 1 : 0,
                          minWidth:
                            data?.Columns?.length <= 10
                              ? 0
                              : columnWidths[cellIndex] || 100,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableFooter,
                          { textAlign: getTextAlignment(cell) },
                          typeof cell === "number" && cell < 0
                            ? { color: "red" }
                            : null,
                        ]}
                        numberOfLines={3}
                      >
                        {typeof cell === "number"
                          ? Number.isInteger(cell)
                            ? cell
                            : cell.toFixed(2)
                          : cell ?? ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        {showPagination && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => handlePageChange(1)}
              disabled={currentPage === 1}
              style={[
                styles.pageButton,
                currentPage === 1 ? styles.disabledButton : null,
              ]}
            >
              <Text style={styles.pageButtonText}>««</Text>
            </TouchableOpacity>
 
            <TouchableOpacity
              onPress={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              style={[
                styles.pageButton,
                currentPage === 1 ? styles.disabledButton : null,
              ]}
            >
              <Text style={styles.pageButtonText}>«</Text>
            </TouchableOpacity>
 
            <Text style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </Text>
 
            <TouchableOpacity
              onPress={() =>
                handlePageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              style={[
                styles.pageButton,
                currentPage === totalPages ? styles.disabledButton : null,
              ]}
            >
              <Text style={styles.pageButtonText}>»</Text>
            </TouchableOpacity>
 
            <TouchableOpacity
              onPress={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              style={[
                styles.pageButton,
                currentPage === totalPages ? styles.disabledButton : null,
              ]}
            >
              <Text style={styles.pageButtonText}>»»</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const clearText = () => {
    setInputText("");
  };


useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener(
    'keyboardDidShow',
    (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    }
  );
  const keyboardDidHideListener = Keyboard.addListener(
    'keyboardDidHide',
    () => {
      setKeyboardHeight(0);
    }
  );

  return () => {
    keyboardDidShowListener.remove();
    keyboardDidHideListener.remove();
  };
}, []);

return (
  <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
    <View style={{ flex: 1 }}>
      {/* ==================== HEADER WITH SLUGS ==================== */}
      <View style={styles.header}>
        {allSlugs.length > 0 && (
          <>
            <View style={styles.firstRow}>
              {categoryId === 79 || categoryId === 29 ? (
                <>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1 }}>
                    {displaySlugs.slice(0, 1).map((item, index) => (
                      <View key={index}>{renderSlug({ item })}</View>
                    ))}
                  </View>

                  {displaySlugs.length > 0 &&
                    allSlugs.some((s) => s.display === "Clear All") && (
                      <View>
                        {renderSlug({
                          item: allSlugs.find((s) => s.display === "Clear All"),
                        })}
                      </View>
                    )}
                </>
              ) : (
                <>
                  {activeSlug && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1 }}>
                      {renderSlug({ item: activeSlug })}
                    </View>
                  )}

                  {activeSlug && (
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => setShowAllSlugs(!showAllSlugs)}
                    >
                      <Text style={styles.moreButtonText}>
                        {showAllSlugs ? "Less" : "More"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Remaining slugs */}
            {categoryId === 79 || categoryId === 29 ? (
              displaySlugs.length > 1 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {displaySlugs.slice(1).map((item, index) => (
                    <View key={index + 1}>{renderSlug({ item })}</View>
                  ))}
                </View>
              )
            ) : (
              showAllSlugs &&
              otherSlugs.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {otherSlugs.map((item, index) => (
                    <View key={index}>{renderSlug({ item })}</View>
                  ))}
                </View>
              )
            )}

            {/* Key Items Row */}
            {currentActiveSlug &&
              currentActiveSlug.id !== 4383 &&
              renderKeyItemsRow(currentActiveSlug)}
          </>
        )}
      </View>

      {/* ==================== ZOOMABLE CHAT AREA ==================== */}
      <FullScreenZoomableContainer>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item, index }) => (
            <View
              style={{
                marginBottom:
                  index === messages.length - 1
                    ? 130 // enough space for input bar
                    : 0,
              }}
            >
              {renderChat({ item })}
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messageList}
          contentContainerStyle={{
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 130,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="never"
          onContentSizeChange={() => {
            if (messages.length >= 2) {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: messages.length - 2,
                  animated: true,
                  viewPosition: 0,
                });
              }, 100);
            }
          }}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }, 100);
          }}
        />
      </FullScreenZoomableContainer>

      {/* ==================== INPUT BAR (FOOTER) ==================== */}
      <View style={[styles.footer, { bottom: keyboardHeight }]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            multiline
            placeholder={isRecording ? "Listening..." : "Enter your text here"}
            value={isRecording ? partialText || inputText : inputText}
            onChangeText={(text) => !isRecording && setInputText(text)}
            onSubmitEditing={() => {
              if (isGenerating) return;
              if (!currentActiveSlug?.id || currentActiveSlug?.display.includes("Clear")) {
                Alert.alert("Please select any one of the Bot's options to continue.");
                return;
              }
              sendMessage(isRecording ? partialText : inputText);
              setShowAllSlugs(false);
            }}
            editable={!isRecording}
            blurOnSubmit={false}
          />

          {inputText.length > 0 && (
            <TouchableOpacity onPress={clearText} style={styles.clearButton}>
              <Icon name="close" size={22} color="#000" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={toggleRecording}
            style={[
              styles.micButton,
              { backgroundColor: isRecording ? "#FF5733" : "#fff" },
            ]}
            disabled={sttStatus === "Audio config error"}
          >
            <Animated.View
              style={[
                styles.micImageContainer,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isRecording
                    ? "rgba(255, 87, 51, 0.3)"
                    : "transparent",
                },
              ]}
            >
              <Image source={Icons.Icon08} style={[styles.micImage, { tintColor: "#000" }]} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (isGenerating) return;
            if (!currentActiveSlug?.id || currentActiveSlug?.display.includes("Clear")) {
              Alert.alert("Please select any one of the Bot's options to continue.");
              return;
            }
            if (isRecording) toggleRecording();
            sendMessage(inputText);
            setShowAllSlugs(false);
          }}
          style={[
            styles.sendButton,
            (!inputText.trim() || isGenerating) && { opacity: 0.5 },
          ]}
          disabled={!inputText.trim() || isGenerating}
        >
          <Image source={Icons.Icon11} style={[styles.sendImage, { tintColor: "#fff" }]} />
        </TouchableOpacity>
      </View>
    </View>

    {/* Key Items Selection Modal */}
    {renderKeyItemsModal()}
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  header: {
    marginBottom: 1,
    zIndex: 10, // Keep header above zoomable content
  },
  messageList: {
    flexGrow: 1,
    marginBottom: 10,
  },
  // Full-screen zoom container styles
  fullScreenZoomContainer: {
    flex: 1,
    overflow: "hidden",
  },
  zoomableContent: {
    flex: 1,
  },
  zoomIndicatorContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoomIndicator: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tableFooterRow: {
    backgroundColor: "#6ccf0840",
  },
  footerCell: {
    padding: 10,
    backgroundColor: "#6ccf0840",
    color: "#000",
    fontWeight: "bold",
  },
  tableFooter: {
    textAlign: "center",
    flexWrap: "wrap",
    color: "#000",
    fontWeight: "bold",
  },
footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    zIndex: 10,
    backgroundColor: "#fff",        // add background
    borderTopWidth: 1,              // optional but recommended
    borderTopColor: "#ddd",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    Height: 40,
    paddingHorizontal: 13,
    paddingVertical: 13, // initial vertical padding centers single line
    textAlignVertical: "top", // text flows from top when multiple lines
    fontSize: 16,
    color: "#000",
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
  },
  clearImage: {
    width: 25,
    height: 25,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  micImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
  },
  micImage: {
    width: 25,
    height: 25,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 30,
    backgroundColor: "#174054",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendImage: {
    width: 22,
    height: 22,
  },
  tableContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    overflow: "hidden",
    // marginBottom: 50,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    minHeight: 50,
  },
  tableHeaderRow: {
    backgroundColor: "#174054",
  },
  headerCell: {
    padding: 5,
    color: "#000000",
  },
  cell: {
    padding: 5,
    backgroundColor: "#E0E0E0",
    color: "#000000",
  },
  periodTextcell: {
    padding: 5,
    backgroundColor: "#E0E0E0",
    color: "#000000",
    fontWeight: "500",
    fontSize: 16,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: "#000000",
  },
  tableHeader: {
    fontWeight: "500",
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
    flexShrink: 1, // allows text to shrink instead of overflowing
    flexWrap: "nowrap", // prevents multi-line wrap
    overflow: "hidden", // hides text overflow
    textOverflow: "ellipsis", // adds "..." effect (on web-like environments)
    maxWidth: "100%", // ensures it doesn’t exceed column width
  },
  tableCell: {
    textAlign: "center",
    color: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 4,
    flexShrink: 1,
    flexWrap: "wrap",
    overflow: "hidden",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginBottom: 10,
  },
  pageButton: {
    padding: 8,
    backgroundColor: "#174054",
    borderRadius: 5,
    marginHorizontal: 10,
  },
  pageButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  pageInfo: {
    fontSize: 14,
    color: "#174054",
  },
  slugButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#174054",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    maxWidth: "100%",
  },
  slugText: {
    fontSize: 14,
    color: "#174054",
    textAlign: "center",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  clearslug: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFC107",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    borderColor: "#FFC107",
  },
  clearslugText: {
    fontSize: 14,
    color: "#FFC107",
    textAlign: "center",
    flexWrap: "wrap",
  },
  selectedSlug: {
    backgroundColor: "#174054",
  },
  selectedSlugText: {
    color: "white",
  },
  filterInput: {
    alignItems: "center",
    height: 35,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 4,
    marginTop: 2,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#000",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "left",
    paddingHorizontal: 1,
    paddingVertical: 1,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "left",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#142440",
    gap: 6,
  },
  actionButtonText: {
    color: "#142440",
    fontSize: 14,
    fontWeight: "500",
  },
  // Key Items Row
  keyItemsContainer: {
    marginTop: 6,
    marginBottom: 4,
  },
  keyItemsTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    color: "#174054",
  },
  keyItemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  keyItemButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#174054",
    marginRight: 6,
    backgroundColor: "#fff",
  },
  selectedKeyItemButton: {
    backgroundColor: "#174054",
  },
  keyItemButtonText: {
    color: "#174054",
    fontSize: 13,
    marginRight: 4,
  },
  selectedKeyItemButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#174054",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOptionsContainer: {
    marginTop: 6,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedModalOption: {
    backgroundColor: "#174054",
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 15,
    color: "#174054",
  },
  selectedModalOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  firstRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moreButton: {
    backgroundColor: "#6ccf0840",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6ccf0840",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  moreButtonText: {
    fontSize: 14,
    color: "#000000ff",
    textAlign: "center",
    fontWeight: "500",
  },
  hedingPeriod: {
    padding: 5,
    backgroundColor: "#E0E0E0",
    color: "#000000",
    fontWeight: "500",
    fontSize: 16,
  },
  downloadButton: {
    backgroundColor: "#28A745", // Excel green
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  downloadButtonText: {
    color: "#fff",       // white text
    fontSize: 16,
    fontWeight: "bold",
  }
});

export default DataScreen;
