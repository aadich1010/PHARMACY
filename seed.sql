-- Superadmin seed for PharmaCentral (run in Supabase SQL Editor)
INSERT INTO users (id, email, name, role, tenant_id, password_hash)
VALUES ('usr-super', 'superadmin@pharmacy.local', 'Super Admin', 'super_admin', NULL, 'scrypt$d6e444a0d55b220d9b2ed59c73390ca7$068d62177a73b4ad8555edbdb0777af7e5062dc2d945f672e7dab9fbbb3b1b1981107ceb9ced79a86519af394244f54ca619bc6a6ad6badf8d419510511553f7')
ON CONFLICT (email) DO NOTHING;
