import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not defined');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const RetroBoard = mongoose.model(
      'RetroBoard',
      new mongoose.Schema({}, { strict: false })
    );

    const retros = await RetroBoard.find({});
    let totalRemoved = 0;

    for (const retro of retros) {
      const originalCardsCount = retro.cards ? retro.cards.length : 0;
      if (!originalCardsCount) continue;

      // Find action items topic
      const actionTopicIds = new Set(
        (retro.topics || [])
          .filter(
            (t) =>
              (t.title || '').toLowerCase().includes('action') ||
              t.icon === 'target'
          )
          .map((t) => t.topicId)
      );

      // Filter out dummy action items
      const updatedCards = retro.cards.filter((card) => {
        const isActionTopic = actionTopicIds.has(card.topicId);
        if (isActionTopic) {
          console.log(
            `Removing action card "${card.text}" (id: ${card.cardId}) from retro "${retro.title}"`
          );
          totalRemoved++;
          return false;
        }
        return true;
      });

      if (updatedCards.length !== originalCardsCount) {
        retro.cards = updatedCards;
        await RetroBoard.updateOne(
          { _id: retro._id },
          { $set: { cards: updatedCards } }
        );
        console.log(
          `Updated retro "${retro.title}": reduced from ${originalCardsCount} to ${updatedCards.length} cards`
        );
      }
    }

    // Also check Project sprints
    const Project = mongoose.model(
      'Project',
      new mongoose.Schema({}, { strict: false })
    );
    const projects = await Project.find({});
    for (const proj of projects) {
      let modified = false;
      if (Array.isArray(proj.sprints)) {
        for (const sprint of proj.sprints) {
          if (Array.isArray(sprint.items) && sprint.items.length > 0) {
            console.log(
              `Cleaning ${sprint.items.length} sprint items from project "${proj.name}", sprint "${sprint.name}"`
            );
            totalRemoved += sprint.items.length;
            sprint.items = [];
            modified = true;
          }
        }
      }
      if (modified) {
        await Project.updateOne(
          { _id: proj._id },
          { $set: { sprints: proj.sprints } }
        );
      }
    }

    console.log(`Successfully removed ${totalRemoved} dummy action items in total.`);
    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error removing dummy action items:', error);
    process.exit(1);
  }
}

run();
