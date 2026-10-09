// ============================================================
// App.js - Ponto de entrada do aplicativo
// "Agenda de Serviços da Oficina"
// Dupla: Nicolas Gabriel & Luiz Eduardo
//
// Monta os providers globais e renderiza a navegação
// (Stack: Login -> Tabs Veículos / Agenda / IA).
// ============================================================

import React from "react";
import { LogBox, StatusBar } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "./src/components/error-boundary";
import { queryClient } from "./src/query-client";
import AppNavigator from "./src/navigation/AppNavigator";

LogBox.ignoreAllLogs(true);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#111113" />
            <AppNavigator />
          </SafeAreaProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
