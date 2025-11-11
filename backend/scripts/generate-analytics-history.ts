import { db } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { DraftLetterModel } from '../src/models/DraftLetter';
import { TemplateModel } from '../src/models/Template';

/**
 * Generate historical analytics data for the past N days
 */
async function generateAnalyticsHistory(days: number = 90) {
  console.log(`📊 Generating ${days} days of analytics history...`);

  try {
    // Get all users, drafts, templates
    const users = await UserModel.findAll();
    const drafts = await DraftLetterModel.findAll();
    const templates = await TemplateModel.findAll();

    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    const now = new Date();
    const events: any[] = [];

    // Generate events for each day
    for (let day = days; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      // Random number of events per day (1-10)
      const eventsPerDay = Math.floor(Math.random() * 10) + 1;

      for (let i = 0; i < eventsPerDay; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const eventTime = new Date(date);
        eventTime.setHours(hour, minute, 0, 0);

        // Random event type
        const eventTypes = [
          'letter_generated',
          'letter_refined',
          'letter_exported',
          'template_created',
          'document_uploaded',
          'user_logged_in',
        ];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        const eventData: any = {
          userId: user.id,
          eventType,
          eventData: {},
          entityType: null,
          entityId: null,
          createdAt: eventTime,
        };

        // Add entity data based on event type
        if (eventType === 'letter_generated' && drafts.length > 0) {
          const draft = drafts[Math.floor(Math.random() * drafts.length)];
          eventData.entityType = 'draft_letter';
          eventData.entityId = draft.id;
          if (templates.length > 0 && Math.random() > 0.5) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            eventData.eventData.templateId = template.id;
          }
        } else if (eventType === 'letter_refined' && drafts.length > 0) {
          const draft = drafts[Math.floor(Math.random() * drafts.length)];
          eventData.entityType = 'draft_letter';
          eventData.entityId = draft.id;
        } else if (eventType === 'letter_exported' && drafts.length > 0) {
          const draft = drafts[Math.floor(Math.random() * drafts.length)];
          eventData.entityType = 'draft_letter';
          eventData.entityId = draft.id;
        } else if (eventType === 'template_created' && templates.length > 0) {
          const template = templates[Math.floor(Math.random() * templates.length)];
          eventData.entityType = 'template';
          eventData.entityId = template.id;
        }

        events.push(eventData);
      }
    }

    // Insert events in batches
    console.log(`Inserting ${events.length} analytics events...`);
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await db('analytics_events').insert(
        batch.map(e => ({
          user_id: e.userId,
          event_type: e.eventType,
          event_data: JSON.stringify(e.eventData),
          entity_type: e.entityType,
          entity_id: e.entityId,
          created_at: e.createdAt,
        }))
      );
      console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)}`);
    }

    console.log('✅ Analytics history generated successfully!');
  } catch (error) {
    console.error('❌ Error generating analytics history:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const days = parseInt(process.argv[2] || '90', 10);
  generateAnalyticsHistory(days)
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { generateAnalyticsHistory };

