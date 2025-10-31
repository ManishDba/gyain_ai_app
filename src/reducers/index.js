import { combineReducers } from 'redux';
import dataReducer from './data.Slice';
import loaderSlice from "./loader.slice";
import filesSlice from "./files.slice";
import authSlice from "./auth.slice";
import validationSlice from "./validation.slice";
import askSlice  from './ask.slice';
import usersSlice  from './users.slice';
import  dashboardSlice  from './dashboard.slice';
import indicatorsSlice from './indicators.Slice';
import dataSetsSlice from './dataSets.slice'
import bulkSearchSlice  from './bulksearch.slice';

const rootReducer = combineReducers({
  data: dataReducer, 
  loaderSlice: loaderSlice, 
  filesSlice: filesSlice, 
  authSlice: authSlice, 
  validationSlice: validationSlice, 
  askSlice: askSlice, 
  usersSlice: usersSlice, 
  dashboardSlice:dashboardSlice,
  indicatorsSlice:indicatorsSlice,
  dataSetsSlice:dataSetsSlice,
  bulkSearchSlice:bulkSearchSlice,
  
  
});

export default rootReducer;
