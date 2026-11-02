
const Campaign = require("../../models/volunteer/Campaign");
const sendEmail = require("../../utils/sendEmail");

const ALLOWED_STATUSES = ["Pending", "Approved", "Rejected"];
const ALLOWED_CAUSES = [
  "healthcare",
  "education",
  "hunger",
  "women",
  "disability",
  "community",
  "other",
];

const registerVolunteer = async (req, res) => {
  try {
    const {
      campaignerName,
      cause,
      email,
      phone,
      socialLinks = [],
      description,
      acceptedTerms,
    } = req.body;

    // Validate required fields
    if (
      typeof campaignerName !== "string" ||
      !campaignerName.trim() ||
      typeof cause !== "string" ||
      !ALLOWED_CAUSES.includes(cause) ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      acceptedTerms !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields and accept the terms.",
      });
    }

    // Validate email
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Validate phone
    const normalizedPhone = phone.trim();

    if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number.",
      });
    }

    // Validate social links
    if (
      !Array.isArray(socialLinks) ||
      socialLinks.length > 10 ||
      socialLinks.some(
        (link) =>
          typeof link !== "string" ||
          (link.trim() &&
            !/^https?:\/\/\S+$/i.test(link.trim()))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid social links (maximum 10).",
      });
    }

    // Save campaign using the existing Campaign model
    const campaign = await Campaign.create({
      campaignerName: campaignerName.trim(),
      cause,
      email: normalizedEmail,
      phone: normalizedPhone,
      socialLinks: socialLinks
        .map((link) => link.trim())
        .filter(Boolean),
      description: description.trim(),
      acceptedTerms,
    });

    // Email notification is optional; save should remain successful
    // Send email in the background; don't wait for it
if (process.env.ADMIN_EMAIL) {
 sendEmail({
  to: process.env.ADMIN_EMAIL,
  subject: "New Campaign Request - O Positive Health",
  text: [
    "A new campaign request has been submitted.",
    "",
    `Campaigner: ${campaign.campaignerName}`,
    `Cause: ${campaign.cause}`,
    `Email: ${campaign.email}`,
    `Phone: ${campaign.phone}`,
    `Social links: ${campaign.socialLinks.join(", ") || "None"}`,
    "",
    "Description:",
    campaign.description,
    "",
    `Campaign ID: ${campaign._id}`,
    `Status: ${campaign.status}`,
  ].join("\n"),
})
  .then((result) =>
    console.log("Campaign notification email accepted:", result?.id)
  )
  .catch((emailError) =>
    console.error("Campaign notification email failed:", emailError.message)
  );
} else {
  console.error("ADMIN_EMAIL is missing.");
}

    return res.status(201).json({
      success: true,
      message: "Campaign request submitted successfully!",
      data: campaign,
    });
  } catch (error) {
    console.error("Campaign registration error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This campaign request already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit your campaign request. Please try again.",
    });
  }
};

// Admin: Get all campaigns
const getVolunteers = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch campaign requests.",
    });
  }
};

// Admin: Update campaign status
const updateVolunteerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Pending, Approved or Rejected.",
      });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Campaign status updated successfully.",
      data: campaign,
    });
  } catch (error) {
    console.error("Update campaign status error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update campaign status.",
    });
  }
};

// Admin: Delete a campaign
const deleteVolunteer = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Campaign request deleted successfully.",
    });
  } catch (error) {
    console.error("Delete campaign error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete campaign request.",
    });
  }
};

module.exports = {
  registerVolunteer,
  getVolunteers,
  updateVolunteerStatus,
  deleteVolunteer,
};
