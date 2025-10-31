import React from "react";
import { Dimensions, StyleSheet, View, Text } from "react-native";
import Svg, { 
  Rect, 
  Line, 
  Text as SvgText,
  G
} from "react-native-svg";

const defaultColors = [
  "rgb(16, 163, 127)",
  "rgb(23, 64, 84)",
  "#B5EAD7",
  "#FFDAC1",
  "#E2A9E5",
  "#FFC3A0",
  "#C7EFCF",
  "#F7C6C7",
  "#A2D2FF",
  "#FDCBBA",
];

const GroupedBarChart = ({ title, monthlyData }) => {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const baseFontSize = Math.min(screenWidth, screenHeight) * 0.025;
  const labelFontSize = baseFontSize * 0.8;

  if (!monthlyData || !monthlyData.data || !monthlyData.labels) {
    return <Text style={styles.errorText}>No Data Available</Text>;
  }

  const { data, labels } = monthlyData;
  const months = Object.keys(data[0]);

  const labelColors = {};
  labels.forEach((label, i) => {
    labelColors[label] = defaultColors[i % defaultColors.length];
  });

  // Chart dimensions
  const chartWidth = screenWidth - 32;
  const chartHeight = 300;
  const padding = { top: 10, right: 10, bottom: 60, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate max value for scaling
  const maxValue = Math.max(...data.flatMap((obj) => Object.values(obj))) * 1.1;

  // Bar dimensions
  const groupWidth = innerWidth / months.length;
  const barWidth = Math.min(40, (groupWidth - 10) / labels.length);
  const barSpacing = 2;

  // Y-axis configuration
  const numberOfYAxisLabels = 6;
  const yAxisLabels = Array.from({ length: numberOfYAxisLabels }, (_, i) => {
    const value = (maxValue / (numberOfYAxisLabels - 1)) * i;
    return Number(value).toFixed(1);
  });

  const getBarHeight = (value) => {
    return (value / maxValue) * innerHeight;
  };

  const getBarY = (value) => {
    return padding.top + innerHeight - getBarHeight(value);
  };

  const renderGridLines = () => {
    const gridLines = [];
    
    // Horizontal grid lines
    for (let i = 0; i < numberOfYAxisLabels; i++) {
      const y = padding.top + innerHeight - (i / (numberOfYAxisLabels - 1)) * innerHeight;
      gridLines.push(
        <Line
          key={`h-${i}`}
          x1={padding.left}
          y1={y}
          x2={chartWidth - padding.right}
          y2={y}
          stroke="rgba(23, 64, 84, 0.2)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      );
    }

    return gridLines;
  };

  const renderYAxisLabels = () => {
    return yAxisLabels.map((label, index) => {
      const y = padding.top + innerHeight - (index / (numberOfYAxisLabels - 1)) * innerHeight;
      return (
        <SvgText
          key={`y-label-${index}`}
          x={padding.left - 10}
          y={y + 4}
          fontSize={labelFontSize}
          fill="rgba(23, 64, 84, 1)"
          textAnchor="end"
        >
          {label}
        </SvgText>
      );
    });
  };

  const renderXAxisLabels = () => {
    return months.map((month, monthIndex) => {
      const x = padding.left + (monthIndex + 0.5) * groupWidth;
      return (
        <SvgText
          key={`x-label-${monthIndex}`}
          x={x}
          y={chartHeight - padding.bottom + 20}
          fontSize={labelFontSize}
          fill="rgba(23, 64, 84, 1)"
          textAnchor="middle"
        >
          {month}
        </SvgText>
      );
    });
  };

  const renderBars = () => {
    const bars = [];
    
    months.forEach((month, monthIndex) => {
      const groupX = padding.left + monthIndex * groupWidth;
      const groupCenterOffset = (groupWidth - (labels.length * barWidth + (labels.length - 1) * barSpacing)) / 2;
      
      labels.forEach((label, labelIndex) => {
        const value = data[labelIndex][month];
        const barHeight = getBarHeight(value);
        const barX = groupX + groupCenterOffset + labelIndex * (barWidth + barSpacing);
        const barY = getBarY(value);
        
        bars.push(
          <G key={`bar-${monthIndex}-${labelIndex}`}>
            <Rect
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill={labelColors[label]}
              rx={4}
              ry={4}
            />
            {/* Value label on top of bar */}
            <SvgText
              x={barX + barWidth / 2}
              y={barY - 5}
              fontSize={labelFontSize}
              fill="black"
              textAnchor="middle"
              fontWeight="bold"
            >
              {value}
            </SvgText>
          </G>
        );
      });
    });
    
    return bars;
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {renderGridLines()}
          
          {/* Y-axis */}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#174054"
            strokeWidth="2"
          />
          
          {/* X-axis */}
          <Line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#174054"
            strokeWidth="2"
          />
          
          {/* Y-axis labels */}
          {renderYAxisLabels()}
          
          {/* X-axis labels */}
          {renderXAxisLabels()}
          
          {/* Bars */}
          {renderBars()}
        </Svg>
      </View>

      <View style={styles.legendContainer}>
        {labels.map((label) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: labelColors[label] }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Dimensions.get("window").height * 0.02,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
    color: "#174054",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "red",
  },
  chartContainer: {
    // alignItems: "center",
    // backgroundColor: "#ffffff",
    // borderRadius: 8,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
    // padding: 10,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 1,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 5,
  },
  legendText: {
    fontSize: 14,
    color: "#174054",
  },
});

export default GroupedBarChart;