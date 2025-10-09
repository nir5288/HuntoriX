import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type PlanId = 'free' | 'core' | 'pro' | 'huntorix';
type BillingCycle = 'monthly' | 'yearly';

interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  locked: boolean;
  icon: string;
}

interface PlanSelectionProps {
  onPlanSelected: () => void;
  userId: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    description: '20 credits / month',
    features: [
      'Access to public jobs',
      'Basic profile',
      'Chat',
      'Dashboard',
      'Max 3 CVs per job',
    ],
    locked: false,
    icon: '',
  },
  {
    id: 'core',
    name: 'Core',
    monthlyPrice: 29,
    description: '250 credits / month',
    features: [
      'Everything in Free',
      'Priority support',
      'Advanced search filters',
      'Candidate process visibility',
      'Statistics & application insights',
      'Max 5 CVs per job',
    ],
    locked: false,
    icon: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 39,
    description: 'Unlimited credits',
    features: [
      'Everything in Core',
      'Featured profile',
      'Analytics dashboard',
      'AI tools',
      'Video calls',
      'AI/Video badges on job cards',
    ],
    locked: true,
    icon: '',
  },
  {
    id: 'huntorix',
    name: 'HuntoriX',
    monthlyPrice: 79,
    description: 'Unlimited credits',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'White-label solution',
      'Custom integrations',
      'Job notifications (by role & industry)',
    ],
    locked: true,
    icon: '',
  },
];

const FEATURE_COMPARISON = [
  { feature: 'Profile & registration', free: true, core: true, pro: true, huntorix: true },
  { feature: 'Dashboard', free: true, core: true, pro: true, huntorix: true },
  { feature: 'Chat', free: true, core: true, pro: true, huntorix: true },
  { feature: 'Employer invites', free: 'Unlimited', core: 'Unlimited', pro: 'Unlimited', huntorix: 'Unlimited' },
  { 
    feature: 'Applications credits', 
    free: '20 credits', 
    core: '250 credits', 
    pro: 'Unlimited', 
    huntorix: 'Unlimited',
    tooltip: 'Credits used to send applications. 1 application = 1 credit.'
  },
  { feature: 'Max CVs per job', free: '3', core: '5', pro: '5', huntorix: '5' },
  { 
    feature: 'Statistics & application insights', 
    free: false, 
    core: true, 
    pro: true, 
    huntorix: true,
    tooltip: 'Analytics on views, response time, conversion, success rates.'
  },
  { 
    feature: 'Candidate process visibility', 
    free: false, 
    core: true, 
    pro: true, 
    huntorix: true,
    tooltip: 'See each candidate\'s stage per job (timeline/progress).'
  },
  { feature: 'Video calls', free: false, core: false, pro: true, huntorix: true },
  { 
    feature: 'AI tools', 
    free: false, 
    core: false, 
    pro: true, 
    huntorix: true,
    tooltip: 'Write/shortlist faster with AI prompts and ranking.'
  },
  { feature: 'AI/Video badges on job cards', free: false, core: false, pro: true, huntorix: true },
  { 
    feature: 'Job notifications (by role & industry)', 
    free: false, 
    core: false, 
    pro: false, 
    huntorix: true,
    tooltip: 'Early heads-up based on your target roles & industries (HuntoriX only).'
  },
  { feature: 'Support', free: 'Standard', core: 'Standard', pro: 'Priority', huntorix: 'Priority' },
];

