// ============================================================
// VeiculosScreen - Tela 2 (Meus Veículos)
// Desenvolvido por Nicolas Gabriel: Gerenciamento de veículos
// FlatList + modal de cadastro de novo veículo
// ============================================================

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import { VEICULOS_MOCK } from "../mocks/data";
import { colors, spacing, radius } from "../theme";

export default function VeiculosScreen() {
  const insets = useSafeAreaInsets();

  // Desenvolvido por Nicolas: estado da lista de veículos (começa com mock)
  const [veiculos, setVeiculos] = useState(VEICULOS_MOCK);
  const [modalAberto, setModalAberto] = useState(false);

  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [ano, setAno] = useState("");
  const [km, setKm] = useState("");
  const [cor, setCor] = useState("");
  const [erro, setErro] = useState("");

  const limparForm = () => {
    setModelo("");
    setPlaca("");
    setAno("");
    setKm("");
    setCor("");
    setErro("");
  };

  // Desenvolvido por Nicolas: adiciona novo veículo no estado local
  const adicionar = () => {
    if (!modelo.trim() || !placa.trim() || !ano.trim()) {
      setErro("Modelo, placa e ano são obrigatórios.");
      return;
    }
    const novo = {
      id: `v${Date.now()}`,
      modelo: modelo.trim(),
      placa: placa.trim().toUpperCase(),
      ano: Number(ano) || 0,
      km: Number(km) || 0,
      cor: cor.trim() || "—",
    };
    setVeiculos((lista) => [novo, ...lista]);
    limparForm();
    setModalAberto(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card} testID={`veiculo-${item.id}`}>
      <View style={styles.cardTopo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.modelo} numberOfLines={1}>
            {item.modelo}
          </Text>
          <Text style={styles.cor}>{item.cor}</Text>
        </View>
        <View style={styles.placaBox}>
          <Text style={styles.placaTexto}>{item.placa}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsLinha}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>ANO</Text>
          <Text style={styles.statValor}>{item.ano}</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>KM</Text>
          <Text style={styles.statValor}>
            {item.km.toLocaleString("pt-BR")}
          </Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>STATUS</Text>
          <Text style={[styles.statValor, { color: colors.success }]}>Ativo</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        titulo="Meus Veículos"
        subtitulo={`${veiculos.length} veículo${veiculos.length === 1 ? "" : "s"} cadastrado${veiculos.length === 1 ? "" : "s"}`}
        acao="+ Adicionar"
        onAcao={() => setModalAberto(true)}
        testID="veiculos-header"
      />

      <FlatList
        data={veiculos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        testID="veiculos-list"
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhum veículo cadastrado</Text>
            <Text style={styles.vazioTexto}>
              Toque em "+ Adicionar" para registrar seu primeiro veículo.
            </Text>
          </View>
        }
      />

      {/* FAB flutuante */}
      <Pressable
        onPress={() => setModalAberto(true)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: spacing.lg },
          pressed && { opacity: 0.85 },
        ]}
        testID="veiculos-fab"
      >
        <Text style={styles.fabTexto}>+</Text>
      </Pressable>

      {/* Modal de cadastro */}
      <Modal
        visible={modalAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAberto(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalFundo}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalWrap}
            >
              <View style={[styles.modalConteudo, { paddingBottom: insets.bottom + spacing.lg }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitulo}>Novo Veículo</Text>
                <Text style={styles.modalSub}>Preencha os dados do veículo</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Modelo *</Text>
                  <TextInput
                    value={modelo}
                    onChangeText={setModelo}
                    placeholder="Ex: Honda Civic LXR"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    testID="input-modelo"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Placa *</Text>
                    <TextInput
                      value={placa}
                      onChangeText={setPlaca}
                      placeholder="ABC-1D23"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="characters"
                      style={styles.input}
                      testID="input-placa"
                    />
                  </View>
                  <View style={{ width: spacing.md }} />
                  <View style={[styles.inputGroup, { width: 110 }]}>
                    <Text style={styles.label}>Ano *</Text>
                    <TextInput
                      value={ano}
                      onChangeText={setAno}
                      placeholder="2024"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      style={styles.input}
                      testID="input-ano"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>KM atual</Text>
                    <TextInput
                      value={km}
                      onChangeText={setKm}
                      placeholder="25000"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      style={styles.input}
                      testID="input-km"
                    />
                  </View>
                  <View style={{ width: spacing.md }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Cor</Text>
                    <TextInput
                      value={cor}
                      onChangeText={setCor}
                      placeholder="Prata"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      testID="input-cor"
                    />
                  </View>
                </View>

                {erro ? (
                  <Text style={styles.erro} testID="modal-erro">
                    {erro}
                  </Text>
                ) : null}

                <View style={styles.modalAcoes}>
                  <Pressable
                    onPress={() => {
                      limparForm();
                      setModalAberto(false);
                    }}
                    style={({ pressed }) => [styles.btnCancelar, pressed && { opacity: 0.7 }]}
                    testID="modal-cancelar"
                  >
                    <Text style={styles.btnCancelarTexto}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={adicionar}
                    style={({ pressed }) => [styles.btnSalvar, pressed && { opacity: 0.85 }]}
                    testID="modal-salvar"
                  >
                    <Text style={styles.btnSalvarTexto}>Salvar Veículo</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  lista: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modelo: {
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  cor: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  placaBox: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placaTexto: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  statsLinha: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCol: {
    flex: 1,
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  statValor: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  vazio: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  vazioTitulo: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  vazioTexto: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    backgroundColor: colors.brandPrimary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabTexto: {
    color: colors.onBrandPrimary,
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },
  // Modal
  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalWrap: {
    width: "100%",
  },
  modalConteudo: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  modalTitulo: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  modalSub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: spacing.xs + 2,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? spacing.md : spacing.sm + 2,
    color: colors.onSurface,
    fontSize: 15,
  },
  erro: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  modalAcoes: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.md,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  btnCancelarTexto: {
    color: colors.onSurfaceSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  btnSalvar: {
    flex: 1.3,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnSalvarTexto: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
