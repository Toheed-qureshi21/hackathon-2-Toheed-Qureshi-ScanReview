export type AuthMeUser = {
  id: string;
  email: string | null;
  fullName: string | null;
};

export type AuthMeMembership = {
  id: string;
  role: "ADMIN" | "MANAGER";
  organization: {
    id: string;
    name: string;
  };
};

export type AuthMeData = {
  user: AuthMeUser;
  membership: AuthMeMembership | null;
  /** True when the user is signed in but has no Member row yet (onboarding). */
  onboardingRequired: boolean;
};
