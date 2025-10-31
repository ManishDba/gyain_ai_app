import React from "react";
import { View, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { useSelector } from "react-redux";

const Loader = () => {
    const { loader } = useSelector((state) => state.loaderSlice);

    return (
        <Modal transparent={true} animationType="none" visible={loader}>
            <View style={styles.overlay}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#ff4e14" />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    spinnerContainer: {
        width: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: "white",
        // borderRadius: 10,
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.25,
        // shadowRadius: 4,
        elevation: 5,
    },
});

export default Loader;
