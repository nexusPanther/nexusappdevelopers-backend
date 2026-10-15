import express, { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
const disposableDomains = require("disposable-email-domains");
import passport from "passport";
import { addContact, getContacts, updateContactStatus, deleteContact, replyToContact } from "../../controller/contactController/contact";

const validateContact = [
  body('name').trim().notEmpty().isLength({ max: 60 }).withMessage('Name must be under 60 characters').escape(),
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 120 }).withMessage('Email must be under 120 characters')
    .custom((value) => {
      const domain = value.split('@')[1];
      if (domain && disposableDomains.includes(domain.toLowerCase())) {
        throw new Error('Disposable emails are not allowed');
      }
      return true;
    })
    .normalizeEmail(),
  body('phone').optional().trim().isMobilePhone('any'),
  body('message').trim().notEmpty().isLength({ max: 2000 }).escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const router = express.Router();

// Public: contact us (supports /add and /create)
router.post("/add", validateContact as any, addContact as any);
router.post("/create", validateContact as any, addContact as any);

// Private: admin listing of contacts
router.get("/get", passport.authenticate("jwt", { session: false }), getContacts as any);

// Update contact status (e.g., resolve query)
router.patch("/update-status/:id", passport.authenticate("jwt", { session: false }), updateContactStatus as any);

// Delete contact
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteContact as any);

// Reply to contact
router.post("/reply", passport.authenticate("jwt", { session: false }), replyToContact as any);

export default router;