export function PlanSelection({ onPlanSelected, userId }: PlanSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [submitting, setSubmitting] = useState(false);

  const getPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return 0;
    return billingCycle === 'yearly' ? plan.monthlyPrice * 10 : plan.monthlyPrice;
  };

  const handleSelectPlan = async (planId: PlanId) => {
    setSubmitting(true);
    try {
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
          });

        if (error) throw error;
      }

      toast.success('Plan selected successfully!');
      onPlanSelected();
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to select plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFeatureValue = (value: any) => {
    if (value === true) return (
      <div className="flex justify-center">
        <Check className="h-5 w-5 text-primary font-bold" strokeWidth={3} />
      </div>
    );
    if (value === false) return (
      <div className="flex justify-center">
        <span className="text-muted-foreground">—</span>
      </div>
    );
    return (
      <div className="flex justify-center">
        <span className="text-sm font-medium">{value}</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-16 pb-16 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground">
            Select the plan that best fits your needs. You can change plans later.
          </p>
        </div>

        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center justify-center gap-4 p-2 rounded-full bg-muted/50 w-fit mx-auto backdrop-blur-sm border border-border/50">
          <span className={cn(
            "text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200",
            billingCycle === 'monthly' && "bg-primary text-primary-foreground shadow-lg"
          )}>
            Monthly
          </span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            className="data-[state=checked]:bg-[hsl(var(--vibrant-mint))]"
          />
          <span className={cn(
            "text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2",
            billingCycle === 'yearly' && "bg-primary text-primary-foreground shadow-lg"
          )}>
            Yearly
            <Badge 
              variant="secondary" 
              className="text-xs font-bold"
              style={{
                backgroundColor: 'hsl(var(--vibrant-mint))',
                color: 'hsl(var(--primary))',
              }}
            >
              save 2 months
            </Badge>
          </span>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan, index) => {
            const price = getPrice(plan);
            const isSelected = selectedPlan === plan.id;
            const isRecommended = plan.id === 'core';

            return (
              <Card
                key={plan.id}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
                className={cn(
                  "group relative cursor-pointer transition-all duration-300 rounded-3xl flex flex-col h-full animate-fade-in overflow-hidden",
                  "hover:shadow-2xl hover:-translate-y-2",
                  isSelected && !plan.locked && "ring-2 ring-[hsl(var(--vibrant-mint))] shadow-2xl scale-[1.02]",
                  isRecommended && "border-2 border-[hsl(var(--vibrant-lilac))] shadow-[0_8px_40px_rgba(167,139,250,0.25)] bg-gradient-to-br from-[hsl(var(--accent-lilac))] via-background to-background",
                  !isRecommended && "border-2 border-border",
                  plan.locked && "opacity-70 cursor-not-allowed hover:shadow-lg hover:translate-y-0",
                  !isSelected && !plan.locked && !isRecommended && "hover:border-[hsl(var(--accent-mint))]"
                )}
                onClick={() => !plan.locked && setSelectedPlan(plan.id)}
              >
                {/* Gradient overlay for recommended */}
                {isRecommended && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--vibrant-lilac)/0.08)] to-transparent pointer-events-none" />
                )}
                {plan.locked && (
                  <div className="absolute top-4 right-4 z-10">
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available soon</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    {isRecommended && (
                      <Badge 
                        className="text-xs font-bold px-3 py-1 animate-scale-in"
                        style={{
                          backgroundColor: 'hsl(var(--vibrant-lilac))',
                          color: 'white',
                        }}
                      >
                        ⭐ Popular
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-base font-medium">
                    {plan.description}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground hover:text-[hsl(var(--vibrant-mint))] transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Each application uses 1 credit.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardDescription>
                  <div className="mt-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-extrabold bg-gradient-to-br from-primary to-[hsl(var(--vibrant-mint))] bg-clip-text text-transparent">
                        ${price}
                      </span>
                      <span className="text-muted-foreground text-lg font-medium">
                        / {billingCycle === 'yearly' ? 'year' : 'mo'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                      <p className="text-sm font-medium mt-3 px-3 py-1.5 rounded-full bg-[hsl(var(--accent-mint))] text-primary w-fit">
                        💰 Save 2 months
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-8 flex-1 flex flex-col relative z-10">
                  <ul className="space-y-4 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li 
                        key={featureIndex} 
                        className="flex items-start gap-3 text-sm group/feature"
                        style={{
                          animationDelay: `${(index * 100) + (featureIndex * 50)}ms`,
                        }}
                      >
                        <div className={cn(
                          "rounded-full p-1 shrink-0 transition-all duration-200",
                          isRecommended ? "bg-[hsl(var(--vibrant-lilac)/0.2)]" : "bg-[hsl(var(--accent-mint))]"
                        )}>
                          <Check 
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform duration-200 group-hover/feature:scale-110",
                              isRecommended ? "text-[hsl(var(--vibrant-lilac))]" : "text-primary"
                            )} 
                            strokeWidth={3} 
                          />
                        </div>
                        <span className="leading-relaxed font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full h-12 text-base font-bold rounded-xl transition-all duration-200 relative overflow-hidden group/btn",
                      isSelected && "shadow-lg scale-105"
                    )}
                    variant={isSelected ? 'default' : 'outline'}
                    style={isRecommended && !isSelected ? {
                      borderColor: 'hsl(var(--vibrant-lilac))',
                      color: 'hsl(var(--vibrant-lilac))',
                    } : {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!plan.locked) setSelectedPlan(plan.id);
                    }}
                    disabled={plan.locked || submitting}
                  >
                    {!plan.locked && !isSelected && (
                      <span className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--vibrant-pink)/0.1)] via-[hsl(var(--vibrant-lilac)/0.1)] to-[hsl(var(--vibrant-mint)/0.1)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    )}
                    <span className="relative z-10">
                      {plan.locked ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Coming soon
                        </>
                      ) : isSelected ? (
                        <>
                          <Check className="mr-2 h-5 w-5" strokeWidth={3} />
                          Selected
                        </>
                      ) : (
                        'Select Plan'
                      )}
                    </span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Plans at a glance strip */}
        <div className="flex items-center justify-center gap-3 flex-wrap p-6 rounded-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-lilac))] to-[hsl(var(--accent-mint))] animate-fade-in">
          {PLANS.map((plan) => {
            const price = getPrice(plan);
            return (
              <Badge
                key={plan.id}
                variant="secondary"
                className={cn(
                  "px-5 py-2.5 text-sm font-bold bg-background/95 backdrop-blur-sm hover:scale-105 transition-transform duration-200 border-2",
                  plan.id === 'core' && "border-[hsl(var(--vibrant-lilac))]",
                  plan.locked && "opacity-60"
                )}
              >
                {plan.name} — ${price}{billingCycle === 'yearly' ? '/yr' : '/mo'}
                {plan.locked && ' 🔒'}
              </Badge>
            );
          })}
        </div>

        {/* Feature Comparison Table - Desktop */}
        <div className="hidden md:block space-y-6 animate-fade-in">
          <h3 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] bg-clip-text text-transparent">
            Plans at a Glance
          </h3>
          
          <div className="overflow-x-auto rounded-3xl border-2 border-border shadow-2xl bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2">
                  <TableHead className="sticky left-0 bg-background z-10 w-[280px] font-bold text-base">Feature</TableHead>
                  {PLANS.map((plan) => (
                    <TableHead key={plan.id} className="text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-3 py-4">
                        <span className="text-xl font-bold">{plan.name}</span>
                        {plan.id === 'core' && (
                          <Badge 
                            className="font-semibold"
                            style={{
                              backgroundColor: 'hsl(var(--primary))',
                              color: 'hsl(var(--primary-foreground))',
                            }}
                          >
                            Recommended
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant={plan.locked ? 'outline' : 'default'}
                          disabled={plan.locked}
                          onClick={() => !plan.locked && setSelectedPlan(plan.id)}
                          className="mt-2 w-full font-semibold"
                        >
                          {plan.locked ? (
                            <>
                              <Lock className="mr-1 h-3 w-3" />
                              Locked
                            </>
                          ) : (
                            `Choose ${plan.name}`
                          )}
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {FEATURE_COMPARISON.map((row, index) => (
                  <TableRow key={index} className={cn(
                    "border-b",
                    index % 2 === 0 ? 'bg-muted/20' : ''
                  )}>
                    <TableCell className="sticky left-0 bg-background z-10 font-semibold py-4">
                      <div className="flex items-center gap-2">
                        {row.feature}
                        {row.tooltip && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.free)}</TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.core)}</TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.pro)}</TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.huntorix)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="text-center">
            <Button variant="link" className="text-sm text-muted-foreground">
              Compare details
            </Button>
          </div>
        </div>

        {/* Feature Comparison - Mobile Cards */}
        <div className="md:hidden space-y-6 animate-fade-in">
          <h3 className="text-3xl font-bold text-center bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] bg-clip-text text-transparent">
            Plans at a Glance
          </h3>
          
          {PLANS.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={cn(
                "rounded-3xl border-2 hover:shadow-xl transition-all duration-300 animate-fade-in",
                plan.id === 'core' && "border-[hsl(var(--vibrant-lilac))] bg-gradient-to-br from-[hsl(var(--accent-lilac))] to-background"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  {plan.id === 'core' && (
                    <Badge 
                      className="font-bold text-xs"
                      style={{
                        backgroundColor: 'hsl(var(--vibrant-lilac))',
                        color: 'white',
                      }}
                    >
                      ⭐ Popular
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {FEATURE_COMPARISON.map((row, index) => {
                  const value = row[plan.id as keyof typeof row];
                  if (value === false) return null;
                  
                  return (
                    <div key={index} className="flex items-start justify-between gap-3 text-sm py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-semibold">{row.feature}</span>
                        {row.tooltip && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground shrink-0 hover:text-[hsl(var(--vibrant-mint))] transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="shrink-0">
                        {typeof value === 'boolean' && value ? (
                          <div className="rounded-full p-1 bg-[hsl(var(--accent-mint))]">
                            <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                          </div>
                        ) : typeof value === 'string' ? (
                          <span className="font-bold text-primary">{value}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Button
                  className={cn(
                    "w-full mt-6 h-12 font-bold rounded-xl transition-all duration-200",
                    plan.id === 'core' && "bg-[hsl(var(--vibrant-lilac))] hover:bg-[hsl(var(--vibrant-lilac))] text-white"
                  )}
                  variant={plan.locked ? 'outline' : 'default'}
                  disabled={plan.locked}
                  onClick={() => !plan.locked && setSelectedPlan(plan.id)}
                >
                  {plan.locked ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Coming soon
                    </>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Helper Notes */}
        <div className="space-y-3 text-sm max-w-4xl mx-auto p-6 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-mint))] animate-fade-in">
          <p className="font-semibold text-primary flex items-center gap-2">
            <span className="text-lg">💡</span>
            Applications credits = credits to send applications (1 application = 1 credit).
          </p>
          <p className="font-semibold text-primary flex items-center gap-2">
            <span className="text-lg">📊</span>
            Candidate process visibility = see each candidate's stage per job (timeline/progress).
          </p>
          <p className="font-semibold text-primary flex items-center gap-2">
            <span className="text-lg">📈</span>
            Statistics & application insights = analytics on views, response time, success rates, etc.
          </p>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-8 animate-fade-in">
          <Button
            size="lg"
            disabled={!selectedPlan || submitting}
            onClick={() => selectedPlan && handleSelectPlan(selectedPlan)}
            className={cn(
              "min-w-[280px] h-14 text-lg font-bold rounded-2xl transition-all duration-300 relative overflow-hidden group shadow-2xl",
              selectedPlan && "hover:scale-105 animate-scale-in"
            )}
            style={selectedPlan ? {
              background: 'linear-gradient(135deg, hsl(var(--vibrant-mint)), hsl(var(--vibrant-lilac)))',
            } : {}}
          >
            {!submitting && selectedPlan && (
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
            <span className="relative z-10">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <span className="ml-2">→</span>
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
