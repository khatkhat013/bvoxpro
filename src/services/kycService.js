/**
 * KYC Service - Business Logic
 * Handles Know-Your-Customer verification workflow.
 * NO file I/O, NO HTTP - purely business logic.
 */

const UserModel = require('../models/userModel');

class KYCService {
  /**
   * KYC status constants
   */
  static STATUS = {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
  };

  /**
   * Submit KYC tier 1 (basic info)
   */
  static async submitKYCTier1(userid, data) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate required fields
    const required = ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'nationality'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const kycRecord = {
      tier: 1,
      status: this.STATUS.SUBMITTED,
      submittedAt: Date.now(),
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality
      }
    };

    return kycRecord;
  }

  /**
   * Submit KYC tier 2 (document verification)
   */
  static async submitKYCTier2(userid, data) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate required fields
    const required = ['documentType', 'documentNumber', 'documentImageUrl', 'proofOfAddressUrl'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate document type
    const validDocTypes = ['passport', 'driverslicense', 'nationalid', 'visa'];
    if (!validDocTypes.includes(data.documentType.toLowerCase())) {
      throw new Error('Invalid document type');
    }

    const kycRecord = {
      tier: 2,
      status: this.STATUS.SUBMITTED,
      submittedAt: Date.now(),
      data: {
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentImageUrl: data.documentImageUrl,
        proofOfAddressUrl: data.proofOfAddressUrl,
        expiryDate: data.expiryDate || null
      }
    };

    return kycRecord;
  }

  /**
   * Approve KYC (admin only - no validation here)
   */
  static async approveKYC(userid, tier, notes = '') {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user KYC status
    user.kycStatus = tier === 1 ? 'tier1_verified' : tier === 2 ? 'verified' : user.kycStatus;
    user.kycVerifiedAt = Date.now();
    user.kycNotes = notes;

    await UserModel.save(user);

    return {
      userid,
      kycStatus: user.kycStatus,
      verifiedAt: user.kycVerifiedAt
    };
  }

  /**
   * Reject KYC (admin only - no validation here)
   */
  static async rejectKYC(userid, tier, reason) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    user.kycStatus = 'rejected';
    user.kycRejectedAt = Date.now();
    user.kycRejectionReason = reason;

    await UserModel.save(user);

    return {
      userid,
      kycStatus: 'rejected',
      rejectionReason: reason,
      rejectedAt: user.kycRejectedAt
    };
  }

  /**
   * Get KYC status for user
   */
  static async getKYCStatus(userid) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      userid,
      status: user.kycStatus,
      verifiedAt: user.kycVerifiedAt || null,
      rejectionReason: user.kycRejectionReason || null
    };
  }

  /**
   * Get pending KYC submissions (admin)
   */
  static async getPendingKYCSubmissions() {
    // Reads from KYC records model
    // Placeholder: return empty array
    return [];
  }
}

module.exports = KYCService;
