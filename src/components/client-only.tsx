"use client";

import { useState, useEffect, ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure browser extensions have modified the DOM
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</> || null;
  }

  return <div suppressHydrationWarning>{children}</div>;
}
