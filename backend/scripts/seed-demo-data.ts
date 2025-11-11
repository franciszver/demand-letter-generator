import { db } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { TemplateModel } from '../src/models/Template';
import { DraftLetterModel } from '../src/models/DraftLetter';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = 'demo123';

interface DemoUser {
  email: string;
  name: string;
  role: 'admin' | 'attorney' | 'paralegal';
}

const demoUsers: DemoUser[] = [
  { email: 'admin@stenodraft.com', name: 'Admin User', role: 'admin' },
  { email: 'attorney1@stenodraft.com', name: 'Sarah Johnson', role: 'attorney' },
  { email: 'attorney2@stenodraft.com', name: 'Michael Chen', role: 'attorney' },
  { email: 'paralegal1@stenodraft.com', name: 'Emily Rodriguez', role: 'paralegal' },
  { email: 'paralegal2@stenodraft.com', name: 'David Kim', role: 'paralegal' },
];

const demoTemplates = [
  {
    name: 'Standard Demand Letter',
    content: 'Dear {{client_name}},\n\nThis letter is regarding the matter dated {{date}}.\n\nBased on our review of the case documents, we are demanding the following:\n\n{{demand_details}}\n\nWe expect a response within {{response_days}} days.\n\nSincerely,\n{{attorney_name}}',
  },
  {
    name: 'Personal Injury Demand Letter',
    content: 'Dear {{client_name}},\n\nRe: Personal Injury Claim - {{incident_date}}\n\nWe represent {{client_name}} in connection with injuries sustained on {{incident_date}}.\n\nFACTS:\n{{incident_facts}}\n\nDAMAGES:\n{{damages_description}}\n\nWe demand compensation in the amount of ${{demand_amount}}.\n\nPlease respond within 30 days.\n\nRespectfully,\n{{attorney_name}}',
  },
  {
    name: 'Property Damage Demand Letter',
    content: 'Dear {{client_name}},\n\nRe: Property Damage Claim - {{incident_date}}\n\nWe are writing to demand compensation for property damage that occurred on {{incident_date}}.\n\nPROPERTY DAMAGE:\n{{damage_description}}\n\nESTIMATED COST:\n${{repair_cost}}\n\nWe demand payment of ${{demand_amount}} within 14 days.\n\nSincerely,\n{{attorney_name}}',
  },
];

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');

  try {
    // Create demo users
    console.log('Creating demo users...');
    const createdUsers: any[] = [];
    for (const userData of demoUsers) {
      try {
        const existing = await UserModel.findByEmail(userData.email);
        if (existing) {
          console.log(`User ${userData.email} already exists, skipping...`);
          createdUsers.push(existing);
          continue;
        }

        const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
        const user = await UserModel.create({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          passwordHash,
        });
        createdUsers.push(user);
        console.log(`✓ Created user: ${userData.email}`);
      } catch (error) {
        console.error(`Failed to create user ${userData.email}:`, error);
      }
    }

    // Create demo templates
    console.log('Creating demo templates...');
    const createdTemplates: any[] = [];
    for (const templateData of demoTemplates) {
      try {
        const template = await TemplateModel.create({
          name: templateData.name,
          content: templateData.content,
          variables: extractVariables(templateData.content),
        });
        createdTemplates.push(template);
        console.log(`✓ Created template: ${templateData.name}`);
      } catch (error) {
        console.error(`Failed to create template ${templateData.name}:`, error);
      }
    }

    // Create demo drafts (if we have users)
    if (createdUsers.length > 0) {
      console.log('Creating demo letter drafts...');
      const attorneyUsers = createdUsers.filter(u => u.role === 'attorney');
      if (attorneyUsers.length > 0) {
        for (let i = 0; i < 5; i++) {
          const user = attorneyUsers[i % attorneyUsers.length];
          try {
            const draft = await DraftLetterModel.create({
              userId: user.id,
              title: `Demo Demand Letter ${i + 1}`,
              content: `This is a sample demand letter draft ${i + 1}. It demonstrates the AI-generated content that would be created from uploaded case documents.

The letter includes:
- Clear statement of facts
- Legal basis for the claim
- Specific demands
- Professional tone suitable for legal correspondence`,
              s3Key: `letters/${user.id}/${Date.now()}-demo-${i + 1}.txt`,
              status: i % 2 === 0 ? 'generated' : 'refined',
            });
            console.log(`✓ Created draft: ${draft.title}`);
          } catch (error) {
            console.error(`Failed to create draft ${i + 1}:`, error);
          }
        }
      }
    }

    console.log('✅ Demo data seeding completed!');
    console.log('\nDemo Users:');
    demoUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - Password: ${DEMO_PASSWORD}`);
    });
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

function extractVariables(content: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

// Run if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedDemoData };

