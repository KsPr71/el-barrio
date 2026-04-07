import { ScreenContainer } from "@/components/screen-container";
import { SitioRelevanteCard } from "@/components/sitio-relevante-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useLocations } from "@/hooks/use-locations";
import { useProfile } from "@/hooks/use-profile";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import { useSitiosRelevantes } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { matchTermsInText, queryToSearchTerms } from "@/lib/search-ofertas";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SearchResult = {
  sitio: SitioRelevante;
  matchedWords: string[];
};

export default function AquiHayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sitios, loading, error } = useSitiosRelevantes();
  const { tipos } = useTiposSitio();
  const { provincias } = useLocations();
  const { profile } = useProfile();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const cancelledRef = useRef(false);
  /** Filtro de provincia: undefined = usar perfil, null = Todas, string = id provincia */
  const [filterProvinciaId, setFilterProvinciaId] = useState<
    string | null | undefined
  >(undefined);
  const [showProvinciaModal, setShowProvinciaModal] = useState(false);

  // Provincia del perfil (para valor por defecto)
  const provinciaUsuarioId = useMemo(() => {
    if (!profile.province || provincias.length === 0) return null;
    const provincia = provincias.find((p) => p.nombre === profile.province);
    return provincia?.id ?? null;
  }, [profile.province, provincias]);

  // Provincia efectiva: override manual o perfil; null = mostrar todos
  const effectiveProvinciaId = useMemo(() => {
    if (filterProvinciaId === undefined) return provinciaUsuarioId;
    return filterProvinciaId;
  }, [filterProvinciaId, provinciaUsuarioId]);

  const effectiveProvinciaNombre = useMemo(() => {
    if (!effectiveProvinciaId) return null;
    return (
      provincias.find((p) => p.id === effectiveProvinciaId)?.nombre ?? null
    );
  }, [effectiveProvinciaId, provincias]);
  const tiposById = useMemo(
    () => new Map(tipos.map((tipo) => [tipo.id, tipo])),
    [tipos],
  );

  // Filtrar sitios por provincia efectiva antes de buscar ofertas
  const sitiosPorProvincia = useMemo(() => {
    if (!effectiveProvinciaId) return sitios;
    return sitios.filter((s) => s.provincia_id === effectiveProvinciaId);
  }, [sitios, effectiveProvinciaId]);

  const terms = queryToSearchTerms(query);
  const termsKey = useMemo(() => terms.join(","), [terms]);

  // Búsqueda progresiva: desde la primera coincidencia, ir añadiendo el resto
  useEffect(() => {
    if (terms.length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    cancelledRef.current = false;
    setSearching(true);
    setSearchResults([]);

    let mounted = true;
    const run = async () => {
      const acc: SearchResult[] = [];
      for (const sitio of sitiosPorProvincia) {
        if (!mounted || cancelledRef.current) return;
        const { matches, matchedWords } = matchTermsInText(
          sitio.ofertas,
          terms,
        );
        if (matches) {
          acc.push({ sitio, matchedWords });
          setSearchResults([...acc]);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      setSearching(false);
    };

    run();
    return () => {
      mounted = false;
      cancelledRef.current = true;
    };
  }, [terms, termsKey, sitiosPorProvincia]);

  const handlePressCard = useCallback((id: number) => {
    router.push({
      pathname: "/(drawer)/(tabs)/detalles",
      params: { id: String(id) },
    });
  }, []);

  const showResults = terms.length > 0;
  const showEmptySearch = terms.length === 0 && query.trim().length > 0;

  return (
    <ScreenContainer className="flex-1">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            {effectiveProvinciaNombre
              ? `Aquí hay en ${effectiveProvinciaNombre}`
              : "Aquí hay"}
          </Text>
          <TouchableOpacity
            onPress={() => setShowProvinciaModal(true)}
            activeOpacity={0.85}
            style={{
              width: 28,
              height: 28,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
            }}
          >
            <IconSymbol name="location.fill" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Busca productos en las ofertas de los sitios
        </Text>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.surface + "70",
                borderColor: colors.border,
              },
              query.trim().length === 0 && {
                borderRightWidth: 1,
                borderTopRightRadius: 12,
                borderBottomRightRadius: 12,
              },
            ]}
          >
            <IconSymbol
              name="magnifyingglass"
              size={22}
              color={colors.muted}
              style={styles.searchIcon}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ej: pan, café, pizzas..."
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {query.trim().length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              style={[
                styles.resetBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                  borderLeftWidth: 0,
                },
              ]}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={22} color={"#FFFFFF"} />
            </TouchableOpacity>
          )}
        </View>
        {showEmptySearch && (
          <Text style={[styles.hint, { color: colors.muted }]}>
            Escribe al menos una palabra (se ignoran artículos y conectores)
          </Text>
        )}
        {showResults && (
          <Text style={[styles.resultCount, { color: colors.muted }]}>
            {searching
              ? "Buscando..."
              : `${searchResults.length} sitio${searchResults.length !== 1 ? "s" : ""} encontrado${searchResults.length !== 1 ? "s" : ""}`}
          </Text>
        )}
      </View>

      {loading && sitiosPorProvincia.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Cargando sitios...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.primary }]}>
            {error}
          </Text>
        </View>
      ) : showResults ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {searchResults.length === 0 && !searching ? (
            <Text style={[styles.empty, { color: colors.muted }]}>
              No hay sitios con ofertas que coincidan con&nbsp;&quot;
              {query.trim()}
              &quot;
            </Text>
          ) : (
            searchResults.map(({ sitio, matchedWords }) => (
              <SitioRelevanteCard
                key={sitio.id}
                sitio={sitio}
                tipo={
                  sitio.tipo_sitio_id != null
                    ? (tiposById.get(sitio.tipo_sitio_id) ?? null)
                    : null
                }
                matchedWords={matchedWords}
                onPress={() => handlePressCard(sitio.id)}
              />
            ))
          )}
          <View style={{ height: 150 }} />
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <IconSymbol
            name="magnifyingglass"
            size={48}
            color={colors.muted}
            style={{ opacity: 0.5 }}
          />
          <Text style={[styles.placeholder, { color: colors.muted }]}>
            Escribe productos para buscar en ofertas
          </Text>
        </View>
      )}

      {/* Modal: elegir provincia (igual que en inicio) */}
      <Modal
        visible={showProvinciaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProvinciaModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowProvinciaModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: Math.max(insets.bottom, 16),
              maxHeight: "70%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                className="text-lg font-semibold"
                style={{ color: colors.foreground }}
              >
                Filtrar por provincia
              </Text>
            </View>
            <ScrollView
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingVertical: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                onPress={() => {
                  setFilterProvinciaId(null);
                  setShowProvinciaModal(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor:
                    effectiveProvinciaId === null
                      ? colors.primary + "20"
                      : "transparent",
                }}
              >
                <IconSymbol
                  name="location.fill"
                  size={22}
                  color={
                    effectiveProvinciaId === null
                      ? colors.primary
                      : colors.muted
                  }
                />
                <Text
                  className="text-base ml-3"
                  style={{
                    color:
                      effectiveProvinciaId === null
                        ? colors.primary
                        : colors.foreground,
                    fontWeight: effectiveProvinciaId === null ? "600" : "400",
                  }}
                >
                  Todas las provincias
                </Text>
              </TouchableOpacity>
              {provincias.map((p) => {
                const isSelected = effectiveProvinciaId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setFilterProvinciaId(p.id);
                      setShowProvinciaModal(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      backgroundColor: isSelected
                        ? colors.primary + "20"
                        : "transparent",
                    }}
                  >
                    <IconSymbol
                      name="location.fill"
                      size={22}
                      color={isSelected ? colors.primary : colors.muted}
                    />
                    <Text
                      className="text-base ml-3"
                      style={{
                        color: isSelected ? colors.primary : colors.foreground,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {p.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,

    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  resetBtn: {
    borderWidth: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  resultCount: {
    fontSize: 13,
    marginTop: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { fontSize: 14, textAlign: "center" },
  empty: { fontSize: 15, textAlign: "center", marginTop: 24 },
  placeholder: { marginTop: 16, fontSize: 15, textAlign: "center" },
});
