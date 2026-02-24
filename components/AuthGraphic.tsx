"use client";

import Image from "next/image";
import { motion } from "framer-motion";
export default function AuthGraphic() {
  return (
    <div className="flex flex-col items-center justify-center p-6">
       <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image src="/auth-graphic.png" alt="Authentication Graphic" width={500} height={300} />
     </motion.div> <h1 className="text-3xl font-bold text-primary">PeerInsights</h1>
    </div>
  );
}