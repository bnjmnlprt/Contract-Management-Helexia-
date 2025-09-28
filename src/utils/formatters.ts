export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Date non définie';
  }

  // The string from toISOString() includes 'T' and 'Z'. A simple date string 'YYYY-MM-DD' does not.
  // We want to treat 'YYYY-MM-DD' as a local date, not UTC, to avoid timezone day shifts.
  // Appending 'T00:00:00' to a date-only string helps browsers interpret it as local time.
  const dateToParse = /^\d{4}-\d{2}-\d{2}$/.test(dateString) 
    ? dateString + 'T00:00:00' 
    : dateString;

  const date = new Date(dateToParse);
  
  if (isNaN(date.getTime())) {
    // As a fallback, try replacing hyphens, which was the old method.
    const fallbackDate = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(fallbackDate.getTime())) {
      return 'Date invalide';
    }
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(fallbackDate);
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};
