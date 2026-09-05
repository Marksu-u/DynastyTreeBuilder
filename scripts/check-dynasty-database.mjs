// Exercises the same Prisma model API used by app actions after table renames.
// All fixtures and changes are rolled back, including on assertion failure.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
dotenv.config({ path: ['.env.local', '.env'], quiet: true });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rollback = new Error('Rollback fixtures');
const ids = [randomUUID(), randomUUID()];
try {
  try {
    await db.$transaction(async tx => {
      const [owner, stranger] = await Promise.all(ids.map(id => tx.user.create({ data: { supabaseId: id, email: `${id}@example.invalid` } })));
      const tree = await tx.dynasty.create({ data: { name: 'Rename verification', slug: ids[0], ownerId: owner.id, isPublic: true } });
      const parent = await tx.character.create({ data: { name: 'Parent', dynastyId: tree.id, flags: ['FOUNDER'] } });
      const child = await tx.character.create({ data: { name: 'Child', dynastyId: tree.id } });
      const relation = await tx.relationship.create({ data: { dynastyId: tree.id, fromId: parent.id, toId: child.id, type: 'PARENT' } });
      const report = await tx.report.create({ data: { source: 'DYNASTY_TREE_BUILDER', shareSlug: tree.slug, reason: 'OTHER', details: 'Synthetic check' } });
      assert.equal(await tx.dynasty.findFirst({ where: { id: tree.id, ownerId: stranger.id } }), null);
      assert.equal((await tx.dynasty.findMany({ where: { ownerId: owner.id } })).length, 1);
      await tx.dynasty.update({ where: { id: tree.id, ownerId: owner.id }, data: { name: 'Saved tree' } });
      await tx.character.update({ where: { id: child.id }, data: { name: 'Edited child', posX: 42, note: 'Preserved note' } });
      await tx.relationship.update({ where: { id: relation.id }, data: { hook: 'Saved relationship' } });
      const shared = await tx.dynasty.findUnique({ where: { slug: tree.slug }, include: { characters: true, relationships: true } });
      assert.equal(shared.name, 'Saved tree');
      assert.equal(shared.characters.length, 2);
      assert.equal(shared.characters.find(c => c.id === child.id).posX, 42);
      assert.equal(shared.relationships[0].hook, 'Saved relationship');
      assert.equal((await tx.report.findUnique({ where: { id: report.id } })).shareSlug, tree.slug);
      await tx.user.delete({ where: { id: owner.id } });
      assert.equal(await tx.dynasty.count({ where: { id: tree.id } }), 0);
      assert.equal(await tx.character.count({ where: { dynastyId: tree.id } }), 0);
      assert.equal(await tx.relationship.count({ where: { dynastyId: tree.id } }), 0);
      await tx.report.delete({ where: { id: report.id } });
      throw rollback;
    }, { timeout: 15000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await db.user.count({ where: { supabaseId: { in: ids } } }), 0);
  console.log('PASS: Prisma tree/character/relationship/report CRUD, ownership filters, share lookup, cascades, and fixture rollback.');
} catch (error) {
  console.error('FAIL:', error instanceof assert.AssertionError ? error.message : error.code ?? error.name);
  process.exitCode = 1;
} finally { await db.$disconnect(); }
