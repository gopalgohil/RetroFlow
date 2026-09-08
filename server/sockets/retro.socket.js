import crypto from 'crypto';
import RetroBoard from '../models/RetroBoard.js';

/**
 * Socket.io Real-Time Retrospective Collaboration Controller
 * Handles instant synchronized card operations across distributed team sessions
 */
export function initRetroSocket(io) {
  const retroNamespace = io.of('/retro');

  retroNamespace.on('connection', (socket) => {
    let currentShareToken = null;
    let currentUser = null;

    // 1. Join Retrospective Room
    socket.on('join:retro', async ({ shareToken, user }, callback) => {
      try {
        if (!shareToken) {
          if (callback) callback({ error: 'Missing shareToken' });
          return;
        }

        currentShareToken = shareToken;
        currentUser = user || { name: 'Teammate' };

        const roomName = `retro:${shareToken}`;
        socket.join(roomName);

        // Fetch latest session cards from MongoDB
        const session = await RetroBoard.findOne({ shareToken }).lean();

        if (callback) {
          callback({
            success: true,
            cards: session?.cards || [],
            room: roomName,
          });
        }

        // Notify room of participant joining
        socket.to(roomName).emit('participant:joined', {
          user: currentUser,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error('[Socket] join:retro error:', err);
        if (callback) callback({ error: 'Failed to join session room' });
      }
    });

    // 2. Add Sticky Card
    socket.on('card:add', async (payload, callback) => {
      try {
        const { shareToken, topicId, text, author, authorEmail } = payload || {};

        if (!shareToken || !topicId || !text?.trim()) {
          if (callback) callback({ error: 'Topic and card text are required' });
          return;
        }

        const newCard = {
          cardId: crypto.randomUUID(),
          topicId,
          text: text.trim(),
          author: (author || currentUser?.name || 'Developer').trim(),
          authorEmail: authorEmail || currentUser?.email || '',
          votes: 1,
          voters: authorEmail ? [authorEmail] : [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedBoard = await RetroBoard.findOneAndUpdate(
          { shareToken },
          { $push: { cards: newCard } },
          { new: true }
        );

        if (!updatedBoard) {
          if (callback) callback({ error: 'Retrospective session not found' });
          return;
        }

        const roomName = `retro:${shareToken}`;
        // Broadcast to ALL sockets in the room (including sender)
        retroNamespace.to(roomName).emit('card:created', newCard);

        if (callback) callback({ success: true, card: newCard });
      } catch (err) {
        console.error('[Socket] card:add error:', err);
        if (callback) callback({ error: 'Failed to save card' });
      }
    });

    // 3. Edit Sticky Card
    socket.on('card:edit', async (payload, callback) => {
      try {
        const { shareToken, cardId, text } = payload || {};

        if (!shareToken || !cardId || !text?.trim()) {
          if (callback) callback({ error: 'Card ID and new text are required' });
          return;
        }

        const trimmedText = text.trim();
        const updatedTime = new Date();

        const updatedBoard = await RetroBoard.findOneAndUpdate(
          { shareToken, 'cards.cardId': cardId },
          {
            $set: {
              'cards.$.text': trimmedText,
              'cards.$.updatedAt': updatedTime,
            },
          },
          { new: true }
        );

        if (!updatedBoard) {
          if (callback) callback({ error: 'Card or session not found' });
          return;
        }

        const roomName = `retro:${shareToken}`;
        retroNamespace.to(roomName).emit('card:updated', {
          cardId,
          text: trimmedText,
          updatedAt: updatedTime,
        });

        if (callback) callback({ success: true, text: trimmedText });
      } catch (err) {
        console.error('[Socket] card:edit error:', err);
        if (callback) callback({ error: 'Failed to update card' });
      }
    });

    // 4. Delete Sticky Card
    socket.on('card:delete', async (payload, callback) => {
      try {
        const { shareToken, cardId } = payload || {};

        if (!shareToken || !cardId) {
          if (callback) callback({ error: 'Share token and card ID are required' });
          return;
        }

        const updatedBoard = await RetroBoard.findOneAndUpdate(
          { shareToken },
          { $pull: { cards: { cardId } } },
          { new: true }
        );

        if (!updatedBoard) {
          if (callback) callback({ error: 'Session not found' });
          return;
        }

        const roomName = `retro:${shareToken}`;
        retroNamespace.to(roomName).emit('card:deleted', { cardId });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('[Socket] card:delete error:', err);
        if (callback) callback({ error: 'Failed to remove card' });
      }
    });

    // 5. Upvote Sticky Card
    socket.on('card:vote', async (payload, callback) => {
      try {
        const { shareToken, cardId, voter } = payload || {};

        if (!shareToken || !cardId) {
          if (callback) callback({ error: 'Share token and card ID are required' });
          return;
        }

        const updatedBoard = await RetroBoard.findOneAndUpdate(
          { shareToken, 'cards.cardId': cardId },
          {
            $inc: { 'cards.$.votes': 1 },
            ...(voter ? { $addToSet: { 'cards.$.voters': voter } } : {}),
          },
          { new: true }
        );

        if (!updatedBoard) {
          if (callback) callback({ error: 'Card not found' });
          return;
        }

        const targetCard = updatedBoard.cards.find((c) => c.cardId === cardId);
        const votes = targetCard ? targetCard.votes : 1;

        const roomName = `retro:${shareToken}`;
        retroNamespace.to(roomName).emit('card:voted', { cardId, votes });

        if (callback) callback({ success: true, votes });
      } catch (err) {
        console.error('[Socket] card:vote error:', err);
        if (callback) callback({ error: 'Failed to cast vote' });
      }
    });

    // 6. Disconnect
    socket.on('disconnect', () => {
      if (currentShareToken) {
        const roomName = `retro:${currentShareToken}`;
        socket.to(roomName).emit('participant:left', {
          user: currentUser,
          timestamp: new Date(),
        });
      }
    });
  });

  return retroNamespace;
}

export default initRetroSocket;
