import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap, Users, Briefcase, Target, TrendingUp, Network, Bot, CheckCircle, Award, Cpu } from 'lucide-react';

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

      {/* Platform-themed Icons */}
      <motion.div
        className="absolute top-[25%] right-[30%]"
        animate={{
          y: [0, -12, 0],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      >
        <Users className="w-6 h-6 text-[hsl(var(--accent-lilac))]" />
      </motion.div>

      <motion.div
        className="absolute top-[55%] right-[28%]"
        animate={{
          y: [0, 8, 0],
          rotate: [0, 5, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2,
        }}
      >
        <Briefcase className="w-5 h-5 text-[hsl(var(--accent-pink))]" />
      </motion.div>

      <motion.div
        className="absolute bottom-[45%] right-[25%]"
        animate={{
          y: [0, -10, 0],
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.85, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <Target className="w-5 h-5 text-[hsl(var(--accent-mint))]" />
      </motion.div>

      <motion.div
        className="absolute top-[65%] right-[15%]"
        animate={{
          y: [0, 12, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        <Network className="w-6 h-6 text-[hsl(var(--accent-lilac))]" />
      </motion.div>

      <motion.div
        className="absolute top-[12%] right-[8%]"
        animate={{
          y: [0, -8, 0],
          rotate: [0, -10, 0],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      >
        <Bot className="w-5 h-5 text-[hsl(var(--accent-pink))]" />
      </motion.div>

      <motion.div
        className="absolute bottom-[20%] right-[32%]"
        animate={{
          y: [0, -15, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <TrendingUp className="w-5 h-5 text-[hsl(var(--accent-mint))]" />
      </motion.div>

      <motion.div
        className="absolute top-[48%] right-[5%]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.8,
        }}
      >
        <Award className="w-4 h-4 text-[hsl(var(--accent-lilac))]" />
      </motion.div>

      <motion.div
        className="absolute bottom-[55%] right-[10%]"
        animate={{
          y: [0, 10, 0],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 4.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.2,
        }}
      >
        <Cpu className="w-5 h-5 text-[hsl(var(--accent-pink))]" />
      </motion.div>

      {/* AI Floating Text Tags */}
      <motion.div
        className="absolute top-[18%] right-[35%] px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--accent-lilac))]/20 to-[hsl(var(--accent-pink))]/20 backdrop-blur-sm border border-[hsl(var(--accent-lilac))]/30"
        animate={{
          y: [0, -10, 0],
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="text-xs font-semibold text-foreground/80">AI Matching</span>
      </motion.div>

      <motion.div
        className="absolute bottom-[35%] right-[33%] px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--accent-mint))]/20 to-[hsl(var(--accent-lilac))]/20 backdrop-blur-sm border border-[hsl(var(--accent-mint))]/30"
        animate={{
          y: [0, 12, 0],
          opacity: [0, 0.75, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <span className="text-xs font-semibold text-foreground/80">Smart Hiring</span>
      </motion.div>

      <motion.div
        className="absolute top-[40%] right-[3%] px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))]/20 to-[hsl(var(--accent-mint))]/20 backdrop-blur-sm border border-[hsl(var(--accent-pink))]/30"
        animate={{
          y: [0, -15, 0],
          opacity: [0, 0.7, 0],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3.5,
        }}
      >
        <span className="text-xs font-semibold text-foreground/80">Auto-Screen</span>
      </motion.div>

      {/* Neural Network Connections */}
      <svg className="absolute inset-0 w-full h-full opacity-15">
        <motion.circle
          cx="20%"
          cy="25%"
          r="3"
          fill="hsl(var(--accent-lilac))"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          cx="30%"
          cy="50%"
          r="2.5"
          fill="hsl(var(--accent-mint))"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.circle
          cx="25%"
          cy="70%"
          r="3"
          fill="hsl(var(--accent-pink))"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        <motion.line
          x1="20%"
          y1="25%"
          x2="30%"
          y2="50%"
          stroke="hsl(var(--accent-lilac))"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.line
          x1="30%"
          y1="50%"
          x2="25%"
          y2="70%"
          stroke="hsl(var(--accent-mint))"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </svg>

      {/* Data Stream Effect */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`stream-${i}`}
          className="absolute w-0.5 h-8 bg-gradient-to-b from-transparent via-[hsl(var(--accent-lilac))] to-transparent"
          style={{
            top: `${10 + i * 10}%`,
            right: `${5 + (i % 3) * 10}%`,
          }}
          animate={{
            y: [0, 100],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Success Indicators */}
      <motion.div
        className="absolute top-[28%] right-[12%]"
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <CheckCircle className="w-5 h-5 text-[hsl(var(--accent-mint))]" />
      </motion.div>

      {/* Rotating Circuit Board Pattern */}
      <motion.div
        className="absolute top-[38%] right-[20%] w-20 h-20"
        animate={{
          rotate: [0, 360],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--accent-lilac))" strokeWidth="0.5" opacity="0.3" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(var(--accent-pink))" strokeWidth="0.5" opacity="0.3" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="hsl(var(--accent-mint))" strokeWidth="0.5" opacity="0.3" />
          <line x1="50" y1="10" x2="50" y2="30" stroke="hsl(var(--accent-lilac))" strokeWidth="0.5" opacity="0.3" />
          <line x1="50" y1="70" x2="50" y2="90" stroke="hsl(var(--accent-pink))" strokeWidth="0.5" opacity="0.3" />
          <line x1="10" y1="50" x2="30" y2="50" stroke="hsl(var(--accent-mint))" strokeWidth="0.5" opacity="0.3" />
          <line x1="70" y1="50" x2="90" y2="50" stroke="hsl(var(--accent-lilac))" strokeWidth="0.5" opacity="0.3" />
        </svg>
      </motion.div>
    </div>
  );
};

export default HeroFloatingElements;
