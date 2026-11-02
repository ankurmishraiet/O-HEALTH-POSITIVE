
const Contact = require("../../models/contact/Contact");
const sendEmail = require("../../utils/sendEmail");

// Public: Create contact enquiry
const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // 1. Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // 2. Validate email
    const normalizedEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // 3. Normalize Indian phone numbers
    let normalizedPhone = phone.replace(/[\s()-]/g, "");

    // Accept +91 or 91 prefix
    if (normalizedPhone.startsWith("+91")) {
      normalizedPhone = normalizedPhone.slice(3);
    } else if (
      normalizedPhone.startsWith("91") &&
      normalizedPhone.length === 12
    ) {
      normalizedPhone = normalizedPhone.slice(2);
    }

    // Validate 10-digit Indian mobile number
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    // 4. Save enquiry to MongoDB
    const contact = await Contact.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      subject: subject.trim(),
      message: message.trim(),
    });

    console.log("Contact enquiry saved:", contact._id);

    // 5. Send admin notification without blocking the response
    if (!process.env.ADMIN_EMAIL) {
      console.error("ADMIN_EMAIL is missing.");
    } else {
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New Contact Enquiry - O Positive Health",
        text: [
          "A new contact enquiry has been submitted.",
          "",
          `Name: ${contact.name}`,
          `Email: ${contact.email}`,
          `Phone: ${contact.phone}`,
          `Subject: ${contact.subject}`,
          `Message: ${contact.message}`,
          "",
          `Enquiry ID: ${contact._id}`,
          `Submitted: ${contact.createdAt}`,
        ].join("\n"),
      })
        .then(() => {
          console.log("Admin notification email sent successfully");
        })
        .catch((emailError) => {
          console.error(
            "Admin notification email failed:",
            emailError.message
          );
        });
    }

    // 6. Return success immediately
    return res.status(201).json({
      success: true,
      message: "Your enquiry has been submitted successfully.",
      data: {
        id: contact._id,
        status: contact.status,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error("Contact API error:", error);

    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An enquiry with this email already exists.",
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please check the submitted contact details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit your enquiry right now.",
    });
  }
};

// 2. Admin: Get all contact enquiries
const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Contacts fetched successfully",
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        console.error("Get contacts error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch contact enquiries"
        });
    }
};

// 3. Admin: Get a contact enquiry by ID
const getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact enquiry not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact fetched successfully",
            data: contact
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid contact ID"
            });
        }

        console.error("Get contact by ID error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch contact enquiry"
        });
    }
};

// 4. Admin: Update contact status
const updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatus = [
            "Pending",
            "In Progress",
            "Resolved"
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact status"
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            {
                new: true,
                runValidators: true
            }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact enquiry not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact status updated successfully",
            data: contact
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid contact ID"
            });
        }

        console.error("Update contact status error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update contact status"
        });
    }
};

// 5. Admin: Delete contact enquiry
const deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact enquiry not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact deleted successfully",
            data: contact
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid contact ID"
            });
        }

        console.error("Delete contact error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete contact enquiry"
        });
    }
};

module.exports = {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact
};
