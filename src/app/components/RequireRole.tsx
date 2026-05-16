'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export type Role = 'admin' | 'reservation' | 'frontoffice' | 'housekeeper' | 'user';

const isAdmin = (role: unknown) => role === 'admin' || role === 'super_admin';

export default function RequireRole({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: Role[];
}) {
  const router = useRouter();
  console.log('RequireRole: Initializing with allowedRoles:', allowedRoles);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        console.log('RequireRole: Starting role check...');
        setChecking(true);
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          console.log('RequireRole: No user or auth error. Redirecting to /');
          if (!alive) return;
          router.push('/');
          return;
        }
        console.log('RequireRole: User found:', user.id);

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.log('RequireRole: No profile or profile error. Signing out and redirecting to /');
          if (!alive) return;
          await supabase.auth.signOut();
          router.push('/');
          return;
        }

        const nextRole = profile.role as string;
        console.log('RequireRole: User role:', nextRole);

        if (isAdmin(nextRole) || allowedRoles.includes(nextRole as Role)) {
          if (!alive) return;
          setChecking(false);
          console.log('RequireRole: Role allowed. Rendering children.');
          return;
        }

        if (!alive) return;
        console.log('RequireRole: Role not allowed. Redirecting to /dashboard');
        router.push('/dashboard');
      } catch {
        if (!alive) return;
        console.error('RequireRole: An unexpected error occurred during role check. Redirecting to /dashboard');
        router.push('/dashboard');
      } finally {
        if (alive) setChecking(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [allowedRoles, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
