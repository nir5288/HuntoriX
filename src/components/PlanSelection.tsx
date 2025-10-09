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
    icon: '🟢',
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
    icon: '🔵',
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
    icon: '⭐',
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
    icon: '💎',
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
    if (value === true) return <Check className="h-4 w-4 text-[hsl(var(--accent-mint))]" />;
    if (value === false) return <span className="text-muted-foreground">—</span>;
    return <span className="text-sm">{value}</span>;
  };

  return (
    <TooltipProvider>
      <div className="space-y-12 pb-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            Select the plan that best fits your needs. You can change plans later.
          </p>
        </div>

        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", billingCycle === 'monthly' && "text-foreground")}>
            Monthly
          </span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <span className={cn("text-sm font-medium", billingCycle === 'yearly' && "text-foreground")}>
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              save 2 months
            </Badge>
          </span>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const price = getPrice(plan);
            const isSelected = selectedPlan === plan.id;
            const isRecommended = plan.id === 'core';

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 rounded-2xl",
                  isSelected && !plan.locked && "ring-2 ring-[hsl(var(--accent-mint))] shadow-lg",
                  isRecommended && "border-[hsl(var(--accent-lilac))]",
                  plan.locked && "opacity-60"
                )}
                onClick={() => !plan.locked && setSelectedPlan(plan.id)}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge 
                      style={{
                        backgroundColor: 'hsl(var(--accent-lilac) / 0.2)',
                        color: 'hsl(var(--accent-lilac))',
                        borderColor: 'hsl(var(--accent-lilac))',
                        borderWidth: 1,
                      }}
                    >
                      Recommended
                    </Badge>
                  </div>
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

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.icon}</span>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    {plan.description}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Each application uses 1 credit.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-muted-foreground">
                        / {billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        billed yearly, save 2 months
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-[hsl(var(--accent-mint))] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!plan.locked) setSelectedPlan(plan.id);
                    }}
                    disabled={plan.locked || submitting}
                  >
                    {plan.locked ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Coming soon
                      </>
                    ) : isSelected ? (
                      'Selected'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Plans at a glance strip */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {PLANS.map((plan) => {
            const price = getPrice(plan);
            return (
              <Badge
                key={plan.id}
                variant="outline"
                className={cn(
                  "px-3 py-1 text-sm",
                  plan.locked && "opacity-60"
                )}
              >
                {plan.icon} {plan.name} — ${price}{billingCycle === 'yearly' && '/yr'}
                {plan.locked && ' (Locked)'}
              </Badge>
            );
          })}
        </div>

        {/* Feature Comparison Table - Desktop */}
        <div className="hidden md:block space-y-4">
          <h3 className="text-2xl font-bold text-center">Plans at a Glance</h3>
          
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 w-[250px]">Feature</TableHead>
                  {PLANS.map((plan) => (
                    <TableHead key={plan.id} className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{plan.icon}</span>
                          <span>{plan.name}</span>
                        </div>
                        {plan.id === 'core' && (
                          <Badge 
                            variant="secondary"
                            style={{
                              backgroundColor: 'hsl(var(--accent-lilac) / 0.2)',
                              color: 'hsl(var(--accent-lilac))',
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
                          className="mt-2"
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
                  <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      <div className="flex items-center gap-2">
                        {row.feature}
                        {row.tooltip && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{renderFeatureValue(row.free)}</TableCell>
                    <TableCell className="text-center">{renderFeatureValue(row.core)}</TableCell>
                    <TableCell className="text-center">{renderFeatureValue(row.pro)}</TableCell>
                    <TableCell className="text-center">{renderFeatureValue(row.huntorix)}</TableCell>
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
        <div className="md:hidden space-y-6">
          <h3 className="text-2xl font-bold text-center">Plans at a Glance</h3>
          
          {PLANS.map((plan) => (
            <Card key={plan.id} className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.icon}</span>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  {plan.id === 'core' && (
                    <Badge variant="secondary">Recommended</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {FEATURE_COMPARISON.map((row, index) => {
                  const value = row[plan.id as keyof typeof row];
                  if (value === false) return null;
                  
                  return (
                    <div key={index} className="flex items-start justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.feature}</span>
                        {row.tooltip && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="text-muted-foreground shrink-0">
                        {renderFeatureValue(value)}
                      </div>
                    </div>
                  );
                })}
                <Button
                  className="w-full mt-4"
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
        <div className="space-y-2 text-sm text-muted-foreground text-center max-w-3xl mx-auto">
          <p>• Applications credits = credits to send applications (1 application = 1 credit).</p>
          <p>• Candidate process visibility = see each candidate's stage per job (timeline/progress).</p>
          <p>• Statistics & application insights = analytics on views, response time, success rates, etc.</p>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            disabled={!selectedPlan || submitting}
            onClick={() => selectedPlan && handleSelectPlan(selectedPlan)}
            className="min-w-[200px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
