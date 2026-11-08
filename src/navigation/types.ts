import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MasterPreview } from '../features/master-profile/MasterProfileScreen';

/** Client mode tabs. */
export type MainTabParamList = {
  Discover: undefined;
  Bookings: undefined;
  Favorites: undefined;
  Profile: undefined;
};

/** Master mode tabs. */
export type MasterTabParamList = {
  Calendar: undefined;
  MasterBookings: undefined;
  Clients: undefined;
  Services: undefined;
  Profile: undefined;
};

/** Admin mode tabs. */
export type AdminTabParamList = {
  Requests: undefined;
  Reports: undefined;
  Stats: undefined;
  Users: undefined;
  Profile: undefined;
};

/** `Main` renders the tab set of the active mode (`me.context`). */
export type AnyTabParamList = MainTabParamList & MasterTabParamList & AdminTabParamList;

export type RootStackParamList = {
  Login: undefined;
  RoleSelect: undefined;
  Main: NavigatorScreenParams<AnyTabParamList> | undefined;
  MasterProfile: { masterId: number; preview?: MasterPreview };
  Booking: { masterId: number; serviceId?: string };
  BecomeMaster: undefined;
};
