import { UserProfileModel } from '../models/UserProfile';
import { CaseContextModel } from '../models/CaseContext';
import { UserProfile, CaseContext } from '../../../shared/types';

export interface EQContext {
  userProfile?: UserProfile;
  caseContext?: CaseContext;
}

export class EQEnhancer {
  /**
   * Get EQ context for a user and draft letter
   */
  static async getEQContext(userId: string, draftLetterId?: string): Promise<EQContext> {
    const [userProfile, caseContext] = await Promise.all([
      UserProfileModel.findByUserId(userId),
      draftLetterId ? CaseContextModel.findByDraftLetterId(draftLetterId) : Promise.resolve(null),
    ]);

    return {
      userProfile: userProfile || undefined,
      caseContext: caseContext || undefined,
    };
  }

  /**
   * Build EQ-enhanced prompt for AI generation
   */
  static buildEQPrompt(basePrompt: string, eqContext: EQContext): string {
    let enhancedPrompt = basePrompt;

    // Add user profile preferences
    if (eqContext.userProfile) {
      const profile = eqContext.userProfile;
      const profileInstructions: string[] = [];

      if (profile.communicationStyle) {
        profileInstructions.push(`Communication style: ${profile.communicationStyle}`);
      }

      if (profile.preferredTone) {
        profileInstructions.push(`Preferred tone: ${profile.preferredTone}`);
      }

      if (profile.formalityLevel) {
        const formalityDesc = profile.formalityLevel >= 8 ? 'very formal' :
                              profile.formalityLevel >= 6 ? 'formal' :
                              profile.formalityLevel >= 4 ? 'moderately formal' : 'casual';
        profileInstructions.push(`Formality level: ${formalityDesc} (${profile.formalityLevel}/10)`);
      }

      if (profile.urgencyTendency) {
        const urgencyDesc = profile.urgencyTendency >= 8 ? 'very urgent' :
                            profile.urgencyTendency >= 6 ? 'urgent' :
                            profile.urgencyTendency >= 4 ? 'moderate urgency' : 'low urgency';
        profileInstructions.push(`Urgency level: ${urgencyDesc} (${profile.urgencyTendency}/10)`);
      }

      if (profile.empathyPreference) {
        const empathyDesc = profile.empathyPreference >= 8 ? 'high empathy' :
                            profile.empathyPreference >= 6 ? 'moderate empathy' :
                            profile.empathyPreference >= 4 ? 'low empathy' : 'minimal empathy';
        profileInstructions.push(`Empathy level: ${empathyDesc} (${profile.empathyPreference}/10)`);
      }

      if (profile.notes) {
        profileInstructions.push(`Additional preferences: ${profile.notes}`);
      }

      if (profileInstructions.length > 0) {
        enhancedPrompt += `\n\nUSER PREFERENCES:\n${profileInstructions.join('\n')}\n\nPlease incorporate these preferences into the letter.`;
      }
    }

    // Add case-specific context
    if (eqContext.caseContext) {
      const context = eqContext.caseContext;
      const contextInstructions: string[] = [];

      if (context.relationshipDynamics) {
        contextInstructions.push(`Relationship dynamics: ${context.relationshipDynamics}`);
      }

      if (context.urgencyLevel) {
        const urgencyDesc = context.urgencyLevel >= 8 ? 'very urgent' :
                            context.urgencyLevel >= 6 ? 'urgent' :
                            context.urgencyLevel >= 4 ? 'moderate urgency' : 'low urgency';
        contextInstructions.push(`Case urgency: ${urgencyDesc} (${context.urgencyLevel}/10)`);
      }

      if (context.previousInteractions) {
        contextInstructions.push(`Previous interactions: ${context.previousInteractions}`);
      }

      if (context.caseSensitivity) {
        contextInstructions.push(`Case sensitivity: ${context.caseSensitivity}`);
      }

      if (context.targetRecipientRole) {
        contextInstructions.push(`Target recipient role: ${context.targetRecipientRole}`);
      }

      if (context.targetRecipientOrg) {
        contextInstructions.push(`Target recipient organization: ${context.targetRecipientOrg}`);
      }

      if (context.targetRelationship) {
        contextInstructions.push(`Target relationship: ${context.targetRelationship}`);
      }

      if (contextInstructions.length > 0) {
        enhancedPrompt += `\n\nCASE-SPECIFIC CONTEXT:\n${contextInstructions.join('\n')}\n\nPlease adjust the letter tone and content based on this context.`;
      }
    }

    return enhancedPrompt;
  }

  /**
   * Get tone recommendations based on EQ context
   */
  static getToneRecommendations(eqContext: EQContext): {
    recommendedIntensity: number;
    recommendedFormality: number;
    recommendedEmpathy: number;
  } {
    let intensity = 6; // Default moderate
    let formality = 7; // Default formal
    let empathy = 5; // Default moderate

    // Adjust based on user profile
    if (eqContext.userProfile) {
      const profile = eqContext.userProfile;
      
      if (profile.formalityLevel) {
        formality = profile.formalityLevel;
      }

      if (profile.empathyPreference) {
        empathy = profile.empathyPreference;
      }

      if (profile.urgencyTendency) {
        intensity = Math.min(10, profile.urgencyTendency + 1);
      }
    }

    // Adjust based on case context
    if (eqContext.caseContext) {
      const context = eqContext.caseContext;

      if (context.urgencyLevel) {
        intensity = Math.max(intensity, Math.min(10, context.urgencyLevel + 1));
      }

      // Adjust empathy based on relationship
      if (context.targetRelationship === 'client' || context.targetRelationship === 'colleague') {
        empathy = Math.max(empathy, 6);
      } else if (context.targetRelationship === 'adversary') {
        empathy = Math.min(empathy, 4);
        intensity = Math.max(intensity, 7);
      }
    }

    return {
      recommendedIntensity: Math.round(intensity),
      recommendedFormality: Math.round(formality),
      recommendedEmpathy: Math.round(empathy),
    };
  }
}

