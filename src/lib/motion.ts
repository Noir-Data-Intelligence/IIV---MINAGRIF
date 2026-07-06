import { type Variants } from "framer-motion";

/**
 * Convenção de chaves adoptada em todos os variants deste ficheiro: `hidden` (estado inicial),
 * `visible` (estado animado) e, quando aplicável, `exit` (ao sair do DOM, ex: AnimatePresence).
 * Uso típico: <motion.div variants={fadeInUp} initial="hidden" animate="visible" exit="exit" />
 *
 * Nota: estes variants aplicam movimento com propósito. Quem consome deve verificar
 * `useReducedMotion()` (de "framer-motion") e reduzir/omitir a animação para utilizadores que
 * preferem menos movimento — essa verificação não é feita aqui.
 */

/** Fade + subida ligeira. Uso comum: entrada de cards, secções, itens de lista. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

/** Contentor que anima os filhos em sequência (cada filho deve ter o seu próprio variant). */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

/** Transição de rota/página: fade + leve translação, curta e subtil. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: 8,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Fade simples, sem deslocamento. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};
