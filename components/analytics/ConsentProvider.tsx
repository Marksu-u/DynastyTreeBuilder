"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readConsent, writeConsent, type ConsentChoice } from "@/lib/analytics/consent";
import { disableAnalytics, GA_MEASUREMENT_ID } from "@/lib/analytics/gtag";

type ConsentContextValue = {
  /** The visitor's answer, or null if they have not been asked yet. */
  choice: ConsentChoice | null;
  /**
   * False until localStorage has been read. Nothing that depends on the answer
   * may render before this flips, or a returning visitor who already accepted
   * sees the banner flash on every page load.
   */
  ready: boolean;
  grant: () => void;
  deny: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) throw new Error("useConsent must be used inside <ConsentProvider>");
  return value;
}

/**
 * Holds the analytics consent answer for the whole app.
 *
 * The answer lives on the visitor's own device, never on the server: a guest
 * who never signs in still has to be able to refuse, and asking the server
 * would mean creating the record we are asking permission to create.
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);

  // localStorage is a client-only API, so the first render must assume nothing
  // and this effect supplies the real answer. Same sanctioned pattern as the
  // locale sync in components/legal/LegalDoc.tsx.
  useEffect(() => {
    const stored = readConsent();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the platform localStorage on mount
    setChoice(stored);
    setReady(true);
  }, []);

  const grant = useCallback(() => {
    writeConsent("granted");
    setChoice("granted");
  }, []);

  const deny = useCallback(() => {
    writeConsent("denied");
    setChoice("denied");
    // Covers the visitor who accepted earlier and is now changing their mind:
    // stop the already-loaded tag and remove the cookies it set.
    disableAnalytics(GA_MEASUREMENT_ID);
  }, []);

  const value = useMemo(
    () => ({ choice, ready, grant, deny }),
    [choice, ready, grant, deny],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
