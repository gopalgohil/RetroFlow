import '../config/env.js';
import db from '../config/db.js';
import Project from '../models/Project.js';
import RetroBoard from '../models/RetroBoard.js';

async function main() {
  await db.connect();

  console.log('=== DELETING DUMMY PGI PROJECTS ===');
  const projRes = await Project.deleteMany({
    $or: [
      { key: 'PGI' },
      { name: /Payment Gateway/i }
    ]
  });
  console.log('Projects deleted:', projRes);

  console.log('=== DELETING DUMMY PGI RETROS ===');
  const retroRes = await RetroBoard.deleteMany({
    $or: [
      { projectKey: 'PGI' },
      { title: /Payment Gateway/i },
      { shareToken: { $in: ['retro-pgi-12', 'retro-pgi-13', 'retro-pgi-14'] } },
      { shareToken: /retro-pgi/i }
    ]
  });
  console.log('Retros deleted:', retroRes);

  console.log('=== REMAINING PROJECTS IN DB ===');
  const remainingProjects = await Project.find({}, 'name key lead members').lean();
  console.log(remainingProjects);

  console.log('=== REMAINING RETROS IN DB ===');
  const remainingRetros = await RetroBoard.find({}, 'title shareToken projectKey').lean();
  console.log(remainingRetros);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
