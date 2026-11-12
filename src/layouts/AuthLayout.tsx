import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Link2,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { ThemeToggle } from '@/components/common';

interface AuthLayoutProps {
  children: ReactNode;
}

const NETWORK_NODES: Array<{ x: number; y: number }> = [
  { x: 10, y: 18 },
  { x: 28, y: 10 },
  { x: 46, y: 24 },
  { x: 62, y: 12 },
  { x: 80, y: 22 },
  { x: 90, y: 42 },
  { x: 72, y: 48 },
  { x: 54, y: 42 },
  { x: 38, y: 52 },
  { x: 20, y: 44 },
  { x: 12, y: 68 },
  { x: 30, y: 74 },
  { x: 48, y: 66 },
  { x: 66, y: 72 },
  { x: 84, y: 62 },
  { x: 92, y: 80 },
  { x: 70, y: 88 },
  { x: 50, y: 86 },
  { x: 32, y: 92 },
  { x: 14, y: 86 },
];

const NETWORK_LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [1, 9],
  [2, 7],
  [3, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 0],
  [8, 11],
  [9, 10],
  [10, 11],
  [11, 12],
  [12, 13],
  [13, 14],
  [14, 5],
  [12, 17],
  [13, 16],
  [16, 17],
  [17, 18],
  [18, 19],
  [19, 10],
  [14, 15],
  [15, 16],
  [8, 12],
  [7, 13],
];

const FEATURES = [
  {
    icon: Link2,
    title: 'Recorded at every step',
    description:
      'Products, shipments, and custody changes stay in an auditable trail.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification, not decoration',
    description:
      'A product is only marked verified when the blockchain service confirms it.',
  },
  {
    icon: Truck,
    title: 'Built for handoffs',
    description:
      'Follow goods from manufacturer to distributor to retailer without losing context.',
  },
];

function NetworkBackdrop() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        {NETWORK_LINKS.map(([from, to], index) => {
          const start = NETWORK_NODES[from];
          const end = NETWORK_NODES[to];
          if (!start || !end) return null;
          return (
            <motion.path
              key={`${from}-${to}`}
              d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
              stroke="white"
              strokeWidth={0.16}
              initial={reduce ? { opacity: 0.12 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.12 }}
              transition={{
                duration: 1.4,
                delay: reduce ? 0 : index * 0.03,
                ease: 'easeOut',
              }}
            />
          );
        })}
      </svg>

      {NETWORK_NODES.map((node, index) => (
        <motion.span
          key={`${node.x}-${node.y}`}
          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          animate={
            reduce
              ? undefined
              : { opacity: [0.18, 0.8, 0.18], scale: [1, 1.35, 1] }
          }
          transition={{
            duration: 4.5 + (index % 5),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.22,
          }}
        />
      ))}
    </div>
  );
}

function AuthHero() {
  const reduce = useReducedMotion();

  return (
    <aside className="relative hidden overflow-hidden bg-[hsl(222_47%_7%)] text-white lg:flex lg:flex-col">
      {/* Ambient accents */}
      <div
        aria-hidden="true"
        className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl"
      />
      <NetworkBackdrop />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[hsl(222_47%_7%)]"
            aria-label="SupplyChain home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">SupplyChain</span>
          </Link>

          <div className="mt-14 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              Blockchain-backed traceability
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
              Every product,
              <br />
              <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                accounted for.
              </span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-white/65 xl:text-base">
              A single workspace for product records, shipment tracking, custody
              handoffs, and blockchain verification reference checks.
            </p>
          </div>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((feature, index) => (
              <motion.li
                key={feature.title}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.15 + index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex gap-3.5"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-teal-300">
                  <feature.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="mt-0.5 max-w-sm text-xs leading-relaxed text-white/55">
                    {feature.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Custody flow
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-white/80">
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5">
              Manufacturer
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-primary/70 to-teal-400/60" />
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5">
              Distributor
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-teal-400/60 to-violet-400/50" />
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5">
              Retailer
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/45">
            Each handoff can carry its own record. Trust comes from the recorded
            trail, not from the interface.
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * Split auth shell: animated supply-chain hero on desktop, focused form on the
 * right. Auth logic, routing, and redirects stay in the page components.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const reduce = useReducedMotion();

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <AuthHero />

      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="surface-grid pointer-events-none absolute inset-0 opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />

        <header className="relative z-10 flex shrink-0 items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Back to SupplyChain home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent text-white shadow-sm lg:hidden">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <ArrowLeft
              className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-6">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </main>

        <p className="relative z-10 px-6 pb-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          Blockchain records can support an authenticity check, but only a live
          verification response confirms a product.
        </p>
      </div>
    </div>
  );
}