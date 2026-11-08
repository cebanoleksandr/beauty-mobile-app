import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MasterPreview } from '../features/master-profile/MasterProfileScreen';

export type MainTabParamList = {
  Discover: undefined;
  Bookings: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  RoleSelect: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  MasterProfile: { masterId: number; preview?: MasterPreview };
  Booking: { masterId: number; serviceId?: string };
};
