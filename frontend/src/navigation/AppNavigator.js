// ============================================================
// AppNavigator.js - Navegação REAL do app (React Navigation)
// Dupla: Nicolas Gabriel & Luiz Eduardo
//
// Estrutura:
//   Stack (raiz)
//    ├─ Login  -> LoginScreen            (dupla)
//    └─ Tabs   -> Tab Navigator
//         ├─ Veiculos    -> VeiculosScreen        (Nicolas)
//         ├─ Agenda      -> AgendaOficinaScreen   (Luiz)
//         └─ Diagnostico -> DiagnosticoScreen     (extra: IA)
// ============================================================

import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LoginScreen from "../screens/LoginScreen";
import VeiculosScreen from "../screens/VeiculosScreen";
import AgendaOficinaScreen from "../screens/AgendaOficinaScreen";
import DiagnosticoScreen from "../screens/DiagnosticoScreen";
import { colors, spacing } from "../theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ícone textual compacto da tab bar (sem dependência externa)
function TabIcon({ label, focused }) {
  return (
    <View style={styles.iconWrap}>
      <View
        style={[
          styles.iconDot,
          { backgroundColor: focused ? colors.brandPrimary : colors.borderStrong },
        ]}
      />
      <Text
        style={[styles.iconLabel, { color: focused ? colors.onSurface : colors.muted }]}
      >
        {label}
      </Text>
    </View>
  );
}

// Tab Navigator: conecta as telas dos dois integrantes
function TabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm,
          ...(Platform.OS === "web" ? { height: 72 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Desenvolvido por Nicolas: gerenciamento de veículos */}
      <Tab.Screen
        name="Veiculos"
        component={VeiculosScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="VEÍCULOS" focused={focused} />,
        }}
      />
      {/* Desenvolvido por Luiz: manipulação de status da agenda */}
      <Tab.Screen
        name="Agenda"
        component={AgendaOficinaScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="AGENDA" focused={focused} />,
        }}
      />
      {/* Extra da dupla: assistente de diagnóstico com IA */}
      <Tab.Screen
        name="Diagnostico"
        component={DiagnosticoScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="IA" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Stack raiz: Login -> Tabs
export default function AppNavigator() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Tabs" component={TabsNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 90,
  },
  iconDot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
});
