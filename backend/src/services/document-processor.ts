import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';
import { getFromS3, uploadToS3 } from '../config/s3';
import { Document } from '../../../shared/types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o';
const PROCESSED_BUCKET = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';

export interface ProcessedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
  };
}

export class DocumentProcessor {
  /**
   * Process uploaded document and extract text
   */
  static async processDocument(
    fileBuffer: Buffer,
    fileType: string,
    s3Key: string
  ): Promise<ProcessedDocument> {
    let extractedText = '';

    try {
      switch (fileType.toLowerCase()) {
        case 'application/pdf':
        case 'pdf':
          extractedText = await this.extractFromPDF(fileBuffer);
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'docx':
          extractedText = await this.extractFromDOCX(fileBuffer);
          break;

        case 'text/plain':
        case 'txt':
          extractedText = await this.extractFromText(fileBuffer);
          break;

        case 'image/jpeg':
        case 'image/jpg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
          extractedText = await this.extractFromImage(fileBuffer, fileType);
          break;

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Store full extracted text in S3
      const processedKey = `processed/${s3Key}.txt`;
      await uploadToS3(PROCESSED_BUCKET, processedKey, extractedText, 'text/plain');

      return {
        text: extractedText,
        metadata: {
          wordCount: extractedText.split(/\s+/).length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF
   */
  private static async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  private static async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text file
   */
  private static async extractFromText(buffer: Buffer): Promise<string> {
    try {
      return buffer.toString('utf-8');
    } catch (error) {
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from image using OpenAI Vision API via OpenRouter
   */
  private static async extractFromImage(buffer: Buffer, fileType: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      // Convert buffer to base64
      const base64Image = buffer.toString('base64');
      
      // Map file type to correct MIME type for data URL
      // Normalize fileType to lowercase for comparison
      const normalizedType = fileType.toLowerCase();
      let mimeType = 'image/jpeg'; // default
      
      if (normalizedType.includes('png')) {
        mimeType = 'image/png';
      } else if (normalizedType.includes('gif')) {
        mimeType = 'image/gif';
      } else if (normalizedType.includes('webp')) {
        mimeType = 'image/webp';
      } else if (normalizedType.includes('jpeg') || normalizedType.includes('jpg')) {
        mimeType = 'image/jpeg';
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this image. Return only the extracted text, no additional commentary.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/steno/demand-letter-generator',
            'X-Title': 'Demand Letter Generator',
          },
        }
      );

      const extractedText = response.data.choices[0]?.message?.content || '';
      if (!extractedText) {
        throw new Error('No text extracted from image');
      }

      return extractedText;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : '';
        console.error('Image OCR API error:', errorMessage, errorDetails);
        throw new Error(`Image OCR failed: ${errorMessage}`);
      }
      throw new Error(`Image OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get processed text from S3
   */
  static async getProcessedText(s3Key: string): Promise<string> {
    // s3Key might be in different formats:
    // - "letters/..." (for draft letters) - use as-is
    // - "processed/..." (for processed documents) - use as-is
    // - Just a key without prefix - prepend "processed/" and add ".txt"
    let processedKey = s3Key;
    if (!s3Key.startsWith('processed/') && !s3Key.startsWith('letters/')) {
      // If it doesn't have a prefix, assume it's a document key and needs processing prefix
      processedKey = `processed/${s3Key}.txt`;
    }
    const buffer = await getFromS3(PROCESSED_BUCKET, processedKey);
    return buffer.toString('utf-8');
  }
}

