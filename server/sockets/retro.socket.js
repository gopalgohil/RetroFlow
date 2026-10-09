import crypto from 'crypto';
import { z } from 'zod';
import RetroBoard from '../models/RetroBoard.js';
import projectService from '../services/project.service.js';
import retroService from '../services/retro.service.js';
import { isSuperAdmin } from '../config/admin.config.js';
import { verifyToken } from '../utils/token.js';

// Zod Validation Schemas for Socket.io Events
const joinRetroSchema = z.object({
  shareToken: z.string().min(1, 'Missing shareToken'),
  token: z.string().optional(),
  user: z
    .object({
      name: z.string().max(100).optional(),
      email: z.string().optional(),
      role: z.string().max(50).optional(),
    })
    .optional(),
});

const cardAddSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  text: z.string().trim().min(1, 'Card text cannot be empty').max(2000, 'Card text cannot exceed 2000 characters'),
  author: z.string().max(100).optional(),
  authorEmail: z.string().optional(),
  token: z.string().optional(),
});

const cardEditSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  cardId: z.string().min(1, 'Card ID is required'),
  text: z.string().trim().min(1, 'Card text cannot be empty').max(2000, 'Card text cannot exceed 2000 characters'),
  token: z.string().optional(),
});

const cardMoveSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  cardId: z.string().min(1, 'Card ID is required'),
  targetTopicId: z.string().min(1, 'Target topic ID is required'),
  token: z.string().optional(),
});

const cardsReorderSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  cardIds: z.array(z.string().min(1)).min(1, 'cardIds must contain at least 1 card ID'),
  token: z.string().optional(),
});

const cardDeleteSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  cardId: z.string().min(1, 'Card ID is required'),
  token: z.string().optional(),
});

const cardVoteSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  cardId: z.string().min(1, 'Card ID is required'),
  voter: z.string().max(100).optional(),
  voterEmail: z.string().optional(),
  token: z.string().optional(),
});

/**
 * Socket.io Real-Time Retrospective Collaboration Controller
 * Handles instant synchronized card operations across distributed team sessions
 */
