"use client";

import { motion } from "framer-motion";

/**
 * A template (not a layout) re-mounts on every navigation within /ptcacs/*, so
 * this wraps the body in an enter animation that plays each time you switch
 * between Assessment Centers and Assessors — a smooth fade + lift instead of a
 * hard cut. The header lives in layout.tsx and stays put.
 */
export default function PtcacsTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
