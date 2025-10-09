import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';

const HeroFloatingElements = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Glowing AI Nodes */}
      <motion.div
        className="absolute top-[10%] right-[15%] w-3 h-3 rounded-full bg-gradient-to-r from-[hsl(var(--accent-lilac))] to-[hsl(var(--accent-pink))]"
        animate={{
          y: [0, -15, 0],
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-[30%] right-[8%] w-2 h-2 rounded-full bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]"
        animate={{
          y: [0, 12, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      <motion.div
        className="absolute bottom-[25%] right-[20%] w-4 h-4 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-mint))]"
        animate={{
          y: [0, -20, 0],
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Geometric Shapes */}
      <motion.div
        className="absolute top-[20%] right-[25%] w-16 h-16 border-2 border-[hsl(var(--accent-lilac))]/30 rounded-lg"
        animate={{
          rotate: [0, 180, 360],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute bottom-[35%] right-[12%] w-12 h-12"
        animate={{
          rotate: [0, -180, -360],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-full h-full border-2 border-[hsl(var(--accent-mint))]/30 rounded-full" />
      </motion.div>

      {/* Hexagon */}
      <motion.div
        className="absolute top-[45%] right-[5%] w-10 h-10"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 60, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50 1 95 25 95 75 50 99 5 75 5 25"
            fill="none"
            stroke="hsl(var(--accent-pink))"
            strokeWidth="2"
            opacity="0.4"
          />
        </svg>
      </motion.div>

      {/* Connected Nodes with Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <motion.line
          x1="15%"
          y1="20%"
          x2="30%"
          y2="40%"
          stroke="hsl(var(--accent-lilac))"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.line
          x1="30%"
          y1="40%"
          x2="20%"
          y2="60%"
          stroke="hsl(var(--accent-mint))"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
        />
      </svg>

      {/* Gradient Pulse Rings */}
      <motion.div
        className="absolute top-[15%] right-[18%] w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent-lilac) / 0.2) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-[30%] right-[15%] w-24 h-24 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent-pink) / 0.2) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Interactive AI Assist Chip */}
      <motion.div
        className="absolute bottom-[15%] right-[10%] pointer-events-auto"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <motion.div
          className="px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--accent-lilac))] to-[hsl(var(--accent-pink))] cursor-pointer shadow-lg"
          animate={{
            boxShadow: [
              '0 0 20px hsl(var(--accent-lilac) / 0.3)',
              '0 0 30px hsl(var(--accent-pink) / 0.5)',
              '0 0 20px hsl(var(--accent-lilac) / 0.3)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          title="Powered by Huntorix AI"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Brain className="w-4 h-4" />
            <span>AI Assist</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Icon Particles */}
      <motion.div
        className="absolute top-[35%] right-[22%]"
        animate={{
          y: [0, -15, 0],
          x: [0, 5, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      >
        <Sparkles className="w-5 h-5 text-[hsl(var(--accent-mint))]" />
      </motion.div>

      <motion.div
        className="absolute bottom-[40%] right-[8%]"
        animate={{
          y: [0, 10, 0],
          x: [0, -5, 0],
          opacity: [0.3, 0.7, 0.3],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        <Zap className="w-4 h-4 text-[hsl(var(--accent-pink))]" />
      </motion.div>

      {/* Particle Trails */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-[hsl(var(--accent-mint))] to-transparent"
          style={{
            top: `${20 + i * 15}%`,
            right: `${10 + i * 3}%`,
          }}
          animate={{
            x: [0, 30, 60],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default HeroFloatingElements;
