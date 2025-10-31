import React from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView } from "react-native";
import Svg, { 
  Line, 
  Circle, 
  Text as SvgText, 
  Polyline, 
  Defs, 
  LinearGradient, 
  Stop 
} from "react-native-svg";

const LineChartComponent = ({ title, data = [], labels = [], style }) => {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const chartHeight = screenHeight * 0.4;
  const padding = 45;
  const innerHeight = chartHeight - padding * 2;

  // Dynamic width calculation based on data length
  const minPointSpacing = 60; // Minimum space between data points
  const minChartWidth = screenWidth * 0.9;
  const calculatedWidth = Math.max(minChartWidth, data.length * minPointSpacing + padding * 2);
  const chartWidth = calculatedWidth;
  const innerWidth = chartWidth - padding * 2;

  const baseFontSize = Math.min(screenWidth, screenHeight) * 0.025;
  const titleFontSize = baseFontSize * 1.5;
  const labelFontSize = baseFontSize * 0.8;

  const formattedData = data.map((value) => Number(Number(value).toFixed(2)));
  const maxValue = formattedData.length ? Math.max(...formattedData) : 1;
  const minValue = formattedData.length ? Math.min(...formattedData) : 0;
  const yAxisMax = Math.ceil(maxValue / 100) * 100 || 100;
  const yAxisMin = Math.floor(minValue / 100) * 100;

  const numberOfYAxisLabels = 5;
  const yAxisLabels = Array.from({ length: numberOfYAxisLabels }, (_, i) => {
    const value = yAxisMin + ((yAxisMax - yAxisMin) / (numberOfYAxisLabels - 1)) * i;
    return Number(value).toFixed(2);
  });

  // Calculate points for the line
  const getX = (index) => padding + (index / Math.max(1, data.length - 1)) * innerWidth;
  const getY = (value) => {
    const normalizedValue = (value - yAxisMin) / (yAxisMax - yAxisMin);
    return chartHeight - padding - normalizedValue * innerHeight;
  };

  const points = data.length
    ? data.map((value, index) => `${getX(index)},${getY(Number(value))}`).join(" ")
    : "";

  const renderGridLines = () => {
    const gridLines = [];
    
    // Horizontal grid lines
    for (let i = 0; i < numberOfYAxisLabels; i++) {
      const y = chartHeight - padding - (i / (numberOfYAxisLabels - 1)) * innerHeight;
      gridLines.push(
        <Line
          key={`h-${i}`}
          x1={padding}
          y1={y}
          x2={chartWidth - padding}
          y2={y}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      );
    }

    // Vertical grid lines
    if (data.length > 1) {
      for (let i = 0; i < data.length; i++) {
        const x = getX(i);
        gridLines.push(
          <Line
            key={`v-${i}`}
            x1={x}
            y1={padding}
            x2={x}
            y2={chartHeight - padding}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        );
      }
    }

    return gridLines;
  };

  const renderYAxisLabels = () => {
    return yAxisLabels.map((label, index) => {
      const y = chartHeight - padding - (index / (numberOfYAxisLabels - 1)) * innerHeight;
      return (
        <SvgText
          key={`y-label-${index}`}
          x={padding - 10}
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
    return labels.map((label, index) => {
      const x = getX(index);
      return (
        <SvgText
          key={`x-label-${index}`}
          x={x}
          y={chartHeight - padding + 20}
          fontSize={labelFontSize}
          fill="rgba(23, 64, 84, 1)"
          textAnchor="middle"
          transform={`rotate(45, ${x}, ${chartHeight - padding + 40})`}
        >
          {label}
        </SvgText>
      );
    });
  };

  const renderDataPoints = () => {
    if (!data.length) return null;
    
    return data.map((value, index) => {
      const x = getX(index);
      const y = getY(Number(value));
      
      return (
        <React.Fragment key={`point-${index}`}>
          <Circle
            cx={x}
            cy={y}
            r={Math.max(4, screenWidth * 0.01)}
            fill="#174054"
          />
          <SvgText
            x={x + 25} 
            y={y + 10}
            fontSize={labelFontSize}
            fill="black"
            textAnchor="middle"
          >
            {Number(value).toFixed(2)}
          </SvgText>
        </React.Fragment>
      );
    });
  };

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { fontSize: titleFontSize }]}>{title}</Text>
      )}
      <View style={[styles.chartContainer, style]}>
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          <View style={styles.chart}>
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#2e8bc0" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#174054" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              
              {/* Grid lines */}
              {renderGridLines()}
              
              {/* Axes */}
              <Line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={chartHeight - padding}
                stroke="rgba(23, 64, 84, 1)"
                strokeWidth="2"
              />
              <Line
                x1={padding}
                y1={chartHeight - padding}
                x2={chartWidth - padding}
                y2={chartHeight - padding}
                stroke="rgba(23, 64, 84, 1)"
                strokeWidth="2"
              />
              
              {/* Y-axis labels */}
              {renderYAxisLabels()}
              
              {/* X-axis labels */}
              {renderXAxisLabels()}
              
              {/* Line chart */}
              {data.length > 1 && (
                <Polyline
                  points={points}
                  fill="none"
                  stroke="#174054"
                  strokeWidth="2"
                />
              )}
              
              {/* Data points */}
              {renderDataPoints()}
            </Svg>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: Dimensions.get("window").height * 0.02,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "500",
    textAlign: "center",
    marginBottom: Dimensions.get("window").height * 0.02,
    color: "#333",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Dimensions.get("window").width * 0.02,
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  chart: {
    // borderRadius: 16,
    // backgroundColor: "#ffffff",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 5,
    // padding: 15,
  },
});

export default LineChartComponent;