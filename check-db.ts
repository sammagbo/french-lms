import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
        }
    });
    console.log('--- Database Users ---');
    console.log(JSON.stringify(users, null, 2));
    
    const courses = await prisma.course.count();
    const lessons = await prisma.lesson.count();
    console.log('--- Database Stats ---');
    console.log(`Courses: ${courses}`);
    console.log(`Lessons: ${lessons}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
