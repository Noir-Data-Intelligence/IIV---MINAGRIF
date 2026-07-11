import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion, AnimatePresence } from "framer-motion";

/**
 * Cursor personalizado: um anel dourado que segue o rato com física de mola e
 * um ponto central fixo. Aumenta sobre elementos interactivos (a, button,
 * [role="button"], input, etc.) para dar feedback de "isto é clicável".
 *
 * Desactivado em: touch devices (sem rato real — `pointer: coarse`),
 * prefers-reduced-motion (o próprio movimento constante do anel é dispensável
 * para quem pediu menos animação) e ecrãs estreitos (mobile, mesmo sem touch
 * detectável, ex: emuladores).
 */
export function CursorFx() {
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springConfig = { stiffness: 500, damping: 40, mass: 0.5 };
  const ringX = useSpring(x, springConfig);
  const ringY = useSpring(y, springConfig);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const isWideEnough = window.matchMedia("(min-width: 1024px)").matches;
    if (prefersReducedMotion || !isFinePointer || !isWideEnough) return;
    setEnabled(true);
    document.documentElement.classList.add("cursor-fx");

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setHovering(!!target.closest('a, button, [role="button"], input, textarea, select, [data-cursor-hover]'));
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("cursor-fx");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  if (!enabled) return null;

  return (
    <>
      <style>{`@media (pointer: fine) and (min-width: 1024px) { html.cursor-fx, html.cursor-fx * { cursor: none !important; } }`}</style>
      <AnimatePresence>
        {visible && (
          <motion.div
            className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full border-2 border-[hsl(var(--iiv-gold))] mix-blend-difference"
            style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, width: 32, height: 32 }}
            animate={{ opacity: 1, width: hovering ? 52 : 32, height: hovering ? 52 : 32 }}
            exit={{ opacity: 0 }}
            transition={{ width: { type: "spring", stiffness: 350, damping: 25 }, height: { type: "spring", stiffness: 350, damping: 25 }, opacity: { duration: 0.15 } }}
          />
        )}
      </AnimatePresence>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-[hsl(var(--iiv-gold))]"
        style={{ x, y, translateX: "-50%", translateY: "-50%", opacity: visible ? 1 : 0 }}
      />
    </>
  );
}
