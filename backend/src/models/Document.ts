import { db } from '../config/database';
import { Document } from '../../../shared/types';

export class DocumentModel {
  static async create(documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    const [document] = await db('documents')
      .insert({
        user_id: documentData.userId,
        filename: documentData.filename,
        original_name: documentData.originalName,
        file_type: documentData.fileType,
        file_size: documentData.fileSize,
        s3_key: documentData.s3Key,
        extracted_text: documentData.extractedText,
        status: documentData.status,
      })
      .returning('*');
    
    return this.mapToDocument(document);
  }

  static async findById(id: string): Promise<Document | null> {
    const document = await db('documents').where({ id }).first();
    if (!document) return null;
    return this.mapToDocument(document);
  }

  static async findByUserId(userId: string): Promise<Document[]> {
    const documents = await db('documents')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return documents.map(this.mapToDocument);
  }

  static async update(id: string, updates: Partial<Document>): Promise<Document | null> {
    const [document] = await db('documents')
      .where({ id })
      .update({
        ...(updates.extractedText !== undefined && { extracted_text: updates.extractedText }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!document) return null;
    return this.mapToDocument(document);
  }

  private static mapToDocument(row: any): Document {
    return {
      id: row.id,
      userId: row.user_id,
      filename: row.filename,
      originalName: row.original_name,
      fileType: row.file_type,
      fileSize: Number(row.file_size),
      s3Key: row.s3_key,
      extractedText: row.extracted_text,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

