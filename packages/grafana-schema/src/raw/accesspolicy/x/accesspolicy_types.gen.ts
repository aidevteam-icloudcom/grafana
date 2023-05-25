// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     kinds/gen.go
// Using jennies:
//     TSResourceJenny
//     LatestMajorsOrXJenny
//
// Run 'make gen-cue' from repository root to regenerate.

export interface RoleRef {
  /**
   * Policies can apply to roles, teams, or users
   * Applying policies to individual users is supported, but discouraged
   */
  kind: ('Role' | 'BuiltinRole' | 'Team' | 'User');
  name: string;
  xname: string; // temporary
}

export interface ResourceRef {
  kind: string; // explicit resource or folder will cascade
  name: string;
}

export interface AccessRule {
  /**
   * The kind this rule applies to (dashboars, alert, etc)
   */
  kind: ('*' | string);
  /**
   * Specific sub-elements like "alert.rules" or "dashboard.permissions"????
   */
  target?: string;
  /**
   * READ, WRITE, CREATE, DELETE, ...
   * should move to k8s style verbs like: "get", "list", "watch", "create", "update", "patch", "delete"
   */
  verb: ('*' | 'none' | string);
}

export interface AccessPolicy {
  /**
   * The role that must apply this policy
   */
  role: RoleRef;
  /**
   * The set of rules to apply.  Note that * is required to modify
   * access policy rules, and that "none" will reject all actions
   */
  rules: Array<AccessRule>;
  /**
   * The scope where these policies should apply
   */
  scope: ResourceRef;
}

export const defaultAccessPolicy: Partial<AccessPolicy> = {
  rules: [],
};
