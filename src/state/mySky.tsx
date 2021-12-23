import {
  createContext,
  ReactNode,
  useCallback, useEffect,
  useMemo, useState
} from "react";
import { MySky } from "skynet-js";
import skynetClient from "../services/skynetClient";
import { MySkyProof, MySkyProofGenerator } from "./mySkyProof";

// TODO: this should be an hns domain
// export const dataDomain = "0404guluqu38oaqapku91ed11kbhkge55smh9lhjukmlrj37lfpm8no";

export type MySkyState = {
  mySky: MySky|null;
  mySkyLoading: boolean;
  proof: MySkyProof | null;
  proofLoading: boolean;
  userId: string;
  userLoggingIn: boolean;
}

type MySkyContextPayload = MySkyState & {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  generateProof: () => Promise<void>
};

export const MySkyContext = createContext<MySkyContextPayload>({} as any);

export function MySkyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    mySky: null,
    mySkyLoading: false,
    proof: null,
    proofLoading: false,
    userId: "",
    userLoggingIn: false,
  } as unknown as MySkyState);
 
  useEffect(() => {
    const execute = async () => {
      // inidcate MySky is being loaded
      setState((state) => ({ ...state, mySkyLoading: true }));

      // load MySky
      const mySky = await skynetClient.loadMySky();

      // log in the user
      try {
        const isAuthenticated = await mySky.checkLogin();
        if (isAuthenticated) {
          setState((state) => ({ ...state, userLoggingIn: true }));
          const userId = await mySky.userID();

          setState((state) => ({
            ...state,
            mySky,
            mySkyLoading: false,
            userId,
            userLoggingIn: false
          }));

          return;
        }

        setState((state) => ({
          ...state,
          mySky,
          mySkyLoading: false
        }));
      } catch {
        setState((state) => ({
          ...state,
          mySky,
          mySkyLoading: false,
          userLoggingIn: false
        }));
      }
    };

    if (!state.mySky && !state.mySkyLoading) {
      execute();
    }
  }, [state]);

  const login = useCallback(async () => {
    const execute = async () => {
      if (!state.mySky) {
        return;
      }

      const success = await state.mySky.requestLoginAccess();
      if (success) {
        const userId = await state.mySky.userID();
        setState((state) => ({
          ...state,
          userId,
          userLoggingIn: false
        }));
        return;
      }

      setState((state) => ({ ...state, userLoggingIn: false }));
    }

    if (state.mySky && !state.userLoggingIn) {
      setState((state) => ({ ...state, userLoggingIn: true }));
      execute();
    }
  },[state]);

  const logout = useCallback(async () => {
    if (state.mySky) {
      state.mySky.logout();
      setState((state) => ({
        ...state,
        proof: null,
        proofLoading: false,
        userId: "",
        userLoggingIn: false,
      }));
    }
  }, [state]);

  const generateProof = useCallback(async () => {
    if (state.mySky && !(state.proof || state.proofLoading)) {
      setState((state) => ({ ...state, proofLoading: true }));

      try {
        const g = new MySkyProofGenerator()
        const proof = await g.generate(state.mySky)
        setState((state) => ({ ...state, proof, proofLoading: false }));
      } catch (error) {
        setState((state) => ({ ...state, proofLoading: false }));
      }
    }
  }, [state])

  const stateContext = useMemo(() => {
    return { ...state, login, logout, generateProof };
  }, [state, login, logout, generateProof]);
  
  return (
    <MySkyContext.Provider value={stateContext}>
      {children}
    </MySkyContext.Provider>
  );
}
