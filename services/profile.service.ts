import { prisma } from '@/lib/prisma';
import { ChangePasswordInput, UpdateProfileInput } from '@/lib/validations/profile.schema';
import bcrypt from 'bcryptjs';

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
  if (!isPasswordValid) throw new Error('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true, message: 'Password changed successfully' };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const existingUser = await prisma.user.findFirst({
    where: {
      AND: [
        { id: { not: userId } },
        {
          OR: [
            { username: input.username },
            { email: input.email },
          ],
        },
      ],
    },
  });

  if (existingUser) {
    throw new Error('Username or email already in use');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      username: input.username,
      email: input.email,
      contactNumber: input.contactNumber,
    },
    include: { roles: true },
  });

  return user;
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });
  
  if (!user) throw new Error('User not found');

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
