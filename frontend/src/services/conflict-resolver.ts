/**
 * Client-side conflict resolution utilities
 */
export class ConflictResolver {
  /**
   * Simple merge detection: check if edits are in different sections
   * Returns true if edits can be auto-merged (different sections)
   */
  static canAutoMerge(localContent: string, serverContent: string): boolean {
    // Simple heuristic: if content lengths are similar and most content matches,
    // edits are likely in different sections
    const lengthDiff = Math.abs(localContent.length - serverContent.length);
    const avgLength = (localContent.length + serverContent.length) / 2;
    
    if (avgLength === 0) return true;
    
    // If length difference is less than 10% of average, likely non-overlapping edits
    if (lengthDiff / avgLength < 0.1) {
      return true;
    }

    // If length difference is small (less than 100 chars), likely non-conflicting
    if (lengthDiff < 100) {
      return true;
    }

    // More sophisticated: check if content is mostly the same
    // Simple character-by-character comparison for first/last parts
    const minLength = Math.min(localContent.length, serverContent.length);
    if (minLength > 0) {
      const startMatch = this.compareStrings(localContent.substring(0, Math.min(100, minLength)), serverContent.substring(0, Math.min(100, minLength)));
      const endMatch = this.compareStrings(
        localContent.substring(Math.max(0, localContent.length - 100)),
        serverContent.substring(Math.max(0, serverContent.length - 100))
      );
      
      // If start and end match well, middle changes are likely non-conflicting
      if (startMatch > 0.8 && endMatch > 0.8) {
        return true;
      }
    }

    return false;
  }

  /**
   * Compare two strings and return similarity ratio (0-1)
   */
  private static compareStrings(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (str1[i] === str2[i]) {
        matches++;
      }
    }

    return matches / longer.length;
  }
}

