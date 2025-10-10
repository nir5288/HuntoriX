import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Info, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  onPlanSelected: (planId?: string) => void;
  userId: string;
  initialSelectedPlan?: string | null;
}
const PLANS: Plan[] = [{
  id: 'free',
  name: 'Free',
  monthlyPrice: 0,
  description: '20 credits / month',
  features: ['Access to public jobs', 'Basic profile', 'Chat', 'Dashboard', 'Max 3 CVs per job'],
  locked: false,
  icon: ''
}, {
  id: 'core',
  name: 'Core',
  monthlyPrice: 29,
  description: '250 credits / month',
  features: ['Everything in Free', 'Priority support', 'Advanced search filters', 'Candidate process visibility', 'Statistics & application insights', 'Max 5 CVs per job'],
  locked: false,
  icon: ''
}, {
  id: 'pro',
  name: 'Pro',
  monthlyPrice: 39,
  description: 'Unlimited credits',
  features: ['Everything in Core', 'Bulk apply', 'Featured profile', 'Analytics dashboard', 'AI tools', 'Video calls', 'AI/Video badges on job cards'],
  locked: true,
  icon: ''
}, {
  id: 'huntorix',
  name: 'HuntoriX',
  monthlyPrice: 79,
  description: 'Unlimited credits',
  features: ['Everything in Pro', 'AI matchmaking & candidate search', 'Work worldwide', 'Dedicated account manager', 'White-label solution', 'Custom integrations', 'Job notifications (by role & industry)'],
  locked: true,
  icon: ''
}];
const FEATURE_COMPARISON = [{
  feature: 'Profile & registration',
  free: true,
  core: true,
  pro: true,
  huntorix: true
}, {
  feature: 'Dashboard',
  free: true,
  core: true,
  pro: true,
  huntorix: true
}, {
  feature: 'Chat',
  free: true,
  core: true,
  pro: true,
  huntorix: true
}, {
  feature: 'Employer invites',
  free: 'Unlimited',
  core: 'Unlimited',
  pro: 'Unlimited',
  huntorix: 'Unlimited'
}, {
  feature: 'Applications credits',
  free: '20 credits',
  core: '250 credits',
  pro: 'Unlimited',
  huntorix: 'Unlimited',
  tooltip: 'Credits used to send applications. 1 application = 1 credit.'
}, {
  feature: 'Max CVs per job',
  free: '3',
  core: '5',
  pro: '5',
  huntorix: '5'
}, {
  feature: 'Bulk apply',
  free: false,
  core: false,
  pro: true,
  huntorix: true,
  tooltip: 'Apply to multiple jobs at once with a single click.'
}, {
  feature: 'Statistics & application insights',
  free: false,
  core: true,
  pro: true,
  huntorix: true,
  tooltip: 'Analytics on views, response time, conversion, success rates.'
}, {
  feature: 'Candidate process visibility',
  free: false,
  core: true,
  pro: true,
  huntorix: true,
  tooltip: 'See each candidate\'s stage per job (timeline/progress).'
}, {
  feature: 'Video calls',
  free: false,
  core: false,
  pro: true,
  huntorix: true
}, {
  feature: 'AI tools',
  free: false,
  core: false,
  pro: true,
  huntorix: true,
  tooltip: 'Write/shortlist faster with AI prompts and ranking.'
}, {
  feature: 'AI/Video badges on job cards',
  free: false,
  core: false,
  pro: true,
  huntorix: true
}, {
  feature: 'AI matchmaking',
  free: false,
  core: false,
  pro: false,
  huntorix: true,
  tooltip: 'Intelligent AI-powered matching between jobs and headhunters based on expertise, history, and success rates.'
}, {
  feature: 'AI candidate search',
  free: false,
  core: false,
  pro: false,
  huntorix: true,
  tooltip: 'Advanced AI-driven candidate search and screening capabilities.'
}, {
  feature: 'Work worldwide',
  free: false,
  core: false,
  pro: false,
  huntorix: true,
  tooltip: 'Access to global job opportunities and international placements.'
}, {
  feature: 'Job notifications (by role & industry)',
  free: false,
  core: false,
  pro: false,
  huntorix: true,
  tooltip: 'Early heads-up based on your target roles & industries (HuntoriX only).'
}, {
  feature: 'Support',
  free: 'Standard',
  core: 'Standard',
  pro: 'Priority',
  huntorix: 'Dedicated'
}];
export function PlanSelection({
  onPlanSelected,
  userId,
  initialSelectedPlan
}: PlanSelectionProps) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(initialSelectedPlan as PlanId | null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<{
    planId: PlanId;
    planUuid: string;
    resetDate: Date;
  } | null>(null);

  // Update selected plan if initialSelectedPlan changes
  useEffect(() => {
    if (initialSelectedPlan) {
      setSelectedPlan(initialSelectedPlan as PlanId);
    }
  }, [initialSelectedPlan]);
  const getPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return 0;
    return billingCycle === 'yearly' ? plan.monthlyPrice * 10 : plan.monthlyPrice;
  };
  const getPlanCredits = (planName: string): number => {
    const lowerName = planName.toLowerCase();
    if (lowerName === 'free') return 20;
    if (lowerName === 'core') return 250;
    return 999999; // Unlimited for pro/huntorix
  };
  const handleSelectPlan = async (planId: PlanId) => {
    setSubmitting(true);

    // If no userId, user is not logged in - store plan and redirect to signup
    if (!userId) {
      onPlanSelected(planId);
      return;
    }
    try {
      // First, get the actual UUID for the plan from subscription_plans table
      const {
        data: planData,
        error: planError
      } = await supabase.from('subscription_plans').select('id, name').ilike('name', planId).maybeSingle();
      if (planError || !planData) {
        throw new Error(`Plan "${planId}" not found in subscription_plans table`);
      }
      const planUuid = planData.id;

      // Check if user already has a subscription and get current plan info
      const {
        data: existing
      } = await supabase.from('user_subscriptions').select('id, plan_id, credits_reset_at, subscription_plans(name)').eq('user_id', userId).maybeSingle();
      if (existing?.subscription_plans) {
        const currentPlanName = (existing.subscription_plans as any).name;
        const currentCredits = getPlanCredits(currentPlanName);
        const newCredits = getPlanCredits(planData.name);

        // Check if this is a downgrade
        if (newCredits < currentCredits) {
          // Calculate next reset date (1 month from credits_reset_at)
          const resetDate = new Date(existing.credits_reset_at);
          resetDate.setMonth(resetDate.getMonth() + 1);

          // Store pending change and show confirmation dialog
          setPendingPlanChange({
            planId,
            planUuid,
            resetDate
          });
          setDowngradeDialogOpen(true);
          setSubmitting(false);
          return;
        }
      }

      // If not a downgrade or no existing subscription, proceed immediately
      await applyPlanChange(planUuid, false);
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to select plan. Please try again.');
      setSubmitting(false);
    }
  };
  const applyPlanChange = async (planUuid: string, isDowngrade: boolean) => {
    try {
      const {
        data: existing
      } = await supabase.from('user_subscriptions').select('id, credits_reset_at, next_plan_id').eq('user_id', userId).maybeSingle();
      if (existing) {
        if (isDowngrade) {
          // For downgrades, schedule the change for next month
          const resetDate = new Date(existing.credits_reset_at);
          resetDate.setMonth(resetDate.getMonth() + 1);
          const {
            error
          } = await supabase.from('user_subscriptions').update({
            next_plan_id: planUuid,
            plan_change_effective_date: resetDate.toISOString(),
            updated_at: new Date().toISOString()
          }).eq('user_id', userId);
          if (error) throw error;
          toast.success('Your plan will be downgraded at the next billing cycle');
        } else {
          // For upgrades
          // If there's a pending downgrade, cancel it and keep current credits
          // Otherwise, reset credits to full amount of new plan
          const shouldResetCredits = !existing.next_plan_id;
          const {
            error
          } = await supabase.from('user_subscriptions').update({
            plan_id: planUuid,
            status: 'active',
            next_plan_id: null,
            plan_change_effective_date: null,
            credits_used: shouldResetCredits ? 0 : undefined,
            credits_reset_at: shouldResetCredits ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString()
          }).eq('user_id', userId);
          if (error) throw error;
          if (existing.next_plan_id) {
            toast.success('Plan change cancelled - continuing with upgraded plan!');
          } else {
            toast.success('Plan upgraded successfully!');
          }
        }
      } else {
        // New subscription
        const {
          error
        } = await supabase.from('user_subscriptions').insert({
          user_id: userId,
          plan_id: planUuid,
          status: 'active'
        });
        if (error) throw error;
        toast.success('Plan selected successfully!');
      }
      onPlanSelected();
    } catch (error) {
      console.error('Error applying plan change:', error);
      throw error;
    } finally {
      setSubmitting(false);
      setDowngradeDialogOpen(false);
      setPendingPlanChange(null);
    }
  };
  const confirmDowngrade = async () => {
    if (!pendingPlanChange) return;
    setSubmitting(true);
    await applyPlanChange(pendingPlanChange.planUuid, true);
  };
  const renderFeatureValue = (value: any) => {
    if (value === true) return <div className="flex justify-center">
        <Check className="h-5 w-5 text-primary font-bold" strokeWidth={3} />
      </div>;
    if (value === false) return <div className="flex justify-center">
        <span className="text-muted-foreground">—</span>
      </div>;
    return <div className="flex justify-center">
        <span className="text-sm font-medium">{value}</span>
      </div>;
  };
  return <TooltipProvider>
      <div className="space-y-16 pb-16 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] bg-clip-text text-transparent break-words">
            Choose Your Plan
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground break-words px-2">
            Select the plan that best fits your needs. You can change plans later.
          </p>
        </div>

        {/* Employer Notice */}
        {!userId && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Are you an employer?
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="font-semibold"
                onClick={() => navigate('/auth?mode=signup&role=employer')}
              >
                Register as Employer
              </Button>
            </div>
          </div>
        )}

        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 p-2 rounded-full bg-muted/50 w-fit mx-auto backdrop-blur-sm border border-border/50 max-w-[95vw]">
          <span className={cn("text-xs sm:text-sm font-semibold px-2 sm:px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap", billingCycle === 'monthly' && "bg-primary text-primary-foreground shadow-lg")}>
            Monthly
          </span>
          <Switch checked={billingCycle === 'yearly'} onCheckedChange={checked => setBillingCycle(checked ? 'yearly' : 'monthly')} className="data-[state=checked]:bg-[hsl(var(--vibrant-mint))] shrink-0" />
          <span className={cn("text-xs sm:text-sm font-semibold px-2 sm:px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1 sm:gap-2", billingCycle === 'yearly' && "bg-primary text-primary-foreground shadow-lg")}>
            <span className="whitespace-nowrap">Yearly</span>
            <Badge variant="secondary" className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 whitespace-nowrap" style={{
            backgroundColor: 'hsl(var(--vibrant-mint))',
            color: 'hsl(var(--primary))'
          }}>
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
          return <Card key={plan.id} style={{
            animationDelay: `${index * 100}ms`
          }} className={cn("group relative cursor-pointer transition-all duration-300 rounded-3xl flex flex-col h-full animate-fade-in overflow-hidden", "hover:shadow-2xl hover:-translate-y-2", isSelected && !plan.locked && "ring-2 ring-[hsl(var(--vibrant-mint))] shadow-2xl scale-[1.02]", isRecommended && "border-2 border-[hsl(var(--vibrant-lilac))] shadow-[0_8px_40px_rgba(167,139,250,0.25)] bg-gradient-to-br from-[hsl(var(--accent-lilac))] via-background to-background", !isRecommended && "border-2 border-border", plan.locked && "opacity-70 cursor-not-allowed hover:shadow-lg hover:translate-y-0", !isSelected && !plan.locked && !isRecommended && "hover:border-[hsl(var(--accent-mint))]")} onClick={() => {
            if (!plan.locked) {
              setSelectedPlan(plan.id);
              // Auto-continue on mobile
              if (window.innerWidth < 768) {
                handleSelectPlan(plan.id);
              }
            }
          }}>
                {/* Gradient overlay for recommended */}
                {isRecommended && <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--vibrant-lilac)/0.08)] to-transparent pointer-events-none" />}

                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    {isRecommended && <Badge className="text-xs font-bold px-3 py-1 animate-scale-in" style={{
                  backgroundColor: 'hsl(var(--vibrant-lilac))',
                  color: 'white'
                }}>
                        ⭐ Popular
                      </Badge>}
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
                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && <p className="text-sm font-medium mt-3 px-3 py-1.5 rounded-full bg-[hsl(var(--accent-mint))] text-primary w-fit">
                        💰 Save 2 months
                      </p>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 flex flex-col relative z-10">
                  <ul className="space-y-4 flex-1">
                    {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start gap-3 text-sm group/feature" style={{
                  animationDelay: `${index * 100 + featureIndex * 50}ms`
                }}>
                        <div className={cn("rounded-full p-1 shrink-0 transition-all duration-200", isRecommended ? "bg-[hsl(var(--vibrant-lilac)/0.2)]" : "bg-[hsl(var(--accent-mint))]")}>
                          <Check className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover/feature:scale-110", isRecommended ? "text-[hsl(var(--vibrant-lilac))]" : "text-primary")} strokeWidth={3} />
                        </div>
                        <span className="leading-relaxed font-medium">{feature}</span>
                      </li>)}
                  </ul>

                  <Button className={cn("w-full h-12 text-base font-bold rounded-xl transition-all duration-200 relative overflow-hidden group/btn", isSelected && "shadow-lg scale-105")} variant={isSelected ? 'default' : 'outline'} style={isRecommended && !isSelected ? {
                borderColor: 'hsl(var(--vibrant-lilac))',
                color: 'hsl(var(--vibrant-lilac))'
              } : {}} onClick={e => {
                e.stopPropagation();
                if (!plan.locked) setSelectedPlan(plan.id);
              }} disabled={plan.locked || submitting}>
                    {!plan.locked && !isSelected && <span className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--vibrant-pink)/0.1)] via-[hsl(var(--vibrant-lilac)/0.1)] to-[hsl(var(--vibrant-mint)/0.1)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />}
                    <span className="relative z-10">
                      {plan.locked ? 'Coming soon' : isSelected ? 'Selected' : 'Select Plan'}
                    </span>
                  </Button>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Continue Button - Desktop/Tablet Only */}
        <div className="hidden md:flex justify-center animate-fade-in">
          <Button size="lg" disabled={!selectedPlan || submitting} onClick={() => selectedPlan && handleSelectPlan(selectedPlan)} className={cn("min-w-[280px] h-14 text-lg font-bold rounded-2xl transition-all duration-300 relative overflow-hidden group shadow-2xl", selectedPlan && "hover:scale-105 animate-scale-in")} style={selectedPlan ? {
          background: 'linear-gradient(135deg, hsl(var(--vibrant-mint)), hsl(var(--vibrant-lilac)))'
        } : {}}>
            {!submitting && selectedPlan && <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />}
            <span className="relative z-10">
              {submitting ? <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </> : <>
                  Continue
                  <span className="ml-2">→</span>
                </>}
            </span>
          </Button>
        </div>

        {/* Plans at a glance strip */}
        <div className="flex items-center justify-center gap-3 flex-wrap p-6 rounded-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-lilac))] to-[hsl(var(--accent-mint))] animate-fade-in">
          {PLANS.map(plan => {
          const price = getPrice(plan);
          return <Badge key={plan.id} variant="secondary" className={cn("px-5 py-2.5 text-sm font-bold bg-background/95 backdrop-blur-sm hover:scale-105 transition-transform duration-200 border-2", plan.id === 'core' && "border-[hsl(var(--vibrant-lilac))]", plan.locked && "opacity-60")}>
                {plan.name} — ${price}{billingCycle === 'yearly' ? '/yr' : '/mo'}
                {plan.locked && ' 🔒'}
              </Badge>;
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
                  {PLANS.map(plan => <TableHead key={plan.id} className="text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-3 py-4">
                        <span className="text-xl font-bold">{plan.name}</span>
                        {plan.id === 'core'}
                        
                      </div>
                    </TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {FEATURE_COMPARISON.map((row, index) => {
                const isHighlighted = row.feature === 'Applications credits' || row.feature === 'Work worldwide';
                return <TableRow key={index} className={cn("border-b", isHighlighted ? 'bg-[hsl(var(--accent-mint))] hover:bg-[hsl(var(--accent-mint))]/90' : index % 2 === 0 ? 'bg-muted/20' : '')}>
                    <TableCell className={cn("sticky left-0 z-10 font-semibold py-4", isHighlighted ? 'bg-[hsl(var(--accent-mint))]' : 'bg-background')}>
                      <div className="flex items-center gap-2">
                        {row.feature}
                        {row.tooltip && <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.free)}</TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.core)}</TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.pro)}</TableCell>
                    <TableCell className="py-4">{renderFeatureValue(row.huntorix)}</TableCell>
                  </TableRow>;
              })}
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
          
          {PLANS.map((plan, index) => <Card key={plan.id} className={cn("rounded-3xl border-2 hover:shadow-xl transition-all duration-300 animate-fade-in", plan.id === 'core' && "border-[hsl(var(--vibrant-lilac))] bg-gradient-to-br from-[hsl(var(--accent-lilac))] to-background")} style={{
          animationDelay: `${index * 100}ms`
        }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  {plan.id === 'core' && <Badge className="font-bold text-xs" style={{
                backgroundColor: 'hsl(var(--vibrant-lilac))',
                color: 'white'
              }}>
                      ⭐ Popular
                    </Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {FEATURE_COMPARISON.map((row, index) => {
              const value = row[plan.id as keyof typeof row];
              if (value === false) return null;
              const isHighlighted = row.feature === 'Applications credits' || row.feature === 'Work worldwide';
              return <div key={index} className={cn("flex items-start justify-between gap-3 text-sm py-2.5 border-b border-border/50 last:border-0", isHighlighted && "bg-[hsl(var(--accent-mint))] -mx-6 px-6 py-3 rounded-lg border-0")}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-semibold">{row.feature}</span>
                        {row.tooltip && <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground shrink-0 hover:text-[hsl(var(--vibrant-mint))] transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>}
                      </div>
                      <div className="shrink-0">
                        {typeof value === 'boolean' && value ? <div className="rounded-full p-1 bg-[hsl(var(--accent-mint))]">
                            <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                          </div> : typeof value === 'string' ? <span className="font-bold text-primary">{value}</span> : <span className="text-muted-foreground">—</span>}
                      </div>
                    </div>;
            })}
                <Button className={cn("w-full mt-6 h-12 font-bold rounded-xl transition-all duration-200", plan.id === 'core' && "bg-[hsl(var(--vibrant-lilac))] hover:bg-[hsl(var(--vibrant-lilac))] text-white")} variant={plan.locked ? 'outline' : 'default'} disabled={plan.locked} onClick={() => !plan.locked && setSelectedPlan(plan.id)}>
                  {plan.locked ? 'Coming soon' : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>)}
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
          <p className="font-semibold text-primary flex items-center gap-2">
            <span className="text-lg">🤖</span>
            AI matchmaking & candidate search = exclusive to HuntoriX for intelligent matching and screening.
          </p>
          <p className="font-semibold text-primary flex items-center gap-2">
            <span className="text-lg">🌍</span>
            Work worldwide = HuntoriX members can access global opportunities and international placements.
          </p>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-8 animate-fade-in">
          <Button size="lg" disabled={!selectedPlan || submitting} onClick={() => selectedPlan && handleSelectPlan(selectedPlan)} className={cn("min-w-[280px] h-14 text-lg font-bold rounded-2xl transition-all duration-300 relative overflow-hidden group shadow-2xl", selectedPlan && "hover:scale-105 animate-scale-in")} style={selectedPlan ? {
          background: 'linear-gradient(135deg, hsl(var(--vibrant-mint)), hsl(var(--vibrant-lilac)))'
        } : {}}>
            {!submitting && selectedPlan && <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />}
            <span className="relative z-10">
              {submitting ? <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </> : <>
                  Continue
                  <span className="ml-2">→</span>
                </>}
            </span>
          </Button>
        </div>
      </div>
      
      {/* Downgrade Confirmation Dialog */}
      <AlertDialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Downgrade Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>You are about to downgrade your plan.</p>
              {pendingPlanChange && <>
                  <p className="font-medium text-foreground">
                    Your current credits will remain available until{' '}
                    <span className="text-primary">
                      {pendingPlanChange.resetDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                    </span>
                  </p>
                  <p>
                    After this date, you will be switched to the new plan with its credit allocation.
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    You can upgrade back to your current plan at any time without waiting.
                  </p>
                </>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDowngrade} disabled={submitting} className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]">
              {submitting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </> : 'Confirm Downgrade'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>;
}