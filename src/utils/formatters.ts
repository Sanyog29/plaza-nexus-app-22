export const formatUserName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return 'Unknown User';
  if (!firstName) return lastName || 'Unknown User';
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

export const formatUserNameFromProfile = (profile?: { first_name?: string; last_name?: string } | null): string => {
  if (!profile) return 'Unknown User';
  return formatUserName(profile.first_name, profile.last_name);
};