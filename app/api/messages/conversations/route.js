import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Message from '@/backend/models/Message';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    // Get latest message from each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user.id },
            { receiverId: req.user.id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user.id] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', req.user.id] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: 1,
            profile: 1,
            role: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Fetch Conversations Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 