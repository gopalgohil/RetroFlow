import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, role: String, projectRole: String }));
  const Project = mongoose.model('Project', new mongoose.Schema({ name: String, key: String, lead: Object, members: Array }));

  // Find all projects
  const projects = await Project.find({}).lean();
  const managerEmails = new Set();

  projects.forEach((p) => {
    if (p.lead?.email) {
      managerEmails.add(p.lead.email.toLowerCase().trim());
    }
    if (Array.isArray(p.members)) {
      p.members.forEach((m) => {
        if (m.email && (m.role || '').toLowerCase() === 'manager') {
          managerEmails.add(m.email.toLowerCase().trim());
        }
      });
    }
  });

  console.log('Detected Manager emails across projects:', Array.from(managerEmails));

  for (const email of managerEmails) {
    const res = await User.updateOne(
      { email, role: { $ne: 'admin' } },
      { $set: { projectRole: 'Manager' } }
    );
    console.log(`Updated user ${email}:`, res);
  }

  // Also ensure admin has Manager projectRole
  await User.updateOne(
    { email: 'gopalgohel249@gmail.com' },
    { $set: { role: 'admin', projectRole: 'Manager' } }
  );

  const updatedUsers = await User.find({}, 'name email role projectRole').lean();
  console.log('=== UPDATED USERS IN DB ===');
  console.log(updatedUsers);

  await mongoose.disconnect();
}

run();
