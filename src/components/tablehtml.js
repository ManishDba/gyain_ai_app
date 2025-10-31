import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const CustomHtmlTable = ({
  heading = "",
  tableData = { Columns: [], Rows: [] },
  footerHeading = "",
  bulletPoints = [],
  paragraph = "",
}) => {
  return (
    <View style={styles.container}>
      {/* Heading */}
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}

      {/* Table */}
      {tableData.Columns.length > 0 && (
        <ScrollView horizontal style={styles.tableScroll}>
          <View style={styles.tableWrapper}>
            {/* Table Content */}
            <View style={styles.table}>
              {/* Header Row */}
              <View style={[styles.tableRow, styles.headerRow]}>
                {tableData.Columns.map((col, idx) => (
                  <View key={idx} style={[styles.cell, styles.headerCell, styles.cellBorder]}>
                    <Text style={styles.headerText}>{col.Name}</Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {tableData.Rows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.tableRow}>
                  {row.map((cell, cellIdx) => (
                    <View key={cellIdx} style={[styles.cell, styles.cellBorder]}>
                      <Text style={styles.cellText}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Footer Heading */}
      {footerHeading ? <Text style={styles.footerHeading}>{footerHeading}</Text> : null}

      {/* Bullet Points */}
      {bulletPoints.map((point, idx) => (
        <Text key={idx} style={styles.bullet}>
          • {point.replace(/<[^>]*>/g, "").trim()}
        </Text>
      ))}

      {/* Paragraph */}
      {paragraph ? <Text style={styles.paragraph}>{paragraph}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "left",
    color: "#000000",
  },
  tableScroll: {
    marginBottom: 16,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 4,
    overflow: "hidden",
  },
  table: {
    flexDirection: "column",
  },
  tableRow: {
    flexDirection: "row",
  },
  headerRow: {
    backgroundColor: "#d9d9d9",
  },
  cell: {
    width: 150,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  headerCell: {
    backgroundColor: "#e0e0e0",
  },
  cellBorder: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  headerText: {
    fontWeight: "bold",
    textAlign: "center",
    color: "#000000",
  },
  cellText: {
    textAlign: "center",
    color: "#000000",
  },
  footerHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 14,
    color: "#000000",
  },
  bullet: {
    marginLeft: 10,
    marginVertical: 2,
    fontSize: 15,
    color: "#000",
  },
  paragraph: {
    marginTop: 10,
    fontStyle: "italic",
    color: "#000000",
  },
});

export default CustomHtmlTable;
