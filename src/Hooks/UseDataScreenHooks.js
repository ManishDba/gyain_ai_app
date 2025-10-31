import { useState, useEffect, useRef } from "react";
import axios from "../../services/axios";
import { encode } from "base-64";
import endpoint from "../../services/endpoint";
import { useDispatch } from "react-redux";
import { setCategory } from "../reducers/ask.slice";

const UseDataScreenHooks = () => {
  const dispatch = useDispatch();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [filteredSlugs, setFilteredSlugs] = useState([]);
  const [matchSlugs, setMatchSlugs] = useState([]);

  const flatListRef = useRef(null);

  const fetchCorrespondents = async () => {
    try {
      const auth = encode("dmsadmin:Welcome@123");
      const response = await axios.get(endpoint.category(),
         {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );
      setMatchSlugs(response.data.results);
      const slugs = response.data.results
        .filter((item) => item.division == "data")
        .map((item) => item.display);
      setFilteredSlugs(slugs);
      dispatch(setCategory(response.data));

    } catch (error) {
      console.error("Error fetching correspondents:", error);
    }
  };

  const sendMessage = async (message) => {
    if (message.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: message, data: {}, type: "text", sender: "user" },
      ]);
      setInputText("");
      await fetchQueryResult(message);
    }
  };

  const fetchQueryResult = async (query) => {
    try {
      const { data } = await axios.post(endpoint.metadata(), { query });

      if (data && data.Columns) {
        const chartData = prepareChartData(data);
        if (chartData) {
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "", data: chartData, type: "chart", sender: "system" },
          ]);
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "", data, type: "tab", sender: "system" },
          ]);
        }
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: "No Data Found for your Query",
            data: {},
            type: "text",
            sender: "system",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Error fetching data",
          data: {},
          type: "text",
          sender: "system",
        },
      ]);
    }
  };

  const fetchQueryResults = async (query) => {
    try {
      const response = await fetch(endpoint.users(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });


    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  

  const prepareChartData = (data) => {
    const columns = data.Columns.map((col) => col.Name);
    const rows = data.Rows;

    if (rows.length < 30) return null;

    const stringCols = columns.filter((col) =>
      isNaN(rows[0][columns.indexOf(col)])
    );
    const numberCols = columns.filter((col) =>
      !isNaN(rows[0][columns.indexOf(col)])
    );

    if (stringCols.length === 1 && numberCols.length === 1) {
      const labels = rows.map((row) => row[columns.indexOf(stringCols[0])]);
      const dataPoints = rows.map((row) =>
        parseFloat(row[columns.indexOf(numberCols[0])])
      );
      return { type: "line", labels, dataPoints };
    }

    if (stringCols.length === 2 && numberCols.length === 2) {
      const labels = rows.map((row) =>
        `${row[columns.indexOf(stringCols[0])]} - ${row[columns.indexOf(stringCols[1])]}`
      );
      const data1 = rows.map((row) =>
        parseFloat(row[columns.indexOf(numberCols[0])])
      );
      const data2 = rows.map((row) =>
        parseFloat(row[columns.indexOf(numberCols[1])])
      );
      return { type: "bar", labels, data1, data2 };
    }

    return null;
  };

  const handleSlugPress = (slug) => {
    const filteredDiv = matchSlugs.filter((d) => d.division == slug);
    const slugData = matchSlugs.find((d) => d.name == slug);

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: slug, data: {}, type: "text", sender: "user" },
      {
        text: "",
        data: {
          actionBtns: filteredDiv.map((d) => d.name),
          text: slugData?.html_code || "",
        },
        type: "action",
        sender: "system",
      },
    ]);
  };

  useEffect(() => {
    fetchCorrespondents();
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return {
    messages,
    inputText,
    setInputText,
    filteredSlugs,
    handleSlugPress,
    sendMessage,
    flatListRef,
    fetchCorrespondents
  };
};

export default UseDataScreenHooks;
