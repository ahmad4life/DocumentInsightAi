import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';

// We'll use a custom approach for PDFs to avoid the test file dependency
const pdfParse = async (dataBuffer: Buffer) => {
  try {
    // Let's use external pdf-parse module dynamically to avoid the initial load issue
    const pdfParser = await import('pdf-parse');
    return await pdfParser.default(dataBuffer);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return { text: 'Failed to parse PDF content. Please try another file.' };
  }
};

/**
 * Process uploaded file to extract text content
 */
export async function processFile(file: Express.Multer.File): Promise<string> {
  try {
    // Create temp file to work with binary data
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${uuidv4()}${path.extname(file.originalname)}`);
    
    // Write buffer to temp file
    await fs.writeFile(tempFilePath, file.buffer);
    
    try {
      // Extract text based on file type
      const fileType = file.mimetype;
      let content = '';
      
      if (fileType === 'application/pdf') {
        // Process PDF
        const dataBuffer = await fs.readFile(tempFilePath);
        const pdfData = await pdfParse(dataBuffer);
        content = pdfData.text;
      } else if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Process DOC/DOCX
        const result = await mammoth.extractRawText({ path: tempFilePath });
        content = result.value;
      } else if (fileType === 'text/plain') {
        // Process TXT
        content = await fs.readFile(tempFilePath, 'utf8');
      } else {
        throw new Error('Unsupported file type');
      }
      
      // Clean up temp file
      await fs.unlink(tempFilePath);
      
      return content;
    } catch (error) {
      // Make sure to clean up temp file on error
      try {
        await fs.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Failed to remove temp file:', unlinkError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process file');
  }
}
