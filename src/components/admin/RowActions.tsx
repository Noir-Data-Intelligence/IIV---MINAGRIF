import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

interface RowActionsProps {
  /** Acção principal renderizada como botão ícone fora do menu (opcional). */
  primary?: RowAction;
  actions: RowAction[];
  align?: "start" | "end";
}

/**
 * Coluna de acções unificada para tabelas admin.
 * Substitui a fileira de 3-5 botões ícone por: [ação principal] + [menu "…"].
 */
export function RowActions({ primary, actions, align = "end" }: RowActionsProps) {
  const visible = actions.filter((a) => !a.hidden);
  const destructive = visible.filter((a) => a.destructive);
  const regular = visible.filter((a) => !a.destructive);

  return (
    <div className="flex items-center gap-1 justify-end">
      {primary && !primary.hidden && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          title={primary.label}
          aria-label={primary.label}
          disabled={primary.disabled}
          onClick={primary.onClick}
        >
          <primary.icon className="h-4 w-4" />
        </Button>
      )}
      {visible.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Mais acções">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align} className="w-48">
            {regular.map((a) => (
              <DropdownMenuItem
                key={a.label}
                disabled={a.disabled}
                onClick={a.onClick}
                className="gap-2 cursor-pointer"
              >
                <a.icon className="h-4 w-4" />
                {a.label}
              </DropdownMenuItem>
            ))}
            {regular.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
            {destructive.map((a) => (
              <DropdownMenuItem
                key={a.label}
                disabled={a.disabled}
                onClick={a.onClick}
                className={cn("gap-2 cursor-pointer text-destructive focus:text-destructive")}
              >
                <a.icon className="h-4 w-4" />
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
