import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ScrollView,
  PanResponder,
  Animated,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Rect,
  Text as SvgText,
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { LineChart, BarChart, PieChart } from "react-native-gifted-charts";

const getMaxValue = (data) =>
  Math.max(...data.flatMap((ds) => ds.data.map((d) => d.value)));

const getMinValue = (data) =>
  Math.min(...data.flatMap((ds) => ds.data.map((d) => d.value)));

const formatValue = (value) => {
  if (value >= 10000000) return (value / 10000000).toFixed(1) + " Cr"; // Crore (1,00,00,000)
  if (value >= 100000) return (value / 100000).toFixed(1) + " L";      // Lakh (1,00,000)
  if (value >= 1000) return (value / 1000).toFixed(1) + " K";          // Thousand (1,000)
  return value.toString();
};
// Function to calculate nice Y-axis steps
const calculateYAxisSteps = (maxValue, minValue = 0, sections = 10) => {
  const absMax = Math.max(Math.abs(maxValue), Math.abs(minValue));
  const range = absMax * 2; // Center around zero
  const roughStep = range / sections;

  // Find the magnitude of the step
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));

  // Normalize the step to 1, 2, or 5 times the magnitude
  let normalizedStep = roughStep / magnitude;
  if (normalizedStep <= 1) normalizedStep = 1;
  else if (normalizedStep <= 2) normalizedStep = 2;
  else if (normalizedStep <= 5) normalizedStep = 5;
  else normalizedStep = 10;

  const step = normalizedStep * magnitude;
  const adjustedMax = Math.ceil(absMax / step) * step;
  const adjustedMin = -adjustedMax; // Symmetric around zero

  return {
    step,
    min: adjustedMin,
    max: adjustedMax,
    sections: Math.round((adjustedMax - adjustedMin) / step),
  };
};

