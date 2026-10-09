// ============================================================
// DiagnosticoScreen - Tela 4 (Diagnóstico IA com Claude Haiku 4.5)
// Chat onde o cliente descreve o problema e a IA sugere causas
// e serviços da oficina.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import { colors, spacing, radius } from "../theme";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const SUGESTOES = [
  "Meu carro está fazendo um barulho estranho ao frear",
  "A luz da injeção acendeu no painel",
  "O motor está esquentando mais do que o normal",
  "O carro está puxando para um lado ao andar",
];

function uuid() {
  return "sess-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function DiagnosticoScreen() {
  const insets = useSafeAreaInsets();
  const sessionId = useMemo(() => uuid(), []);
  const listRef = useRef(null);

  const [mensagens, setMensagens] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o Mecânico IA da oficina 🔧\n\nMe conte o que está acontecendo com o seu carro (ruídos, luzes no painel, comportamento estranho) e eu vou sugerir possíveis causas e os serviços que podemos realizar.",
    },
  ]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    // Scroll to bottom whenever mensagens muda
    if (listRef.current && mensagens.length > 0) {
      setTimeout(() => {
        try {
          listRef.current?.scrollToEnd({ animated: true });
        } catch (_) {}
      }, 50);
    }
  }, [mensagens]);

  const enviar = async (texto_envio) => {
    const mensagem = (texto_envio ?? texto).trim();
    if (!mensagem || carregando) return;

    setErro("");
    setTexto("");

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: mensagem,
    };
    setMensagens((atual) => [...atual, userMsg]);
    setCarregando(true);

    try {
      const resp = await fetch(`${BACKEND_URL}/api/diagnostico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          mensagem,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Erro ${resp.status}: ${errText.slice(0, 120)}`);
      }

      const data = await resp.json();
      const botMsg = {
        id: data.id || `a-${Date.now()}`,
        role: "assistant",
        content: data.content || "Sem resposta.",
      };
      setMensagens((atual) => [...atual, botMsg]);
    } catch (e) {
      console.log("Erro diagnostico:", e);
      setErro("Não consegui falar com a IA agora. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}
        testID={`msg-${item.id}`}
      >
        {!isUser ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>IA</Text>
          </View>
        ) : null}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
          ]}
        >
          <Text style={[styles.bubbleTexto, isUser && styles.bubbleTextoUser]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        titulo="Diagnóstico IA"
        subtitulo="Powered by Claude Haiku 4.5"
        testID="diagnostico-header"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={mensagens}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          testID="diagnostico-list"
          ListFooterComponent={
            carregando ? (
              <View style={styles.loadingRow} testID="loading-ia">
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>IA</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleBot, styles.loadingBubble]}>
                  <ActivityIndicator color={colors.brandPrimary} size="small" />
                  <Text style={styles.loadingTexto}>Analisando...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Sugestões rápidas (só aparece se ainda não houver mensagens do usuário) */}
        {mensagens.filter((m) => m.role === "user").length === 0 && !carregando ? (
          <View style={styles.sugestoesWrap} testID="sugestoes">
            <Text style={styles.sugestoesTitulo}>Exemplos:</Text>
            {SUGESTOES.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => enviar(s)}
                style={({ pressed }) => [styles.sugestao, pressed && { opacity: 0.7 }]}
                testID={`sugestao-${i}`}
              >
                <Text style={styles.sugestaoTexto}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {erro ? (
          <Text style={styles.erro} testID="diagnostico-erro">
            {erro}
          </Text>
        ) : null}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Descreva o problema do seu carro..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            maxLength={500}
            testID="diagnostico-input"
            editable={!carregando}
          />
          <Pressable
            onPress={() => enviar()}
            disabled={carregando || !texto.trim()}
            style={({ pressed }) => [
              styles.btnEnviar,
              (!texto.trim() || carregando) && styles.btnEnviarDisabled,
              pressed && { opacity: 0.8 },
            ]}
            testID="diagnostico-enviar"
          >
            <Text style={styles.btnEnviarTexto}>
              {carregando ? "..." : "Enviar"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  lista: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "flex-end",
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarTexto: {
    color: colors.onBrandPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bubbleBot: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
    borderBottomRightRadius: 4,
  },
  bubbleTexto: {
    color: colors.onSurfaceSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextoUser: {
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingTexto: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: "italic",
  },
  sugestoesWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sugestoesTitulo: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  sugestao: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginBottom: spacing.xs + 2,
  },
  sugestaoTexto: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
  },
  erro: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? spacing.sm + 2 : spacing.sm,
    color: colors.onSurface,
    fontSize: 15,
  },
  btnEnviar: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  btnEnviarDisabled: {
    backgroundColor: colors.surfaceTertiary,
  },
  btnEnviarTexto: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
