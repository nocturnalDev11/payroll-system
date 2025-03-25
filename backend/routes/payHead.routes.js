import express from 'express';
import { getAllPayHeads, createPayHead, updatePayHead, deletePayHead } from '../controllers/employees/payhead.controller.js';

const router = express.Router();

router.get('/', getAllPayHeads);
router.post('/', createPayHead);
router.put('/:id', updatePayHead);
router.delete('/:id', deletePayHead);

export default router;