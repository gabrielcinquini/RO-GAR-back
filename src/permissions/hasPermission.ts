import { PilotRank, User } from '@prisma/client';
import { permissions } from './permissions';

export const userHasPermission = (user: Pick<User, 'internalRole'>, role: PilotRank) => {
  if (!user) return false;

  const hasUserPermission = permissions[role] <= permissions[user.internalRole];

  return hasUserPermission;
};