import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NoteDataProvider } from "./contexts/NoteDataContext";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
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
import { ProposalReviewQueueScreen } from "./screens/ProposalReviewQueueScreen";
import { C } from "./constants/colors";
import {
  canRegisterForRemotePushNotifications,
  registerForPushNotificationsAsync,
} from "./utils/pushNotifications";
import { resolveNotificationRoute } from "./utils/notificationRouting";

type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
};

type RootStackParamList = {
  Main: undefined;
  Module: { id: string };
  Note: { id: string; initialTab?: "notes" | "proposals" | "comments" };
  Editor: { noteId: string };
  Versions: { noteId: string };
  Export: { noteId: string };
  Preview: { noteId: string; content: string };
  Annotations: { noteId: string };
  CreateNote: { moduleId: string };
  Analytics: { moduleId: string };
  ReviewQueue: undefined;
};

type ScreenName =
  | "module"
  | "note"
  | "editor"
  | "versions"
  | "export"
  | "annotations"
  | "createNote"
  | "analytics"
  | "reviewQueue"
  | "Preview"
  | "preview";

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
  reviewQueue: "ReviewQueue",
  Preview: "Preview",
  preview: "Preview",
};

function AppContent() {
  const { user, loading, logout, updatePushToken } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    let isActive = true;

    if (canRegisterForRemotePushNotifications()) {
      registerForPushNotificationsAsync().then((token) => {
        if (isActive && token && user) {
          updatePushToken(token).catch(() => {});
        }
      });
    }

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const route = resolveNotificationRoute(
          response.notification.request.content.data as any,
        );
        if (route) {
          navigationRef.current?.navigate("Note", {
            id: route.noteId,
            initialTab: route.initialTab,
          });
        }
      });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const route = response
        ? resolveNotificationRoute(
            response.notification.request.content.data as any,
          )
        : null;
      if (route) {
        navigationRef.current?.navigate("Note", {
          id: route.noteId,
          initialTab: route.initialTab,
        });
      }
    });

    return () => {
      isActive = false;
      responseSubscription.remove();
    };
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (showRegister) {
    return (
      <RegisterScreen
        onRegister={() => setShowRegister(false)}
        onBackToLogin={() => setShowRegister(false)}
      />
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={() => {}}
        onRegisterPress={() => setShowRegister(true)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <NoteDataProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
              {({ navigation }) => (
                <MainTabs
                  onLogout={logout}
                  rootNavigation={navigation}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Module">
              {({ navigation, route }) => (
                <ModuleDetailScreen
                  id={route.params.id}
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
                  initialTab={route.params.initialTab}
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
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Export">
              {({ navigation, route }) => (
                <ExportScreen
                  noteId={route.params.noteId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Annotations">
              {({ navigation, route }) => (
                <AnnotationsScreen
                  noteId={route.params.noteId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CreateNote">
              {({ navigation, route }) => (
                <CreateNoteScreen
                  moduleId={route.params.moduleId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Analytics">
              {({ navigation, route }) => (
                <AnalyticsScreen
                  moduleId={route.params.moduleId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ReviewQueue">
              {({ navigation }) =>
                user.role === "lecturer" ? (
                  <ProposalReviewQueueScreen
                    onBack={() => navigation.goBack()}
                  />
                ) : (
                  <View style={styles.blockedScreen}>
                    <Text style={styles.blockedTitle}>Access denied</Text>
                    <Text style={styles.blockedText}>
                      Only lecturers can review proposals.
                    </Text>
                  </View>
                )
              }
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </NoteDataProvider>
    </SafeAreaView>
  );
}

const MainTabs: React.FC<{
  onLogout: () => Promise<void>;
  rootNavigation: NativeStackNavigationProp<RootStackParamList>;
}> = ({ onLogout, rootNavigation }) => {
  const navigateToScreen = (screen: string, params?: any) => {
    const routeName = screenMap[screen as ScreenName];
    if (routeName) rootNavigation.navigate(routeName, params);
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
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Search: "search-outline",
            Notifications: "notifications-outline",
            Profile: "person-outline",
          };
          return <Ionicons name={icons[route.name as keyof MainTabParamList]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen navigate={navigateToScreen} />}
      </Tab.Screen>
      <Tab.Screen name="Search">
        {() => <SearchScreen navigate={navigateToScreen} />}
      </Tab.Screen>
      <Tab.Screen name="Notifications">
        {() => <NotificationsScreen />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <ProfileScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  blockedScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: C.bg,
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  blockedText: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
