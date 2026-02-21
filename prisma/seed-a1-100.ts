import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to generate a standardized Rich Document lesson
function createRichLesson(title: string, theory: string, practiceTitle: string, practiceItems: string[], assignmentTitle: string, assignmentDesc: string) {
      return `
# ${title}

## 📖 Parte 1: Teoria (Leçon)
${theory}

<hr />

## ✍️ Parte 2: Prática Automática
<div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 not-prose mb-8">
      <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">${practiceTitle}</h4>
      <ul className="list-disc pl-5 space-y-3 text-slate-700 dark:text-slate-300">
            ${practiceItems.map(item => `<li>${item}</li>`).join('\n')}
      </ul>
</div>

<hr />

## 🎤 Parte 3: A Missão Prática (Assignment)
<DocumentAlert variant="important" title="${assignmentTitle}">
      <p className="font-semibold mb-2">Instruções:</p>
      <p>${assignmentDesc}</p>
</DocumentAlert>
      `;
}

async function main() {
      console.log('🌱 Iniciando o Seeding Intensivo (100+ Aulas A1)...');

      const passwordHash = await bcrypt.hash('123456', 10);

      // Create or Get Teacher
      const teacher = await prisma.user.upsert({
            where: { email: 'prof100@french.com' },
            update: {},
            create: {
                  email: 'prof100@french.com',
                  passwordHash,
                  role: Role.TEACHER,
                  profile: { create: { bio: 'Professor Mestre', frenchLevel: 'C2' } },
            },
      });

      console.log('📚 Removendo curso antigo (se existir) para gerar o currículo de 100 aulas...');
      await prisma.course.deleteMany({ where: { slug: 'frances-complet-a1-100' } });

      // Core Handcrafted Modules (15 lessons)
      const coreModules = [
            {
                  title: 'Módulo 1: As Bases do Idioma',
                  lessons: [
                        {
                              title: 'Aula 1: Les Salutations (Saudações)',
                              content: createRichLesson(
                                    'Bonjour et Bonsoir',
                                    'Aprender a cumprimentar é o primeiro passo para qualquer conversa em francês.\n\n* **Bonjour:** "Bom dia" / "Olá" (Usado até as 18h).\n* **Bonsoir:** "Boa noite" (Ao chegar, após o pôr do sol).',
                                    'Complete as frases:',
                                    ['Às 9h da manhã, eu digo: ________', 'Às 20h da noite, eu digo: ________'],
                                    'Tarefa: Áudio de Saudação',
                                    'Grave um áudio dizendo seu nome e cumprimentando adequadamente agora (Bonjour ou Bonsoir).'
                              )
                        },
                        {
                              title: 'Aula 2: O Verbo Être (Ser/Estar)',
                              content: createRichLesson(
                                    'Le Verbe Être',
                                    'Usamos **Être** para expressar quem somos, nacionalidade e profissão.\n\n| Pronome | Verbo |\n|----------|-------|\n| Je | suis |\n| Tu | es |\n| Il/Elle | est |\n| Nous | sommes |\n| Vous | êtes |\n| Ils/Elles| sont |',
                                    'Conjugue o verbo:',
                                    ['Je ________ brésilien.', 'Nous ________ à Paris.', 'Elle ________ étudiante.'],
                                    'Tarefa: Apresentação Pessoal',
                                    'Escreva ou grave: "Bonjour, je suis [Seu Nome] et je suis content(e)."'
                              )
                        },
                        {
                              title: 'Aula 3: O Verbo Avoir (Ter)',
                              content: createRichLesson(
                                    'Le Verbe Avoir',
                                    'O verbo **Avoir** é usado para posse e idade.\n\n* J\'ai (Eu tenho)\n* Tu as (Tu tens)\n* Il/Elle a (Ele/Ela tem)',
                                    'Diga a sua idade:',
                                    ['J\'________ 25 ans.', 'Il ________ une voiture.', 'Nous avons un chat.'],
                                    'Tarefa: Diga sua idade',
                                    'Grave a frase: "Bonjour, j\'ai [sua idade] ans."'
                              )
                        }
                  ]
            },
            {
                  title: 'Módulo 2: Vocabulário Essencial',
                  lessons: [
                        {
                              title: 'Aula 4: Les Nombres de 1 à 20',
                              content: createRichLesson(
                                    'Números de 1 a 20',
                                    'Contar em francês é fascinante. Vamos ver do 1 ao 5:\n> [!TIP]\n> 1: Un, 2: Deux, 3: Trois, 4: Quatre, 5: Cinq',
                                    'Traduza os números:',
                                    ['Três = ________', 'Cinco = ________', 'Dois = ________'],
                                    'Tarefa: Matemática Básica',
                                    'Grave lendo os números: Un, deux, trois, quatre, cinq.'
                              )
                        },
                        {
                              title: 'Aula 5: Les Jours de la Semaine',
                              content: createRichLesson(
                                    'Dias da Semana',
                                    'Os dias da semana em francês terminam quase todos em "di".\n\nLundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche.',
                                    'Qual é o dia?',
                                    ['O primeiro dia da semana útil: ________', 'O fim de semana começa no: ________'],
                                    'Tarefa: Sua rotina',
                                    'Qual é o seu dia favorito da semana e por quê? (Responda em português ou misturado).'
                              )
                        }
                  ]
            }
      ];

      // Add a 3rd module with loop to pad to 15 handmade-ish
      for (let i = 6; i <= 15; i++) {
            coreModules[1].lessons.push({
                  title: `Aula ${i}: Regra Gramatical ${i}`,
                  content: createRichLesson(
                        `Regra A1 - Nível ${i}`,
                        'Uma regra essencial de francês A1.',
                        'Exercício Rápido',
                        ['Complete a regra X', 'Traduza a palavra Y'],
                        'Tarefa Prática',
                        `Aplique a regra ${i} numa frase simples.`
                  )
            });
      }

      // Generate 85 Intensive Practice Lessons
      const practiceModules = [];
      const topics = ['La Famille', 'La Nourriture', 'Les Vêtements', 'Les Couleurs', 'Au Restaurant'];

      let globalLessonCounter = 16;
      for (let m = 0; m < topics.length; m++) {
            const topic = topics[m];
            const lessonsInModule = [];

            for (let i = 1; i <= 17; i++) {
                  lessonsInModule.push({
                        title: `Aula ${globalLessonCounter}: Prática - ${topic} Parte ${i}`,
                        content: createRichLesson(
                              `Intensivão: ${topic} (Parte ${i}/17)`,
                              `Nesta aula de prática intensiva, vamos focar no vocabulário de **${topic}**. A repetição é a chave da fluência. Esta é a variação número ${i} do treinamento de memória.\n\n<DocumentAlert variant="note" title="Foco da Aula">Memorize os falsos cognatos ligados a este tema!</DocumentAlert>`,
                              `Treino Ortográfico (${topic})`,
                              [
                                    `Corrija o erro comum ${i} sobre ${topic}.`,
                                    `Traduza a expressão idiomática ${i}.`
                              ],
                              `Missão ${globalLessonCounter}`,
                              `Escreva um texto de 3 linhas usando os termos aprendidos na Lição ${globalLessonCounter}.`
                        )
                  });
                  globalLessonCounter++;
            }

            practiceModules.push({
                  title: `Módulo Especial ${m + 1}: Prática Intensiva - ${topic}`,
                  lessons: lessonsInModule
            });
      }

      console.log('🚀 Inserindo Curso com ' + (globalLessonCounter - 1) + ' aulas na base de dados...');

      // Transform all to prisma create input formatting
      const allModulesForPrisma = [...coreModules, ...practiceModules].map(mod => ({
            title: mod.title,
            lessons: {
                  create: mod.lessons.map(les => ({
                        title: les.title,
                        content: les.content
                  }))
            }
      }));

      const course = await prisma.course.create({
            data: {
                  title: 'Francês Imersivo A1 - Curso Completo (100 Aulas)',
                  slug: 'frances-complet-a1-100',
                  description: 'Currículo extenso de Francês A1 gerado via Seed com 100 lições combinando Teoria e Prática Intensiva.',
                  price: 0,
                  authorId: teacher.id,
                  modules: {
                        create: allModulesForPrisma
                  },
            },
      });

      console.log(`✅ Sucesso! Curso criado com ID: ${course.id}`);
      console.log(`✅ Total de Aulas inseridas no script: ${globalLessonCounter - 1}`);
}

main()
      .catch((e) => {
            console.error('❌ Erro durante o seeding intenso:', e);
            process.exit(1);
      })
      .finally(async () => {
            await prisma.$disconnect();
      });
