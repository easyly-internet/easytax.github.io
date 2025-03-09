// src/services/document.service.js
const axios = require('axios');

/**
 * Document Service Client
 * This service interacts with the Document Service via its API
 */
class DocumentService {
  constructor() {
    this.baseUrl = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8083';
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000 // 30 seconds
    });
  }

  /**
   * Upload multiple documents
   * @param {string} memberId - ID of the member
   * @param {Array} files - Array of file objects
   * @param {string} category - Document category
   * @returns {Promise<Array>} - Array of uploaded document objects
   */
  async uploadMultipleDocuments(memberId, files, category) {
    try {
      const formData = new FormData();
      formData.append('memberId', memberId);
      formData.append('category', category);
      
      files.forEach((file, index) => {
        formData.append(`documents`, file);
      });

      const response = await this.apiClient.post('/api/documents/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error uploading documents to document service:', error);
      throw new Error('Failed to upload documents');
    }
  }

  /**
   * Get member documents
   * @param {string} memberId - ID of the member
   * @param {string} financialYear - Financial year
   * @returns {Promise<Array>} - Array of document objects
   */
  async getMemberDocuments(memberId, financialYear) {
    try {
      const response = await this.apiClient.get(`/api/documents/member/${memberId}`, {
        params: { financialYear }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching member documents from document service:', error);
      throw new Error('Failed to fetch member documents');
    }
  }

  /**
   * Get document by ID
   * @param {string} documentId - ID of the document
   * @returns {Promise<Object>} - Document object
   */
  async getDocumentById(documentId) {
    try {
      const response = await this.apiClient.get(`/api/documents/${documentId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching document with ID ${documentId}:`, error);
      throw new Error('Failed to fetch document');
    }
  }

  /**
   * Get document content
   * @param {string} documentId - ID of the document
   * @returns {Promise<Buffer>} - Document content as buffer
   */
  async getDocumentContent(documentId) {
    try {
      const response = await this.apiClient.get(`/api/documents/${documentId}/content`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching document content for ID ${documentId}:`, error);
      throw new Error('Failed to fetch document content');
    }
  }

  /**
   * Update document metadata
   * @param {string} documentId - ID of the document
   * @param {Object} metadata - Document metadata
   * @returns {Promise<Object>} - Updated document object
   */
  async updateDocumentMetadata(documentId, metadata) {
    try {
      const response = await this.apiClient.patch(`/api/documents/${documentId}/metadata`, { metadata });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating metadata for document ${documentId}:`, error);
      throw new Error('Failed to update document metadata');
    }
  }
}

module.exports = new DocumentService();