import { AuthProvider } from "@/contexts/auth-context";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('📄 [Onboarding Layout] ========================================')
  console.log('📄 [Onboarding Layout] LAYOUT RENDERING')
  console.log('📄 [Onboarding Layout] Using AuthProvider only (no CustomerProvider)')
  console.log('📄 [Onboarding Layout] ========================================')

  // Onboarding only needs AuthProvider, not CustomerProvider
  // to avoid redirect loops
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
