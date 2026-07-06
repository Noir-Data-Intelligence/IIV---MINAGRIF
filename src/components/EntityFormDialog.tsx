/**
 * Exemplo de uso (futuro) numa página admin, ex: Stock.tsx > ItemDialog:
 *
 *   const itemSchema = z.object({
 *     name: z.string().trim().min(2, "Nome demasiado curto"),
 *     category: z.enum(["laboratorio", "vacinas", "agricola"]),
 *   });
 *
 *   const entityForm = useEntityForm({
 *     schema: itemSchema,
 *     initialValues: itemEdit ?? undefined,
 *     open: itemOpen,
 *     onSubmit: (values) => saveItem(values),
 *     onSuccess: () => setItemOpen(false),
 *   });
 *
 *   <EntityFormDialog
 *     open={itemOpen} onOpenChange={setItemOpen}
 *     title={itemEdit ? "Editar Item" : "Novo Item"}
 *     form={entityForm}
 *   >
 *     {(form) => (
 *       <FormField control={form.control} name="name" render={...} />
 *     )}
 *   </EntityFormDialog>
 */
import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { UseEntityFormResult } from "@/hooks/useEntityForm";
import { cn } from "@/lib/utils";

export interface EntityFormDialogProps<TValues extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título do dialog (ex: "Novo Item" vs "Editar Item"), decidido pelo consumidor. */
  title: ReactNode;
  /** Resultado de `useEntityForm<schema>` (form, handleSubmit, isSubmitting). */
  form: UseEntityFormResult<TValues>;
  /** Campos específicos da entidade — render prop com acesso ao form, ou nó estático. */
  children: ReactNode | ((form: UseFormReturn<TValues>) => ReactNode);
  /** Texto do botão de submissão em repouso (ex: "Criar", "Guardar Alterações"). */
  submitLabel?: string;
  /** Texto do botão de submissão enquanto `isSubmitting` é verdadeiro. */
  submittingLabel?: string;
  /** Texto do botão de cancelar. */
  cancelLabel?: string;
  className?: string;
}

/**
 * Chassis genérico para dialogs de criação/edição: Dialog + título + corpo do
 * formulário (fornecido pelo consumidor) + botões Cancelar/Guardar com estado
 * de loading. Usa o resultado de `useEntityForm` passado via prop `form`.
 */
export function EntityFormDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  form,
  children,
  submitLabel = "Guardar",
  submittingLabel = "A guardar...",
  cancelLabel = "Cancelar",
  className,
}: EntityFormDialogProps<TValues>) {
  const { form: rhfForm, handleSubmit, isSubmitting } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...rhfForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {typeof children === "function" ? children(rhfForm) : children}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
