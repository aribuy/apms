// Document Converter Utility - Convert Word documents to PDF
// Supports .doc and .docx to PDF conversion

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const logger = require('./logger');

/**
 * Check if LibreOffice is available on the system
 * @returns {Promise<boolean>} True if LibreOffice is available
 */
const checkLibreOfficeAvailable = async () => {
  try {
    // Try to find LibreOffice or soffice command
    const commands = ['libreoffice', 'soffice'];

    for (const cmd of commands) {
      try {
        await exec(`${cmd} --version`);
        logger.info({ command: cmd }, 'LibreOffice found via command');
        return cmd;
      } catch {
        // Command not found, try next
      }
    }

    logger.warn('LibreOffice not found on system');
    return null;
  } catch (error) {
    logger.error({ err: error }, 'Error checking LibreOffice availability');
    return null;
  }
};

/**
 * Convert Word document to PDF using LibreOffice command-line
 * @param {string} inputPath - Path to input Word document (.doc or .docx)
 * @returns {Promise<string>} Path to converted PDF file
 */
const convertWordToPDF = async (inputPath) => {
  try {
    logger.info('Word to PDF conversion started');
    logger.debug({ inputPath }, 'Word to PDF input file');

    // Validate input file
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.doc' && ext !== '.docx') {
      throw new Error(`Unsupported file format: ${ext}. Only .doc and .docx are supported.`);
    }

    // Check LibreOffice availability
    const libreOfficeCmd = await checkLibreOfficeAvailable();

    if (!libreOfficeCmd) {
      throw new Error('LibreOffice is not installed on this system. Please install LibreOffice to convert Word documents to PDF.');
    }

    // Create temp directory for conversion
    const inputDir = path.dirname(inputPath);
    const outputDir = path.join(inputDir, 'temp_conversion');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    logger.debug({ outputDir }, 'Word to PDF output directory');

    // Run LibreOffice conversion command
    // --headless: Run without GUI
    // --convert-to: Output format
    // --outdir: Output directory
    const command = `"${libreOfficeCmd}" --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    logger.debug({ command }, 'Word to PDF command');

    const { stdout, stderr } = await exec(command);

    if (stderr && !stderr.includes('javaldx')) {
      // Some warnings are normal, but real errors should be logged
      logger.warn({ stderr }, 'LibreOffice stderr');
    }

    logger.debug({ stdout }, 'LibreOffice stdout');

    // Get the output PDF filename
    const inputBasename = path.basename(inputPath, ext);
    const outputPdfPath = path.join(outputDir, `${inputBasename}.pdf`);

    // Check if conversion was successful
    if (!fs.existsSync(outputPdfPath)) {
      throw new Error('PDF conversion failed - output file not created');
    }

    logger.info({ outputPdfPath }, 'Word to PDF conversion successful');

    // Verify PDF is valid (check file size > 0)
    const stats = fs.statSync(outputPdfPath);
    if (stats.size === 0) {
      throw new Error('Converted PDF is empty - conversion may have failed');
    }

    logger.debug({ size: stats.size }, 'Word to PDF output size');
    logger.info('Word to PDF conversion complete');

    return outputPdfPath;

  } catch (error) {
    logger.error({ err: error }, 'Word to PDF conversion failed');
    throw error;
  }
};

/**
 * Clean up temporary conversion files
 * @param {string} filePath - Path to file to delete
 */
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug({ filePath }, 'Cleaned up temp file');
    }
  } catch (error) {
    logger.error({ err: error }, 'Error cleaning up temp file');
  }
};

/**
 * Convert Word to PDF and replace original file
 * @param {string} inputPath - Path to Word document
 * @returns {Promise<{pdfPath: string, originalPath: string}>} Conversion result
 */
const convertAndReplace = async (inputPath) => {
  try {
    // Convert to PDF
    const pdfPath = await convertWordToPDF(inputPath);

    // Delete original Word file
    cleanupTempFile(inputPath);

    return {
      pdfPath,
      originalPath: inputPath,
      success: true
    };
  } catch (error) {
    return {
      pdfPath: null,
      originalPath: inputPath,
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if a file is a Word document
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is .doc or .docx
 */
const isWordDocument = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return ['.doc', '.docx'].includes(ext);
};

module.exports = {
  convertWordToPDF,
  convertAndReplace,
  isWordDocument,
  checkLibreOfficeAvailable,
  cleanupTempFile
};
