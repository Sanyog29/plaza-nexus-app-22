export const formatUserName = (firstName?: string, lastName?: string, email?: string): string => {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (email) {
    // Try to create a human-readable name from email
    const emailPart = email.split('@')[0];
    // Handle common patterns like first.last, firstname.lastname, etc.
    const nameParts = emailPart.split(/[._-]/).map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    );
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[1]}`;
    }
    // Fallback to email if no pattern found
    return email;
  }
  return 'Unknown User';
};

export const formatUserNameFromProfile = (profile?: { first_name?: string; last_name?: string; email?: string } | null): string => {
  if (!profile) return 'Unknown User';
  return formatUserName(profile.first_name, profile.last_name, profile.email);
};