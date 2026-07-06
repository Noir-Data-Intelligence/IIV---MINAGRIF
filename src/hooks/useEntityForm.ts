import { useEffect } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

/**
 * Formato de erro de campo que esperamos poder receber de uma API (ex: validação
 * 422 do Laravel), para mapear directamente para `form.setError(field, ...)`.
 */
export interface FieldError {
  field: string;
  message: string;
}

function isFieldErrorArray(value: unknown): value is FieldError[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).field === "string" &&
        typeof (item as Record<string, unknown>).message === "string",
    )
  );
}

/**
 * Tenta extrair uma lista de FieldError de um erro desconhecido lançado por
 * `onSubmit`. Suporta:
 *  - `Error` cuja propriedade `cause` seja um array de FieldError;
 *  - objectos com uma propriedade `errors` que seja um array de FieldError;
 *  - o próprio erro, se já for um array de FieldError.
 */
function extractFieldErrors(error: unknown): FieldError[] | null {
  if (isFieldErrorArray(error)) return error;

  if (error && typeof error === "object") {
    const maybeErrors = (error as Record<string, unknown>).errors;
    if (isFieldErrorArray(maybeErrors)) return maybeErrors;

    const maybeCause = (error as { cause?: unknown }).cause;
    if (isFieldErrorArray(maybeCause)) return maybeCause;
  }

  return null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export interface UseEntityFormOptions<TSchema extends z.ZodType<FieldValues>> {
  /** Schema zod usado para validação (via zodResolver). */
  schema: TSchema;
  /**
   * Valores iniciais do formulário. `undefined`/`null` representa "criar novo".
   * Quando mudam (ou o dialog reabre), o formulário é reiniciado (`form.reset`).
   */
  initialValues?: Partial<z.infer<TSchema>> | null;
  /** Valores por omissão a usar quando não há `initialValues` (modo "criar"). */
  defaultValues?: Partial<z.infer<TSchema>>;
  /** Controla quando o `reset` deve ocorrer (normalmente o estado `open` do dialog). */
  open?: boolean;
  /** Chamado com os valores validados; deve lançar em caso de erro. */
  onSubmit: (values: z.infer<TSchema>) => Promise<void>;
  /** Mensagem de sucesso mostrada em toast após `onSubmit` resolver. */
  successMessage?: string;
  /** Mensagem de erro genérica, usada quando o erro não é mapeável para campos. */
  errorMessage?: string;
  /** Chamado após um submit bem sucedido (ex: fechar o dialog, recarregar lista). */
  onSuccess?: () => void;
}

export interface UseEntityFormResult<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Encapsula o padrão repetido nos dialogs de criação/edição de entidades:
 * `useForm` + `zodResolver`, reset dos valores quando `initialValues`/`open`
 * mudam, submissão com toasts de sucesso/erro e mapeamento de erros de campo.
 */
export function useEntityForm<TSchema extends z.ZodType<FieldValues>>({
  schema,
  initialValues,
  defaultValues,
  open,
  onSubmit,
  successMessage = "Guardado com sucesso",
  errorMessage = "Ocorreu um erro. Tente novamente.",
  onSuccess,
}: UseEntityFormOptions<TSchema>): UseEntityFormResult<z.infer<TSchema>> {
  const { toast } = useToast();

  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues: (initialValues ?? defaultValues ?? {}) as DefaultValues<z.infer<TSchema>>,
  });

  // Replica o padrão `useEffect(() => setForm(initial ?? default), [initial, open])`
  // já usado nas páginas actuais, mas reiniciando o react-hook-form em vez de um
  // simples useState.
  useEffect(() => {
    form.reset((initialValues ?? defaultValues ?? {}) as DefaultValues<z.infer<TSchema>>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      toast({ title: successMessage });
      onSuccess?.();
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors) {
        fieldErrors.forEach(({ field, message }) => {
          form.setError(field as Path<z.infer<TSchema>>, { type: "server", message });
        });
        toast({
          title: "Verifique os campos",
          description: fieldErrors[0]?.message ?? errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erro",
        description: getErrorMessage(error, errorMessage),
        variant: "destructive",
      });
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}
