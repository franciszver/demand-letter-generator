export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'attorney' | 'paralegal';
    createdAt: string;
    updatedAt: string;
}
export interface Template {
    id: string;
    name: string;
    content: string;
    variables: string[];
    version: number;
    createdAt: string;
    updatedAt: string;
}
export interface Document {
    id: string;
    userId: string;
    filename: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    s3Key: string;
    extractedText?: string;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}
export interface DraftLetter {
    id: string;
    userId: string;
    documentId?: string;
    templateId?: string;
    title: string;
    content: string;
    s3Key: string;
    version: number;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
    status: 'draft' | 'generated' | 'refined' | 'final';
    createdAt: string;
    updatedAt: string;
}
export interface Session {
    id: string;
    draftLetterId: string;
    userId: string;
    isActive: boolean;
    lastActivity: string;
    createdAt: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface UploadResponse {
    documentId: string;
    status: string;
    message: string;
}
export interface GenerateRequest {
    documentId: string;
    templateId?: string;
}
export interface RefineRequest {
    draftId: string;
    instructions: string;
}
export interface ExportResponse {
    downloadUrl: string;
    expiresAt: string;
}
export interface UserProfile {
    id: string;
    userId: string;
    communicationStyle?: string;
    preferredTone?: string;
    formalityLevel: number;
    urgencyTendency: number;
    empathyPreference: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface RefinementHistory {
    id: string;
    draftLetterId: string;
    userId: string;
    promptText: string;
    responseText?: string;
    version: number;
    metricsBefore?: LetterMetrics;
    metricsAfter?: LetterMetrics;
    createdAt: string;
    updatedAt: string;
}
export interface LetterMetrics {
    id: string;
    draftLetterId: string;
    intensity: number;
    seriousness: number;
    formality: number;
    clarity: number;
    persuasiveness: number;
    empathy: number;
    structureQuality: number;
    legalPrecision: number;
    calculatedAt: string;
    createdAt: string;
    updatedAt: string;
}
export interface TimeTracking {
    id: string;
    userId: string;
    draftLetterId: string;
    actionType: 'upload' | 'generate' | 'refine' | 'export';
    startTime: string;
    endTime?: string;
    estimatedManualTime?: number;
    userReportedTime?: number;
    timeSaved?: number;
    createdAt: string;
    updatedAt: string;
}
export interface UserRelationship {
    id: string;
    primaryUserId: string;
    secondaryUserId: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}
export interface CaseContext {
    id: string;
    draftLetterId: string;
    userId: string;
    relationshipDynamics?: string;
    urgencyLevel: number;
    previousInteractions?: string;
    caseSensitivity?: string;
    targetRecipientRole?: string;
    targetRecipientOrg?: string;
    targetRelationship?: string;
    createdAt: string;
    updatedAt: string;
}
export interface GenerateRequestWithEQ extends GenerateRequest {
    caseContext?: Partial<CaseContext>;
}
export interface RefineRequestWithHistory extends RefineRequest {
    trackHistory?: boolean;
}
//# sourceMappingURL=index.d.ts.map