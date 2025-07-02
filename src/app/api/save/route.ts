// src/app/api/save/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../lib/db';

export async function POST(req: Request) {
    const body = await req.json();
//   console.log('→ [/api/save] payload:', body);

  const { task, answer, evaluation, revisedAnswer, feedback } = body;

  if (!task || !answer || !evaluation || !revisedAnswer || !feedback) {
    return NextResponse.json(
      { error: 'Missing one of the required fields' },
      { status: 400 }
    );
  }

  try {
   const inserted = await db.query(
      `
      INSERT INTO essay_evaluations
        (task, answer, evaluation, revised_answer, feedback)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
      `,
      [task, answer, evaluation, revisedAnswer, feedback]
    );

    // `inserted` is `any[]` by default—cast it to your shape
    const firstRow = (inserted as Array<{ id: number; created_at: string }>)[0];

    return NextResponse.json({ success: true, id: firstRow.id });
  } catch (error: unknown) {
    // Narrow down to Error if possible
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('DB error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}