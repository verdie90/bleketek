import { useState, useEffect } from "react";

export function usePageLoading(delay = 800) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isLoading;
}

export function useComponentLoading(delay = 500) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isLoading;
}

// Hook untuk conditional loading berdasarkan data
export function useDataLoading<T>(data: T | null | undefined, minLoadingTime = 500) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasMinTimePassed, setHasMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMinTimePassed(true);
    }, minLoadingTime);

    return () => clearTimeout(timer);
  }, [minLoadingTime]);

  useEffect(() => {
    if (data !== null && data !== undefined && hasMinTimePassed) {
      setIsLoading(false);
    }
  }, [data, hasMinTimePassed]);

  return isLoading;
}

// Hook untuk loading dengan multiple conditions
export function useMultipleLoading(conditions: boolean[], delay = 300) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasDelayPassed, setHasDelayPassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasDelayPassed(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (hasDelayPassed && conditions.every(condition => condition === false)) {
      setIsLoading(false);
    }
  }, [conditions, hasDelayPassed]);

  return isLoading;
}
