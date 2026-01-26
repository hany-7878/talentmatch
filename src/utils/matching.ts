// src/utils/matching.ts
export const calculateMatch = (userSkills: string[], jobRequirements: string[]): number => {
  if (!jobRequirements.length) return 0;
  
  const matches = jobRequirements.filter(req => 
    userSkills.some(skill => skill.toLowerCase() === req.toLowerCase())
  );
  
  return Math.round((matches.length / jobRequirements.length) * 100);
};