// Zoomable Container Component
const ZoomableContainer = ({ children, initialWidth }) => {
  const scaleAnim = new Animated.Value(1);
  const translateAnim = new Animated.Value(0);
  const [isZooming, setIsZooming] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);

  const resetToOriginalPosition = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateAnim, {
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

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to pinch gestures (2 fingers) or significant horizontal movement when zoomed
      return (
        evt.nativeEvent.touches.length === 2 ||
        (Math.abs(gestureState.dx) > 10 && isZooming)
      );
    },
    onPanResponderGrant: (evt) => {
      const currentTime = Date.now();
      setLastTouchTime(currentTime);

      if (evt.nativeEvent.touches.length === 2) {
        setIsZooming(true);
        setShowZoomIndicator(true);
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (evt.nativeEvent.touches.length === 2) {
        // Pinch to zoom
        const touches = evt.nativeEvent.touches;
        const distance = Math.sqrt(
          Math.pow(touches[0].pageX - touches[1].pageX, 2) +
            Math.pow(touches[0].pageY - touches[1].pageY, 2)
        );

        // Calculate scale based on distance (adjust the divisor to control sensitivity)
        const newScale = Math.max(0.8, Math.min(distance / 150, 3));
        scaleAnim.setValue(newScale);
        setCurrentScale(newScale);

        // Allow panning when zoomed
        if (newScale > 1.2) {
          const panX = gestureState.dx * 0.5; // Reduce sensitivity
          translateAnim.setValue(panX);
        }
      } else if (isZooming && evt.nativeEvent.touches.length === 1) {
        // Allow panning with single finger when already zoomed
        const panX = gestureState.dx * 0.8;
        translateAnim.setValue(panX);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTouchTime;

      // Auto-reset after a short delay when user stops interacting
      setTimeout(() => {
        resetToOriginalPosition();
      }, 800); // Wait 800ms before auto-reset
    },
    onPanResponderTerminate: () => {
      // Reset when gesture is interrupted
      resetToOriginalPosition();
    },
  });

  return (
    <View style={styles.zoomContainer} {...panResponder.panHandlers}>
      {showZoomIndicator && (
        <Text style={styles.zoomIndicator}>{currentScale.toFixed(1)}x</Text>
      )}
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }, { translateX: translateAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// Updated color palette with vibrant tones
const colors = [
"#052C6B",
"#2D9FE6",
"#227481",
"#5AC48F",
"#ABC856",
"#FFD747",
"#F58B00",
"#A44813",
"#7D1212",
"#53284E",
"#0A53CA",
"#62B7ED",
"#34B2C5",
"#83D2AB",
"#C0D680",
"#FFE175",
"#FFA938",
"#E56B24",
"#CD1D1D",
"#94478C",
"#3981F6",
"#92CDF2",
"#6FCBD9",
"#A8E0C4",
"#D3E2A6",
"#FFEA9F",
"#FFC374",
"#ED9766",
"#E75656",
"#BD76B6",
];

// LineChartComponent with zoom functionality
const LineChartComponent = ({ title, chartData }) => {
  const maxValue = Math.max(...chartData.data.map((item) => item.value));
  const minValue = Math.min(...chartData.data.map((item) => item.value));
  const yAxisConfig = calculateYAxisSteps(maxValue, minValue);

  // Extract axis labels from the first data item
  const xAxisLabel = chartData.data[0]?.xAxisLabel || "Dates";
  const yAxisLabel = chartData.data[0]?.yAxisLabel || "Values";

  const transformedData = chartData.data.map((item) => ({
    value: item.value,
    label: item.label.length > 8 ? item.label.substring(0, 8) + "..." : item.label,
    dataPointText: formatValue(item.value),
  }));

  const baseWidth = Math.max(
    Dimensions.get("window").width - 80,
    transformedData.length * 50 + 50
  );

  return (
    <View style={styles.chartContainer}>
      {/* Y-Axis Label (Vertical) */}
      <View style={styles.chartWithXAxis}>
        <View style={styles.yAxisLabelContainer}>
          <Text style={styles.axisLabelText}>
            {yAxisLabel}
          </Text>
        </View>
        <ZoomableContainer initialWidth={baseWidth}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <LineChart
              data={transformedData}
              width={baseWidth}
              height={300}
              color={colors[0]}
              thickness={3}
              startFillColor={colors[0] + "33"}
              endFillColor={colors[0] + "05"}
              startOpacity={0.4}
              endOpacity={0.1}
              initialSpacing={20}
              noOfSections={yAxisConfig.sections}
              stepValue={yAxisConfig.step}
              maxValue={yAxisConfig.max}
              minValue={yAxisConfig.min} // Explicitly set minValue
              yAxisOffset={0} // Zero is at the x-axis
              yAxisTextStyle={styles.yAxisText}
              xAxisLabelTextStyle={styles.xAxisText}
              showDataPointsForMissingData={false}
              showTextOnFocus={false}
              showDataPointLabelOnFocus={false}
              hideDataPoints={false}
              dataPointsColor={colors[0]}
              dataPointsRadius={5}
              textShiftY={1}
              textShiftX={14}
              textColor="black"
              textFontSize={11}
              showValuesAsDataPointsText
              focusEnabled={false}
              verticalLinesColor={"rgba(0,0,0,0.1)"}
              backgroundColor={"transparent"}
              rulesColor={"rgba(0,0,0,0.1)"}
              rulesType="solid"
              yAxisColor={"rgba(0,0,0,0.2)"}
              xAxisColor={"rgba(0,0,0,0.2)"}
              yAxisLabelWidth={60}
              showFractionalValues={false}
              formatYLabel={(value) => formatValue(value)}
              referenceLine1Position={0}
              referenceLine1Config={{
                color: "#000000",
                thickness: 2,
                dashWidth: 0, // Solid line
              }}
            />
          </ScrollView>
        </ZoomableContainer>
        {/* X-Axis Label */}
        <Text style={[styles.axisLabelText, styles.xAxisLabel]}>
          {xAxisLabel}
        </Text>
      </View>
    </View>
  );
};

// BarChartComponent with dynamic bar width based on data count
const BarChartComponent = ({ title, chartData }) => {
  const maxValue = Math.max(...chartData.data.map((item) => item.value));
  const minValue = Math.min(...chartData.data.map((item) => item.value));
  const yAxisConfig = calculateYAxisSteps(maxValue, minValue);

  // Extract axis labels from the first data item
  const xAxisLabel = chartData.data[0]?.xAxisLabel || "";
  const yAxisLabel = chartData.data[0]?.yAxisLabel || "";

  // Dynamic bar width calculation based on number of data points
  const dataCount = chartData.data.length;
  const screenWidth = Dimensions.get("window").width - 80;
  
  let barWidth, spacing, initialSpacing;
  
  if (dataCount <= 3) {
    // Very few bars - make them very wide
    barWidth = 120;
    spacing = 40;
    initialSpacing = 40;
  } else if (dataCount <= 4) {
    // Few bars (3-4) - make them wider
    barWidth = 80;
    spacing = 20;
    initialSpacing = 30;
  } else if (dataCount <= 6) {
    // Medium number of bars
    barWidth = 60;
    spacing = 15;
    initialSpacing = 20;
  } else {
    // Many bars - use default width
    barWidth = 50;
    spacing = 2;
    initialSpacing = 10;
  }

  const transformedData = chartData.data.map((item, index) => ({
    value: item.value,
    label: item.label.length > 8 ? item.label.substring(0, 8) + "..." : item.label,
    topLabelComponent: () => (
      <Text style={styles.barTopLabel}>{formatValue(item.value)}</Text>
    ),
    frontColor: colors[index % colors.length],
  }));

  // Calculate width based on bar width, spacing, and data count
  const calculatedWidth = (barWidth + spacing) * dataCount + initialSpacing * 2;
  const baseWidth = Math.max(screenWidth, calculatedWidth + 60);

  return (
    <View style={styles.chartContainer}>
      {/* Y-Axis Label (Vertical) */}

      <View style={styles.chartWithXAxis}>
      <View style={styles.yAxisLabelContainer}>
        <Text style={styles.axisLabelText}>
          {yAxisLabel}
        </Text>
      </View>
        <ZoomableContainer initialWidth={baseWidth}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <BarChart
              data={transformedData}
              width={baseWidth}
              height={300}
              barWidth={barWidth}
              spacing={spacing}
              hideRules={false}
              yAxisTextStyle={styles.yAxisText}
              noOfSections={yAxisConfig.sections}
              stepValue={yAxisConfig.step}
              maxValue={yAxisConfig.max}
              minValue={yAxisConfig.min}
              yAxisOffset={0}
              backgroundColor={"transparent"}
              rulesColor={"rgba(0,0,0,0.1)"}
              yAxisColor={"rgba(0,0,0,0.2)"}
              xAxisColor={"rgba(0,0,0,0.2)"}
              initialSpacing={initialSpacing}
              showFractionalValues={false}
              showYAxisIndices
              hideOrigin={false}
              yAxisLabelWidth={60}
              formatYLabel={(value) => formatValue(value)}
              referenceLine1Position={0}
              referenceLine1Config={{
                color: "#000000",
                thickness: 2,
                dashWidth: 0,
              }}
            />
          </ScrollView>
        </ZoomableContainer>
        <Text style={[styles.axisLabelText, styles.xAxisLabel]}>
          {xAxisLabel}
        </Text>
        {/* X-Axis Label */}
      </View>
    </View>
  );
};

// PieChartComponent with zoom functionality
const PieChartComponent = ({ title, chartData }) => {
  const [selectedSlice, setSelectedSlice] = useState(null);

  // Separate positive and negative values
  const positiveData = chartData.data
    .filter((item) => item.value >= 0)
    .map((item) => ({ ...item, isPositive: true }));
  const negativeData = chartData.data
    .filter((item) => item.value < 0)
    .map((item) => ({
      ...item,
      value: Math.abs(item.value), // Use absolute value for pie chart
      isPositive: false,
    }));

  // Validate data
  const hasValidData = positiveData.length > 0 || negativeData.length > 0;
  if (!hasValidData) {
    return <Text style={styles.noDataText}>No valid data available</Text>;
  }

  // Combine positive and negative data for pie chart
  const transformedData = [
    ...positiveData.map((item, index) => ({
      value: item.value,
      color: colors[index % colors.length], // Blue tones for positive
      text: `${(item.value)}`,
      fullText: `${item.text}: (${(item.value)})`,
      label: item.text,
      isPositive: true,
      onPress: () => setSelectedSlice({
        text: item.text,
        value: item.value,
        color: colors[index % colors.length], // Store assigned color
        isPositive: true,
      }),
    })),
    ...negativeData.map((item, index) => ({
      value: item.value,
      color: colors[(index + positiveData.length) % colors.length], // Red tones for negative
      text: `${item.text}:${(-item.value)}`, // Show original negative value
      fullText: `${item.text}: (${(-item.value)})`,
      label: item.text,
      isPositive: false,
      onPress: () => setSelectedSlice({
        text: item.text,
        value: -item.value, // Store original negative value
        color: colors[(index + positiveData.length) % colors.length], // Store assigned color
        isPositive: false,
      }),
    })),
  ];

  // Calculate totals
  const positiveTotal = positiveData.reduce((sum, item) => sum + item.value, 0);
  const negativeTotal = negativeData.reduce((sum, item) => sum + Math.abs(item.value), 0);
  const netTotal = positiveTotal - negativeTotal;

  return (
    <View style={styles.chartContainer}>
      <ZoomableContainer initialWidth={Dimensions.get("window").width - 80}>
        <View style={styles.pieLegendContainer}>
          {transformedData.map((item, index) => (
            <View key={index} style={styles.pieLegendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: item.color }]}
              />
              <Text style={styles.pieLegendText}>
                {item.fullText}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.pieChartWrapper}>
          <PieChart
            data={transformedData}
            radius={150}
            innerRadius={60}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={styles.centerLabelText}>Net Total</Text>
                <Text style={styles.centerLabelValue}>
                  {formatValue(netTotal)}
                </Text>
              </View>
            )}
            textColor="#000"
            textSize={12}
            fontWeight="bold"
            labelsPosition="onBorder"
          />

          {selectedSlice && (
            <View style={styles.tooltip}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: selectedSlice.color },
                ]}
              />
              <Text style={styles.tooltipText}>
                {selectedSlice.text}: {(selectedSlice.value)}
              </Text>
            </View>
          )}
        </View>
      </ZoomableContainer>
    </View>
  );
};


