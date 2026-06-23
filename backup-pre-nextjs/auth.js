import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    const filePath = path.join(process.cwd(), 'data', 'userdata.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const users = JSON.parse(fileContents);

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      res.status(200).json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
