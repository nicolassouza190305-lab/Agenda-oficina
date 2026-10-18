// ============================================================
// AppNavigator.js - Navegação REAL do app (React Navigation)
// Dupla: Nicolas Gabriel & Luiz Eduardo
//
// Estrutura:
//   Sem login  -> LoginScreen (entrar / cadastrar cliente)
//   Cliente    -> Tabs: Veículos (Nicolas) · Horários (consulta) · IA
//   Oficina    -> Tabs: Agenda (Luiz: confirmar/cancelar) · IA
// ============================================================

import React from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
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
import HorariosScreen from "../screens/HorariosScreen";
import { useAuth } from "../context/AuthContext";
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

// Opções comuns da barra de abas
function useTabOptions() {
  const insets = useSafeAreaInsets();
  return {
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
  };
}

const aba = (label) => ({
  tabBarIcon: ({ focused }) => <TabIcon label={label} focused={focused} />,
});

// Abas do CLIENTE: seus veículos, consulta de horários e IA
function TabsCliente() {
  return (
    <Tab.Navigator screenOptions={useTabOptions()}>
      {/* Desenvolvido por Nicolas: gerenciamento de veículos */}
      <Tab.Screen name="Veiculos" component={VeiculosScreen} options={aba("VEÍCULOS")} />
      <Tab.Screen name="Horarios" component={HorariosScreen} options={aba("HORÁRIOS")} />
      <Tab.Screen name="Diagnostico" component={DiagnosticoScreen} options={aba("IA")} />
    </Tab.Navigator>
  );
}

// Abas da OFICINA (dono): agenda completa e IA
function TabsOficina() {
  return (
    <Tab.Navigator screenOptions={useTabOptions()}>
      {/* Desenvolvido por Luiz: manipulação de status da agenda */}
      <Tab.Screen name="Agenda" component={AgendaOficinaScreen} options={aba("AGENDA")} />
      <Tab.Screen name="Diagnostico" component={DiagnosticoScreen} options={aba("IA")} />
    </Tab.Navigator>
  );
}

// Raiz: sem sessão -> Login; com sessão -> abas conforme o perfil
export default function AppNavigator() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {!usuario ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : usuario.perfil === "Oficina" ? (
            <Stack.Screen name="TabsOficina" component={TabsOficina} />
          ) : (
            <Stack.Screen name="TabsCliente" component={TabsCliente} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
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
