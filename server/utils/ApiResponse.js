/**
 * @file ApiResponse.js
 * @description Standardized API response format ensuring every endpoint response
 * adheres to a uniform structure across the entire platform.
 */
export class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (typically 200, 201, etc.)
   * @param {*} data - Payload data to return
   * @param {string} [message='Success'] - Context message
   */
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  // Factory helpers for frequent response types
  static ok(res, data, message = 'Success') {
    return res.status(200).json(new ApiResponse(200, data, message));
  }

  static created(res, data, message = 'Resource created successfully') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

export default ApiResponse;
