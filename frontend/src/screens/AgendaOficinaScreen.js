// ============================================================
// AgendaOficinaScreen - Tela 3 (Agenda do Dia / Painel da Oficina)
// Desenvolvido por Luiz Eduardo: Manipulação de status da agenda
// FlatList com cards de agendamento + ações Confirmar/Recusar
// ============================================================

import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import CardAgendamento from "../components/CardAgendamento";
import { AGENDAMENTOS_MOCK } from "../mocks/data";
import { colors, spacing, radius } from "../theme";

const FILTROS = ["Todos", "Agendado", "Confirmado", "Em Andamento", "Recusado"];

function dataFormatada() {
  const d = new Date();
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
}

export default function AgendaOficinaScreen() {
  const insets = useSafeAreaInsets();

  // Desenvolvido por Luiz: estado da agenda e manipulação de status
  const [agendamentos, setAgendamentos] = useState(AGENDAMENTOS_MOCK);
  const [filtro, setFiltro] = useState("Todos");

  // Desenvolvido por Luiz: altera status para "Confirmado"
  const confirmar = (id) => {
    setAgendamentos((atual) =>
      atual.map((a) => (a.id === id ? { ...a, status: "Confirmado" } : a)),
    );
  };

  // Desenvolvido por Luiz: altera status para "Recusado"
  const recusar = (id) => {
    setAgendamentos((atual) =>
      atual.map((a) => (a.id === id ? { ...a, status: "Recusado" } : a)),
    );
  };

  const lista = useMemo(() => {
    if (filtro === "Todos") return agendamentos;
    return agendamentos.filter((a) => a.status === filtro);
  }, [agendamentos, filtro]);

  const resumo = useMemo(() => {
    const total = agendamentos.length;
    const confirmados = agendamentos.filter((a) => a.status === "Confirmado").length;
    const emAndamento = agendamentos.filter((a) => a.status === "Em Andamento").length;
    const pendentes = agendamentos.filter((a) => a.status === "Agendado").length;
    return { total, confirmados, emAndamento, pendentes };
  }, [agendamentos]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header titulo="Agenda do Dia" subtitulo={dataFormatada()} testID="agenda-header" />

      {/* Resumo */}
      <View style={styles.resumoLinha}>
        <View style={styles.statBox} testID="resumo-total">
          <Text style={styles.statBoxValor}>{resumo.total}</Text>
          <Text style={styles.statBoxLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.brandTertiary }]} testID="resumo-pendentes">
          <Text style={[styles.statBoxValor, { color: colors.onBrandTertiary }]}>
            {resumo.pendentes}
          </Text>
          <Text style={[styles.statBoxLabel, { color: colors.onBrandTertiary }]}>Pendentes</Text>
        </View>
        <View style={styles.statBox} testID="resumo-andamento">
          <Text style={[styles.statBoxValor, { color: colors.brandSecondary }]}>
            {resumo.emAndamento}
          </Text>
          <Text style={styles.statBoxLabel}>Em curso</Text>
        </View>
        <View style={styles.statBox} testID="resumo-confirmados">
          <Text style={[styles.statBoxValor, { color: colors.success }]}>
            {resumo.confirmados}
          </Text>
          <Text style={styles.statBoxLabel}>Confirmados</Text>
        </View>
      </View>

      {/* Filtros em chips horizontais */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtros}
        style={styles.filtrosScroll}
        testID="agenda-filtros"
      >
        {FILTROS.map((f) => {
          const ativo = filtro === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFiltro(f)}
              style={[styles.chip, ativo && styles.chipAtivo]}
              testID={`chip-${f}`}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Lista de agendamentos */}
      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardAgendamento item={item} onConfirmar={confirmar} onRecusar={recusar} />
        )}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        testID="agenda-list"
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhum agendamento</Text>
            <Text style={styles.vazioTexto}>
              Não há serviços com o filtro "{filtro}" para hoje.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  resumoLinha: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBoxValor: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "800",
  },
  statBoxLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 2,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  filtrosScroll: {
    marginTop: spacing.lg,
    maxHeight: 56,
  },
  filtros: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipAtivo: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipTexto: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextoAtivo: {
    color: colors.onBrandPrimary,
  },
  lista: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
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
});
