import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_NOTIFICATIONS } from "./data/mockData";
import { User } from "./utils/helpers";
import { NoteDataProvider } from "./contexts/NoteDataContext";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ModuleDetailScreen } from "./screens/ModuleDetailScreen";
import { NoteDetailScreen } from "./screens/NoteDetailScreen";
import { EditorScreen } from "./screens/EditorScreen";
import { PreviewScreen } from "./screens/PreviewScreen";
import { VersionHistoryScreen } from "./screens/VersionHistoryScreen";
import { ExportScreen } from "./screens/ExportScreen";
import { AnnotationsScreen } from "./screens/AnnotationsScreen";
import { CreateNoteScreen } from "./screens/CreateNoteScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { C } from "./constants/colors";

type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
};

type RootStackParamList = {
  Main: undefined;
  Module: { id: string };
  Note: { id: string };
  Editor: { noteId: string };
  Versions: { noteId: string };
  Export: { noteId: string };
  Preview: { noteId: string; content: string };
  Annotations: { noteId: string };
  CreateNote: { moduleId: string };
  Analytics: { moduleId: string };
};

type ScreenName = "module" | "note" | "editor" | "versions" | "export" | "annotations" | "createNote" | "analytics";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const screenMap: Record<ScreenName, keyof RootStackParamList> = {
  module: "Module",
  note: "Note",
  editor: "Editor",
  versions: "Versions",
  export: "Export",
  annotations: "Annotations",
  createNote: "CreateNote",
  analytics: "Analytics",
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <NoteDataProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
            {({ navigation }) => (
              <MainTabs
                user={user}
                unreadCount={unreadCount}
                onLogout={() => setUser(null)}
                rootNavigation={navigation}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Module">
            {({ navigation, route }) => (
              <ModuleDetailScreen
                id={route.params.id}
                user={user}
                navigate={(screen, params) =>
                  navigation.navigate(screenMap[screen as ScreenName], params)
                }
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Note">
            {({ navigation, route }) => (
              <NoteDetailScreen
                id={route.params.id}
                user={user}
                navigate={(screen, params) =>
                  navigation.navigate(screenMap[screen as ScreenName], params)
                }
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Editor">
            {({ navigation, route }) => (
              <EditorScreen
                noteId={route.params.noteId}
                user={user}
                navigate={(screen, params) =>
                  navigation.navigate(screenMap[screen as ScreenName], params)
                }
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Preview">
            {({ navigation, route }) => (
              <PreviewScreen
                noteId={route.params.noteId}
                content={route.params.content}
                onBack={() => navigation.goBack()}
                onSubmit={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Versions">
            {({ navigation, route }) => (
              <VersionHistoryScreen
                noteId={route.params.noteId}
                user={user}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Export">
            {({ navigation, route }) => (
              <ExportScreen
                noteId={route.params.noteId}
                user={user}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Annotations">
            {({ navigation, route }) => (
              <AnnotationsScreen
                noteId={route.params.noteId}
                user={user}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="CreateNote">
            {({ navigation, route }) => (
              <CreateNoteScreen moduleId={route.params.moduleId} onBack={() => navigation.goBack()} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Analytics">
            {({ navigation, route }) => (
              <AnalyticsScreen moduleId={route.params.moduleId} onBack={() => navigation.goBack()} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      </NoteDataProvider>
    </SafeAreaView>
  );
}

const MainTabs: React.FC<{
  user: User;
  unreadCount: number;
  onLogout: () => void;
  rootNavigation: NativeStackNavigationProp<RootStackParamList>;
}> = ({ user, unreadCount, onLogout, rootNavigation }) => {
  const navigateToScreen = (screen: string, params?: any) => {
    const routeName = screenMap[screen as ScreenName];
    if (routeName) {
      rootNavigation.navigate(routeName, params);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopWidth: 1,
          borderTopColor: C.border,
          height: 64,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Search: "search-outline",
            Notifications: "notifications-outline",
            Profile: "person-outline",
          };
          const iconName = icons[route.name as keyof MainTabParamList];
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen user={user} navigate={navigateToScreen} />}
      </Tab.Screen>
      <Tab.Screen name="Search">
        {() => <SearchScreen navigate={navigateToScreen} />}
      </Tab.Screen>
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
});