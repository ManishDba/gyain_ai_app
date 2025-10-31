import React from "react";
import { Dimensions, StyleSheet, View, Text, ScrollView } from "react-native";
import Svg, { 
  Rect, 
  Line, 
  Text as SvgText,
  G
} from "react-native-svg";

const colors = [
  "rgb(16, 163, 127)", "rgb(23, 64, 84)", "#B5EAD7", "#FFDAC1", "#E2A9E5",
  "#FFC3A0", "#C7EFCF", "#F7C6C7", "#A2D2FF", "#FDCBBA",
];

const BarChartComponent = ({ title, data = [], labels = [], chartConfig, style }) => {
  const screenWidth = Dimensions.get("window").width;

  const hasData = data.length > 0;
  
  // Chart dimensions
  const baseChartWidth = screenWidth - 32;
  const chartHeight = 300;
  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  
  // Bar dimensions
  const barWidth = 40;
  const spacing = 30;
  const minBarsToShow = 4; // Minimum number of bars to show before scrolling
  
  // Calculate dynamic chart width based on data length
  const chartData = hasData ? data : [0];
  const chartLabels = hasData ? labels : ["No Data"];
  
  const totalBarsWidth = chartData.length * barWidth + (chartData.length - 1) * spacing;
  const minChartWidth = minBarsToShow * barWidth + (minBarsToShow - 1) * spacing + padding.left + padding.right;
  
  // Use larger width if we have more data than minimum bars to show
  const chartWidth = Math.max(baseChartWidth, totalBarsWidth + padding.left + padding.right);
  const shouldScroll = chartData.length > minBarsToShow;
  
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Data processing
  const maxValue = hasData ? Math.max(...data) * 1.1 : 10;
  
  const startX = padding.left;

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

  const getLabelColor = (opacity = 1) => {
    if (chartConfig?.labelColor) {
      return chartConfig.labelColor(opacity);
    }
    return opacity === 1 ? "#174054" : `rgba(23, 64, 84, ${opacity})`;
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
          stroke={getLabelColor(0.2)}
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      );
    }

    // Vertical lines (optional, based on original config)
    if (chartConfig?.showVerticalLines !== false) {
      chartData.forEach((_, index) => {
        const x = startX + index * (barWidth + spacing) + barWidth / 2;
        gridLines.push(
          <Line
            key={`v-${index}`}
            x1={x}
            y1={padding.top}
            x2={x}
            y2={chartHeight - padding.bottom}
            stroke={getLabelColor(0.2)}
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        );
      });
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
          fontSize={12}
          fill={getLabelColor(1)}
          textAnchor="end"
        >
          {label}
        </SvgText>
      );
    });
  };

  const renderXAxisLabels = () => {
    return chartLabels.map((label, index) => {
      const x = startX + index * (barWidth + spacing) + barWidth / 2;
      
      // Handle long labels by potentially rotating or truncating
      const displayLabel = label.length > 8 ? label.substring(0, 8) + '...' : label;
      
      return (
        <SvgText
          key={`x-label-${index}`}
          x={x}
          y={chartHeight - padding.bottom + 20}
          fontSize={12}
          fill={getLabelColor(1)}
          textAnchor="middle"
        >
          {displayLabel}
        </SvgText>
      );
    });
  };

  const renderBars = () => {
    return chartData.map((value, index) => {
      const barHeight = getBarHeight(value);
      const barX = startX + index * (barWidth + spacing);
      const barY = getBarY(value);
      const barColor = hasData ? colors[index % colors.length] : "#d3d3d3";
      
      return (
        <G key={`bar-${index}`}>
          {/* Bar */}
          <Rect
            x={barX}
            y={barY}
            width={barWidth}
            height={barHeight}
            fill={barColor}
            rx={2}
            ry={2}
          />
          
          {/* Value label on top of bar */}
          {hasData && (
            <SvgText
              x={barX + barWidth / 2}
              y={barY - 8}
              fontSize={12}
              fill={getLabelColor(1)}
              textAnchor="middle"
              fontWeight="normal"
            >
              {Number(value).toFixed(2)}
            </SvgText>
          )}
        </G>
      );
    });
  };

  const renderChart = () => (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Grid lines */}
      {renderGridLines()}
      
      {/* Y-axis */}
      <Line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={chartHeight - padding.bottom}
        stroke={getLabelColor(1)}
        strokeWidth="2"
      />
      
      {/* X-axis */}
      <Line
        x1={padding.left}
        y1={chartHeight - padding.bottom}
        x2={chartWidth - padding.right}
        y2={chartHeight - padding.bottom}
        stroke={getLabelColor(1)}
        strokeWidth="2"
      />
      
      {/* Y-axis labels */}
      {renderYAxisLabels()}
      
      {/* X-axis labels */}
      {renderXAxisLabels()}
      
      {/* Bars */}
      {renderBars()}
    </Svg>
  );

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={[styles.chartContainer, style]}>
        {shouldScroll ? (
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {renderChart()}
          </ScrollView>
        ) : (
          renderChart()
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
    color: "#174054",
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
    // overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
});

export default BarChartComponent;