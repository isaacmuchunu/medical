import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Notification from '@/backend/models/Notification';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    let query = { userId: req.user.id };
    if (unreadOnly) {
      query.read = false;
    }
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const body = await req.json();
    const { notificationIds } = body;

    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: req.user.id
      },
      { $set: { read: true } }
    );

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Update Notifications Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 