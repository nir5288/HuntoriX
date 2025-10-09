import { motion, useReducedMotion } from "framer-motion";

export const HeroNetworkAnimation = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return null;
  }

  // Profile positions - relative positioning for responsive design
  const profiles = [
    { id: 1, x: "15%", y: "20%", size: "120px", delay: 0 },
    { id: 2, x: "65%", y: "15%", size: "80px", delay: 0.5 },
    { id: 3, x: "75%", y: "45%", size: "90px", delay: 1 },
    { id: 4, x: "70%", y: "70%", size: "75px", delay: 1.5 },
    { id: 5, x: "45%", y: "55%", size: "85px", delay: 2 },
  ];

  // Connection lines between profiles
  const connections = [
    { from: 1, to: 2, delay: 0 },
    { from: 2, to: 3, delay: 0.3 },
    { from: 3, to: 4, delay: 0.6 },
    { from: 4, to: 5, delay: 0.9 },
    { from: 5, to: 1, delay: 1.2 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {/* Animated connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {connections.map((conn, idx) => {
          const from = profiles.find(p => p.id === conn.from);
          const to = profiles.find(p => p.id === conn.to);
          
          if (!from || !to) return null;

          return (
            <motion.line
              key={idx}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 3,
                delay: conn.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>

      {/* Animated profile circles */}
      {profiles.map((profile) => (
        <motion.div
          key={profile.id}
          className="absolute rounded-full bg-gradient-to-br from-primary/20 to-primary/40 backdrop-blur-sm border-2 border-primary/30 shadow-lg"
          style={{
            left: profile.x,
            top: profile.y,
            width: profile.size,
            height: profile.size,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 0.9, 0.7],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            delay: profile.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner glow pulse */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              delay: profile.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />

          {/* Communication indicator */}
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary shadow-lg"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              delay: profile.delay + 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}

      {/* Floating communication icons */}
      <motion.div
        className="absolute left-[40%] top-[30%] text-primary/40"
        animate={{
          y: [0, -15, 0],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute left-[55%] top-[50%] text-primary/40"
        animate={{
          y: [0, 15, 0],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 3.5,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </motion.div>
    </div>
  );
};
