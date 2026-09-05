---
title: "TypeORM Migrations in NestJS: A Complete Guide"
date: 2025-03-07
description: "Set up TypeORM migrations in NestJS end to end: config with synchronize false, npm scripts, generating and running migrations, and the SQLite rebuild trap."
tags:
  - dev
  - backend
  - NestJS
  - TypeORM
  - SQLite
---

> [!tldr]
> TypeORM migrations provide a structured approach to database schema evolution in NestJS applications. Set up your configuration with `synchronize: false`, create migration scripts in your package.json, and follow a workflow of entity creation, migration generation, review, and execution. Remember that SQLite handles alterations differently than other databases by rebuilding tables rather than directly modifying them.

## 🌐 Overview

Managing database schema changes can be challenging, especially in applications that evolve over time. Database migrations solve this problem by providing version control for your database schema. This guide walks through TypeORM migrations in a NestJS application. SQLite is the worked example throughout, and a later section covers what changes when the driver is PostgreSQL or MySQL.

Migrations ensure that:

- Database changes are tracked in your codebase
- Schema modifications can be applied consistently across environments
- Changes can be rolled back if issues occur
- Your team can collaborate effectively on database evolution

## 🔧 Configuration Setup

First, let's configure TypeORM to work with SQLite and enable migrations:

```typescript
// src/config/typeorm-config.ts
import { join } from "path";
import { DataSource } from "typeorm";

export const TypeormConfig = {
  type: "sqlite",
  database: join(process.cwd(), "data", "db.sqlite"),
  entities: ["dist/**/*.entity{.js,.ts}"],
  migrations: ["dist/migrations/**/*.js"],
  synchronize: false, // Critical: disable auto-sync to use migrations
};

export default new DataSource(TypeormConfig);
```

> [!important]
> Always set `synchronize: false` in production environments and when using migrations. The `synchronize` option automatically alters the database schema based on entity changes, which can lead to data loss.

## 📝 Setting Up Migration Scripts

Add these helpful scripts to your `package.json`:

```json
"scripts": {
  "migration:generate": "typeorm-ts-node-commonjs migration:generate src/migrations/Migration -d src/config/typeorm-config.ts",
  "migration:create": "typeorm-ts-node-commonjs migration:create src/migrations/Migration",
  "migration:run": "typeorm-ts-node-commonjs migration:run -d src/config/typeorm-config.ts",
  "migration:show": "typeorm-ts-node-commonjs migration:show -d src/config/typeorm-config.ts",
  "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/config/typeorm-config.ts",
  "schema:drop": "typeorm-ts-node-commonjs schema:drop -d src/config/typeorm-config.ts"
}
```

## 🚀 Migration Workflow

### 1️⃣ Creating Entities

Start by defining your entities. Here's a simple example:

```typescript
// src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;
}
```

### 2️⃣ Generating Migrations

After defining or modifying entities, generate a migration:

```bash
pnpm migration:generate
```

This creates a timestamped migration file in your migrations directory:

```typescript
// src/migrations/1741268246116-InitialMigration.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1741268246116 implements MigrationInterface {
  name = "InitialMigration1741268246116";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "name" varchar NOT NULL,
      "email" varchar NOT NULL UNIQUE
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
```

### 3️⃣ Running Migrations

Apply the migrations to update your database schema:

```bash
pnpm migration:run
```

### 4️⃣ Viewing Migration Status

Check which migrations have been applied:

```bash
pnpm migration:show
```

### 5️⃣ Reverting Migrations

If needed, roll back the most recent migration:

```bash
pnpm migration:revert
```

## 🔀 Switching the Driver

Everything above is driver independent. The `synchronize: false` rule, the npm scripts, the generate, review, run and revert loop, and the migration files themselves work the same way against PostgreSQL, MySQL and SQLite. Only two things change.

The first is the connection block:

```typescript
// PostgreSQL
export const TypeormConfig = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ["dist/**/*.entity{.js,.ts}"],
  migrations: ["dist/migrations/**/*.js"],
  synchronize: false,
};
```

The second is the SQL that `migration:generate` writes for you. A generated migration is dialect specific, so a file generated against SQLite is not portable to PostgreSQL. If you develop on one engine and deploy on another, generate against the engine you deploy to, and read the generated SQL before running it.

## 🔍 SQLite Specific Considerations

SQLite handles schema modifications differently than PostgreSQL or MySQL. SQLite cannot directly alter tables by adding or removing columns. Instead, TypeORM handles this by:

1. Creating a new table with the updated schema
2. Copying data from the old table to the new one
3. Dropping the old table
4. Renaming the new table to match the original name

This process works automatically, but be aware of potential performance implications for large tables.

## 📚 Complex Migration Example

Here's an example of a migration handling the creation of a file storage system:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFileStorage1741268246117 implements MigrationInterface {
  name = "CreateFileStorage1741268246117";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "file" (
      "id" varchar PRIMARY KEY NOT NULL,
      "tenantName" varchar NOT NULL,
      "type" varchar CHECK( "type" IN ('clientCertificate','configurationFile') ) NOT NULL,
      "filePath" varchar NOT NULL,
      "originalName" varchar NOT NULL,
      "size" integer NOT NULL,
      "uploadedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`);

    await queryRunner.query(
      `CREATE INDEX "IDX_FILE_TENANT" ON "file" ("tenantName") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_FILE_TENANT"`);
    await queryRunner.query(`DROP TABLE "file"`);
  }
}
```

## 🛠️ Creating Custom Migrations

Sometimes, you need to write migrations manually, especially for data transformations:

```bash
pnpm migration:create
```

This generates an empty migration template that you can customize:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedAdminUser1741268246118 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "user" ("name", "email") 
      VALUES ('Admin', 'admin@example.com')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user" WHERE "email" = 'admin@example.com'
    `);
  }
}
```

## 💁🏼‍♀️ Best Practices

1. **Never use `synchronize: true` in production** - Always use migrations instead
2. **Version control your migrations** - They're part of your codebase
3. **Test migrations before applying to production** - Especially test the `down` method
4. **Create small, incremental migrations** - Easier to test and roll back
5. **Follow naming conventions** - Descriptive names help track changes
6. **Back up your database before running migrations** - Safety first!

## ⚠️ Common Issues and Solutions

### Migration Conflicts

If multiple developers generate migrations simultaneously, merge conflicts might occur. Resolve this by:

1. Staggering migration creation
2. Carefully merging migration files, ensuring timestamp uniqueness

### SQLite Limitations

Remember that SQLite has constraints when altering tables. In complex cases, you might need to manually write migrations that:

1. Create the new table structure
2. Transfer data with transformations
3. Drop the old table

## 📌 Summary

Implementing TypeORM migrations in a NestJS application provides a structured approach to database schema evolution. The workflow is the same on every driver; only the connection block and the generated SQL change. While SQLite has limitations compared to other database systems, TypeORM effectively abstracts most of these differences.

By following this guide, you can establish a robust workflow for managing your database schema changes, ensuring your application remains maintainable and your data safe throughout the development lifecycle.
