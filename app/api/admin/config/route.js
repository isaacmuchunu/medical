import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import SystemConfig from '@/backend/models/SystemConfig';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';
import { createAuditLog } from '@/backend/services/audit';

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public') === 'true';

    let query = {};
    if (category) query.category = category;
    if (!req.user.role === 'admin') query.isPublic = true;

    const configs = await SystemConfig.find(query)
      .populate('lastUpdatedBy', 'profile')
      .sort({ category: 1, key: 1 });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Fetch Config Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    await requireRole('admin')(req);

    const body = await req.json();
    const updates = body.configs;

    const updatePromises = updates.map(async (update) => {
      const config = await SystemConfig.findOneAndUpdate(
        { key: update.key },
        {
          $set: {
            value: update.value,
            lastUpdatedBy: req.user.id
          }
        },
        { new: true }
      );

      // Create audit log
      await createAuditLog({
        userId: req.user.id,
        action: 'update_config',
        entityType: 'system',
        entityId: config._id,
        details: { key: update.key, value: update.value }
      });

      return config;
    });

    const updatedConfigs = await Promise.all(updatePromises);
    return NextResponse.json(updatedConfigs);
  } catch (error) {
    console.error('Update Config Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 