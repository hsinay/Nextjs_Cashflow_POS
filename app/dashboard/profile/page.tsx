import { EditProfileForm } from '@/components/auth/edit-profile-form';
import { authOptions } from '@/lib/auth';
import { getUserProfile } from '@/services/profile.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Profile | POS/ERP System',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await getUserProfile(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-2">
          Manage your account information
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Account Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-500">Username</label>
              <p className="text-sm font-medium mt-1 text-slate-900">{user.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">Email</label>
              <p className="text-sm font-medium mt-1 text-slate-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">Contact Number</label>
              <p className="text-sm font-medium mt-1 text-slate-900">{user.contactNumber || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">Roles</label>
              <p className="text-sm font-medium mt-1 text-slate-900">
                {user.roles?.map((r: any) => r.name).join(', ') || 'No roles assigned'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Edit Profile</h3>
          <EditProfileForm user={user} />
        </div>
      </div>
    </div>
  );
}