import express from 'express'
import * as authController from '../controllers/authController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/register', authController.register)
router.post('/login', authController.login)

// Protected routes
router.get('/me', auth, authController.getCurrentUser)

export default router