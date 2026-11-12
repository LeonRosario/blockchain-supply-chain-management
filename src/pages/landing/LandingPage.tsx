import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Link2,
  Package,
  QrCode,
  ScanLine,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/hooks';

const capabilities = [
  {
    icon: Package,
    title: 'Product registry',
    description:
      'Register products, batches, SKUs, and manufacturing details in one searchable catalog.',
  },
  {
    icon: Truck,
    title: 'Shipment tracking',
    description:
      'Create shipments, move them through tracking stages, and keep a complete delivery history.',
  },
  {
    icon: Warehouse,
    title: 'Warehouse & inventory',
    description:
      'Monitor stock by facility, flag low inventory, and record every movement with an audit trail.',
  },
  {
    icon: Link2,
    title: 'Blockchain records',
    description:
      'Inspect transaction references and verify products when a blockchain service is connected.',
  },
  {
    icon: ScanLine,
    title: 'QR verification',
    description:
      'Scan a product QR code with a camera or upload an image to check an identifier.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Review shipment throughput, stock distribution, and verification activity in one view.',
  },
];

const roles = [
  { name: 'Manufacturers', icon: Boxes },
  { name: 'Distributors', icon: Truck },
  { name: 'Warehouse teams', icon: Warehouse },
  { name: 'Retailers', icon: Package },
  { name: 'Customers', icon: Users },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="container mx-auto grid gap-12 px-4 py-20 md:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-blue-100">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Supply-chain visibility and product verification
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Follow every product,
              <span className="block bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">
                from factory to customer.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              SupplyChain connects products, shipments, warehouses, distributors, and
              ownership records in one workspace — with blockchain verification
              available when a live service is connected.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  <Link to="/dashboard">
                    Open dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  <Link to="/auth/register">
                    Create an account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/verify">
                  <QrCode className="mr-2 h-4 w-4" />
                  Verify a product
                </Link>
              </Button>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              Verification never claims success without a live blockchain response. When
              no service is connected, results are shown as unavailable.
            </p>
          </div>

          {/* Product journey card */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Product journey</p>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
                  Example flow
                </span>
              </div>
              <div className="mt-5 space-y-0">
                {[
                  {
                    title: 'Manufactured',
                    detail: 'Batch and origin recorded',
                    icon: Boxes,
                  },
                  {
                    title: 'In transit',
                    detail: 'Shipment stages tracked end to end',
                    icon: Truck,
                  },
                  {
                    title: 'Warehouse',
                    detail: 'Inventory and custody updated',
                    icon: Warehouse,
                  },
                  {
                    title: 'Verified',
                    detail: 'Checked against the blockchain service',
                    icon: ShieldCheck,
                  },
                ].map((step, index, all) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={
                            index === all.length - 1
                              ? 'flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300'
                              : 'flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-blue-200'
                          }
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {index < all.length - 1 && (
                          <div className="my-1 h-8 w-px bg-white/15" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-slate-400">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                Sample illustration only. Live verification depends on a connected
                blockchain backend — demo records are always labelled.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-10 md:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Built for every step of the chain
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.name}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {role.name}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="container mx-auto px-4 py-16 md:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One workspace for the full supply chain
          </h2>
          <p className="mt-3 text-muted-foreground">
            Replace scattered spreadsheets and disconnected tools with a single,
            role-aware platform.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <Card key={capability.title} className="border-muted transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {capability.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-slate-50">
        <div className="container mx-auto px-4 py-16 md:px-6 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How verification works
              </h2>
              <p className="mt-3 text-muted-foreground">
                A QR code or product ID identifies the product. Authenticity is then
                checked separately against the blockchain service — scanning alone never
                proves a product is genuine.
              </p>

              <ol className="mt-8 space-y-6">
                {[
                  {
                    title: 'Locate the product identifier',
                    detail:
                      'Scan the QR code or enter the product ID printed on the label.',
                  },
                  {
                    title: 'Check the blockchain service',
                    detail:
                      'The backend looks up the product and returns an explicit verification status.',
                  },
                  {
                    title: 'Read the result carefully',
                    detail:
                      'Only an explicit on-chain confirmation is shown as verified. Unavailable is never treated as success.',
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <Button asChild className="mt-8">
                <Link to="/verify">
                  <ScanLine className="mr-2 h-4 w-4" />
                  Try public verification
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Clear verification states</p>
                  <p className="text-xs text-muted-foreground">
                    No ambiguous “probably authentic” results
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  {
                    label: 'Blockchain verified',
                    detail: 'An explicit on-chain confirmation was returned.',
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                    icon: CheckCircle2,
                  },
                  {
                    label: 'Verification unavailable',
                    detail: 'No result was received — never shown as verified.',
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                    icon: ShieldCheck,
                  },
                  {
                    label: 'Not verified',
                    detail: 'The service responded without confirming authenticity.',
                    tone: 'border-red-200 bg-red-50 text-red-900',
                    icon: ShieldCheck,
                  },
                ].map((state) => {
                  const Icon = state.icon;
                  return (
                    <div
                      key={state.label}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${state.tone}`}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{state.label}</p>
                        <p className="text-xs opacity-80">{state.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Demo accounts and sample records are labelled throughout the application.
                They are not presented as blockchain-verified data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-slate-900 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to make your supply chain traceable?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
            Create an account to manage products, shipments, inventory, and verification
            from one dashboard.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                <Link to="/dashboard">
                  Go to dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                <Link to="/auth/register">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/verify">
                <QrCode className="mr-2 h-4 w-4" />
                Verify a product
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            SupplyChain
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/verify" className="hover:text-foreground">
              Verify product
            </Link>
            <Link to="/auth/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link to="/auth/register" className="hover:text-foreground">
              Create account
            </Link>
          </div>
          <p className="text-xs">
            Blockchain results are only shown when a live verification service confirms
            them.
          </p>
        </div>
      </footer>
    </div>
  );
}