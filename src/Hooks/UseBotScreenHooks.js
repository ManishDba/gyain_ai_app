import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Platform, PermissionsAndroid, Animated } from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import VoiceToText, {
  VoiceToTextEvents,
} from "@appcitor/react-native-voice-to-text";

import axios from "../../services/axios";
import axiosWl from "../../services/axiosWl";
import endpoint from "../../services/endpoint";

import { setCategory } from "../reducers/ask.slice";

// import mobileStringReplacement from "../components/mobileStringReplacement";
import {
  extractPeriod,
  dateKeywordReplace,
} from "../components/dateKeywordReplace";

const greetings = [
  "hi",
  "hello",
  "hey",
  "hii",
  "helo",
  "heloo",
  "hai",
  "yo",
  "sup",
  "hola",
  "namaste",
  "wassup",
  "gm",
  "good morning",
  "good evening",
  "good afternoon",
  "👋",
  "🙋‍♂️",
  "🙋‍♀️",
];

const numeric_data_types = [
  "int",
  "integer",
  "float",
  "double",
  "decimal",
  "number",
  "numeric",
];

const useDataScreenHooks = ({ route }) => {
  const lastTapRef = useRef(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const catagoryName = route?.params?.Cat_name;

  const configData = useSelector((state) => state.usersSlice.config || {});
  const configworddata = Array.isArray(configData) ? configData[0] : configData;
  const userdetails = useSelector((state) => state.authSlice.userDetails || {});
  const botLevel = configData[0]?.bot_level;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [filteredSlugs, setFilteredSlugs] = useState([]);
  const [matchSlugs, setMatchSlugs] = useState([]);
  const [apiresponse, setApiResponse] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentActiveSlug, setCurrentActiveSlug] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sttStatus, setSttStatus] = useState("Disconnected");
  const [partialText, setPartialText] = useState("");
  const [paginationState, setPaginationState] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filtersByTable, setFiltersByTable] = useState({});
  const [activeFilterColumnsByTable, setActiveFilterColumnsByTable] = useState(
    {}
  );
  const [selectedKeyItems, setSelectedKeyItems] = useState({});
  const [periodTextsByTable, setPeriodTextsByTable] = useState({});
  const [loadingDots, setLoadingDots] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const itemsPerPage = 7;
  const wsRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
    navigation.navigate("BotCategory");
  }, [navigation]);

  const getReadableTextFromHtml = (html = "") => {
    return html
      .replace(/<\/(tr|p|div|h[1-6])>/gi, "\n")
      .replace(/<\/(th|td)>/gi, ": ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // const tokenize = (name) => {
  //   return name
  //     .replace(/([a-z])([A-Z])/g, "$1 $2")
  //     .replace(/[_\s-]+/g, " ")
  //     .toLowerCase()
  //     .split(" ");
  // };

  const isValidNumber = (value) => {
    if (value === null || value === undefined) return false;
    const clean = String(value).replace(/,/g, "").trim();
    return /^-?\d+(\.\d+)?$/.test(clean);
  };

  const isOnlyTotalNonEmpty = (arr) => {
    return arr.every((val, idx) =>
      idx === 0 ? val === "Total" : val === "" || val === null
    );
  };

  const generateFooterRowWithInference = (response) => {
    if (!response.Rows || response.Rows.length <= 1) return [];

    const { total_stop_words = "", decimal_stop_words = "" } =
      configworddata || {};

    const totalStopWords = total_stop_words
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    const decimalStopWordsRaw = decimal_stop_words
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    const decimalStopWords = decimalStopWordsRaw
      .filter((w) => !w.startsWith("#"))
      .map((w) => w.toLowerCase().replace(/[_\s]+/g, ""));

    const hashDecimalStopWords = decimalStopWordsRaw
      .filter((w) => w.startsWith("#"))
      .map((w) =>
        w
          .replace(/^#/, "")
          .toLowerCase()
          .replace(/[_\s]+/g, "")
      );

    const footer = [];
    let totalPlaced = false;

    const pushMessage = () => {
      if (!totalPlaced) {
        footer.push("Total");
        totalPlaced = true;
      } else {
        footer.push("");
      }
    };

    response.Columns.forEach((entry, index) => {
      const originalColumnName = (entry?.Name || "").toLowerCase();
      const normalizedColumnName = originalColumnName.replace(/[_\s]+/g, "");

      // Check if column name contains any stop word
      const isTotalStop = totalStopWords.some((word) => {
        // Create regex with word boundaries to match whole words only
        const wordRegex = new RegExp(`\\b${word}\\b`, "i");
        const matches = wordRegex.test(originalColumnName);
        return matches;
      });

      const sampleValue = response.Rows[0]?.[index];
      const isNumeric =
        (entry.Type && numeric_data_types.includes(entry.Type.toLowerCase())) ||
        isValidNumber(sampleValue);

      if (isTotalStop) {
        pushMessage();
        return;
      }

      if (isNumeric) {
        let sum = 0;
        let isMalformed = false;

        for (const row of response.Rows) {
          const cellValue = row[index];
          let raw;
          if (typeof cellValue === "number") {
            raw = cellValue;
          } else {
            raw = String(cellValue).replace(/,/g, "").trim();
          }

          if (
            raw === "Unknown" ||
            raw === "" ||
            raw === "null" ||
            raw === "undefined"
          ) {
            continue;
          } else if (!/^-?\d+(\.\d+)?$/.test(String(raw))) {
            isMalformed = true;
            break;
          } else {
            sum += parseFloat(raw);
          }
        }

        if (isMalformed) {
          footer.push("");
        } else {
          const isHashDecimalStop = hashDecimalStopWords.some((w) =>
            normalizedColumnName.includes(w)
          );
          const isDecimalStop = decimalStopWords.some((w) =>
            normalizedColumnName.includes(w)
          );

          // 🔧 Always show round figures (no decimals)
          const roundedSum = Math.round(sum);

          footer.push(roundedSum.toLocaleString("en-IN"));
        }
      } else {
        pushMessage();
      }
    });

    return footer;
  };

  const formatCellValue = (cell, columnName, columnType) => {
    const { decimal_stop_words = "" } = configworddata || {};

    const normalizedColumnName = (columnName || "")
      .toLowerCase()
      .replace(/[_\s]+/g, "");

    const decimalStopWordsRaw = decimal_stop_words
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    const decimalStopWords = decimalStopWordsRaw
      .filter((w) => !w.startsWith("#"))
      .map((w) => w.toLowerCase().replace(/[_\s]+/g, ""));

    const hashDecimalStopWords = decimalStopWordsRaw
      .filter((w) => w.startsWith("#"))
      .map((w) =>
        w
          .replace(/^#/, "")
          .toLowerCase()
          .replace(/[_\s]+/g, "")
      );

    const isTextColumn = columnType?.toLowerCase() === "text";

    // ✅ Handle text columns
    if (isTextColumn) {
      return cell && String(cell).trim() !== "" ? String(cell) : "";
    }

    // ✅ Handle empty/null values
    if (
      cell === null ||
      cell === "" ||
      cell === undefined ||
      cell === "Unknown"
    ) {
      return "";
    }

    // ✅ Handle valid numbers
    if (isValidNumber(cell)) {
      const num =
        typeof cell === "number"
          ? cell
          : parseFloat(String(cell).replace(/,/g, ""));

      const isHashDecimalStop = hashDecimalStopWords.some((w) =>
        normalizedColumnName.includes(w)
      );
      const isDecimalStop = decimalStopWords.some((w) =>
        normalizedColumnName.includes(w)
      );

      if (isHashDecimalStop) {
        // # columns: No comma, no decimal
        return num.toString();
      } else if (isDecimalStop) {
        // decimalStopWords: No decimals, but with commas
        return Math.round(num).toLocaleString("en-IN");
      } else {
        // ✅ Normal columns: always show 2 decimals (.00)
        const formatted = num.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return formatted;
      }
    }

    // ✅ Handle date-like strings
    if (String(cell).includes("T")) {
      return String(cell).split("T")[0];
    }

    return String(cell);
  };

  const initializeContextWithFirstSlug = async (slugs, matchedSlugs) => {
    const now = new Date();
    const istOffset = 5.5 * 60;
    const localTime = new Date(now.getTime() + istOffset * 60000);
    const hour = localTime.getUTCHours();

    let greeting = "Good evening";
    if (hour >= 5 && hour < 12) {
      greeting = "Good morning";
    } else if (hour >= 12 && hour < 17) {
      greeting = "Good afternoon";
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        text: `${greeting} ~${userdetails?.first_name} ${userdetails?.last_name}~. How may I help you?`,
        data: {},
        type: "greeting",
        sender: "system",
        hideVoice: true, // 👈 Add this flag
      },
    ]);

    if (slugs.length > 0) {
      const firstSlug = slugs[0];
      setCurrentActiveSlug({
        id: firstSlug.id,
        display: firstSlug.display,
      });

      const matched = matchedSlugs.find((item) => item.id === firstSlug.id);

      if (!matched) return;

      const { name, display, html_code } = matched;
      const slugText = { query: firstSlug };
      const keywordsText = { keywords: name };

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: display,
          data: {},
          type: "text",
          sender: "user",
        },
      ]);
      if (matched.html_code)
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: matched.html_code,
            data: {},
            type: "text",
            sender: "system",
            hideVoice: true, // 👈 Add this flag
          },
        ]);

      try {
        const results = await Promise.allSettled([
          axios.post(endpoint.clearContext(), slugText),
          axios.post(endpoint.docsourcesContext(), keywordsText),
        ]);

        let success = true;

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            setApiResponse(result?.value?.data);
          } else {
            success = false;
          }
        });

        if (success && html_code) {
        }
      } catch (error) {
        console.log("Unexpected error during initialization:", error);
      }
    }
  };

  const calculateColumnWidths = (data) => {
    if (!data?.Columns || !data?.Rows) return [];

    const formatHeaderName = (name) => {
      if (!name) return "";
      return name
        .replace(/_/g, " ")
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    return data.Columns.map((column, columnIndex) => {
      // Use formatted header name for width calculation
      let maxWidth = formatHeaderName(column.Name).length * 2;
      data.Rows.forEach((row) => {
        const cellContent = row[columnIndex];
        const cellString =
          typeof cellContent === "number"
            ? cellContent.toFixed(2)
            : String(cellContent);
        const cellWidth = cellString.length; // Consistent multiplier
        maxWidth = Math.max(maxWidth, cellWidth);
      });
      return Math.max(maxWidth, 120); // Ensure minimum width
    });
  };

  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingDots((prev) => (prev.length < 6 ? prev + "." : ""));
      }, 500);
    } else {
      setLoadingDots("");
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const sendMessage = async (message) => {
    if (!message.trim() || isGenerating) return; // ✅ Prevent if already generating

    const lowerCaseMessage = message.trim().toLowerCase();

    // Add user message
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: message, data: {}, type: "text", sender: "user" },
    ]);

    setInputText("");
    Keyboard.dismiss();

    // Greeting response
    if (greetings.includes(lowerCaseMessage)) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Hello! How can I help you?",
          data: {},
          type: "text",
          sender: "system",
        },
      ]);
      return;
    }

    // Show "Generating..." loader message
    setIsGenerating(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "Generating", data: {}, type: "loading", sender: "system" },
    ]);

    // Enrich message
    let enrichedMessage = message;
    if (selectedKeyItems && Object.keys(selectedKeyItems).length > 0) {
      const filterMessageParts = Object.entries(selectedKeyItems)
        .filter(([_, value]) => value && value !== "")
        .map(([key, value]) => `${key} ${value}`);

      if (filterMessageParts.length > 0) {
        enrichedMessage = `${message} for ${filterMessageParts.join(" and ")}`;
      }
    }

    try {
      const response = await callSourcesContextAPI(enrichedMessage);
      await fetchQueryResult(enrichedMessage, response);

      // Remove loader
      setIsGenerating(false);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.type !== "loading")
      );
    } catch (error) {
      console.error("Error:", error);
      setIsGenerating(false);
      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => msg.type !== "loading"),
        {
          text: "Something went wrong. Please try again.",
          data: {},
          type: "text",
          sender: "system",
        },
      ]);
    }
  };

  const callSourcesContextAPI = async (query) => {
    try {
      const slugToUse = currentActiveSlug || filteredSlugs[0];

      if (slugToUse) {
        const matched = matchSlugs.find((item) => item.id === slugToUse.id);
        const { name } = matched || {};

        const payloadData = {
          keywords: name,
          user_query: query,
        };

        const result = await axiosWl.post(
          endpoint.sourcesContext(),
          payloadData
        );
        if (result?.data && result.data.length > 0) {
          setApiResponse(result.data);
          return result.data;
        } else if (
          (!Array.isArray(result?.data) || result.data.length === 0) &&
          (!Array.isArray(apiresponse) || apiresponse.length === 0)
        ) {
          // ⚠️ API gave empty response AND existing state is also empty
          setMessages((prev) => [
            ...prev,
            {
              text: "No Data Found! Please provide more clarity in your query...!",
              data: {},
              type: "text",
              sender: "system",
              hideVoice: true,
            },
          ]);
          return [];
        }
      }
    } catch (error) {
      console.error("Error calling sourcesContext API:", error);

      // ✅ Only show message if apiresponse is also empty
      if (!Array.isArray(apiresponse) || apiresponse.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            text: "No Data Found! Please provide more clarity in your query...!",
            data: {},
            type: "text",
            sender: "system",
            hideVoice: true,
          },
        ]);
      }

      return [];
    }
  };

  const fetchQueryResult = async (query, response) => {
    const dataToUse =
      Array.isArray(response) && response.length > 0 ? response : apiresponse;

    if (!dataToUse || !Array.isArray(dataToUse)) {
      return;
    }

    try {
      // Step 1: Extract source IDs
      const docIds =
        dataToUse
          .filter((item) => item.source === "doc")
          .flatMap((item) => item.source_id) || [];

      const apiIds =
        dataToUse
          .filter((item) => item.source === "url")
          .flatMap((item) => item.source_id) || [];

      const sqIndicatorsIds =
        dataToUse
          .filter((item) => item.source === "sq")
          .flatMap((item) => item.source_id) || [];

      const savequeryId =
        dataToUse
          .filter((item) => item.source === "sq")
          .flatMap((item) =>
            Array.isArray(item.source_id) ? item.source_id : [item.source_id]
          ) || [];

      const xlsQueryItems =
        dataToUse
          .filter((item) => item.source === "sql")
          .flatMap((item) =>
            item.source_id.map((id) => ({
              source: item.source,
              source_id: id,
            }))
          ) || [];

      const slugToUse = currentActiveSlug || filteredSlugs[0];
      const matched = matchSlugs.find((item) => item.id === slugToUse?.id);
      const { name, display } = matched || {};

         // keywords that should disable period extraction
const YEAR_KEYWORDS = [
  "all year",
  "all years",
  "year wise",
  "yearwise",
  "year-wise",
  "year wise report", // optional extensions you can add
];
 
// helper: returns true if text contains any year-keyword
function containsYearKeyword(text = "") {
  const s = String(text || "").toLowerCase();
  return YEAR_KEYWORDS.some((k) => s.includes(k));
}
 
  // ------------------ main logic ------------------
// check direct period in the user query first
const directPeriodResult = extractPeriod(query);
let periodResult = [];
let sqIdOnlyPromises = [];
let sqResponses = [];
let rawName = "";
let replacedName = "";
let currentPeriodText = "";
 
// If the *user query* explicitly asks for "all year / yearwise", skip period extraction
const skipBecauseUserAskedYearwise = containsYearKeyword(query);
 
// If user asked yearwise, we won't call extractPeriod anywhere
if (skipBecauseUserAskedYearwise) {
  currentPeriodText = [];
  periodResult = [];
  sqIdOnlyPromises = [];
} else {
  const hasPeriodInQuery = directPeriodResult && directPeriodResult.length > 0;
 
  if (!hasPeriodInQuery) {
    if (savequeryId && savequeryId.length > 0) {
      // fetch saved queries
      sqIdOnlyPromises = savequeryId.map((idValue) =>
        axiosWl.get(endpoint.savedquerybyid(idValue))
      );
 
      sqResponses = await Promise.all(sqIdOnlyPromises);
 
      // if multiple saved queries, you might want to iterate — using first as before
      rawName = sqResponses?.[0]?.data?.name || "";
 
      // If the saved query name contains "all year" / "yearwise", skip extraction too.
      const skipBecauseSavedQueryIsYearwise = containsYearKeyword(rawName);
      if (skipBecauseSavedQueryIsYearwise) {
        currentPeriodText = [];
        periodResult = [];
        sqIdOnlyPromises = [];
      } else {
        // Normal path: replace keywords (like "this year", "last fy", etc.) then extract
        replacedName = dateKeywordReplace(rawName);
 
        const periodFromApi = extractPeriod(replacedName);
        currentPeriodText = periodFromApi || [];
        periodResult = periodFromApi || [];
      }
    }
  } else {
    // user query explicitly contains a period -> use it
    currentPeriodText = directPeriodResult;
    periodResult = directPeriodResult;
    sqIdOnlyPromises = [];
  }
}

      const sqPromises = sqIndicatorsIds.map((id) =>
        axiosWl.post(endpoint.sqindicators(), {
          saved_query_id: id,
          qfilter: query,
          limit: 500,
          bot_name: `${display} -M`,
        })
      );

      const xlsPromises = xlsQueryItems.map(({ source, source_id }) =>
        axiosWl.post(endpoint.datasets_xlsquery(), {
          source_id,
          query_text: query,
          source,
          bot_name: `${display} -M`,
          limit: 500,
        })
      );

      const aiDocPromise =
        docIds.length > 0 || apiIds.length > 0
          ? axiosWl.post(endpoint.searchAiDocument(), {
              query_text: query,
              api_ids: apiIds,
              doc_ids: docIds,
              bc_name: name,
            })
          : null;

      const allPromises = [
        ...sqPromises,
        ...(aiDocPromise ? [aiDocPromise] : []),
        ...xlsPromises,
        ...sqIdOnlyPromises,
      ];

      if (allPromises.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            text: "No relevant data sources available for your query.",
            data: {},
            type: "text",
            sender: "system",
            hideVoice: true,
          },
        ]);
        return;
      }

      // Step 3: Execute API calls
      const results = await Promise.allSettled(allPromises);
      let hasValidResult = false;
      let shownNoDataMessage = false;
      let tableCounter = 0; // 🆕 Counter for unique table keys

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const data = result.value.data;
          if (data && data.Columns && data.Rows) {
            if (data.Columns.length === 0 || data.Rows.length === 0) {
              if (!shownNoDataMessage) {
                shownNoDataMessage = true;
                setMessages((prev) => [
                  ...prev,
                  {
                    text: "No Data Found! Please provide more clarity in your query...!",
                    data: {},
                    type: "text",
                    sender: "system",
                    hideVoice: true,
                  },
                ]);
              }
            } else {
              hasValidResult = true;
              tableCounter++; // 🆕 Increment for each table
              const tableKey = `table_${Date.now()}_${tableCounter}`; // 🆕 Unique key

              // 🆕 Store period text for this specific table
              setPeriodTextsByTable((prev) => {
                const updated = {
                  ...prev,
                  [tableKey]: currentPeriodText,
                };
                console.log(
                  "📝 Storing period for key:",
                  tableKey,
                  "->",
                  currentPeriodText
                );
                return updated;
              });

              const chartData = prepareChartData(data);

              // 🆕 Add tableKey and periodText directly to data
              const dataWithKey = chartData || data;
              dataWithKey.tableKey = tableKey;
              dataWithKey.periodText = currentPeriodText;

              setMessages((prev) => [
                ...prev,
                {
                  text: "",
                  data: dataWithKey,
                  type: chartData ? "chart" : "tab",
                  sender: "system",
                },
              ]);
            }
          } else if (typeof data === "string" && data.trim() !== "") {
            hasValidResult = true;

            if (data.includes("<table")) {
              const parsed = extractHtmlSections(data);

              if (
                parsed &&
                parsed.tableData &&
                parsed.tableData.Columns.length > 0 &&
                parsed.tableData.Rows.length > 0
              ) {
                tableCounter++; // 🆕 Increment for HTML table
                const tableKey = `table_${Date.now()}_${tableCounter}`;

                // 🆕 Store period text for HTML table
                setPeriodTextsByTable((prev) => {
                  const updated = {
                    ...prev,
                    [tableKey]: currentPeriodText,
                  };
                  console.log(
                    "📝 Storing period for HTML key:",
                    tableKey,
                    "->",
                    currentPeriodText
                  );
                  return updated;
                });

                setMessages((prev) => [
                  ...prev,
                  {
                    text: "",
                    data: {
                      heading: parsed.heading || "",
                      tableData: {
                        ...parsed.tableData,
                        tableKey,
                        periodText: currentPeriodText, // 🆕 Add periodText
                      },
                      footerHeading: parsed.footerHeading || "",
                      notes: parsed.notes || [],
                      paragraph: parsed.paragraph || "",
                    },
                    type: "html_structured",
                    sender: "system",
                  },
                ]);
              } else {
                setMessages((prev) => [
                  ...prev,
                  {
                    text: data,
                    data: {},
                    type: "text",
                    sender: "system",
                  },
                ]);
              }
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  text:
                    data.trim() !== "<html><body></body></html>"
                      ? data
                      : "No Data Found for your Query",
                  data: {},
                  type: "text",
                  sender: "system",
                },
              ]);
            }
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              text: "",
              data: {},
              type: "text",
              sender: "system",
            },
          ]);
        }
      });

      if (!hasValidResult && !shownNoDataMessage) {
        setMessages((prev) => [
          ...prev,
          {
            text: "No Data Found! Please provide more clarity in your query...!",
            data: {},
            type: "text",
            sender: "system",
            hideVoice: true,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Something went wrong! Please try again.",
          data: {},
          type: "text",
          sender: "system",
          hideVoice: true,
        },
      ]);
    }
  };
  const extractHtmlSections = (html) => {
    // Extract heading before table
    const headingMatch = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
    const heading = headingMatch ? headingMatch[1].trim() : "";

    // Extract table HTML
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) return null;
    const tableHtml = tableMatch[0];

    // Parse table rows and columns
    const rowMatches = [...tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
    const parsedRows = [];
    let columns = [];

    rowMatches.forEach((row, rowIndex) => {
      const cells = [...row[1].matchAll(/<(th|td)>([\s\S]*?)<\/\1>/g)];
      const cellValues = cells.map(([, , content]) =>
        content.replace(/<[^>]*>/g, "").trim()
      );
      if (rowIndex === 0) {
        columns = cellValues.map((name) => ({ Name: name }));
      } else {
        parsedRows.push(cellValues);
      }
    });

    // Extract footer heading (first <h*> after </table>)
    const footerHeadingMatch = html.match(
      /<\/table>[\s\S]*?<h[1-6][^>]*>(.*?)<\/h[1-6]>/i
    );
    const footerHeading = footerHeadingMatch
      ? footerHeadingMatch[1].trim()
      : "";

    // Extract bullet points
    const ulMatch = html.match(/<ul>([\s\S]*?)<\/ul>/i);
    const bulletItems = ulMatch
      ? [...ulMatch[1].matchAll(/<li>(.*?)<\/li>/gi)].map((m) => m[1].trim())
      : [];

    // Extract last paragraph
    const paraMatch = html.match(/<p[^>]*>(.*?)<\/p>/gi);
    const lastPara =
      paraMatch && paraMatch.length > 0
        ? paraMatch[paraMatch.length - 1].replace(/<[^>]*>/g, "").trim()
        : "";

    return {
      heading,
      footerHeading,
      tableData: {
        Columns: columns,
        Rows: parsedRows,
      },
      notes: bulletItems,
      paragraph: lastPara,
    };
  };

  const fetchCorrespondents = async () => {
    try {
      const response = await axios.get(endpoint.category());
      setMatchSlugs(response.data.results);

      let slugs = [];

      if (botLevel === 1) {
        slugs = response.data.results
          .filter(
            (item) => item.division === catagoryName && item.visible !== false
          )
          .sort((a, b) => a.sequence - b.sequence);
      } else {
        slugs = response.data.results
          .filter((item) => item.visible !== false)
          .sort((a, b) => a.sequence - b.sequence);
      }

      const clearOptions = ["Clear", "Clear All"];
      const filteredSlugs = slugs
        .filter((slug) => !clearOptions.includes(slug.display))
        .map((item) => ({
          id: item.id,
          name: item.name,
          display: item.display,
        }));
      setFilteredSlugs(filteredSlugs);
      dispatch(setCategory(response.data));

      if (filteredSlugs.length > 0) {
        await initializeContextWithFirstSlug(
          filteredSlugs,
          response.data.results
        );
      }
    } catch (error) {
      console.error("Error fetching correspondents:", error);
    }
  };

  const handleSlugPress = async (slug) => {
      if (currentActiveSlug?.id === slug.id) {
    return;
  }
  setCurrentActiveSlug(slug);

    if (slug.display === "Clear" || slug.display === "Clear All") {
      setMessages([]);
      setApiResponse(null);
      try {
        await axiosWl.post(endpoint.clearContext(), { query: "Clear" });
      } catch (error) {
        console.error("Failed to clear context:", error);
      }
      return;
    }

    // Match by id
    const matched = matchSlugs.find((d) => d.id === slug.id);
    const { name } = matched || {};
    // Filter by id
    const filteredDiv = matchSlugs.filter((d) => d.id === slug.id);
    const slugData = matched; // same as matched now
    const slugText = { query: slug.display }; // sending display name as query
    const keywordsText = { keywords: name };
    try {
      const results = await Promise.allSettled([
        axiosWl.post(endpoint.clearContext(), slugText),
        axiosWl.post(endpoint.docsourcesContext(), keywordsText),
      ]);

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setApiResponse(result?.value?.data);
        } else {
          console.error(`API ${index + 1} failed:`, result.reason);
        }
      });
    } catch (error) {
      console.log("Unexpected error:", error);
    }

    // Set messages with display text
    setMessages((prevMessages) => {
      const newMessages = [
        ...prevMessages,
        { text: slug.display, data: {}, type: "text", sender: "user" },
      ];

      if (filteredDiv?.length > 0 && slugData && slugData.html_code) {
        newMessages.push({
          text: "",
          data: {
            actionBtns: filteredDiv.map((d) => d.name),
            text: slugData.html_code,
          },
          type: "action",
          sender: "system",
        });
      }

      return newMessages;
    });
  };

  const isValidNumberchart = (value) => {
    if (value === null || value === undefined || value === "") return false;
    const num = Number(value);
    return !isNaN(num) && isFinite(num);
  };

  const analyzeDataForChart = (data) => {
    // Enhanced data validation with detailed error checking
    if (!data) {
      console.warn("Data is null or undefined");
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "No data provided",
      };
    }

    if (typeof data !== "object") {
      console.warn("Data is not an object");
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "Invalid data format - not an object",
      };
    }

    if (!data.Columns || !Array.isArray(data.Columns)) {
      console.warn("Data.Columns is missing or not an array");
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "Invalid data structure - Columns missing or invalid",
      };
    }

    if (!data.Rows || !Array.isArray(data.Rows)) {
      console.warn("Data.Rows is missing or not an array");
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "Invalid data structure - Rows missing or invalid",
      };
    }

    if (data.Rows.length === 0) {
      console.warn("Data.Rows is empty");
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "No data rows available",
      };
    }

    // Validate that each row is an array and has the correct length
    const expectedColumnCount = data.Columns.length;
    const invalidRows = data.Rows.filter(
      (row) => !Array.isArray(row) || row.length !== expectedColumnCount
    );

    if (invalidRows.length > 0) {
      console.warn(`Found ${invalidRows.length} invalid rows`);
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "Invalid row structure detected",
      };
    }

    if (data.type === "table") {
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "Data type explicitly set to table",
      };
    }

    // Safe column mapping with validation
    const columns = data.Columns.map((col, index) => {
      if (!col || typeof col !== "object") {
        console.warn(`Invalid column at index ${index}`);
        return {
          name: `Column_${index}`,
          type: "string",
        };
      }

      return {
        name: col.Name || `Column_${index}`,
        type: col.Type ? col.Type.toLowerCase() : "string",
      };
    });

    const rows = data.Rows;

    const isDateColumn = (colIndex) => {
      if (colIndex < 0 || colIndex >= columns.length) return false;

      const colName = columns[colIndex].name.toLowerCase();
      const colType = columns[colIndex].type;

      // Check type-based indicators
      const typeIndicators = ["date", "time", "datetime", "timestamp"];
      if (typeIndicators.some((indicator) => colType.includes(indicator))) {
        return true;
      }

      // Check name-based indicators
      const nameIndicators = [
        "date",
        "year",
        "month",
        "day",
        "period",
        "yearmonth",
        "financial_year",
      ];
      if (nameIndicators.some((indicator) => colName.includes(indicator))) {
        return true;
      }

      // Check if values look like dates/years
      if (
        rows.length > 0 &&
        rows[0][colIndex] !== null &&
        rows[0][colIndex] !== undefined
      ) {
        const sampleValue = String(rows[0][colIndex]);
        // Check for year patterns (e.g., "2021-22", "2021", etc.)
        if (
          sampleValue.match(/^\d{4}(-\d{2})?$/) ||
          sampleValue.match(/^\d{4}-\d{4}$/)
        ) {
          return true;
        }
      }

      return false;
    };

    const isNumericColumn = (colIndex) => {
      if (colIndex < 0 || colIndex >= columns.length) return false;

      const colType = columns[colIndex].type;
      const numericTypes = [
        "number",
        "int",
        "integer",
        "float",
        "double",
        "decimal",
        "numeric",
      ];
      const isNumericType = numericTypes.some((type) => colType.includes(type));

      if (!isNumericType && rows.length > 0) {
        // Sample a few values to determine if they're numeric
        const sampleSize = Math.min(3, rows.length);
        let numericCount = 0;

        for (let i = 0; i < sampleSize; i++) {
          if (
            rows[i] &&
            rows[i][colIndex] !== null &&
            rows[i][colIndex] !== undefined
          ) {
            if (isValidNumberchart(rows[i][colIndex])) {
              numericCount++;
            }
          }
        }

        return numericCount > 0;
      }

      return isNumericType;
    };

    let dateCols = 0;
    let valueCols = 0;
    let labelCols = 0;
    let dateColIndex = -1;
    let valueColIndices = [];
    let labelColIndices = [];

    columns.forEach((col, index) => {
      try {
        if (isDateColumn(index)) {
          dateCols++;
          dateColIndex = index;
        } else if (isNumericColumn(index)) {
          valueCols++;
          valueColIndices.push(index);
        } else {
          labelCols++;
          labelColIndices.push(index);
        }
      } catch (error) {
        console.warn(`Error analyzing column ${index}:`, error);
        // Default to label column if there's an error
        labelCols++;
        labelColIndices.push(index);
      }
    });

    // Chart decision logic with better error handling
    try {
      if (dateCols === 1 && valueCols === 1 && labelCols === 1) {
        const uniqueLabels = [
          ...new Set(
            rows.map((row) =>
              row && row[labelColIndices[0]] !== null
                ? row[labelColIndices[0]]
                : "Unknown"
            )
          ),
        ];
        const uniqueDates = [
          ...new Set(
            rows.map((row) =>
              row && row[dateColIndex] !== null ? row[dateColIndex] : "Unknown"
            )
          ),
        ];

        if (uniqueLabels.length > 1 && uniqueDates.length > 1) {
          return {
            shouldRenderChart: true,
            type: "multi_line",
            dateColIndex,
            valueColIndices,
            labelColIndices,
            reason: "Time series with multiple categories (multi-line)",
          };
        } else if (uniqueLabels.length > 1) {
          return {
            shouldRenderChart: true,
            type: "multi_bar",
            dateColIndex,
            valueColIndices,
            labelColIndices,
            reason: "Multiple categories over time (multi-bar)",
          };
        } else {
          return {
            shouldRenderChart: true,
            type: "linechart",
            dateColIndex,
            valueColIndices,
            labelColIndices,
            reason: "Single time series",
          };
        }
      }

      if (dateCols === 1 && valueCols >= 1 && labelCols === 0) {
        if (valueCols === 1) {
          return {
            shouldRenderChart: true,
            type: "linechart",
            dateColIndex,
            valueColIndices,
            reason: "Time series with single value",
          };
        } else {
          return {
            shouldRenderChart: true,
            type: "multi_line",
            dateColIndex,
            valueColIndices,
            reason: "Time series with multiple values (multi-line)",
          };
        }
      }

      if (labelCols >= 2 && valueCols === 1) {
        const shouldUsePie = rows.length <= 8;
        return {
          shouldRenderChart: true,
          type: shouldUsePie ? "pie" : "bar",
          valueColIndices,
          labelColIndices,
          reason: `Multiple categories with single value (${
            shouldUsePie ? "pie" : "bar"
          })`,
        };
      }

      if (labelCols === 1 && valueCols === 1 && dateCols === 0) {
        const shouldUsePie = rows.length <= 10;
        return {
          shouldRenderChart: true,
          type: shouldUsePie ? "pie" : "bar",
          valueColIndices,
          labelColIndices,
          reason: `Single category with single value (${
            shouldUsePie ? "pie" : "bar"
          })`,
        };
      }

      return {
        shouldRenderChart: false,
        type: "table",
        reason: `No matching chart conditions (dates: ${dateCols}, values: ${valueCols}, labels: ${labelCols})`,
      };
    } catch (error) {
      console.error("Error in chart analysis logic:", error);
      return {
        shouldRenderChart: false,
        type: "table",
        reason: "Error during chart analysis",
      };
    }
  };

  const prepareChartData = (chartAnalysis, data) => {
    // Enhanced validation
    if (!chartAnalysis || !chartAnalysis.shouldRenderChart) {
      return null;
    }

    if (!data || !data.Columns || !data.Rows) {
      console.error("Invalid data structure in prepareChartData");
      return null;
    }

    const { type, dateColIndex, valueColIndices, labelColIndices } =
      chartAnalysis;
    const columns = data.Columns;
    const rows = data.Rows;

    // Safe array access function
    const safeArrayAccess = (arr, index, defaultValue = null) => {
      if (!arr || !Array.isArray(arr) || index < 0 || index >= arr.length) {
        return defaultValue;
      }
      return arr[index];
    };

    const formatDate = (dateValue) => {
      if (!dateValue) return "";

      if (
        typeof dateValue === "string" &&
        dateValue.match(/^\d{4}(-\d{2})?$/)
      ) {
        return dateValue; // Handle "2021-22" format
      }

      if (typeof dateValue === "string" && dateValue.match(/^\d{4}-\d{4}$/)) {
        return dateValue; // Handle "2021-2022" format
      }

      if (typeof dateValue === "string" && dateValue.match(/^\d{4}$/)) {
        return dateValue;
      }

      if (
        typeof dateValue === "number" &&
        dateValue >= 1900 &&
        dateValue <= 2100
      ) {
        return dateValue.toString();
      }

      try {
        const date = new Date(dateValue);
        if (date.toString() !== "Invalid Date") {
          return date.toISOString().split("T")[0];
        }
      } catch (error) {
        console.warn("Date parsing error:", error);
      }

      return String(dateValue);
    };

    try {
      switch (type) {
        case "linechart":
          if (
            dateColIndex !== -1 &&
            valueColIndices &&
            valueColIndices.length > 0
          ) {
            const dates = rows.map((row) =>
              formatDate(safeArrayAccess(row, dateColIndex, ""))
            );
            const values = rows.map((row) => {
              const value = safeArrayAccess(row, valueColIndices[0], 0);
              return parseFloat(value) || 0;
            });

            return {
              type: "linechart",
              chartData: {
                labels: dates,
                datasets: [
                  {
                    name:
                      safeArrayAccess(columns, valueColIndices[0], {}).Name ||
                      "Value",
                    data: values,
                  },
                ],
              },
            };
          }
          break;

        case "multi_line":
          if (
            dateColIndex !== -1 &&
            valueColIndices &&
            valueColIndices.length > 0
          ) {
            const dates = [
              ...new Set(
                rows.map((row) =>
                  formatDate(safeArrayAccess(row, dateColIndex, ""))
                )
              ),
            ].sort();

            if (labelColIndices && labelColIndices.length > 0) {
              const seriesMap = new Map();

              rows.forEach((row) => {
                if (!row || !Array.isArray(row)) return;

                const seriesName = String(
                  safeArrayAccess(row, labelColIndices[0], "Unknown")
                );
                const date = formatDate(safeArrayAccess(row, dateColIndex, ""));
                const value =
                  parseFloat(safeArrayAccess(row, valueColIndices[0], 0)) || 0;

                if (!seriesMap.has(seriesName)) {
                  seriesMap.set(seriesName, new Map());
                }
                seriesMap.get(seriesName).set(date, value);
              });

              const datasets = Array.from(seriesMap.entries()).map(
                ([seriesName, dateValueMap]) => ({
                  name: seriesName,
                  label: seriesName,
                  data: dates.map((date) => dateValueMap.get(date) || 0),
                })
              );

              return {
                type: "multi_line",
                chartData: {
                  labels: dates,
                  datasets: datasets,
                },
              };
            } else {
              // Multiple value columns, single date column
              const datasets = valueColIndices.map((colIndex) => ({
                name:
                  safeArrayAccess(columns, colIndex, {}).Name ||
                  `Value ${colIndex}`,
                label:
                  safeArrayAccess(columns, colIndex, {}).Name ||
                  `Value ${colIndex}`,
                data: rows.map(
                  (row) => parseFloat(safeArrayAccess(row, colIndex, 0)) || 0
                ),
              }));

              return {
                type: "multi_line",
                chartData: {
                  labels: dates,
                  datasets: datasets,
                },
              };
            }
          }
          break;

        case "multi_bar":
          if (
            dateColIndex !== -1 &&
            labelColIndices &&
            labelColIndices.length > 0 &&
            valueColIndices &&
            valueColIndices.length > 0
          ) {
            const dates = [
              ...new Set(
                rows.map((row) =>
                  formatDate(safeArrayAccess(row, dateColIndex, ""))
                )
              ),
            ].sort();
            const seriesMap = new Map();

            rows.forEach((row) => {
              if (!row || !Array.isArray(row)) return;

              const seriesName = String(
                safeArrayAccess(row, labelColIndices[0], "Unknown")
              );
              const date = formatDate(safeArrayAccess(row, dateColIndex, ""));
              const value =
                parseFloat(safeArrayAccess(row, valueColIndices[0], 0)) || 0;

              if (!seriesMap.has(seriesName)) {
                seriesMap.set(seriesName, new Map());
              }
              seriesMap.get(seriesName).set(date, value);
            });

            const datasets = Array.from(seriesMap.entries()).map(
              ([seriesName, dateValueMap]) => ({
                name: seriesName,
                label: seriesName,
                data: dates.map((date) => dateValueMap.get(date) || 0),
              })
            );

            return {
              type: "multi_bar",
              chartData: {
                labels: dates,
                datasets: datasets,
              },
            };
          }
          break;

        case "bar":
          if (
            labelColIndices &&
            labelColIndices.length > 0 &&
            valueColIndices &&
            valueColIndices.length > 0
          ) {
            if (labelColIndices.length === 1) {
              const labels = rows.map((row) =>
                String(safeArrayAccess(row, labelColIndices[0], "Unknown"))
              );
              const values = rows.map(
                (row) =>
                  parseFloat(safeArrayAccess(row, valueColIndices[0], 0)) || 0
              );

              return {
                type: "bar",
                chartData: {
                  labels: labels,
                  datasets: [
                    {
                      name:
                        safeArrayAccess(columns, valueColIndices[0], {}).Name ||
                        "Value",
                      data: values,
                    },
                  ],
                },
              };
            } else {
              const combinedLabels = rows.map((row) => {
                const labelParts = labelColIndices.map((index) =>
                  String(safeArrayAccess(row, index, "Unknown"))
                );
                return labelParts.join(" - ");
              });
              const values = rows.map(
                (row) =>
                  parseFloat(safeArrayAccess(row, valueColIndices[0], 0)) || 0
              );

              return {
                type: "bar",
                chartData: {
                  labels: combinedLabels,
                  datasets: [
                    {
                      name:
                        safeArrayAccess(columns, valueColIndices[0], {}).Name ||
                        "Value",
                      data: values,
                    },
                  ],
                },
              };
            }
          }
          break;

        case "pie":
          if (
            labelColIndices &&
            labelColIndices.length > 0 &&
            valueColIndices &&
            valueColIndices.length > 0
          ) {
            const pieLabels = rows.map((row) =>
              String(safeArrayAccess(row, labelColIndices[0], "Unknown"))
            );
            const pieValues = rows.map(
              (row) =>
                parseFloat(safeArrayAccess(row, valueColIndices[0], 0)) || 0
            );

            return {
              type: "pie",
              chartData: {
                labels: pieLabels,
                values: pieValues,
              },
            };
          }
          break;

        default:
          console.warn(`Unknown chart type: ${type}`);
          return null;
      }
    } catch (error) {
      console.error("Error in prepareChartData:", error);
      return null;
    }

    return null;
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message:
            "This app needs access to your microphone for speech recognition.",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const convertSpokenNumbersToDigits = (text) => {
    if (!text) return text;

    let result = text.toLowerCase();

    // Number words mapping
    const numberWords = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
      hundred: 100,
      thousand: 1000,
      lakh: 100000,
      crore: 10000000,
    };

    // Helper: convert sequence of words to number (supports "two thousand five hundred")
    const wordsToNumber = (words) => {
      let total = 0;
      let current = 0;

      for (let word of words) {
        const value = numberWords[word];
        if (value === undefined) continue;

        if (value < 100) {
          current += value;
        } else if (value === 100) {
          if (current === 0) current = 1;
          current *= value;
        } else {
          if (current === 0) current = 1;
          current *= value;
          total += current;
          current = 0;
        }
      }

      return total + current;
    };

    // Replace groups of number words with actual digits
    result = result.replace(
      /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|crore)(\s+(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|crore))*\b/g,
      (match) => {
        const words = match.trim().split(/\s+/);
        return wordsToNumber(words);
      }
    );

    return result;
  };

  const cleanText = (text) => {
    if (!text) return text;
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const replaceWords = (text) => {
    const textWithNumbers = convertSpokenNumbersToDigits(text);
    const cleaned = cleanText(textWithNumbers);

    const words = cleaned.split(" ");

    const findVariantMatch = (wordSequence) => {
      for (const [target, variants] of Object.entries(
        configworddata.mobile_string_replacement
      )) {
        // Add check to ensure variants is an array
        if (Array.isArray(variants) && variants.includes(wordSequence)) {
          return target;
        }
      }
      return null;
    };

    let result = [];
    let i = 0;

    // Calculate max variant length with safety checks
    let maxVariantLength = 1;
    try {
      const lengths = Object.values(configworddata.mobile_string_replacement)
        .filter((variants) => Array.isArray(variants)) // Filter only arrays
        .map((variants) =>
          Math.max(...variants.map((v) => String(v).split(" ").length))
        );

      if (lengths.length > 0) {
        maxVariantLength = Math.max(...lengths);
      }
    } catch (error) {
      console.warn("Error calculating max variant length:", error);
      maxVariantLength = 5; // Default fallback
    }

    while (i < words.length) {
      let matched = false;
      for (let len = maxVariantLength; len >= 1; len--) {
        if (i + len <= words.length) {
          const wordSequence = words.slice(i, i + len).join(" ");
          const target = findVariantMatch(wordSequence);
          if (target) {
            result.push(target);
            i += len;
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        result.push(words[i]);
        i++;
      }
    }

    return result.join(" ");
  };

  const replacePartialWords = (text, limit = 10) => {
    const words = text.split(" ");
    const lastWords = words.slice(-limit).join(" ");
    return replaceWords(lastWords);
  };

  useEffect(() => {
    VoiceToText.addEventListener(VoiceToTextEvents.START, () => {
      setIsRecording(true);
      setSttStatus("Listening...");
      setPartialText("");
    });

    VoiceToText.addEventListener(VoiceToTextEvents.END, () => {
      setIsRecording(false);
      setSttStatus("Disconnected");
      setPartialText("");
    });

    VoiceToText.addEventListener(VoiceToTextEvents.RESULTS, (event) => {
      if (event && event.value) {
        const replacedText = replaceWords(event.value);
        setInputText(replacedText);
      }
      setSttStatus("Finalized");
      setIsRecording(false);
      setPartialText("");
    });

    VoiceToText.addEventListener(VoiceToTextEvents.PARTIAL_RESULTS, (event) => {
      if (event && event.value) {
        const replacedPartial = replacePartialWords(event.value, 10);
        setPartialText(replacedPartial);
      }
      setSttStatus("Listening...");
    });

    VoiceToText.addEventListener(VoiceToTextEvents.ERROR, (event) => {
      console.error("VoiceToText Error:", event);
      setSttStatus("Error");
      setIsRecording(false);
      setPartialText("");
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        VoiceToText.stopListening();
        setIsRecording(false);
        setSttStatus("Disconnected");
      };
    }, [])
  );

  const toggleRecording = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setSttStatus("Mic permission denied");
      return;
    }

    try {
      if (isRecording) {
        await VoiceToText.stopListening();
        setIsRecording(false);
        setSttStatus("Disconnected");
        if (partialText) {
          setInputText(partialText);
          setPartialText("");
        }
      } else {
        await VoiceToText.stopListening().catch(() => {});
        setInputText("");
        setPartialText("");
        setSttStatus("Listening...");
        await VoiceToText.startListening();
        setIsRecording(true);
      }
    } catch (error) {
      console.log("VoiceToText error:", error);
      setSttStatus("Error");
      setIsRecording(false);
    }
  };

  useEffect(() => {
    fetchCorrespondents();
  }, []);

  const toggleFilterInput = (tableKey, columnName) => {
    setActiveFilterColumnsByTable((prev) => {
      const prevForTable = prev[tableKey] || [];
      let updatedForTable;
 
      if (prevForTable.includes(columnName)) {
        updatedForTable = prevForTable.filter((col) => col !== columnName);
        setFiltersByTable((filters) => {
          const updated = { ...filters };
          if (updated[tableKey]) {
            const tableFilters = { ...updated[tableKey] };
            delete tableFilters[columnName];
            updated[tableKey] = tableFilters;
          }
          return updated;
        });
      } else {
        updatedForTable = [...prevForTable, columnName];
      }
 
      return { ...prev, [tableKey]: updatedForTable };
    });
  };
  
  const handleFilterChange = (tableKey, columnName, value, onPageChange) => {
    setFiltersByTable((prev) => ({
      ...prev,
      [tableKey]: {
        ...(prev[tableKey] || {}),
        [columnName]: value,
      },
    }));
    if (onPageChange) onPageChange(1);
  };  

  const applyFilters = (rows = [], columns = [], tableKey) => {
    const tableFilters = filtersByTable[tableKey] || {};
 
    return rows.filter((row) =>
      columns.every((col, colIndex) => {
        const rawFilterValue = tableFilters[col.Name] || "";
        if (!rawFilterValue) return true;
 
        const filterValue = rawFilterValue.replace(/[.,\s]/g, "").toLowerCase();
        const cellRaw = row[colIndex];
        const cellValue = String(cellRaw || "")
          .replace(/[.,\s]/g, "")
          .toLowerCase();
 
        return cellValue.includes(filterValue);
      })
    );
  };

  const handleUserMessageDoubleTap = (sender, rawHtml, setInputText) => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      if (sender === "user") {
        const cleanText = getReadableTextFromHtml(rawHtml);
        setInputText(cleanText);
      }
    }
    lastTapRef.current = now;
  };

  const handleMessageSingleTap = (sender, rawHtml, setInputText) => {
    if (sender !== "user") {
      const cleanText = getReadableTextFromHtml(rawHtml);
      setInputText(cleanText);
    }
  };

  return {
    lastTapRef,
    messages,
    inputText,
    setInputText,
    filteredSlugs,
    currentPage,
    periodTextsByTable,
    setCurrentPage,
    currentActiveSlug,
    refreshing,
    isRecording,
    sttStatus,
    partialText,
    wsRef,
    pulseAnim,
    flatListRef,
    paginationState,
    isSpeaking,
    isPaused,
    filtersByTable,
    activeFilterColumnsByTable,
    selectedKeyItems,
    loadingDots,
    isGenerating,
    formatCellValue,
    setSelectedKeyItems,
    handleUserMessageDoubleTap,
    handleMessageSingleTap,
    toggleFilterInput,
    handleFilterChange,
    applyFilters,
    setPaginationState,
    handleRefresh,
    toggleRecording,
    sendMessage,
    handleSlugPress,
    renderPaginationControls: (totalItems) => {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return { totalPages, itemsPerPage };
    },
    calculateColumnWidths,
    generateFooterRowWithInference,
    isOnlyTotalNonEmpty,
    analyzeDataForChart,
    prepareChartData,
    formatCellValue,
    formatDate: (dateValue) => {
      if (!dateValue) return "";
      if (
        typeof dateValue === "string" &&
        dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
      )
        return dateValue;
      if (typeof dateValue === "string" && dateValue.match(/^\d{4}$/))
        return dateValue;
      if (
        typeof dateValue === "number" &&
        dateValue >= 1900 &&
        dateValue <= 2100
      )
        return dateValue.toString();
      const date = new Date(dateValue);
      if (date.toString() !== "Invalid Date")
        return date.toISOString().split("T")[0];
      return String(dateValue);
    },
    renderChart: (chartAnalysis, data) => {
      const chartData = prepareChartData(chartAnalysis, data);
      if (!chartData) return null;
      return chartData;
    },
  };
};

export default useDataScreenHooks;
