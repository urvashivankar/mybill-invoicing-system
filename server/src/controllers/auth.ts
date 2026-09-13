import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Bill, Customer, Item, Quotation, Payment, BusinessSettings } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'mybill_super_secret_key_12345';

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isFirstUser = (await User.count()) === 0;

    const user = await User.create({
      name,
      email,
      passwordHash
    });

    // If this is the very first user, migrate all existing un-owned data to this user
    if (isFirstUser) {
      await Bill.update({ userId: user.id }, { where: { userId: null } });
      await Customer.update({ userId: user.id }, { where: { userId: null } });
      await Item.update({ userId: user.id }, { where: { userId: null } });
      await Quotation.update({ userId: user.id }, { where: { userId: null } });
      await Payment.update({ userId: user.id }, { where: { userId: null } });
      
      const settingsCount = await BusinessSettings.count();
      if (settingsCount > 0) {
        await BusinessSettings.update({ userId: user.id }, { where: { userId: null } });
      } else {
        await BusinessSettings.create({ userId: user.id });
      }
    } else {
      // For subsequent users, create default settings
      await BusinessSettings.create({ userId: user.id });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