// MultiLineChartComponent with zoom functionality
const MultiLineChartComponent = ({ title, chartData }) => {
  if (
    !chartData?.data?.length ||
    !chartData.data.every(
      (ds) => ds.color && ds.label && Array.isArray(ds.data)
    )
  ) {
    return <Text style={styles.noDataText}>Invalid or no data available</Text>;
  }

  const maxValue = getMaxValue(chartData.data);
  const minValue = Math.min(0, getMinValue(chartData.data));
  const yAxisConfig = calculateYAxisSteps(maxValue, minValue);
  const chartWidth = Dimensions.get("window").width - 80;
  const maxDataLength = Math.max(
    ...chartData.data.map((dataset) => dataset.data.length)
  );

  const LABEL_MAX_LENGTH = 10;
  const POINT_WIDTH = 60;

  const dataSet = chartData.data.map((dataset, index) => {
    const validData = dataset.data
      .map((item) => ({
        value: typeof item.value === "number" ? item.value : 0,
        label: item.label || "N/A",
      }))
      .filter((item) => typeof item.value === "number");
    return {
      data: validData.map((item) => ({
        value: item.value,
        label:
          item.label.length > LABEL_MAX_LENGTH
            ? item.label.substring(0, LABEL_MAX_LENGTH) + "..."
            : item.label,
        dataPointText: formatValue(item.value),
      })),
      color: dataset.color || "#000000",
      dataPointsColor: dataset.color || "#000000",
      textColor: dataset.color || "#000000",
      strokeWidth: 3,
      startFillColor: (dataset.color || "#000000") + "33",
      endFillColor: (dataset.color || "#000000") + "05",
      startOpacity: 0.4,
      endOpacity: 0.1,
    };
  });

  const LEGEND_ITEM_WIDTH = Math.min(120, chartWidth / 2);
  const LEGEND_ITEMS_PER_ROW = Math.floor(chartWidth / LEGEND_ITEM_WIDTH);

  return (
    <View style={styles.chartContainer}>
      <ZoomableContainer
        initialWidth={Math.max(chartWidth, maxDataLength * POINT_WIDTH)}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <FlatList
              data={chartData.data}
              keyExtractor={(_, index) => `legend-${index}`}
              numColumns={LEGEND_ITEMS_PER_ROW}
              initialNumToRender={LEGEND_ITEMS_PER_ROW}
              windowSize={5}
              renderItem={({ item, index }) => (
                <View
                  style={[styles.legendItem, { width: LEGEND_ITEM_WIDTH }]}
                  accessible
                  accessibilityLabel={`Legend for ${item.label}`}
                >
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: item.color },
                    ]}
                    accessible
                    accessibilityLabel={`Color indicator for ${item.label}`}
                  />
                  <Text style={styles.legendText}>
                    {item.label || `Series ${index + 1}`}
                  </Text>
                </View>
              )}
              style={{
                width: Math.max(chartWidth, maxDataLength * POINT_WIDTH),
              }}
            />
            <LineChart
              dataSet={dataSet}
              width={Math.max(chartWidth, maxDataLength * POINT_WIDTH)}
              height={300}
              initialSpacing={20}
              noOfSections={yAxisConfig.sections}
              stepValue={yAxisConfig.step}
              maxValue={yAxisConfig.max}
              minValue={yAxisConfig.min} // Explicitly set minValue
              yAxisOffset={0} // Zero is at the x-axis
              showDataPointsForMissingData={false}
              showTextOnFocus={false}
             thornDataPointLabelOnFocus={false}
              hideDataPoints={false}
              dataPointsRadius={5}
              textShiftY={1}
              textShiftX={14}
              textFontSize={11}
              textColor="white"
              focusEnabled={false}
              showValuesAsDataPointsText
              verticalLinesColor={"rgba(0,0,0,0.1)"}
              backgroundColor={"transparent"}
              rulesColor={"rgba(0,0,0,0.1)"}
              rulesType="solid"
              yAxisColor={"rgba(0,0,0,0.2)"}
              xAxisColor={"rgba(0,0,0,0.2)"}
              yAxisTextStyle={styles.yAxisText}
              xAxisLabelTextStyle={styles.xAxisText}
              adjustToWidth={false}
              yAxisLabelWidth={60}
              showFractionalValues={false}
              formatYLabel={(value) => formatValue(value)}
              referenceLine1Position={0}
              referenceLine1Config={{
                color: "#000000",
                thickness: 2,
                dashWidth: 0, // Solid line
              }}
            />
          </View>
        </ScrollView>
      </ZoomableContainer>
    </View>
  );
};

