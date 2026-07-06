import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHeroSlide,
  deleteHeroSlide,
  listHeroSlides,
  listHeroSlidesAdmin,
  updateHeroSlide,
} from "@/services/api/heroSlides";
import type { HeroSlideDto, HeroSlideListParams } from "@/types/dto/heroSlide";

/**
 * Hooks react-query do módulo Hero Slides.
 *
 * Padrão idêntico a `hooks/queries/useNoticias.ts`: fábrica de query keys +
 * query pública + query/mutations admin. Todas as mutations invalidam
 * `heroSlideKeys.all` (prefixo comum de `lists()` e `adminLists()`), para que
 * uma escrita feita no admin actualize também a leitura pública consumida por
 * `HeroSlideshow.tsx`.
 */

export const heroSlideKeys = {
  all: ["heroSlides"] as const,
  lists: () => [...heroSlideKeys.all, "list"] as const,
  adminLists: () => [...heroSlideKeys.all, "admin-list"] as const,
  adminList: (params: HeroSlideListParams) => [...heroSlideKeys.adminLists(), params] as const,
};

/** Leitura pública (só slides publicados, sem paginação) — usada por `HeroSlideshow.tsx`. Inalterada. */
export function useHeroSlides() {
  return useQuery({
    queryKey: heroSlideKeys.lists(),
    queryFn: () => listHeroSlides(),
  });
}

/** Leitura ADMIN (todos os slides, paginada) — usada por `pages/admin/Slideshow.tsx`. */
export function useHeroSlidesAdminList(params: HeroSlideListParams) {
  return useQuery({
    queryKey: heroSlideKeys.adminList(params),
    queryFn: () => listHeroSlidesAdmin(params),
  });
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<HeroSlideDto>) => createHeroSlide(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heroSlideKeys.all });
    },
  });
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<HeroSlideDto> }) =>
      updateHeroSlide(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heroSlideKeys.all });
    },
  });
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHeroSlide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heroSlideKeys.all });
    },
  });
}
