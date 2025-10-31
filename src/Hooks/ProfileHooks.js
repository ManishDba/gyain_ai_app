"use client"
import { useState } from "react"
import axios from "../../services/axios";
import { useNavigation } from "@react-navigation/native"
import changeHandlerHelper from "./helper/changeHandler"
import endpoint from "../../services/endpoint"
import { encode } from "base-64"
import { useDispatch } from "react-redux";
import {setUserDetails} from "../reducers/auth.slice"

const initialProfileState={
    first_name:"",
    last_name:"",
    email:"",
    password:"",
    auth_token:"",
    social_accounts: [],
    has_usable_password:true
}
const useProfileHooks = ()=>{   
    const navigation =useNavigation()
    const dispatch = useDispatch();

    const[profileState,setProfileState]=useState({...initialProfileState})
    const [data, setData] = useState([]);


    const fetchProfile = async () => {
        try {
          const response = await axios.get(endpoint.profile());
          dispatch(setUserDetails(response.data));
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      };
      const profileUpdtaeSubmitHandler = async () => {
        const updatedProfile = {
        ...initialProfileState
        };
    
        try {
          const response = await axios.patch(endpoint.profile(), updatedProfile);
          if (response.status === 200) {
            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
          }
        } catch (error) {
          console.error('Failed to update profile:', error);
          Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
      };


      const fetchData = async () => {
          try {
            const response = await axios.get(endpoint.dasbobards(),
            );
            setData(response.data);
          } catch (error) {
            console.error("Error fetching data:", error);
          }
        };

          const handleToggle = async (id, isEnabled) => {
            try {
              const auth = encode("dmsadmin:Welcome@123");
              const updatedStatus = !isEnabled;
              const item = data.find((item) => item.id === id);
              const payload = {
                ...item,
                notify: updatedStatus,
              };

              await axios.put(endpoint.dasbobardsByid(id), payload);
              setData((prevData) =>
                prevData.map((item) =>
                  item.id === id ? { ...item, notify: updatedStatus } : item
                )
              );
            } catch (error) {
              console.error("Error updating notification status:", error);
            }
          };
        
     
      const handleCancel = () => {
        navigation.goBack();
      };

return({
    profileState,
    data,
    fetchData,
    fetchProfile,
    handleToggle,
    profileUpdtaeSubmitHandler,
    handleCancel,

    //changeHandler
    profileChangeHandler :(e)=> changeHandlerHelper(e,profileState,setProfileState)

})
}
export default useProfileHooks