export const formatSeniority = (seniority: string | null): string => {
  if (!seniority) return '';
  
  const seniorityMap: { [key: string]: string } = {
    'junior': 'Junior',
    'mid_level': 'Mid-Level',
    'senior': 'Senior',
    'lead_principal': 'Lead / Principal',
    'manager_director': 'Manager / Director',
    'vp_c_level': 'VP / C-Level',
    // Legacy values for backwards compatibility
    'mid': 'Mid-Level',
    'lead': 'Lead / Principal',
    'exec': 'VP / C-Level'
  };
  
  return seniorityMap[seniority] || seniority.charAt(0).toUpperCase() + seniority.slice(1);
};
