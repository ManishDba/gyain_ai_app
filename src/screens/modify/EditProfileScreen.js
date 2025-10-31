import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import useProfileHooks from '../../Hooks/ProfileHooks';

const EditProfileScreen = () => {
  


 const {profileState,profileUpdtaeSubmitHandler, handleCancel,profileChangeHandler,fetchProfile}=useProfileHooks()
      useEffect(() => {
      fetchProfile();
      }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          name="email"
          style={styles.input}
          state={profileState}
          onChangeText={profileChangeHandler}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          name="password"
          style={styles.input}
          state={profileState}
          editable={false} 
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name:</Text>
        <TextInput
          name="first_name"
          style={styles.input}
          state={profileState}
          onChangeText={profileChangeHandler}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          name="last_name"
          style={styles.input}
          state={profileState}
          onChangeText={profileChangeHandler}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Auth Token:</Text>
        <TextInput
          name="auth_token"
          style={styles.input}
          state={profileState}
          onChangeText={profileChangeHandler}
        />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={profileUpdtaeSubmitHandler}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    marginBottom: 10,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  buttonGroup: {
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#174054',
  },
  cancelButton: {
    backgroundColor: 'gray',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "400",
    color: '#fff',
  },
});

export default EditProfileScreen;