// MultiBarChartComponent with zoom functionality
const MultiBarChartComponent = ({ title, chartData }) => {
  if (
    !chartData?.data?.length ||
    !chartData.data.every(
      (ds) => ds.color && ds.label && Array.isArray(ds.data)
    )
  ) {
    return <Text style={styles.noDataText}>Invalid or no data available</Text>;
  }

  const maxValue = getMaxValue(chartData.data);
  const minValue = Math.min(0, getMinValue(chartData.data));
  const yAxisConfig = calculateYAxisSteps(maxValue, minValue);
  const chartWidth = Dimensions.get("window").width - 80;

  // Calculate total number of bars and groups
  const maxDataLength = Math.max(
    ...chartData.data.map((dataset) => dataset.data.length)
  );
  const numberOfDatasets = chartData.data.length;
  const totalBars = maxDataLength * numberOfDatasets;

  // Dynamic bar width and spacing calculation
  let barWidth, spacing, initialSpacing, groupSpacing;
  
  if (maxDataLength <= 3) {
    // Very few groups - make bars very wide
    barWidth = 60;
    spacing = 8;
    groupSpacing = 25;
    initialSpacing = 30;
  } else if (maxDataLength <= 4) {
    // Few groups (3-4) - make bars wider
    barWidth = 45;
    spacing = 6;
    groupSpacing = 20;
    initialSpacing = 25;
  } else if (maxDataLength <= 6) {
    // Medium number of groups
    barWidth = 35;
    spacing = 4;
    groupSpacing = 15;
    initialSpacing = 20;
  } else {
    // Many groups - use smaller bars
    barWidth = 30;
    spacing = 2;
    groupSpacing = 10;
    initialSpacing = 10;
  }

  const barData = [];
  chartData.data.forEach((dataset, datasetIndex) => {
    dataset.data.forEach((item, itemIndex) => {
      barData.push({
        value: item.value,
        label:
          item.label.length > 6
            ? item.label.substring(0, 20) + "..."
            : item.label,
        frontColor: colors[datasetIndex % colors.length],
        spacing: datasetIndex === 0 ? groupSpacing : spacing,
        labelWidth: Math.max(50, barWidth + 10),
        labelTextStyle: styles.xAxisText,
        topLabelComponent: () => {
          const val = formatValue(item.value);
          return val === "0" || val === 0 ? null : (
            <Text style={styles.barTopLabel}>{val}</Text>
          );
        },
      });
    });
  });

  const LEGEND_ITEM_WIDTH = Math.min(120, chartWidth / 2);
  const LEGEND_ITEMS_PER_ROW = Math.floor(chartWidth / LEGEND_ITEM_WIDTH);
  
  // Calculate chart width based on bar dimensions
  const calculatedWidth = (barWidth + spacing) * totalBars + 
                          (groupSpacing - spacing) * maxDataLength + 
                          initialSpacing * 2;
  const finalChartWidth = Math.max(chartWidth, calculatedWidth + 60);

  return (
    <View style={styles.chartContainer}>
      <ZoomableContainer initialWidth={finalChartWidth}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <FlatList
              data={chartData.data}
              keyExtractor={(_, index) => `legend-${index}`}
              numColumns={LEGEND_ITEMS_PER_ROW}
              initialNumToRender={LEGEND_ITEMS_PER_ROW}
              windowSize={5}
              renderItem={({ item, index }) => (
                <View
                  style={[styles.legendItem, { width: LEGEND_ITEM_WIDTH }]}
                  accessible
                  accessibilityLabel={`Legend for ${item.label}`}
                >
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: item.color || colors[index % colors.length] },
                    ]}
                    accessible
                    accessibilityLabel={`Color indicator for ${item.label}`}
                  />
                  <Text style={styles.legendText}>
                    {item.label || `Series ${index + 1}`}
                  </Text>
                </View>
              )}
              style={{
                width: finalChartWidth,
              }}
            />
            <BarChart
              data={barData}
              width={finalChartWidth}
              height={300}
              barWidth={barWidth}
              spacing={spacing}
              hideRules={false}
              yAxisTextStyle={styles.yAxisText}
              xAxisLabelTextStyle={styles.xAxisText}
              noOfSections={yAxisConfig.sections}
              stepValue={yAxisConfig.step}
              maxValue={yAxisConfig.max}
              minValue={yAxisConfig.min}
              yAxisOffset={0}
              backgroundColor={"transparent"}
              rulesColor={"rgba(0,0,0,0.1)"}
              yAxisColor={"rgba(0,0,0,0.2)"}
              xAxisColor={"rgba(0,0,0,0.2)"}
              initialSpacing={initialSpacing}
              showFractionalValues={false}
              showYAxisIndices
              hideOrigin={false}
              yAxisLabelWidth={60}
              formatYLabel={(value) => formatValue(value)}
              showValuesAsTopLabel={false}
              capThickness={0}
              capRadius={0}
              disableScroll={false}
              referenceLine1Position={0}
              referenceLine1Config={{
                color: "#000000",
                thickness: 2,
                dashWidth: 0,
              }}
            />
          </View>
        </ScrollView>
      </ZoomableContainer>
    </View>
  );
};
// Enhanced styles with zoom container
const styles = StyleSheet.create({
  chartContainer: {
    // backgroundColor: '#ffffff',
    // borderRadius: 12,
    // padding: 16,
    // marginVertical: 12,
    // marginHorizontal: 12,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    // elevation: 6,
    // borderWidth: 1,
    // borderColor: 'rgba(0,0,0,0.05)',
  },
  zoomContainer: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  zoomIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: 8,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
    zIndex: 1000,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 16,
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  yAxisText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  xAxisText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },
  barTopLabel: {
    fontSize: 11,
    color: "#1F2937",
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 6,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabelText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  centerLabelValue: {
    fontSize: 18,
    color: "#1F2937",
    fontWeight: "bold",
  },
  pieLegendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 1,
    paddingTop: 1,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    width: "48%",
    marginRight: "2%",
  },
  pieLegendText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
    flexShrink: 1,
  },
    centerLabelSubText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "500",
    marginTop: 4,
  },
  tooltip: {
    backgroundColor: "#FFFFFF", // White fill color for the tooltip box
    borderColor: "#D1D5DB", // Light gray border
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    flexDirection: "row", // Align dot and text horizontally
    alignItems: "center", // Vertically center the content
  },
  dot: {
    width: 15,
    height: 15,   
    borderRadius: 5, // Half of width/height for a circular shape
    marginRight: 6, // Space between dot and text
  },
  tooltipText: {
    fontSize: 14,
    color: "#1F2937", // Dark gray for high contrast
    fontWeight: "normal",
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 20,
  },
   yAxisLabelContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom:20,
  },
  chartWithXAxis: {
    // flex: 1,
    // alignItems: "center",
  },
  xAxisLabel: {
    marginTop: 20,
  },
  axisLabelText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  yAxisText: {
    fontSize: 12,
    color: "#333",
  },
});

const Allchart = () => {
  return {
    MultiLineChartComponent,
    MultiBarChartComponent,
    LineChartComponent,
    BarChartComponent,
    PieChartComponent,
  };
};

export default Allchart;
