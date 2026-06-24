import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide username, email, and password'
      })
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] })
    if (existing) {
      return res.status(409).json({ 
        message: 'Username or email is already taken'
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = new User({ username, email, passwordHash })
    await user.save()

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' })
    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email },
      token
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password'
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password'
      })
    }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return res.status(401).json({ 
        message: 'Invalid email or password'
      })
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' })
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
      token
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Get current user information
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  }
}
