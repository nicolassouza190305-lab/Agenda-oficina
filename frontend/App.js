// ============================================================
// App.js - Ponto de entrada do aplicativo
// "Agenda de Serviços da Oficina"
// Dupla: Nicolas Gabriel & Luiz Eduardo
//
// Monta os providers globais e renderiza a navegação
// (Login -> abas por perfil: Cliente ou Oficina).
// ============================================================

import React from "react";
import { LogBox, StatusBar } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "./src/components/error-boundary";
import { queryClient } from "./src/query-client";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";

LogBox.ignoreAllLogs(true);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#111113" />
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
