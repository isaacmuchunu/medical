import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Appointment from '@/backend/models/Appointment';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const appointmentId = session.metadata.appointmentId;

      await connectDB();

      // Update appointment payment status
      await Appointment.findByIdAndUpdate(appointmentId, {
        paymentStatus: 'completed',
        status: 'confirmed'
      });

      // TODO: Send confirmation email/notification to patient and doctor
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 