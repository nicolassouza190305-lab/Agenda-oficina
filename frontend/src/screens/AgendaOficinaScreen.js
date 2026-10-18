// ============================================================
// AgendaOficinaScreen - Tela 3 (Agenda do Dia / Painel da Oficina)
// Desenvolvido por Luiz Eduardo: Manipulação de status da agenda
// FlatList com cards de agendamento + ações Confirmar/Recusar
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import CardAgendamento from "../components/CardAgendamento";
import DiaSelector from "../components/DiaSelector";
import { listarAgendamentos, atualizarStatus } from "../database/db";
import { useAuth } from "../context/AuthContext";
import { proximosDias, descreverDia } from "../utils/datas";
import { colors, spacing, radius } from "../theme";

const FILTROS = ["Todos", "Agendado", "Confirmado", "Em Andamento", "Cancelado"];

export default function AgendaOficinaScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth(); // só o dono da oficina chega nesta tela

  // Agendamentos vêm do SQLite (tabela "agendamentos")
  const [agendamentos, setAgendamentos] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const dias = useMemo(() => proximosDias(7), []);
  const [dia, setDia] = useState(dias[0].iso);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    listarAgendamentos(usuario.id)
      .then((lista) => ativo && setAgendamentos(lista))
      .catch((e) => {
        console.warn("[db] erro ao listar agenda:", e);
        ativo && setErro("Não foi possível carregar a agenda.");
      });
    return () => {
      ativo = false;
    };
  }, [usuario.id]);

  // Grava o novo status no SQLite (o banco só aceita se for a oficina) e reflete na tela
  const mudarStatus = async (id, status) => {
    try {
      await atualizarStatus(usuario.id, id, status);
      setAgendamentos((atual) =>
        atual.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      setErro("");
    } catch (e) {
      console.warn("[db] erro ao atualizar status:", e);
      setErro(e?.erroApp ? e.message : "Não foi possível atualizar o agendamento.");
    }
  };

  const confirmar = (id) => mudarStatus(id, "Confirmado");
  const recusar = (id) => mudarStatus(id, "Cancelado");

  // Agendamentos do dia selecionado
  const doDia = useMemo(
    () => agendamentos.filter((a) => a.data === dia),
    [agendamentos, dia],
  );

  const lista = useMemo(() => {
    if (filtro === "Todos") return doDia;
    return doDia.filter((a) => a.status === filtro);
  }, [doDia, filtro]);

  const resumo = useMemo(() => {
    const total = doDia.length;
    const confirmados = doDia.filter((a) => a.status === "Confirmado").length;
    const emAndamento = doDia.filter((a) => a.status === "Em Andamento").length;
    const pendentes = doDia.filter((a) => a.status === "Agendado").length;
    return { total, confirmados, emAndamento, pendentes };
  }, [doDia]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header titulo="Agenda do Dia" subtitulo={descreverDia(dia)} testID="agenda-header" />

      <DiaSelector dias={dias} selecionado={dia} onSelecionar={setDia} />

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

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

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
              Não há serviços com o filtro "{filtro}" neste dia.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  erro: {
    color: colors.error,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
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