export function initRetroSocket(io) {
  const retroNamespace = io.of('/retro');

  // Socket JWT Authentication Middleware
  retroNamespace.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (token) {
        try {
          const decoded = verifyToken(token);
          if (decoded) {
            const email = (decoded.email || '').toLowerCase().trim();
            socket.user = {
              id: decoded.id || decoded._id,
              name: decoded.name || (email ? email.split('@')[0] : 'Teammate'),
              email,
              role: decoded.role || 'member',
              projectRole: decoded.projectRole || null,
              isGuest: Boolean(decoded.isGuest),
            };
          }
        } catch (tokenErr) {
          // Allow connection as guest/unauthenticated
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  retroNamespace.on('connection', (socket) => {
    let currentShareToken = null;
    let currentUser = null;

    // Cryptographically verified identity helper (Bug 7 Fix: Prevents client payload spoofing)
    function getAuthenticatedUser(payload) {
      // 1. If payload or handshake contains a signed JWT token, verify it
      const tokenCandidate = payload?.token || socket.handshake.auth?.token;
      if (tokenCandidate) {
        try {
          const decoded = verifyToken(tokenCandidate);
          if (decoded) {
            const email = (decoded.email || '').toLowerCase().trim();
            return {
              id: decoded.id || decoded._id,
              name: decoded.name || (email ? email.split('@')[0] : 'Teammate'),
              email,
              role: decoded.role || 'member',
              projectRole: decoded.projectRole || null,
              isGuest: Boolean(decoded.isGuest),
            };
          }
        } catch (e) {}
      }

      // 2. Return verified user from connection handshake
      if (socket.user) {
        return socket.user;
      }

      return null;
    }

    // 1. Join Retrospective Room
    socket.on('join:retro', async (payload, callback) => {
      try {
        const parsed = joinRetroSchema.safeParse(payload);
        if (!parsed.success) {
          if (callback) callback({ error: parsed.error.issues[0]?.message || 'Invalid input data' });
          return;
        }

        const { shareToken, user } = parsed.data;

        currentShareToken = shareToken;
        const verifiedUser = getAuthenticatedUser(payload);
        if (verifiedUser) {
          socket.user = verifiedUser;
          currentUser = verifiedUser;
        } else {
          currentUser = user ? { name: user.name || 'Teammate', email: '', isGuest: true } : { name: 'Teammate', email: '', isGuest: true };
        }

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

        // Non-blocking auto-record attendee in RetroBoard document
        const participantEmail = currentUser?.email?.toLowerCase()?.trim();
        if (participantEmail) {
          RetroBoard.findOne({ shareToken }).then((board) => {
            if (!board) return;
            if (!Array.isArray(board.attendees)) board.attendees = [];
            const existingIdx = board.attendees.findIndex(
              (a) => a.email?.toLowerCase().trim() === participantEmail
            );
            if (existingIdx >= 0) {
              board.attendees[existingIdx].lastActiveAt = new Date();
              if (currentUser.name) board.attendees[existingIdx].name = currentUser.name;
            } else {
              board.attendees.push({
                userId: currentUser.id || null,
                name: currentUser.name || participantEmail.split('@')[0],
                email: participantEmail,
                role: currentUser.role || 'Developer',
                joinedAt: new Date(),
                lastActiveAt: new Date(),
              });
            }
            board.save().catch(() => {});
          }).catch(() => {});
        }
      } catch (err) {
        console.error('[Socket] join:retro error:', err);
        if (callback) callback({ error: 'Failed to join session room' });
      }
    });

    // 2. Add Sticky Card
    socket.on('card:add', async (payload, callback) => {
      try {
        const parsed = cardAddSchema.safeParse(payload);
        if (!parsed.success) {
          if (callback) callback({ error: parsed.error.issues[0]?.message || 'Invalid card data' });
          return;
        }

        const { shareToken, topicId, text } = parsed.data;

        const authUser = getAuthenticatedUser(payload);
        const authorName = (authUser?.name || payload?.author || currentUser?.name || 'Developer').trim();
        // Strict: If authenticated, lock authorEmail to verified email (cannot spoof authorEmail)
        const authorEmail = authUser?.email
          ? authUser.email.toLowerCase().trim()
          : (payload?.authorEmail || '').toLowerCase().trim();

        const newCard = {
          cardId: crypto.randomUUID(),
          topicId,
          text: text.trim(),
          author: authorName,
          authorEmail: authorEmail,
          votes: 0,
          voters: [],
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

        // Dynamically sync real-time card and action item counts to parent projects
        projectService.syncRetroBoardToProjects(shareToken, retroNamespace).catch(() => {});

        if (callback) callback({ success: true, card: newCard });
      } catch (err) {
        console.error('[Socket] card:add error:', err);
        if (callback) callback({ error: 'Failed to save card' });
      }
    });

    // 3. Edit Sticky Card (Author Only - Cryptographically Verified Guard)
    socket.on('card:edit', async (payload, callback) => {
      try {
        const parsed = cardEditSchema.safeParse(payload);
        if (!parsed.success) {
          if (callback) callback({ error: parsed.error.issues[0]?.message || 'Invalid edit data' });
          return;
        }

        const { shareToken, cardId, text } = parsed.data;

        const authUser = getAuthenticatedUser(payload);
        if (!authUser) {
          if (callback) {
            callback({ error: 'Authentication required to edit cards. Please log in or rejoin the session.' });
          }
          return;
        }

        // Verify that the user is the original author of the card
        const existingBoard = await RetroBoard.findOne(
          { shareToken, 'cards.cardId': cardId },
          { 'cards.$': 1 }
        ).lean();

        if (!existingBoard || !existingBoard.cards || existingBoard.cards.length === 0) {
          if (callback) callback({ error: 'Card or session not found' });
          return;
        }

        const targetCard = existingBoard.cards[0];
        const targetEmail = (targetCard.authorEmail || '').toLowerCase().trim();
        const userEmail = (authUser.email || '').toLowerCase().trim();
        const targetAuthor = (targetCard.author || '').toLowerCase().trim();
        const userName = (authUser.name || '').toLowerCase().trim();

        const isAuthor =
          Boolean(userEmail && targetEmail && userEmail === targetEmail) ||
          Boolean(!targetEmail && targetAuthor && userName && userName === targetAuthor);

        if (!isAuthor) {
          console.warn(
            `[Socket Security] Blocked unauthorized edit attempt on card ${cardId} by ${
              authUser.email || authUser.name
            } (Original author: ${targetCard.authorEmail || targetCard.author})`
          );
          if (callback) {
            callback({ error: 'Permission denied: Only the original author can edit this feedback.' });
          }
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

    // Helper: Verify if user has Workspace Admin or Manager permissions for the retro session
    function checkAdminOrManager(board, requester) {
      if (!requester) return false;
      const requesterEmail = (requester?.email || '').toLowerCase().trim();
      const requesterRole = (requester?.role || '').toLowerCase().trim();

      // 1. Workspace Admin
      const isWsAdmin =
        requesterRole === 'admin' ||
        isSuperAdmin(requesterEmail);

      if (isWsAdmin) return true;

      // 2. Manager or Lead role
      if (
        requesterRole === 'manager' ||
        requesterRole.includes('lead') ||
        requesterRole.includes('manager')
      ) {
        return true;
      }

      // 3. Creator of retro board
      if (board?.createdBy) {
        const createdById =
          typeof board.createdBy === 'object'
            ? String(board.createdBy._id || board.createdBy.id || '')
            : String(board.createdBy);
        const createdByEmail =
          typeof board.createdBy === 'object'
            ? (board.createdBy.email || '').toLowerCase().trim()
            : '';
        if (
          (requester?.id && createdById === String(requester.id)) ||
          (requesterEmail && createdByEmail === requesterEmail)
        ) {
          return true;
        }
      }

      // 4. Linked Project Lead or Manager member
      const linkedProject = (board?.projectId && typeof board.projectId === 'object')
        ? board.projectId
        : ((board?.project && typeof board.project === 'object') ? board.project : null);

      if (linkedProject) {
        const leadEmail = (linkedProject.lead?.email || '').toLowerCase().trim();
        if (leadEmail && leadEmail === requesterEmail) {
          return true;
        }
        if (Array.isArray(linkedProject.members)) {
          const member = linkedProject.members.find(
            (m) => (m.email || '').toLowerCase().trim() === requesterEmail
          );
          if (member) {
            const mRole = (member.role || '').toLowerCase().trim();
            if (mRole === 'manager' || mRole.includes('lead') || mRole.includes('manager')) {
              return true;
            }
          }
        }
      }

      return false;
    }

    // Move Sticky Card between topics/questions (Strictly Admin and Manager only)
    socket.on('card:move', async (payload, callback) => {
      try {
        const parsed = cardMoveSchema.safeParse(payload);
        if (!parsed.success) {
          if (callback) callback({ error: parsed.error.issues[0]?.message || 'Invalid move data' });
          return;
        }

        const { shareToken, cardId, targetTopicId } = parsed.data;

        const requester = getAuthenticatedUser(payload);
        if (!requester) {
          if (callback) callback({ error: 'Authentication required to move cards.' });
          return;
        }

        const board = await RetroBoard.findOne({ shareToken }).populate('projectId').lean();
        if (!board) {
          if (callback) callback({ error: 'Card or session not found' });
          return;
        }

        if (!checkAdminOrManager(board, requester)) {
          console.warn(
            `[Socket Security] Unauthorized cross-question card move blocked for user ${
              requester?.email || requester?.name || 'anonymous'
            }`
          );
          if (callback) {
            callback({
              error: 'Permission denied: Only Admin and Manager can move cards between questions.',
            });
          }
          return;
        }

        const updatedTime = new Date();

        const updatedBoard = await RetroBoard.findOneAndUpdate(
          { shareToken, 'cards.cardId': cardId },
          {
            $set: {
              'cards.$.topicId': targetTopicId,
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
        retroNamespace.to(roomName).emit('card:moved', {
          cardId,
          targetTopicId,
          updatedAt: updatedTime,
        });

        if (callback) callback({ success: true, cardId, targetTopicId });
      } catch (err) {
        console.error('[Socket] card:move error:', err);
        if (callback) callback({ error: 'Failed to move card' });
      }
    });

    // Reorder Sticky Cards within a specific topic (Strictly Admin and Manager only)
    socket.on('cards:reorder', async (payload, callback) => {
      try {
        const parsed = cardsReorderSchema.safeParse(payload);
        if (!parsed.success) {
          if (callback) callback({ error: parsed.error.issues[0]?.message || 'Invalid reorder data' });
          return;
        }

        const { shareToken, topicId, cardIds } = parsed.data;

        const requester = getAuthenticatedUser(payload);
        if (!requester) {
          if (callback) callback({ error: 'Authentication required to reorder cards.' });
          return;
        }

        const board = await RetroBoard.findOne({ shareToken }).populate('projectId').lean();
        if (!board) {
          if (callback) callback({ error: 'Session not found' });
          return;
        }

        if (!checkAdminOrManager(board, requester)) {
          console.warn(
            `[Socket Security] Unauthorized cards reorder blocked for user ${
              requester?.email || requester?.name || 'anonymous'
            }`
          );
          if (callback) {
            callback({
              error: 'Permission denied: Only Admin and Manager can reorder cards.',
            });
          }
          return;
        }

        const result = await retroService.reorderCards(shareToken, topicId, cardIds, requester);

        const roomName = `retro:${shareToken}`;
        retroNamespace.to(roomName).emit('cards:reordered', result);

        if (callback) callback({ success: true, ...result });
      } catch (err) {
        console.error('[Socket] cards:reorder error:', err);
        if (callback) callback({ error: 'Failed to reorder cards' });
      }
    });

    // 4. Delete Sticky Card (Author or Facilitator/Admin/Manager only)
    socket.on('card:delete', async (payload, callback) => {
      try {
        const parsed = cardDeleteSchema.safeParse(payload);
        if (!parsed.success) {
          if (callback) callback({ error: parsed.error.issues[0]?.message || 'Invalid delete data' });
          return;
        }

        const { shareToken, cardId } = parsed.data;

        const authUser = getAuthenticatedUser(payload);
        if (!authUser) {
          if (callback) {
            callback({ error: 'Authentication required to delete cards. Please log in or rejoin the session.' });
          }
          return;
        }

        const board = await RetroBoard.findOne(
          { shareToken, 'cards.cardId': cardId },
          { createdBy: 1, projectId: 1, projectKey: 1, 'cards.$': 1 }
        ).populate('projectId').lean();

        if (!board || !board.cards || board.cards.length === 0) {
          if (callback) callback({ error: 'Card or session not found' });
          return;
        }

        const targetCard = board.cards[0];
        const targetEmail = (targetCard.authorEmail || '').toLowerCase().trim();
        const userEmail = (authUser.email || '').toLowerCase().trim();
        const targetAuthor = (targetCard.author || '').toLowerCase().trim();
        const userName = (authUser.name || '').toLowerCase().trim();

        const isAuthor =
          Boolean(userEmail && targetEmail && userEmail === targetEmail) ||
          Boolean(!targetEmail && targetAuthor && userName && userName === targetAuthor);

        const isPrivileged = checkAdminOrManager(board, authUser);

        if (!isAuthor && !isPrivileged) {
          console.warn(
            `[Socket Security] Unauthorized card deletion attempt on card ${cardId} by ${
              authUser.email || authUser.name
            }`
          );
          if (callback) {
            callback({ error: 'Permission denied: Only the original author or team manager can delete this card.' });
          }
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

        // Dynamically sync real-time card and action item counts to parent projects
        projectService.syncRetroBoardToProjects(shareToken, retroNamespace).catch(() => {});

        if (callback) callback({ success: true, cardId });
      } catch (err) {
        console.error('[Socket] card:delete error:', err);
        if (callback) callback({ error: 'Failed to remove card' });
      }
    });

    // 5. Toggle Like / Unlike Sticky Card (Dynamic real-time toggle)
    socket.on('card:vote', async (payload, callback) => {
      try {
        const parsed = cardVoteSchema.safeParse(payload);
        if (!parsed.success) {
          if (callback) callback({ error: parsed.error.issues[0]?.message || 'Invalid vote data' });
          return;
        }

        const { shareToken, cardId, voter, voterEmail } = parsed.data;

        const board = await RetroBoard.findOne({ shareToken });
        if (!board) {
          if (callback) callback({ error: 'Retrospective session not found' });
          return;
        }

        const targetCard = board.cards.find((c) => c.cardId === cardId);
        if (!targetCard) {
          if (callback) callback({ error: 'Card not found' });
          return;
        }

        const authUser = getAuthenticatedUser(payload);
        const voterName = (authUser?.name || voter || 'Developer').trim();
        const normalizedEmail = (authUser?.email || voterEmail || '').toLowerCase().trim();
        const normalizedName = voterName.toLowerCase().trim();

        // Safe matcher to identify this specific user's votes uniquely (Fixes Bug 6 voter conflict)
        const isThisVoter = (v) => {
          const vLower = (v || '').toLowerCase().trim();
          if (normalizedEmail && vLower === normalizedEmail) return true;
          if (normalizedEmail && vLower.includes(normalizedEmail)) return true;
          if (normalizedName && vLower === normalizedName) return true;
          return false;
        };

        if (!Array.isArray(targetCard.voters)) {
          targetCard.voters = [];
        }

        const existingIndex = targetCard.voters.findIndex(isThisVoter);

        let hasVoted = false;
        if (existingIndex !== -1) {
          // UNLIKE / UNVOTE
          targetCard.voters.splice(existingIndex, 1);
          targetCard.votes = Math.max(0, (targetCard.votes || 1) - 1);
          hasVoted = false;
        } else {
          // LIKE / VOTE: Strictly 1 vote per card per participant (cannot vote multiple times on the same card, but can vote on other cards)
          const voterIdentifier = normalizedEmail || voterName;
          targetCard.voters.push(voterIdentifier);
          targetCard.votes = (targetCard.votes || 0) + 1;
          hasVoted = true;
        }

        await board.save();

        const roomName = `retro:${shareToken}`;
        retroNamespace.to(roomName).emit('card:voted', {
          cardId,
          votes: targetCard.votes,
          voters: targetCard.voters,
        });

        if (callback) {
          callback({
            success: true,
            votes: targetCard.votes,
            voters: targetCard.voters,
            hasVoted,
            action: hasVoted ? 'liked' : 'unliked',
          });
        }
      } catch (err) {
        console.error('[Socket] card:vote error:', err);
        if (callback) callback({ error: 'Failed to toggle vote' });
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
