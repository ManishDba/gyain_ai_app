import { useState, useEffect, useRef } from 'react';
import { View, Text, Dimensions } from "react-native";
import Pdf from "react-native-pdf";
import axios from "../../services/axios";
import { Buffer } from "buffer";
import { ENV } from "../../env";
 
const PdfViewerScreen = ({ route }) => {
  const { url } = route.params;
 
  const [pdfBase64, setPdfBase64] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
 
  const pdfRef = useRef();
  const initialPageRef = useRef(null);
 
  const normalizedUrl =
    url.startsWith("about://") ? url.replace("about://", ENV.PDF_URL) : url;
 
  useEffect(() => {
    const fetchPdf = async () => {
      try {
        // Extract page number if present (#page=17)
        const pageMatch = url.match(/#page=(\d+)/);
        if (pageMatch) {
          initialPageRef.current = parseInt(pageMatch[1], 10);
        }
 
        const cleanUrl = normalizedUrl.split("#")[0];
        console.log("Fetching PDF from:", cleanUrl);
 
        const response = await axios.get(cleanUrl, {
          responseType: "arraybuffer",
        });
 
        console.log("PDF response size (bytes):", response.data.byteLength);
 
        const base64 = Buffer.from(response.data).toString("base64");
        setPdfBase64(`data:application/pdf;base64,${base64}`);
      } catch (err) {
        console.error("PDF fetch error:", err.message);
        setError(`Failed to load PDF: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
 
    fetchPdf();
  }, [normalizedUrl]);
 
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", fontSize: 16 }}>{error}</Text>
      </View>
    );
  }
 
  if (loading || !pdfBase64) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading PDF, please wait...</Text>
      </View>
    );
  }
 
  return (
    <View style={{ flex: 1 }}>
      <Pdf
        ref={pdfRef}
        source={{ uri: pdfBase64 }}
        style={{ flex: 1, width: Dimensions.get("window").width }}
        trustAllCerts={false}
        horizontal={false}
        enablePaging={false} // smooth continuous scroll
 
        onLoadComplete={(numPages) => {
          setTotalPages(numPages);
 
          // Jump only once
          if (initialPageRef.current) {
            pdfRef.current.setPage(initialPageRef.current);
            initialPageRef.current = null;
          }
        }}
 
        onPageChanged={(curr) => {
          setCurrentPage(curr); // only UI update (no rerender of PDF)
        }}
 
        onError={(err) => {
          setError("Failed to load PDF: " + err.message);
        }}
      />
 
      {/* Page Counter */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          alignSelf: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 14 }}>
          Page {currentPage} of {totalPages}
        </Text>
      </View>
    </View>
  );
};
 
export default PdfViewerScreen;