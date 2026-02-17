"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type HeaderCategoryContextValue = {
  chipVisible: boolean;
  categoryLabel: string | null;
  setHeaderChip: (visible: boolean) => void;
  setHeaderCategoryLabel: (label: string) => void;
};

const HeaderCategoryContext = createContext<HeaderCategoryContextValue | null>(
  null,
);

export function HeaderCategoryProvider({ children }: { children: ReactNode }) {
  const [chipVisible, setChipVisible] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState<string | null>("Todas");

  const setHeaderChip = useCallback((visible: boolean) => {
    setChipVisible(visible);
  }, []);

  const setHeaderCategoryLabel = useCallback((label: string) => {
    setCategoryLabel(label);
  }, []);

  const value = useMemo(
    () => ({
      chipVisible,
      categoryLabel,
      setHeaderChip,
      setHeaderCategoryLabel,
    }),
    [chipVisible, categoryLabel, setHeaderChip, setHeaderCategoryLabel],
  );

  return (
    <HeaderCategoryContext.Provider value={value}>
      {children}
    </HeaderCategoryContext.Provider>
  );
}

export function useHeaderCategory() {
  const ctx = useContext(HeaderCategoryContext);
  if (!ctx) {
    return {
      chipVisible: false,
      categoryLabel: null,
      setHeaderChip: (_visible: boolean) => {},
      setHeaderCategoryLabel: (_label: string) => {},
    };
  }
  return ctx;
}
