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

/** Fade + subida ligeira, com física de mola (sensação mais natural que easeOut puro). */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28, mass: 0.7 },
  },
};

/**
 * Contentor que anima os filhos em sequência (cada filho deve ter o seu próprio variant).
 * 40ms por item — dentro da janela recomendada de 30-50ms; suficientemente rápido para
 * não parecer lento em listas longas, mas ainda perceptível como sequência.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

/**
 * Transição de rota/página: fade + leve translação. A saída é ~60% da duração da
 * entrada (regra "exit mais rápido que enter") para a navegação parecer responsiva.
 */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15, ease: "easeIn" },
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
