import { useEffect } from "react";

export const useDevLogger = (error: unknown) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("UnexpectedError", error);
    }
  }, [error]);
};
