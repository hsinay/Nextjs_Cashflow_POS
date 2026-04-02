import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Change Password | POS/ERP System',
};

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Change Password</h1>
        <p className="text-slate-600 mt-2">
          Update your password to keep your account secure
        </p>
      </div>

      <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6 max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}