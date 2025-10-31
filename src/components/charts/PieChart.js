import React, { useState } from "react";
import { View, Text, useWindowDimensions, StyleSheet, TouchableOpacity } from "react-native";
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

const colors = [
  "rgb(16, 163, 127)", "rgb(23, 64, 84)", "#B5EAD7", "#FFDAC1", "#E2A9E5",
  "#FFC3A0", "#C7EFCF", "#F7C6C7", "#A2D2FF", "#FDCBBA",
];

const PieChartComponent = ({ title, data = [], labels = [], style }) => {
  const { width } = useWindowDimensions();
  const chartRadius = Math.min(width * 0.4, 150);
  const innerRadius = chartRadius * 0.55;
  const [focusedIndex, setFocusedIndex] = useState(-1);

// Pair data with labels and sort by value descending
const paired = data.map((item, index) => ({
  value: Number(item) || 0,
  label: labels[index] || "Unknown",
  originalIndex: index,
}));

// Sort and take top 10
const topTen = paired
  .sort((a, b) => b.value - a.value)
  .slice(0, 10);

// Re-map with color and text
const transformedData = topTen.map((item, i) => ({
  ...item,
  color: colors[i % colors.length],
  text: item.value.toFixed(2),
}));

  const hasValidData = transformedData.some(item => item.value > 0);
  const defaultData = [{
    value: 1,
    label: "No Data",
    color: "#D3D3D3",
    text: "0.00",
  }];

  const chartData = hasValidData ? transformedData : defaultData;
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  const createPath = (cx, cy, startAngle, endAngle, outerR, innerR) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;

    const x1 = cx + outerR * Math.cos(start);
    const y1 = cy + outerR * Math.sin(start);
    const x2 = cx + outerR * Math.cos(end);
    const y2 = cy + outerR * Math.sin(end);
    const x3 = cx + innerR * Math.cos(end);
    const y3 = cy + innerR * Math.sin(end);
    const x4 = cx + innerR * Math.cos(start);
    const y4 = cy + innerR * Math.sin(start);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", x1, y1,
      "A", outerR, outerR, 0, largeArcFlag, 1, x2, y2,
      "L", x3, y3,
      "A", innerR, innerR, 0, largeArcFlag, 0, x4, y4,
      "Z"
    ].join(" ");
  };

  const renderPieSegments = () => {
    const cx = chartRadius + 10;
    const cy = chartRadius + 10;
    let currentAngle = -90;

    return chartData.map((item, index) => {
      const angle = (item.value / totalValue) * 360;
      const endAngle = currentAngle + angle;
      const midAngle = currentAngle + angle / 2;
      const midRad = (midAngle * Math.PI) / 180;

      const labelRadius = chartRadius * 0.75;
      const labelX = cx + labelRadius * Math.cos(midRad);
      const labelY = cy + labelRadius * Math.sin(midRad);
      const percent = ((item.value / totalValue) * 100).toFixed(1);

      const path = createPath(
        cx, cy,
        currentAngle, endAngle,
        focusedIndex === index ? chartRadius + 5 : chartRadius,
        innerRadius
      );

      currentAngle = endAngle;

      return (
        <G key={index}>
          <Path
            d={path}
            fill={`url(#grad-${index})`}
            stroke="#fff"
            strokeWidth="2"
            onPress={() => setFocusedIndex(focusedIndex === index ? -1 : index)}
          />
          {item.value > 0 && (
            <SvgText
              x={labelX}
              y={labelY}
              fontSize={12}
              fill="#fff"
              textAnchor="middle"
              fontWeight="bold"
            >
              {percent}%
            </SvgText>
          )}
        </G>
      );
    });
  };

  const renderCenterContent = () => {
    const cx = chartRadius + 10;
    const cy = chartRadius + 10;

    if (!hasValidData) {
      return (
        <SvgText
          x={cx}
          y={cy}
          fontSize={16}
          fill="#999"
          textAnchor="middle"
          fontWeight="bold"
        >
          No Data
        </SvgText>
      );
    }

    if (focusedIndex !== -1) {
      const item = chartData[focusedIndex];
      return (
        <>
          <SvgText
            x={cx}
            y={cy - 5}
            fontSize={14}
            fill="#333"
            textAnchor="middle"
            fontWeight="bold"
          >
            {item.label}
          </SvgText>
          <SvgText
            x={cx}
            y={cy + 15}
            fontSize={14}
            fill="#888"
            textAnchor="middle"
          >
            {item.text}
          </SvgText>
        </>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {title && <Text style={[styles.title, { fontSize: width * 0.05 }]}>{title}</Text>}
      <View style={[styles.chartContainer, style]}>
        <Svg width={(chartRadius + 10) * 2} height={(chartRadius + 10) * 2}>
          <Defs>
            {chartData.map((item, index) => (
              <LinearGradient id={`grad-${index}`} key={index} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={item.color} stopOpacity="1" />
              </LinearGradient>
            ))}
          </Defs>

          {renderPieSegments()}

          <Circle
            cx={chartRadius + 10}
            cy={chartRadius + 10}
            r={innerRadius}
            fill="white"
            stroke="white"
            strokeWidth="2"
          />

          {renderCenterContent()}
        </Svg>

        <View style={styles.legendContainer}>
          {chartData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.legendItem,
                focusedIndex === index && styles.legendItemFocused
              ]}
              onPress={() => setFocusedIndex(focusedIndex === index ? -1 : index)}
            >
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { fontSize: width * 0.04 }]}>{item.label}</Text>
              <Text style={[styles.legendValue, { fontSize: width * 0.035 }]}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  chartContainer: {
    alignItems: "center",
    width: "100%",
  },
  legendContainer: {
    marginTop: 20,
    width: "90%",
    alignSelf: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    padding: 8,
    borderRadius: 8,
  },
  legendItemFocused: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    color: "#333",
    flex: 1,
  },
  legendValue: {
    color: "#666",
    marginLeft: 8,
  },
});

export default PieChartComponent;
