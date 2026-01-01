import yaml from "js-yaml";
import { useState, useEffect, useCallback } from "react";

import {
  validateYamlConfig,
  type ValidationResult,
  type Validator,
  defaultValidators,
} from "@agent-manager/lib/validation";

interface UseYamlValidationOptions {
  debounceMs?: number;
  validators?: Validator[];
}

export function useYamlValidation(
  yamlContent: string,
  options: UseYamlValidationOptions = {},
) {
  const { debounceMs = 500, validators = defaultValidators } = options;
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
  });
  const [isValidating, setIsValidating] = useState(false);

  const performValidation = useCallback(
    (content: string) => {
      if (!content.trim()) {
        setValidationResult({ valid: true, errors: [] });
        setIsValidating(false);
        return;
      }

      try {
        // First parse the YAML
        const parsed = yaml.load(content);

        // Run validators
        const result = validateYamlConfig(content, parsed, validators);
        setValidationResult(result);
      } catch (error) {
        // YAML parse error - don't run validators
        setValidationResult({
          valid: false,
          errors: [
            {
              message:
                error instanceof Error ? error.message : "YAML parse error",
              severity: "error",
              line: 1,
              column: 1,
            },
          ],
        });
      } finally {
        setIsValidating(false);
      }
    },
    [validators],
  );

  useEffect(() => {
    setIsValidating(true);
    const timer = setTimeout(() => {
      performValidation(yamlContent);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [yamlContent, debounceMs, performValidation]);

  return { validationResult, isValidating };
}
