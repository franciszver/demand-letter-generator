import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { uploadToS3, getPresignedUrl } from '../config/s3';

const EXPORTS_BUCKET = process.env.S3_BUCKET_EXPORTS || 'demand-letter-generator-dev-exports';

export class WordExporter {
  /**
   * Export letter content to Word document
   */
  static async exportToWord(
    content: string,
    title: string,
    filename: string
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      // Parse content into paragraphs (split by double newlines or single newlines)
      const paragraphs = this.parseContentToParagraphs(content);

      // Create Word document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.LEFT,
                spacing: { after: 400 },
              }),
              // Content paragraphs
              ...paragraphs,
            ],
          },
        ],
      });

      // Generate document buffer
      const buffer = await Packer.toBuffer(doc);

      // Upload to S3
      const s3Key = `exports/${filename}-${Date.now()}.docx`;
      await uploadToS3(EXPORTS_BUCKET, s3Key, buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      // Generate presigned URL (valid for 1 hour)
      const downloadUrl = await getPresignedUrl(EXPORTS_BUCKET, s3Key, 3600);
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

      return { downloadUrl, expiresAt };
    } catch (error) {
      throw new Error(`Word export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse content string into Word paragraphs
   */
  private static parseContentToParagraphs(content: string): Paragraph[] {
    // Split by double newlines (paragraph breaks) or single newlines
    const lines = content.split(/\n\s*\n|\n/).filter(line => line.trim().length > 0);

    return lines.map(line => {
      const trimmed = line.trim();
      
      // Check if it's a heading (starts with # or is all caps and short)
      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)?.[0].length || 1;
        const text = trimmed.replace(/^#+\s*/, '');
        return new Paragraph({
          text: text,
          heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 200 },
        });
      }

      // Regular paragraph
      return new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            font: 'Times New Roman',
            size: 22, // 11pt
          }),
        ],
        spacing: { after: 200 },
        alignment: AlignmentType.LEFT,
      });
    });
  }
}

