import { ScreenContainer } from "@/components/screen-container";
import { SitioRelevanteCard } from "@/components/sitio-relevante-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import { useSitiosRelevantes } from "@/hooks/use-sitios-relevantes";
import { matchTermsInText, queryToSearchTerms } from "@/lib/search-ofertas";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type SearchResult = {
  sitio: SitioRelevante;
  matchedWords: string[];
};

export default function AquiHayScreen() {
  const colors = useColors();
  const { sitios, loading, error } = useSitiosRelevantes();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const cancelledRef = useRef(false);

  const terms = queryToSearchTerms(query);

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
      for (const sitio of sitios) {
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
  }, [terms.join(","), sitios]);

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
        <Text style={[styles.title, { color: colors.foreground }]}>
          Aquí hay
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Busca productos en las ofertas de los sitios
        </Text>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.surface,
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

      {loading && sitios.length === 0 ? (
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
                matchedWords={matchedWords}
                onPress={() => handlePressCard(sitio.id)}
              />
            ))
          )}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 16,
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
