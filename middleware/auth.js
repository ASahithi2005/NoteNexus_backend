import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ msg: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Token missing' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // { id, role }
    next();
  } catch {
    res.status(400).json({ msg: 'Invalid token' });
  }
}
