// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     kinds/gen.go
// Using jennies:
//     TSResourceJenny
//     LatestMajorsOrXJenny
//
// Run 'make gen-cue' from repository root to regenerate.

/**
 * TODO:
 * common metadata will soon support setting the parent folder in the metadata
 */
export interface Folder {
  /**
   * Description of the folder.
   */
  description?: string;
  /**
   * Folder title
   */
  title: string;
  /**
   * Unique folder id. (will be k8s name)
   */
  uid: string;
}
