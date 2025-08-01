"use client";

import { useState, useEffect } from "react";

export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Use a timeout to ensure the component has fully mounted
    // and browser extensions have had time to modify the DOM
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return isClient;
};
