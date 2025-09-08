export const formatUserName = (firstName?: string, lastName?: string, email?: string): string => {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (email) return email;
  return 'Unknown User';
};

export const formatUserNameFromProfile = (profile?: { first_name?: string; last_name?: string; email?: string } | null): string => {
  if (!profile) return 'Unknown User';
  return formatUserName(profile.first_name, profile.last_name, profile.email);
};