import { createContext } from "react";

export const AppContext = createContext({
  mode: "light", // yoki "dark"
});