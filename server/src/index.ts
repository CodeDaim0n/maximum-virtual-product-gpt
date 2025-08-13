import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// --- Auth middleware (simple bearer check for GPT Actions) ---
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token || token !== process.env.ALLOWED_GPT_BEARER) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

// --- Supabase client (service key kept server-side only) ---
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// --- Routes ---
app.get('/health', (_req, res) => res.json({ ok: true }));

// Projects
app.get('/api/projects', requireAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/projects', requireAuth, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// KPI targets
app.post('/api/kpis/targets', requireAuth, async (req, res) => {
  const { project_id, type, metric, target_value, due_date } = req.body || {};
  if (!project_id || !type || !metric || target_value === undefined) {
    return res.status(400).json({ error: 'project_id, type, metric, target_value required' });
  }

  const { data, error } = await supabase
    .from('kpi_targets')
    .insert({ project_id, type, metric, target_value, due_date })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Experiments
app.post('/api/experiments', requireAuth, async (req, res) => {
  const { project_id, hypothesis, method, result_metric, result_value, notes } = req.body || {};
  if (!project_id || !hypothesis) {
    return res.status(400).json({ error: 'project_id and hypothesis are required' });
  }

  const { data, error } = await supabase
    .from('experiments')
    .insert({ project_id, hypothesis, method, result_metric, result_value, notes })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Start server
const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`Server listening on :${port}`));
