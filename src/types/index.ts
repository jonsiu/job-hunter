// CareerOS Job Collector - Type Definitions

export interface JobBookmark {
  id: string;
  url: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary?: string;
  location: string;
  remote: boolean;
  deadline?: Date;
  userNotes: string;
  rating: number;
  bookmarkedAt: string;
  lastAnalyzed?: string;
  analysis?: JobAnalysis;
  source: string;
}

export interface JobAnalysis {
  jobId: string;
  skillsMatch: SkillsMatch;
  requirementsGap: RequirementsGap;
  salaryBenchmark: SalaryBenchmark;
  companyCulture: CompanyCulture;
  applicationReadiness: ApplicationReadiness;
  recommendations: Recommendation[];
}

export interface SkillsMatch {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  prioritySkills: string[];
}

export interface RequirementsGap {
  missingRequirements: string[];
  experienceGap: ExperienceGap;
  educationGap: EducationGap;
  certificationGap: CertificationGap;
}

export interface ExperienceGap {
  years: number;
  type: string;
}

export interface EducationGap {
  required: string;
  current: string;
}

export interface CertificationGap {
  required: string[];
  current: string[];
}

export interface SalaryBenchmark {
  marketRate: number;
  userCurrentSalary?: number;
  salaryGap: number;
  negotiationRoom: number;
  benefitsComparison: BenefitsComparison;
}

export interface BenefitsComparison {
  health: string;
  retirement: string;
  vacation: string;
  other: string[];
}

export interface CompanyCulture {
  score: number;
  workLifeBalance: number;
  diversity: number;
  growth: number;
  values: string[];
}

export interface ApplicationReadiness {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface Recommendation {
  type: 'skill' | 'experience' | 'education' | 'certification';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timeToComplete: string;
  resources: string[];
}

export interface ExtensionSettings {
  autoAnalyze: boolean;
  notifications: boolean;
  syncWithCareerOS: boolean;
  careerOSUrl: string;
  enabledJobBoards: {
    linkedin: boolean;
    indeed: boolean;
    glassdoor: boolean;
    angelList: boolean;
    stackOverflow: boolean;
    remoteCo: boolean;
    weWorkRemotely: boolean;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  experience: number;
  skills: string[];
  location: string;
  salary?: number;
  resume?: string;
}

export interface ExtensionMessage {
  action: string;
  jobData?: JobBookmark;
  jobId?: string;
  count?: number;
  error?: string;
}

export interface ExtensionResponse {
  success: boolean;
  jobs?: JobBookmark[];
  analysis?: JobAnalysis;
  error?: string;
}

export interface JobBoardConfig {
  name: string;
  url: string;
  selectors: {
    title: string[];
    company: string[];
    location: string[];
    description: string[];
  };
  enabled: boolean;
}

export interface CareerInsights {
  topSkills: string[];
  topCompanies: string[];
  locations: string[];
  totalJobs: number;
  analyzedJobs: number;
  skillGaps: string[];
  careerPath: string[];
  recommendations: Recommendation[];
}
