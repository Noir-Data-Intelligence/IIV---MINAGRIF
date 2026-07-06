import { useQuery } from "@tanstack/react-query";
import { listHeroSlides } from "@/services/api/heroSlides";

/**
 * Hooks react-query do módulo Hero Slides.
 *
 * Padrão idêntico a `hooks/queries/useNoticias.ts`: fábrica de query keys +
 * query simples (este módulo, por agora, só lista — sem mutations).
 */

export const heroSlideKeys = {
  all: ["heroSlides"] as const,
  lists: () => [...heroSlideKeys.all, "list"] as const,
};

export function useHeroSlides() {
  return useQuery({
    queryKey: heroSlideKeys.lists(),
    queryFn: () => listHeroSlides(),
  });
}
