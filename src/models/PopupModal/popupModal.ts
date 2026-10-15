import mongoose from "mongoose";

const FestivePopupSchema = new mongoose.Schema(
  {
    campaignName: {
      type: String,
      default: "Christmas & Holiday Special",
      trim: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    animationType: {
      type: String,
      enum: ["leaves", "snow", "rockets", "confetti"],
      default: "snow",
    },

    // Header & Badges
    badgeStartEmoji: { type: String, default: "🎄" },
    badgeText: { type: String, default: "Christmas & Holiday Special" },
    badgeEndEmoji: { type: String, default: "🎁" },
    subtitle: { type: String, default: "Celebrate Growth. Build The Future." },

    // Main Typography
    titleMain: { type: String, default: "Celebrate Growth." },
    titleHighlight: { type: String, default: "Build The Future." },

    // Discount & Scope
    discountNumber: { type: String, default: "45%" },
    discountLabel: { type: String, default: "OFF" },
    discountScope: { type: String, default: "Custom Web, Mobile & AI Engineering" },

    // Countdown Timer
    countdownDays: { type: Number, default: 7, min: 1, max: 60 },
    countdownLabel: { type: String, default: "Holiday Special Offer Ends In:" },

    // Value Proposition Perks
    perks: {
      type: [String],
      default: [
        "45% discount on initial sprint or MVP development cycle",
        "Complimentary AI architecture & security audit ($2,000 value)",
        "Dedicated senior engineers & full IP ownership transferred",
      ],
    },

    // Lead Generation Form
    formTitle: { type: String, default: "Claim Your 45% Holiday Discount" },
    formSubtitle: {
      type: String,
      default: "Lock in holiday promotional pricing for your upcoming web, app, or AI project.",
    },

    // Floating Trigger Pill (Shown on public pages when enabled)
    floatingBadgeText: { type: String, default: "Holiday Deal" },
    floatingBadgeDiscount: { type: String, default: "45% OFF" },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

const NormalExitPopupSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    heading: { type: String, default: "Leaving Already?" },
    subheading: {
      type: String,
      default: "Hear from our clients and why businesses trust VrNexus Technologies",
    },
    ctaButtonText: { type: String, default: "Claim Free Technical Consultation" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export const FestivePopup = mongoose.model("FestivePopup", FestivePopupSchema);
export const NormalPopup = mongoose.model("NormalPopup", NormalExitPopupSchema);
