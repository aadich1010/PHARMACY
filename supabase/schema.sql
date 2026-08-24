-- ==========================================================================
-- PharmaCentral — Supabase (Postgres) schema
-- ==========================================================================
-- Run this ONCE in the Supabase dashboard:  SQL Editor  ->  New query  ->
-- paste this whole file  ->  Run.
--
-- Design: each table stores one row per entity as `(id text primary key,
-- data jsonb)`. The `data` column holds the exact same object shape the app's
-- TypeScript types use, so there is no column-by-column mapping to maintain.
-- The server (using the SERVICE ROLE key) reads/writes these tables; on first
-- run, if the `tenants` table is empty, the app auto-seeds all demo data.
--
-- Row Level Security is intentionally left DISABLED: the service role key used
-- by the server bypasses RLS anyway, and that key must live ONLY in server-side
-- environment variables (never shipped to the browser).
-- ==========================================================================

create table if not exists tenants          (id text primary key, data jsonb not null);
create table if not exists users            (id text primary key, data jsonb not null);
create table if not exists medicines        (id text primary key, data jsonb not null);
create table if not exists batches          (id text primary key, data jsonb not null);
create table if not exists suppliers        (id text primary key, data jsonb not null);
create table if not exists customers        (id text primary key, data jsonb not null);
create table if not exists sales            (id text primary key, data jsonb not null);
create table if not exists transfers        (id text primary key, data jsonb not null);
create table if not exists purchase_orders  (id text primary key, data jsonb not null);
