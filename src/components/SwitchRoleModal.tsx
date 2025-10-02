import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface SwitchRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRole: 'employer' | 'headhunter';
  targetRole: 'employer' | 'headhunter';
}

export function SwitchRoleModal({ open, onOpenChange, currentRole, targetRole }: SwitchRoleModalProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    const dashboardPath = currentRole === 'employer' ? '/dashboard/employer' : '/dashboard/headhunter';
    navigate(dashboardPath);
    onOpenChange(false);
  };

  const handleLogout = async () => {
    await signOut();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Switch to {targetRole === 'employer' ? 'Employer' : 'Headhunter'}?</AlertDialogTitle>
          <AlertDialogDescription>
            You're currently signed in as {currentRole === 'employer' ? 'an Employer' : 'a Headhunter'}. 
            To continue as {targetRole === 'employer' ? 'an Employer' : 'a Headhunter'}, please log out and sign in with a different role.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleGoToDashboard} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Go to {currentRole === 'employer' ? 'Employer' : 'Headhunter'} Dashboard
          </AlertDialogAction>
          <AlertDialogAction onClick={handleLogout}>
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
