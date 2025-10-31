import React from "react";
import { Provider, useSelector } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// ✅ Only the imports you requested
import LoginScreen from "./src/screens/LoginScreen";
import DataScreen from "./src/screens/DataScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MainLayout from "./src/components/MainLayout";
import HeaderOnlyLayout from "./src/components/HeaderOnlyLayout";
import store from "./src/store";
import Loader from "./src/components/Loader";
import BotCategory from "./src/screens/BotCategory";
import SplashScreen from "./src/screens/SplashScreen";
import PdfViewerScreen from "./src/components/PdfViewerScreen";
import { NativeModules } from "react-native";
console.log("Loaded native modules:", Object.keys(NativeModules));

const Stack = createStackNavigator();

const screens = [
  { name: "DataScreen", component: DataScreen },
  { name: "BotCategory", component: BotCategory },
];

const AppContent = () => {
  const isLoading = useSelector((state) => state.loaderSlice);

  return (
    <>
      {isLoading && <Loader />}
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{ headerShown: false, animationEnabled: false }}
        >
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />

          {screens.map(({ name, component }) => (
            <Stack.Screen key={name} name={name}>
              {({ route }) => (
                <MainLayout route={route}>
                  {React.createElement(component, { route })}
                </MainLayout>
              )}
            </Stack.Screen>
          ))}

          <Stack.Screen name="Profile">
            {() => (
              <HeaderOnlyLayout>
                <ProfileScreen />
              </HeaderOnlyLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="PdfViewerScreen">
            {({ route, navigation }) => (
              <HeaderOnlyLayout>
                <PdfViewerScreen route={route} navigation={navigation} />
              </HeaderOnlyLayout>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;
