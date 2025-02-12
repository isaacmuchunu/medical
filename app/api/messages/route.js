import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Message from '@/backend/models/Message';
import { authMiddleware } from '@/backend/middleware/auth';
import { getIO } from '@/backend/services/websocket';
import { createNotification } from '@/backend/services/notification';

export async function POST(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const body = await req.json();
    const { receiverId, content, type, fileUrl, appointmentId } = body;

    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      content,
      type,
      fileUrl,
      appointmentId
    });

    // Populate sender info for real-time message
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'profile')
      .populate('receiverId', 'profile');

    // Send real-time message
    const io = getIO();
    io.to(`user:${receiverId}`).emit('message', populatedMessage);

    // Create notification for receiver
    await createNotification({
      userId: receiverId,
      title: 'New Message',
      message: `You have a new message from ${req.user.profile.name}`,
      type: 'message',
      relatedId: message._id,
      relatedModel: 'Message'
    });

    return NextResponse.json(
      { message: 'Message sent successfully', data: populatedMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send Message Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const appointmentId = searchParams.get('appointmentId');

    let query = {
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]
    };

    if (appointmentId) {
      query.appointmentId = appointmentId;
    }

    const messages = await Message.find(query)
      .populate('senderId', 'profile')
      .populate('receiverId', 'profile')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        receiverId: req.user.id,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 