import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

const router = Router();

// Official demonstration user accounts with municipal and campus jurisdictions
const USERS = [
  {
    id: 'user-pcmc-01',
    displayName: 'Er. Rajesh Patil',
    designation: 'Executive Engineer (Civil & Infrastructure)',
    department: 'Pimpri-Chinchwad Municipal Corporation (PCMC)',
    jurisdiction: 'PCMC Ward 14 (Pradhikaran Sector 26 - Nigdi Zone)',
    badgeNumber: 'PCMC-ENG-2601',
    email: 'officer.nigdi@pcmcindia.gov.in',
    role: 'AUTHORITY_ADMIN',
  },
  {
    id: 'user-pccoe-01',
    displayName: 'Dr. S. K. Kadam',
    designation: 'Director of Campus Infrastructure & Facilities',
    department: 'PCCOE Campus Operations',
    jurisdiction: 'PCCOE Campus Sector 26 Zone',
    badgeNumber: 'PCCOE-FAC-044',
    email: 'officer@pccoe.edu.in',
    role: 'CAMPUS_AUTHORITY',
  },
  {
    id: 'user-citizen-01',
    displayName: 'Pradhikaran Resident (Public)',
    designation: 'Citizen / Resident',
    department: 'Pradhikaran Sector 26 Civic Welfare',
    jurisdiction: 'Public Citizen Portal',
    badgeNumber: 'CITIZEN-PUN-01',
    email: 'citizen@pradhikaran.org',
    role: 'CITIZEN',
  }
];

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = USERS.find(u => u.email === email) || USERS[0]; // fallback to admin for testing

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.displayName,
      designation: user.designation,
      department: user.department,
      jurisdiction: user.jurisdiction,
      badgeNumber: user.badgeNumber,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    data: {
      token,
      user
    }
  });
});

// GET /api/v1/auth/accounts - List available authority roles
router.get('/accounts', async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: USERS
  });
});

// GET /api/v1/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ success: true, data: { user: USERS[0] } }); // dev convenience
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, config.jwtSecret);
    return res.json({ success: true, data: { user: decoded } });
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
  }
});

export const authRouter = router;
