import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Timetable & Holiday Seed ---');

  // 1. Ensure we attach this data to your actual registered users
  let users = await prisma.user.findMany();
  
  // If no user exists yet, create the default 'student' account as a fallback
  if (users.length === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const defaultUser = await prisma.user.create({
      data: {
        username: 'student',
        passwordHash,
        targetPercentage: 75
      }
    });
    users = [defaultUser];
  }

  // 2. Define the exact 8-period timetable matrix from your images
  // Format: [dayOfWeek (1=Mon, 2=Tue, etc), periodNumber, subjectName]
  const timetableRows = [
    // Monday (Mon)
    [1, 1, 'IOT'],
    [1, 2, 'IOT'],
    [1, 3, 'CNS'],
    [1, 4, 'CNS'],
    [1, 5, 'CS LAB'],
    [1, 6, 'CS LAB'],
    [1, 7, 'CS LAB'],
    [1, 8, 'CS LAB'],

    // Tuesday (Tue)
    [2, 1, 'MPMC'],
    [2, 2, 'MPMC'],
    [2, 3, 'CSDF'],
    [2, 4, 'CSDF'],
    [2, 5, 'IOT LAB'],
    [2, 6, 'IOT LAB'],
    [2, 7, 'IOT LAB'],
    [2, 8, 'IOT LAB'],

    // Wednesday (Wed)
    [3, 1, 'OE-I'],
    [3, 2, 'OE-I'],
    [3, 5, 'IOT'],
    [3, 6, 'IOT'],
    [3, 7, 'MPMC'],
    [3, 8, 'MPMC'],

    // Thursday (Thu)
    [4, 1, 'ES(QA)'],
    [4, 2, 'ES(QA)'],
    [4, 3, 'CNS'],
    [4, 4, 'CNS'],
    [4, 5, 'CSDF'],
    [4, 6, 'CSDF'],
    [4, 7, 'SS(SS)'],
    [4, 8, 'SS(SS)'],

    // Friday (Fri)
    [5, 1, 'UIDF LAB'],
    [5, 2, 'UIDF LAB'],
    [5, 3, 'UIDF LAB'],
    [5, 4, 'UIDF LAB'],
    [5, 5, 'OE-I'],
    [5, 6, 'OE-I']
  ];

  // 2.5 Cleanup legacy 'Minors' traces from previous seeds (subject has been removed)
  console.log('Cleaning up legacy Minors timetable and attendance entries...');
  await prisma.attendanceLog.deleteMany({ where: { subjectName: 'Minors' } });
  await prisma.timetable.deleteMany({ where: { subjectName: 'Minors' } });

  // Apply the timetable to ALL accounts found in the system
  console.log(`Seeding timetable entries for ${users.length} user profile(s)...`);
  for (const user of users) {
    for (const [dayOfWeek, periodNumber, subjectName] of timetableRows) {
      await prisma.timetable.upsert({
        where: {
          userId_dayOfWeek_periodNumber: {
            userId: user.id,
            dayOfWeek,
            periodNumber
          }
        },
        update: { subjectName },
        create: { userId: user.id, dayOfWeek, periodNumber, subjectName }
      });
    }
  }

  // 3. Official Holiday Schedule Calendar Mapping
  const holidays = [
    ['2026-06-26', 'Moharam', true],
    ['2026-08-15', 'Independence Day', true],
    ['2026-08-26', 'Milad Nabi', true],
    ['2026-09-04', 'Janmastami', true],
    ['2026-09-14', 'Ganesh Chaturthi', true],
    ['2026-10-02', 'Gandhi Jayanthi', true],
    ['2026-10-19', 'Durgaashtami', true],
    ['2026-10-20', 'Maharnavami & Vijayadasami', true],
    ['2026-11-08', 'Diwali', true],
    ['2026-12-25', 'Christmas', true],
    ['2027-01-01', 'New Year Day', true],
    ['2027-01-14', 'Bhogi', true],
    ['2027-01-15', 'MakaraSankarathi', true],
    ['2027-01-16', 'Kanuma', true],
    ['2027-01-26', 'Republic Day', true],
    ['2027-03-06', 'Maha Shivaratri', true],
    ['2027-03-10', 'Ramzan', true],
    ['2027-03-22', 'Holi', true],
    ['2027-03-26', 'Good Friday', true],
    ['2027-04-05', 'Jagajeevan Ram Jayanthi', true],
    ['2027-04-07', 'Ugadi', true],
    ['2027-04-14', 'Dr. B.R. Ambedkar Jayanthi', true],
    ['2027-04-15', 'Sriramanavami', true],
    ['2027-05-15', 'Bakrid', true]
  ];

  console.log('Seeding official academic holidays calendar...');
  for (const [date, holidayName, isOfficial] of holidays) {
    await prisma.holiday.upsert({
      where: { date: new Date(`${date}T00:00:00.000Z`) },
      update: { holidayName, isOfficial },
      create: {
        date: new Date(`${date}T00:00:00.000Z`),
        holidayName,
        isOfficial
      }
    });
  }

  console.log('--- Seeding Successfully Completed! ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });