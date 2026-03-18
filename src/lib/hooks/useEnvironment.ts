import { useState, useCallback } from "react";
import type { Environment } from "@/lib/types";

export function useEnvironment() {
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(["prod"]);
  const [customEnvironments, setCustomEnvironments] = useState<Environment[]>([]);
  const [selectedAutocompleteEnv, setSelectedAutocompleteEnv] = useState<string>("prod");

  const handleEnvironmentChange = useCallback((selectedIds: string[]) => {
    setSelectedEnvironments(selectedIds);
    const newEnvId = selectedIds[0];
    if (newEnvId && ["prod", "stage", "dev"].includes(newEnvId)) {
      setSelectedAutocompleteEnv(newEnvId);
    }
  }, []);

  const handleAddCustomEnvironment = (env: Environment) => {
    setCustomEnvironments((prev) => [...prev, env]);
  };

  const handleRemoveCustomEnvironment = (envId: string) => {
    setCustomEnvironments((prev) => prev.filter((e) => e.id !== envId));
  };

  return {
    selectedEnvironments,
    setSelectedEnvironments,
    customEnvironments,
    setCustomEnvironments,
    selectedAutocompleteEnv,
    setSelectedAutocompleteEnv,
    handleEnvironmentChange,
    handleAddCustomEnvironment,
    handleRemoveCustomEnvironment,
  };
}
