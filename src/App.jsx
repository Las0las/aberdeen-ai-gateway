import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Home, Users, Briefcase, Send, Calendar, Gift, Award, Building2,
  GitBranch, UserCheck, Rocket, Share2, BarChart3, Search, BookOpen,
  Activity, Settings, HelpCircle, Zap, Command, Plus, Bell, X,
  ChevronLeft, ChevronRight, ChevronDown, ArrowUp, ArrowDown,
  DollarSign, TrendingUp, Gauge, Shield, ArrowRight,
  Mail, Phone, MapPin, Clock, FileText, MessageSquare, Paperclip,
  MoreHorizontal, Edit3, Hash, RefreshCw,
  LayoutGrid, List, UserPlus, Globe, CheckCircle, Menu
} from "lucide-react";

// ═══ SUPABASE CONFIG ═══
const SB_URL = "https://lalkdgljfkgiojfbreyq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGtkZ2xqZmtnaW9qZmJyZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTc2NjIsImV4cCI6MjA1ODI3MzY2Mn0.GKJJqxfJRkFJylI1Zll1bj1HzKT2raWRpz6RMaZR37c";
const sbHeaders = { apikey: SB_KEY, "Content-Type": "application/json" };
const sbFetch = (path, opts = {}) => fetch(`${SB_URL}${path}`, { ...opts, headers: { ...sbHeaders, ...opts.headers } });

// ═══ DESIGN TOKENS — VICE BRAND SYSTEM ═══
// Vice Blue (#41B6E6) = Execution · Vice Fuchsia (#DB3EB1) = Signal
// Obsidian canvas · Outfit + JetBrains Mono · Spring curves
// All contrast ratios ≥ 4.5:1 WCAG AA verified
const T = {
  bg: "#050507", bgE: "#0D0D11", bgH: "#121218", bgA: "#17171F",
  t1: "#EDEDF0", t2: "#9394A1", t3: "#82849C",
  acc: "#41B6E6", ok: "#34D399", warn: "#FBBF24", err: "#F87171",
  vio: "#8B5CF6", cyan: "#60A5FA", rose: "#DB3EB1", ora: "#F97316", teal: "#00D4AA",
  bd: "rgba(255,255,255,0.05)", bd2: "rgba(255,255,255,0.08)",
  // Vice extras
  fuchsia: "#DB3EB1", gradient: "linear-gradient(135deg, #41B6E6 0%, #DB3EB1 100%)",
  card: "#0D0D11", sidebar: "#0A0A0E", focus: "#41B6E680",
  t4: "#3D3F50", glass: "rgba(13,13,17,0.85)",
};

const iconMap = {
  home: Home, users: Users, briefcase: Briefcase, send: Send, calendar: Calendar,
  gift: Gift, award: Award, building: Building2, gitBranch: GitBranch,
  userCheck: UserCheck, rocket: Rocket, share: Share2, barChart: BarChart3,
  search: Search, bookOpen: BookOpen, activity: Activity, settings: Settings,
  helpCircle: HelpCircle, zap: Zap, command: Command, layout: BarChart3, userPlus: UserPlus,
};

// ═══ NAV ═══

// ═══════════════════════════════════════════════════════════════
// PORTED BACKEND ENGINES — Pure JS from server/ TypeScript
// Candidate Scoring, Job Scoring, Matching, Hybrid, Economics,
// Thompson Sampling, Drift Detection, Decision Engine
// ═══════════════════════════════════════════════════════════════

// --- CANDIDATE SCORING ENGINE (Maslow-weighted) ---
const CAND_WEIGHTS = { technical: 0.30, stability: 0.20, communication: 0.15, domain: 0.15, leadership: 0.10, extras: 0.10 };
const CAND_THRESHOLDS = { FAST_TRACK: 0.80, REVIEW: 0.60, HOLD: 0.40 };

function scoreCandidate(input) {
  const breakdown = {};
  for (const [k, w] of Object.entries(CAND_WEIGHTS)) breakdown[k] = (input[k] || 0) * w;
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const overallScore = Math.round(total * 100);
  let recommendation;
  if (total >= CAND_THRESHOLDS.FAST_TRACK) recommendation = "FAST_TRACK";
  else if (total >= CAND_THRESHOLDS.REVIEW) recommendation = "REVIEW";
  else if (total >= CAND_THRESHOLDS.HOLD) recommendation = "HOLD";
  else recommendation = "REJECT";
  const riskFlags = [];
  if (input.stability < 0.4) riskFlags.push("short_tenure_risk");
  if (input.communication < 0.4) riskFlags.push("communication_concern");
  if (input.technical < 0.5) riskFlags.push("technical_gap");
  if (input.domain < 0.3) riskFlags.push("domain_mismatch");
  const strengths = [];
  if (input.technical >= 0.8) strengths.push("strong_technical");
  if (input.communication >= 0.8) strengths.push("excellent_communicator");
  if (input.domain >= 0.8) strengths.push("deep_domain_expertise");
  if (input.leadership >= 0.8) strengths.push("leadership_ready");
  if (input.stability >= 0.8) strengths.push("high_stability");
  return { score_json: breakdown, overall_score: overallScore, placement_probability: parseFloat(total.toFixed(4)), recommendation, risk_flags: riskFlags, strengths };
}

function deriveStabilityScore(experiences) {
  if (!experiences || experiences.length === 0) return 0.5;
  const tenures = experiences.map(exp => {
    const start = exp.start_date ? new Date(exp.start_date) : null;
    const end = exp.end_date ? new Date(exp.end_date) : new Date();
    if (!start) return 2;
    return (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  });
  const avg = tenures.reduce((a, b) => a + b, 0) / tenures.length;
  if (avg < 1) return 0.2; if (avg < 2) return 0.5; if (avg < 4) return 0.7; return 0.9;
}

// --- JOB SCORING ENGINE ---
const JOB_WEIGHTS = { clarity: 0.30, budget: 0.25, timeline: 0.20, exclusivity: 0.15, relationship: 0.10 };
const JOB_THRESHOLDS = { PRIORITIZE: 0.75, REVISE: 0.55, DEPRIORITIZE: 0.35 };
const TTF_BASELINE = { PRIORITIZE: 21, REVISE_JOB: 42, DEPRIORITIZE: 60, DECLINE: 90 };

function scoreJob(input) {
  const weighted = {};
  for (const [k, w] of Object.entries(JOB_WEIGHTS)) weighted[k] = (input[k] || 0) * w;
  const total = Object.values(weighted).reduce((a, b) => a + b, 0);
  let recommendation;
  if (total >= JOB_THRESHOLDS.PRIORITIZE) recommendation = "PRIORITIZE";
  else if (total >= JOB_THRESHOLDS.REVISE) recommendation = "REVISE_JOB";
  else if (total >= JOB_THRESHOLDS.DEPRIORITIZE) recommendation = "DEPRIORITIZE";
  else recommendation = "DECLINE";
  const riskFlags = [];
  if (input.clarity < 0.4) riskFlags.push("unclear_requirements");
  if (input.budget < 0.4) riskFlags.push("low_budget");
  if (input.timeline < 0.3) riskFlags.push("unrealistic_timeline");
  if (input.exclusivity < 0.3) riskFlags.push("multi_agency_risk");
  if (input.relationship < 0.3) riskFlags.push("weak_client_relationship");
  return { score_json: weighted, intake_quality: Math.round(total * 100), fill_probability: parseFloat(total.toFixed(4)), time_to_fill_estimate_days: TTF_BASELINE[recommendation], recommendation, risk_flags: riskFlags };
}

// --- MATCHING ENGINE (skill overlap + comp + location) ---
function computeSkillMatch(candidateSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) return 1;
  const norm = new Set((candidateSkills || []).map(s => s.toLowerCase().trim()));
  const matched = jobSkills.filter(s => norm.has(s.toLowerCase().trim()));
  return matched.length / jobSkills.length;
}

function computeCompAlignment(candidateComp, jobMin, jobMax) {
  if (!candidateComp || !jobMin || !jobMax) return 0.7;
  if (candidateComp >= jobMin && candidateComp <= jobMax) return 1.0;
  if (candidateComp > jobMax) return Math.max(0, 1 - ((candidateComp - jobMax) / jobMax) * 2);
  return Math.max(0.3, 1 - (jobMin - candidateComp) / jobMin);
}

function computeLocationFit(candidateLoc, jobLoc, remotePolicy) {
  if (remotePolicy === "remote") return 1.0;
  if (!candidateLoc || !jobLoc) return 0.5;
  const cl = candidateLoc.toLowerCase().trim(), jl = jobLoc.toLowerCase().trim();
  if (cl === jl) return 1.0;
  if (cl.includes(jl) || jl.includes(cl)) return remotePolicy === "hybrid" ? 0.8 : 0.6;
  return remotePolicy === "hybrid" ? 0.4 : 0.2;
}

const MATCH_WEIGHTS = { skill_match: 0.45, score_weight: 0.25, comp_alignment: 0.15, location_fit: 0.15 };

function matchCandidateToJob(input) {
  const reasoning = [];
  const skillMatch = computeSkillMatch(input.candidate.skills || [], input.job.skills || []);
  if (skillMatch >= 0.8) reasoning.push("strong_skill_alignment"); else if (skillMatch >= 0.5) reasoning.push("partial_skill_match"); else reasoning.push("skill_gap_detected");
  const scoreWeight = Math.min((input.candidate.score || 50) / 100, 1);
  if (scoreWeight >= 0.8) reasoning.push("high_quality_candidate");
  const compAlignment = computeCompAlignment(input.candidate.comp_expectation, input.job.comp_min, input.job.comp_max);
  if (compAlignment < 0.5) reasoning.push("comp_misalignment"); else if (compAlignment >= 0.9) reasoning.push("salary_alignment");
  const locationFit = computeLocationFit(input.candidate.location, input.job.location, input.job.remote_policy || "remote");
  if (locationFit >= 0.9) reasoning.push("location_match"); else if (locationFit < 0.5) reasoning.push("location_concern");
  const breakdown = { skill_match: skillMatch, score_weight: scoreWeight, comp_alignment: compAlignment, location_fit: locationFit };
  const total = breakdown.skill_match * MATCH_WEIGHTS.skill_match + breakdown.score_weight * MATCH_WEIGHTS.score_weight + breakdown.comp_alignment * MATCH_WEIGHTS.comp_alignment + breakdown.location_fit * MATCH_WEIGHTS.location_fit;
  return { match_score: Math.round(total * 100), placement_probability: parseFloat(total.toFixed(4)), reasoning, breakdown };
}

// --- HYBRID MATCHING ENGINE (vector + maslow + dynamic weights) ---
const DEFAULT_HYB_WEIGHTS = { vector: 0.40, maslow: 0.30, comp: 0.15, location: 0.15 };

function computeHybridScore(vectorSimilarity, maslowResult, weights) {
  const w = weights || DEFAULT_HYB_WEIGHTS;
  const weighted = vectorSimilarity * w.vector + (maslowResult.match_score / 100) * w.maslow + maslowResult.breakdown.comp_alignment * w.comp + maslowResult.breakdown.location_fit * w.location;
  const score = Math.min(Math.max(weighted, 0), 1);
  let tier;
  if (score >= 0.80) tier = "ELITE"; else if (score >= 0.65) tier = "STRONG"; else if (score >= 0.50) tier = "MODERATE"; else tier = "WEAK";
  return { score, tier };
}

function runLocalHybridMatch(candidates, job, weights) {
  return candidates.map(c => {
    const vectorSim = 0.5 + (c.score || 50) / 200 + computeSkillMatch(c.skills || [], job.skills || []) * 0.3;
    const maslowResult = matchCandidateToJob({ candidate: { skills: c.skills || [], score: c.score || 50, comp_expectation: c.salary_expectation || null, location: c.location || null }, job: { skills: job.skills || [], comp_min: job.pay_rate ? job.pay_rate * 2000 : null, comp_max: job.bill_rate ? job.bill_rate * 2000 : null, location: job.location || null, remote_policy: job.location?.toLowerCase().includes("remote") ? "remote" : "hybrid" } });
    const hybrid = computeHybridScore(Math.min(vectorSim, 1), maslowResult, weights);
    return { candidate_id: c.id, candidate_name: c.name, match_score: Math.round(hybrid.score * 100), placement_probability: parseFloat(hybrid.score.toFixed(4)), tier: hybrid.tier, breakdown: { vector_similarity: parseFloat(Math.min(vectorSim, 1).toFixed(4)), maslow_score: maslowResult.match_score / 100, comp_alignment: maslowResult.breakdown.comp_alignment, location_fit: maslowResult.breakdown.location_fit }, reasoning: [...maslowResult.reasoning, ...(hybrid.tier === "ELITE" ? ["top_tier_candidate"] : []), ...(vectorSim > 0.85 ? ["strong_semantic_match"] : [])] };
  }).sort((a, b) => b.match_score - a.match_score);
}

// --- ECONOMICS ENGINE (EV + Priority) ---
function computeEV(input) {
  let dealValue, margin;
  if (input.fee_type === "percentage") { const salary = input.bill_rate || 0; margin = salary; dealValue = salary * (input.fee_value / 100); }
  else { margin = (input.bill_rate || 0) - (input.pay_rate || 0); dealValue = input.fee_value; }
  const ev = input.placement_probability * dealValue;
  return { expected_value: parseFloat(ev.toFixed(2)), deal_value: parseFloat(dealValue.toFixed(2)), margin: parseFloat(margin.toFixed(2)) };
}

function computePriority(input) {
  const cost = input.estimated_hours_to_fill * input.cost_per_hour;
  const netEV = Math.max(input.expected_value - cost, 0);
  const roi = cost > 0 ? netEV / cost : 0;
  let urgencyMultiplier = 1 + input.urgency_score;
  if (input.deadline) {
    const days = Math.max((new Date(input.deadline).getTime() - Date.now()) / 86400000, 1);
    if (days < 7) urgencyMultiplier += 1.5; else if (days < 14) urgencyMultiplier += 1.0; else if (days < 30) urgencyMultiplier += 0.5;
  }
  const priorityScore = (netEV / Math.max(input.estimated_hours_to_fill, 1)) * urgencyMultiplier;
  return { priority_score: parseFloat(priorityScore.toFixed(2)), roi: parseFloat(roi.toFixed(4)), urgency_multiplier: parseFloat(urgencyMultiplier.toFixed(2)), cost: parseFloat(cost.toFixed(2)) };
}

function rankJobsLocally(jobs, candidates) {
  return jobs.map(job => {
    const matchResults = runLocalHybridMatch(candidates.slice(0, 5), job, null);
    const avgProb = matchResults.length > 0 ? matchResults.reduce((s, m) => s + m.placement_probability, 0) / matchResults.length : 0.3;
    const evResult = computeEV({ placement_probability: avgProb, bill_rate: job.bill_rate || 0, pay_rate: job.pay_rate || 0, fee_type: "flat", fee_value: (job.bill_rate || 0) - (job.pay_rate || 0) > 0 ? ((job.bill_rate || 0) - (job.pay_rate || 0)) * 2080 * avgProb : 5000 });
    const priResult = computePriority({ expected_value: evResult.expected_value, estimated_hours_to_fill: 40, cost_per_hour: 75, urgency_score: job.status === "sourcing" ? 0.7 : job.status === "open" ? 0.5 : 0.3, deadline: null });
    return { job_id: job.id, title: job.title || job.name, company_name: job.client_name || "", expected_value: evResult.expected_value, priority_score: priResult.priority_score, margin: job.bill_rate && job.pay_rate ? ((1 - job.pay_rate / job.bill_rate) * 100).toFixed(1) : 0, roi: priResult.roi, placement_probability: avgProb, urgency_score: job.status === "sourcing" ? 0.7 : 0.5, estimated_hours_to_fill: 40 };
  }).sort((a, b) => b.priority_score - a.priority_score);
}

// --- THOMPSON SAMPLING (Bayesian weight optimization) ---
function normalRandom() { return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()); }
function sampleGamma(shape) {
  if (shape < 1) return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  const d = shape - 1/3, c = 1 / Math.sqrt(9 * d);
  while (true) { let x, v; do { x = normalRandom(); v = 1 + c * x; } while (v <= 0); v = v*v*v; const u = Math.random(); if (u < 1 - 0.0331*(x*x)*(x*x)) return d*v; if (Math.log(u) < 0.5*x*x + d*(1-v+Math.log(v))) return d*v; }
}
function sampleBeta(alpha, beta) { const ga = sampleGamma(alpha), gb = sampleGamma(beta); return ga / (ga + gb); }

function sampleThompsonWeights(arms) {
  const samples = {};
  for (const arm of arms) samples[arm.arm] = sampleBeta(arm.alpha, arm.beta);
  const total = Object.values(samples).reduce((a, b) => a + b, 0);
  if (total === 0) return { vector: 0.25, maslow: 0.25, comp: 0.25, location: 0.25 };
  return { vector: samples.vector / total, maslow: samples.maslow / total, comp: samples.comp / total, location: samples.location / total };
}

function getExpectedWeights(arms) {
  const means = {};
  for (const arm of arms) means[arm.arm] = arm.alpha / (arm.alpha + arm.beta);
  const total = Object.values(means).reduce((a, b) => a + b, 0);
  return { vector: means.vector / total, maslow: means.maslow / total, comp: means.comp / total, location: means.location / total };
}

// Default bandit arms (initial priors)
const DEFAULT_BANDIT_ARMS = [
  { arm: "vector", alpha: 12, beta: 4, total_pulls: 48, total_rewards: 36 },
  { arm: "maslow", alpha: 8, beta: 5, total_pulls: 42, total_rewards: 28 },
  { arm: "comp", alpha: 5, beta: 4, total_pulls: 30, total_rewards: 18 },
  { arm: "location", alpha: 4, beta: 5, total_pulls: 28, total_rewards: 14 },
];

// --- DRIFT DETECTION (ADWIN-lite) ---
const DRIFT_THRESHOLD = 0.15;
function detectDrift(values) {
  if (values.length < 20) return { drift_score: 0, drift_detected: false, left_avg: 0, right_avg: 0 };
  const mid = Math.floor(values.length / 2);
  const left = values.slice(0, mid), right = values.slice(mid);
  const leftAvg = left.reduce((a, b) => a + b, 0) / left.length;
  const rightAvg = right.reduce((a, b) => a + b, 0) / right.length;
  const driftScore = Math.abs(leftAvg - rightAvg);
  return { drift_score: parseFloat(driftScore.toFixed(4)), drift_detected: driftScore > DRIFT_THRESHOLD, left_avg: parseFloat(leftAvg.toFixed(4)), right_avg: parseFloat(rightAvg.toFixed(4)) };
}

// --- DECISION ENGINE (rules → action plan) ---
const DECISION_THRESHOLDS = { AUTO_SUBMIT: 0.85, SUGGEST_SHORTLIST: 0.75, OUTREACH: 0.65, RISK_FLAG: 0.35, JOB_PRIORITIZE: 80, JOB_RISK: 50 };

function decideFromMatch(match, job, candidate) {
  const actions = []; const prob = match.placement_probability;
  if (prob >= DECISION_THRESHOLDS.AUTO_SUBMIT && match.tier === "ELITE") actions.push({ action_type: "SUBMIT_CANDIDATE", entity_type: "job", entity_id: job.id, payload: { candidate_id: candidate.id, candidate_name: candidate.name, match_score: match.match_score, tier: match.tier }, requires_approval: true, decision_reasoning: { rule: "elite_auto_submit", confidence: prob, inputs: { match_score: match.match_score, tier: match.tier } } });
  if (prob >= DECISION_THRESHOLDS.SUGGEST_SHORTLIST && match.tier !== "WEAK") actions.push({ action_type: "SUGGEST_SHORTLIST", entity_type: "job", entity_id: job.id, payload: { candidate_id: candidate.id, candidate_name: candidate.name || candidate.candidate_name, match_score: match.match_score, reasoning: match.reasoning }, requires_approval: false, decision_reasoning: { rule: "strong_match_shortlist", confidence: prob, inputs: { match_score: match.match_score } } });
  if (prob >= DECISION_THRESHOLDS.OUTREACH) actions.push({ action_type: "SEND_OUTREACH", entity_type: "candidate", entity_id: candidate.id, payload: { job_id: job.id, job_title: job.title, company: job.client_name, match_score: match.match_score, message_type: prob >= 0.8 ? "high_priority" : "standard" }, requires_approval: false, decision_reasoning: { rule: "match_outreach", confidence: prob, inputs: { match_score: match.match_score } } });
  if (match.reasoning.includes("comp_misalignment") || match.reasoning.includes("skill_gap_detected")) actions.push({ action_type: "FLAG_RISK", entity_type: "job", entity_id: job.id, payload: { candidate_id: candidate.id, risk_factors: match.reasoning.filter(r => ["comp_misalignment", "skill_gap_detected", "location_concern"].includes(r)) }, requires_approval: false, decision_reasoning: { rule: "risk_detection", confidence: 1.0, inputs: { reasoning: match.reasoning } } });
  return actions;
}

function decideFromJobScore(job, score) {
  const actions = [];
  if (score.intake_quality >= DECISION_THRESHOLDS.JOB_PRIORITIZE) actions.push({ action_type: "PRIORITIZE_JOB", entity_type: "job", entity_id: job.id, payload: { intake_quality: score.intake_quality, fill_probability: score.fill_probability, recommendation: score.recommendation }, requires_approval: false, decision_reasoning: { rule: "high_quality_prioritize", confidence: score.fill_probability, inputs: { intake_quality: score.intake_quality } } });
  if (score.intake_quality < DECISION_THRESHOLDS.JOB_RISK) actions.push({ action_type: "NOTIFY_RECRUITER", entity_type: "job", entity_id: job.id, payload: { message: `Job "${job.title}" scored ${score.intake_quality}/100. Review recommended.`, risk_flags: score.risk_flags, recommendation: score.recommendation }, requires_approval: false, decision_reasoning: { rule: "low_intake_alert", confidence: 1.0, inputs: { intake_quality: score.intake_quality, risk_flags: score.risk_flags } } });
  if (score.recommendation === "PRIORITIZE") actions.push({ action_type: "TRIGGER_SCORING", entity_type: "job", entity_id: job.id, payload: { trigger: "auto_match_candidates", priority: "high" }, requires_approval: false, decision_reasoning: { rule: "auto_match_on_prioritize", confidence: score.fill_probability, inputs: { recommendation: score.recommendation } } });
  return actions;
}

function decideFromEconomics(rankedJobs) {
  const actions = [];
  for (const job of rankedJobs) {
    if (job.priority_score > 200 && job.expected_value > 10000) { actions.push({ action_type: "PRIORITIZE_JOB", entity_type: "job", entity_id: job.job_id, payload: { expected_value: job.expected_value, priority_score: job.priority_score, roi: job.roi, reason: "high_ev_auto_prioritize" }, requires_approval: false, decision_reasoning: { rule: "economics_auto_prioritize", confidence: Math.min(job.priority_score / 500, 1), inputs: { expected_value: job.expected_value, priority_score: job.priority_score } } }); actions.push({ action_type: "TRIGGER_SCORING", entity_type: "job", entity_id: job.job_id, payload: { trigger: "economics_driven_match", priority: "critical", expected_value: job.expected_value }, requires_approval: false, decision_reasoning: { rule: "high_ev_auto_match", confidence: Math.min(job.priority_score / 500, 1), inputs: { expected_value: job.expected_value } } }); }
    if (job.urgency_score >= 0.8 && job.expected_value > 5000) actions.push({ action_type: "NOTIFY_RECRUITER", entity_type: "job", entity_id: job.job_id, payload: { message: `High-value urgent: "${job.title}" — EV: $${job.expected_value.toFixed(0)}`, urgency: "critical" }, requires_approval: false, decision_reasoning: { rule: "urgent_high_ev_alert", confidence: job.urgency_score, inputs: { urgency_score: job.urgency_score, expected_value: job.expected_value } } });
    if (job.roi < 0.1 && job.expected_value < 2000) actions.push({ action_type: "FLAG_RISK", entity_type: "job", entity_id: job.job_id, payload: { risk_factors: ["low_roi", "low_ev"], roi: job.roi, expected_value: job.expected_value, recommendation: "consider_deprioritizing" }, requires_approval: false, decision_reasoning: { rule: "low_roi_flag", confidence: 1.0, inputs: { roi: job.roi, expected_value: job.expected_value } } });
  }
  return actions;
}

// --- SCORE MOCK CANDIDATES WITH REAL ENGINE ---
function scoreCandidateFromRecord(rec) {
  const yoe = rec.years_experience || 3;
  const skillCount = (rec.skills || []).length;
  const input = {
    technical: Math.min(0.5 + skillCount * 0.07 + yoe * 0.02, 1),
    stability: yoe >= 8 ? 0.85 : yoe >= 5 ? 0.7 : yoe >= 3 ? 0.55 : 0.35,
    communication: 0.5 + Math.random() * 0.35,
    domain: Math.min(0.4 + skillCount * 0.08, 1),
    leadership: yoe >= 8 ? 0.75 : yoe >= 5 ? 0.5 : 0.3,
    extras: rec.source === "Referral" ? 0.8 : rec.source === "LinkedIn" ? 0.5 : 0.4,
  };
  return scoreCandidate(input);
}

// ═══════════════════════════════════════════════════════════════
const CORE = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "candidates", label: "Candidates", icon: "users", count: 30879 },
  { id: "jobs", label: "Jobs", icon: "briefcase", count: 147 },
  { id: "offers", label: "Offers", icon: "gift", count: 156 },
  { id: "placements", label: "Placements", icon: "award", count: 94 },
  { id: "clients", label: "Clients", icon: "building", count: 48 },
];
const OPS = [
  { id: "bench", label: "Bench", icon: "userCheck" },
  { id: "referrals", label: "Referrals", icon: "share" },
];
const TOOLS = [
  { id: "ingestion", label: "Ingestion", icon: "userPlus" },
  { id: "analytics", label: "Analytics", icon: "barChart" },
  { id: "search", label: "Search", icon: "search" },
  { id: "knowledge", label: "Knowledge", icon: "bookOpen" },
  { id: "ai-gateway", label: "AI Gateway", icon: "zap", badge: "38" },
  { id: "command-center", label: "Command Center", icon: "command" },
];

const PM = {
  dashboard: ["Dashboard", "Welcome back. Here's your recruiting overview."],
  candidates: ["Candidates", "30,879 candidates in your talent pool"],
  jobs: ["Jobs", "147 jobs across 48 clients"],
  offers: ["Offers", "156 offers extended"],
  placements: ["Placements", "94 active placements"],
  clients: ["Clients", "48 client accounts"],
  bench: ["Bench", "Unallocated consultants"],
  referrals: ["Referrals", "Referral tracking"],
  analytics: ["Analytics", "Revenue analytics"],
  search: ["Search", "Cross-entity search"],
  knowledge: ["Knowledge", "Playbooks & templates"],
  "ai-gateway": ["AI Gateway", "38 domain agents · Live Claude API"],
  "command-center": ["Command Center", "Decision engine & governance"],
  ingestion: ["Ingestion", "Resume parsing · LinkedIn import · Bulk CSV"],
  settings: ["Settings", "Platform configuration"],
};

// ═══ GATEWAY AGENTS ═══
const CATS = [
  { id: "enterprise", label: "Enterprise Platforms", icon: "⚡", color: "#E85D26" },
  { id: "data", label: "Data & Intelligence", icon: "📊", color: "#2E86DE" },
  { id: "ai", label: "AI & ML", icon: "🧠", color: "#8B5CF6" },
  { id: "delivery", label: "Delivery", icon: "🎯", color: "#10B981" },
  { id: "strategy", label: "Strategy", icon: "🏛️", color: "#F59E0B" },
  { id: "certs", label: "Certs", icon: "📜", color: "#EC4899" },
  { id: "design", label: "Design", icon: "🎨", color: "#06B6D4" },
  { id: "engops", label: "Engineering", icon: "🔧", color: "#6366F1" },
  { id: "talent", label: "Talent Ops", icon: "👥", color: "#EF4444" },
];
const AGENTS = [
  { id: "sap", name: "SAP Agent", cat: "enterprise", icon: "⚡", color: "#E85D26", rate: [125, 225], tags: ["S/4HANA", "FICO", "ABAP", "Basis", "BW", "MM/SD"], sys: "You are the SAP Agent for Aberdeen AI. Deep expertise in the entire SAP ecosystem. Be specific, actionable, concise.", kw: ["sap", "s4hana", "fico", "abap", "basis", "bw"] },
  { id: "snow", name: "ServiceNow Agent", cat: "enterprise", icon: "🔷", color: "#81B5A1", rate: [115, 200], tags: ["ITSM", "ITOM", "HRSD", "CSM", "SecOps", "GRC"], sys: "You are the ServiceNow Agent. Deep expertise across ITSM, ITOM, HRSD, CSM, SecOps.", kw: ["servicenow", "snow", "itsm", "itom"] },
  { id: "oracle", name: "Oracle Agent", cat: "enterprise", icon: "🔴", color: "#C74634", rate: [120, 215], tags: ["EBS", "Cloud ERP", "PL/SQL", "OIC", "APEX", "OCI"], sys: "You are the Oracle Agent. Cover EBS, Cloud ERP, Fusion, OCI, PL/SQL, APEX.", kw: ["oracle", "ebs", "plsql", "oci"] },
  { id: "workday", name: "Workday Agent", cat: "enterprise", icon: "🟠", color: "#F5A623", rate: [120, 210], tags: ["HCM", "Financials", "Prism", "EIB", "Studio"], sys: "You are the Workday Agent. Evaluate Workday HCM, Financials, Adaptive Planning.", kw: ["workday", "hcm", "prism"] },
  { id: "msft", name: "Microsoft Agent", cat: "enterprise", icon: "🟦", color: "#0078D4", rate: [110, 200], tags: ["Dynamics 365", "Power Platform", "Azure", "M365"], sys: "You are the Microsoft Agent. Cover Dynamics 365, Power Platform, Azure, M365.", kw: ["microsoft", "dynamics", "power platform", "azure"] },
  { id: "da", name: "Data Analyst Agent", cat: "data", icon: "📈", color: "#2E86DE", rate: [75, 140], tags: ["SQL", "Python", "Tableau", "Power BI", "Statistics"], sys: "You are the Data Analyst Agent. Evaluate SQL, visualization, statistics.", kw: ["data analyst", "sql", "tableau", "power bi"] },
  { id: "de", name: "Data Engineer Agent", cat: "data", icon: "🔩", color: "#1B6CA8", rate: [110, 185], tags: ["Spark", "Airflow", "dbt", "Snowflake", "Kafka"], sys: "You are the Data Engineer Agent. Evaluate pipeline architecture, warehousing.", kw: ["data engineer", "spark", "airflow", "dbt", "snowflake"] },
  { id: "darch", name: "Data Architect Agent", cat: "data", icon: "🏗️", color: "#14537A", rate: [140, 230], tags: ["Data Mesh", "MDM", "Governance", "Lakehouse"], sys: "You are the Data Architect Agent. Evaluate data mesh, governance, strategy.", kw: ["data architect", "data mesh", "mdm"] },
  { id: "ds", name: "Data Scientist Agent", cat: "data", icon: "🔬", color: "#3498DB", rate: [120, 200], tags: ["Python", "TensorFlow", "PyTorch", "MLOps", "NLP"], sys: "You are the Data Scientist Agent. Evaluate ML, experimentation, deployment.", kw: ["data scientist", "machine learning", "tensorflow"] },
  { id: "aiml", name: "AI/ML Agent", cat: "ai", icon: "🧠", color: "#8B5CF6", rate: [145, 260], tags: ["LLMs", "RAG", "Fine-tuning", "MLOps", "Agents"], sys: "You are the AI/ML Agent. Evaluate LLM expertise, ML infrastructure, responsible AI.", kw: ["ai", "ml", "llm", "rag", "fine-tuning", "mlops"] },
  { id: "bpa", name: "Process Automation Agent", cat: "ai", icon: "⚙️", color: "#A78BFA", rate: [100, 175], tags: ["UiPath", "Power Automate", "MuleSoft", "RPA"], sys: "You are the Process Automation Agent. Evaluate RPA, integration, automation.", kw: ["rpa", "uipath", "power automate", "mulesoft"] },
  { id: "bparch", name: "Process Architect", cat: "ai", icon: "🏛️", color: "#7C3AED", rate: [130, 210], tags: ["BPMN", "Appian", "Pega", "Lean Six Sigma"], sys: "You are the Process Architect Agent. Evaluate process modeling.", kw: ["process architect", "bpmn", "appian", "pega"] },
  { id: "pm", name: "Project Manager Agent", cat: "delivery", icon: "📋", color: "#10B981", rate: [95, 170], tags: ["Agile", "Waterfall", "Jira", "Risk", "Budget"], sys: "You are the Project Manager Agent. Screen methodology, risk, delivery.", kw: ["project manager", "agile", "waterfall", "jira"] },
  { id: "pgm", name: "Program Manager Agent", cat: "delivery", icon: "🎖️", color: "#059669", rate: [130, 210], tags: ["Portfolio", "Governance", "Multi-stream"], sys: "You are the Program Manager Agent. Evaluate portfolio, governance.", kw: ["program manager", "portfolio", "governance"] },
  { id: "pdm", name: "Product Manager Agent", cat: "delivery", icon: "🚀", color: "#34D399", rate: [120, 195], tags: ["Product Strategy", "Roadmap", "OKRs", "A/B Testing"], sys: "You are the Product Manager Agent. Assess strategy, roadmap, research.", kw: ["product manager", "roadmap", "okrs"] },
  { id: "po", name: "Product Owner Agent", cat: "delivery", icon: "📌", color: "#6EE7B7", rate: [100, 165], tags: ["User Stories", "Backlog", "Sprint Planning", "Scrum"], sys: "You are the Product Owner Agent. Screen backlog management, Agile.", kw: ["product owner", "backlog", "sprint", "scrum"] },
  { id: "ba", name: "Business Analyst Agent", cat: "delivery", icon: "🔍", color: "#047857", rate: [85, 150], tags: ["Requirements", "Use Cases", "BPMN", "Gap Analysis"], sys: "You are the Business Analyst Agent. Screen requirements, process analysis.", kw: ["business analyst", "requirements", "bpmn"] },
  { id: "rte", name: "Release Train Engineer", cat: "delivery", icon: "🚂", color: "#065F46", rate: [130, 200], tags: ["SAFe", "PI Planning", "ART", "Flow Metrics"], sys: "You are the RTE Agent. Evaluate ART management, PI Planning.", kw: ["rte", "release train", "art"] },
  { id: "strcon", name: "Strategy Consultant Agent", cat: "strategy", icon: "🏛️", color: "#F59E0B", rate: [150, 275], tags: ["Strategy", "Market Analysis", "Business Case", "ROI"], sys: "You are the Strategy Consultant Agent. Screen strategic frameworks.", kw: ["strategy", "consultant", "business case"] },
  { id: "digistr", name: "Digital Strategy Agent", cat: "strategy", icon: "💡", color: "#D97706", rate: [145, 260], tags: ["Digital Transformation", "Tech Roadmap", "Innovation"], sys: "You are the Digital Strategy Agent. Evaluate digital roadmaps.", kw: ["digital strategy", "digital transformation"] },
  { id: "ma", name: "M&A Agent", cat: "strategy", icon: "🤝", color: "#B45309", rate: [160, 300], tags: ["Due Diligence", "Valuation", "Integration", "PMI"], sys: "You are the M&A Agent. Evaluate due diligence, valuation.", kw: ["m&a", "merger", "acquisition", "due diligence"] },
  { id: "pmp", name: "PMP Agent", cat: "certs", icon: "📜", color: "#EC4899", rate: [100, 170], tags: ["PMBOK", "PMI", "EVM"], sys: "You are the PMP Agent. Assess PMBOK knowledge.", kw: ["pmp", "pmbok"] },
  { id: "csm", name: "CSM Agent", cat: "certs", icon: "🔄", color: "#F472B6", rate: [95, 160], tags: ["Scrum", "Ceremonies", "Servant Leadership"], sys: "You are the CSM Agent. Evaluate Scrum mastery.", kw: ["csm", "scrum master"] },
  { id: "safe", name: "SAFe Agent", cat: "certs", icon: "🔷", color: "#DB2777", rate: [120, 190], tags: ["SAFe", "PI Planning", "Value Streams", "WSJF"], sys: "You are the SAFe Agent. Evaluate SAFe configurations.", kw: ["safe", "scaled agile", "pi planning"] },
  { id: "prosci", name: "Prosci Agent", cat: "certs", icon: "🔀", color: "#BE185D", rate: [110, 180], tags: ["ADKAR", "Change Strategy"], sys: "You are the Prosci Agent. Evaluate ADKAR, change planning.", kw: ["prosci", "adkar", "change management"] },
  { id: "chgmgmt", name: "Change Mgmt Agent", cat: "certs", icon: "🔄", color: "#9D174D", rate: [120, 200], tags: ["OCM", "Stakeholder Analysis", "Kotter"], sys: "You are the Change Management Agent. Screen OCM strategy.", kw: ["change management", "ocm", "stakeholder"] },
  { id: "ux", name: "UX Agent", cat: "design", icon: "🎨", color: "#06B6D4", rate: [95, 170], tags: ["User Research", "Wireframes", "Figma", "Usability"], sys: "You are the UX Agent. Evaluate research, IA, design systems.", kw: ["ux", "user experience", "wireframes", "figma"] },
  { id: "ui", name: "UI Agent", cat: "design", icon: "✨", color: "#0891B2", rate: [85, 155], tags: ["Visual Design", "Figma", "Typography", "Motion"], sys: "You are the UI Agent. Screen visual design, responsive, motion.", kw: ["ui", "visual design", "typography"] },
  { id: "qa", name: "QA Agent", cat: "engops", icon: "✅", color: "#6366F1", rate: [70, 130], tags: ["Test Strategy", "Regression", "API Testing"], sys: "You are the QA Agent. Evaluate test strategy, defect management.", kw: ["qa", "quality assurance", "testing"] },
  { id: "autoqa", name: "Automation QA Agent", cat: "engops", icon: "🤖", color: "#818CF8", rate: [90, 160], tags: ["Selenium", "Cypress", "Playwright", "BDD"], sys: "You are the Automation QA Agent. Screen frameworks, CI/CD integration.", kw: ["automation qa", "selenium", "cypress", "playwright"] },
  { id: "devops", name: "DevOps Agent", cat: "engops", icon: "♾️", color: "#4F46E5", rate: [110, 185], tags: ["CI/CD", "Terraform", "Kubernetes", "Docker", "GitOps"], sys: "You are the DevOps Agent. Evaluate CI/CD, IaC, containers.", kw: ["devops", "ci/cd", "terraform", "kubernetes", "docker"] },
  { id: "cloudarch", name: "Cloud Architect Agent", cat: "engops", icon: "☁️", color: "#3730A3", rate: [140, 240], tags: ["AWS", "Azure", "GCP", "Serverless", "FinOps"], sys: "You are the Cloud Architect Agent. Evaluate architecture, migration.", kw: ["cloud architect", "aws", "azure", "gcp"] },
  { id: "cloudeng", name: "Cloud Engineer Agent", cat: "engops", icon: "⛅", color: "#4338CA", rate: [100, 170], tags: ["AWS", "Azure", "GCP", "VPC", "IAM", "Lambda"], sys: "You are the Cloud Engineer Agent. Screen services, security.", kw: ["cloud engineer", "vpc", "iam", "lambda"] },
  { id: "dba", name: "Database Agent", cat: "engops", icon: "🗄️", color: "#312E81", rate: [95, 170], tags: ["PostgreSQL", "SQL Server", "MongoDB", "HA/DR"], sys: "You are the Database Agent. Evaluate RDBMS, NoSQL, performance.", kw: ["database", "dba", "postgresql", "mongodb"] },
  { id: "recruit", name: "Recruitment Agent", cat: "talent", icon: "👥", color: "#EF4444", rate: [65, 120], tags: ["Sourcing", "Boolean", "Pipeline", "ATS"], sys: "You are the Recruitment Agent — the meta-orchestrator. Coordinate all domain agents for sourcing, screening, pipeline.", kw: ["recruiting", "recruitment", "sourcing", "boolean", "pipeline", "ats", "candidate"] },
  { id: "am", name: "Account Manager Agent", cat: "talent", icon: "💼", color: "#DC2626", rate: [80, 150], tags: ["Account Planning", "Client Relations", "Revenue"], sys: "You are the Account Manager Agent. Evaluate account strategy.", kw: ["account manager", "client", "revenue", "contract"] },
];

function mockReply(agent, q) {
  return `**${agent.name} Analysis:**\n\nFor "${q.slice(0, 50)}..."\n\nKey considerations:\n- Domain depth assessment required\n- Rate range: $${agent.rate[0]}-${agent.rate[1]}/hr\n\nI can provide more specific analysis with additional context.`;
}

function renderMd(text) {
  if (!text) return "";
  return text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E6E8EB">$1</strong>').replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:2px 0">• $1</div>').replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>");
}

// ═══ ACCESSIBILITY ═══
function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    const prev = document.activeElement;
    if (first) first.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    el.addEventListener("keydown", trap);
    return () => { el.removeEventListener("keydown", trap); prev?.focus(); };
  }, [ref, active]);
}

// ═══ SHARED COMPONENTS ═══
function Badge({ children, color, variant = "default" }) {
  const bg = variant === "outline" ? "transparent" : color + "18";
  const border = variant === "outline" ? `1px solid ${color}30` : "none";
  return <span style={{ fontSize: 10, fontFamily: "var(--mono)", fontWeight: 600, padding: "3px 10px", borderRadius: 6, color, background: bg, border, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{children}</span>;
}
function MetricCard({ label, value, color }) {
  return <div style={{ padding: 12, background: "rgba(255,255,255,0.015)", border: `1px solid ${T.bd}`, borderRadius: 8, textAlign: "center" }}>
    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: color || T.t1 }}>{value}</div>
    <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: ".06em", marginTop: 2 }}>{label}</div>
  </div>;
}
function IconBtn({ children, onClick, active, title, size = "md" }) {
  const pad = size === "sm" ? 6 : 8;
  return <button onClick={onClick} title={title} aria-label={title} style={{ padding: pad, borderRadius: 8, border: "none", background: active ? `${T.acc}18` : "transparent", color: active ? T.acc : T.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.bgH; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    onFocus={e => { if (!active) e.currentTarget.style.background = T.bgH; }} onBlur={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>{children}</button>;
}
function Pill({ children, color, onClick, active }) {
  return <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 100, border: `1px solid ${active ? color + "40" : T.bd}`, background: active ? color + "12" : "transparent", color: active ? color : T.t3, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Outfit'", fontWeight: 500, transition: "all 0.15s" }}>{children}</button>;
}
function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ width: 56, height: 56, background: T.bgH, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon size={24} color={T.t3} /></div>
    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 13, color: T.t3, marginBottom: 16, maxWidth: 320, margin: "4px auto 16px" }}>{description}</div>
    {action && <button onClick={onAction} style={{ padding: "8px 20px", background: T.gradient, color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit'" }}>{action}</button>}
  </div>;
}
function ScoreBadge({ score }) {
  const color = score >= 80 ? T.ok : score >= 60 ? T.warn : score < 40 ? T.err : T.t3;
  return <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div style={{ width: 32, height: 4, background: T.bd, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 2 }} /></div>
    <span style={{ fontSize: 11, fontFamily: "var(--mono)", fontWeight: 600, color }}>{score}</span>
  </div>;
}
function CAvatar({ name, size = 36, color }) {
  const initials = name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  const hue = name ? name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360 : 200;
  const bg = color || `hsl(${hue}, 60%, 45%)`;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: bg + "20", color: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, flexShrink: 0 }}>{initials}</div>;
}
function formatDate(d) { if (!d) return "—"; const date = new Date(d); const now = new Date(); const diff = now - date; if (diff < 60000) return "just now"; if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`; if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`; return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function formatCurrency(n) { if (!n) return "—"; return "$" + n.toLocaleString(); }

// ═══ STATUS CHANGE DROPDOWN (GOLDEN ROUTE FIX) ═══
function StatusDropdown({ statuses, current, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const st = statuses.find(s => s.value === current) || { label: current, color: T.t3 };
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
    <button onClick={() => setOpen(!open)} aria-label="Change status" aria-expanded={open} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, border: `1px solid ${st.color}30`, background: st.color + "12", color: st.color, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "var(--mono)" }}>
      {st.label}<ChevronDown size={10} />
    </button>
    {open && <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 50, minWidth: 140, overflow: "hidden" }}>
      {statuses.map(s => <button key={s.value} onClick={() => { onChange(s.value); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", border: "none", background: s.value === current ? s.color + "12" : "transparent", color: s.value === current ? s.color : T.t2, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit'", textAlign: "left" }}
        onMouseEnter={e => { if (s.value !== current) e.currentTarget.style.background = T.bgH; }}
        onMouseLeave={e => { if (s.value !== current) e.currentTarget.style.background = "transparent"; }}
        onFocus={e => { if (s.value !== current) e.currentTarget.style.background = T.bgH; }}
        onBlur={e => { if (s.value !== current) e.currentTarget.style.background = "transparent"; }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />{s.label}
      </button>)}
    </div>}
  </div>;
}

// ═══ ENTITY CONFIGS ═══
const CAND_CONFIG = {
  name: "Candidates", singular: "Candidate", table: "candidates", icon: Users, color: T.acc,
  columns: [
    { key: "name", label: "Name", width: "1.8fr", sortable: true },
    { key: "title", label: "Title", width: "1.5fr", sortable: true },
    { key: "status", label: "Status", width: "0.8fr", sortable: true },
    { key: "source", label: "Source", width: "0.8fr" },
    { key: "score", label: "Score", width: "0.6fr", sortable: true },
    { key: "location", label: "Location", width: "1fr" },
    { key: "updated_at", label: "Updated", width: "0.8fr", sortable: true },
  ],
  statuses: [
    { value: "new", label: "New", color: T.acc }, { value: "contacted", label: "Contacted", color: T.cyan },
    { value: "screening", label: "Screening", color: T.vio }, { value: "submitted", label: "Submitted", color: T.warn },
    { value: "interviewing", label: "Interviewing", color: T.ora }, { value: "offered", label: "Offered", color: T.teal },
    { value: "placed", label: "Placed", color: T.ok }, { value: "rejected", label: "Rejected", color: T.err },
    { value: "withdrawn", label: "Withdrawn", color: T.t3 },
  ],
  filters: [
    { id: "skills", label: "Skills", type: "multi", extract: (data) => { const all = new Set(); data.forEach(r => (r.skills || []).forEach(s => all.add(s))); return [...all].sort(); }, match: (rec, vals) => vals.some(v => (rec.skills || []).includes(v)) },
    { id: "seniority", label: "Seniority", type: "multi", options: ["Junior (0-2)", "Mid (3-5)", "Senior (6-9)", "Staff (10+)"], match: (rec, vals) => { const yoe = rec.years_experience || 0; return vals.some(v => v.startsWith("Junior") && yoe <= 2 || v.startsWith("Mid") && yoe >= 3 && yoe <= 5 || v.startsWith("Senior") && yoe >= 6 && yoe <= 9 || v.startsWith("Staff") && yoe >= 10); } },
    { id: "location", label: "Location", type: "multi", extract: (data) => [...new Set(data.map(r => r.location).filter(Boolean))].sort(), match: (rec, vals) => vals.includes(rec.location) },
    { id: "company", label: "Company", type: "multi", extract: (data) => [...new Set(data.map(r => r.current_company).filter(Boolean))].sort(), match: (rec, vals) => vals.includes(rec.current_company) },
    { id: "source", label: "Source", type: "multi", extract: (data) => [...new Set(data.map(r => r.source).filter(Boolean))].sort(), match: (rec, vals) => vals.includes(rec.source) },
    { id: "score", label: "Score", type: "range", min: 0, max: 100, match: (rec, [lo, hi]) => (rec.score || 0) >= lo && (rec.score || 0) <= hi },
  ],
  tabs: ["Overview", "Submissions", "Interviews", "Notes", "Documents", "Activity"],
  actions: [[Mail, "Send Email", T.acc], [Send, "Create Submission", T.warn], [Calendar, "Schedule Interview", T.vio], [TrendingUp, "Add to Pipeline", T.ok]],
};
const JOBS_CONFIG = {
  name: "Jobs", singular: "Job", table: "jobs", icon: Briefcase, color: T.vio, detailIcon: Briefcase,
  columns: [
    { key: "title", label: "Title", width: "1.8fr", sortable: true },
    { key: "client_name", label: "Client", width: "1.2fr", sortable: true },
    { key: "status", label: "Status", width: "0.8fr", sortable: true },
    { key: "department", label: "Department", width: "1fr" },
    { key: "location", label: "Location", width: "1fr" },
    { key: "bill_rate", label: "Bill Rate", width: "0.7fr", sortable: true },
    { key: "updated_at", label: "Updated", width: "0.8fr", sortable: true },
  ],
  statuses: [
    { value: "draft", label: "Draft", color: T.t3 }, { value: "open", label: "Open", color: T.ok },
    { value: "sourcing", label: "Sourcing", color: T.acc }, { value: "submissions", label: "Submissions", color: T.warn },
    { value: "interviewing", label: "Interviewing", color: T.ora }, { value: "offer", label: "Offer", color: T.teal },
    { value: "filled", label: "Filled", color: T.vio }, { value: "on_hold", label: "On Hold", color: T.warn },
    { value: "closed", label: "Closed", color: T.err },
  ],
  tabs: ["Overview", "Intelligence", "Economics", "Pipeline", "Candidates", "Submissions", "Notes", "Activity"],
  skillsLabel: "Requirements",
  scoreFactors: ["Clarity", "Budget", "Timeline", "Exclusivity", "Relationship"],
  overviewSections: (rec) => [
    { title: "Job Details", rows: [[Briefcase, "Title", rec.title], [Building2, "Client", rec.client_name], [MapPin, "Location", rec.location], [Hash, "Department", rec.department], [Calendar, "Start Date", rec.start_date], [Clock, "Duration", rec.duration]] },
    { title: "Compensation", rows: [[DollarSign, "Bill Rate", rec.bill_rate ? `$${rec.bill_rate}/hr` : null], [DollarSign, "Pay Rate", rec.pay_rate ? `$${rec.pay_rate}/hr` : null], [TrendingUp, "Margin", rec.bill_rate && rec.pay_rate ? `${((1 - rec.pay_rate / rec.bill_rate) * 100).toFixed(1)}%` : null], [Users, "Openings", rec.openings], [FileText, "Submissions", rec.submissions_count]] },
  ],
  quickStats: (rec) => {
    const js = rec._jobScore;
    return [["Intake", js ? js.intake_quality : "—", js ? (js.intake_quality >= 75 ? T.ok : js.intake_quality >= 55 ? T.warn : T.err) : T.t3], ["Fill%", js ? `${(js.fill_probability * 100).toFixed(0)}%` : "—", T.acc], ["TTF", js ? `${js.time_to_fill_estimate_days}d` : "—"], ["EV", rec._ev ? `$${(rec._ev.expected_value / 1000).toFixed(0)}K` : "—", T.ok]];
  },
  actions: [[Send, "Submit Candidate", T.warn], [Users, "View Pipeline", T.acc], [Calendar, "Schedule Interview", T.vio], [Zap, "Generate JD", T.teal], [TrendingUp, "Score Job", T.ok]],
  createSteps: ["Basics", "Requirements", "Compensation", "Intake Quality", "Review"],
  createFields: {
    0: [{ label: "Job Title", field: "title", required: true, placeholder: "Sr. Software Engineer" }, { label: "Client", field: "client_name", required: true, placeholder: "Acme Corp" }, { label: "Department", field: "department", placeholder: "Engineering" }, { label: "Location", field: "location", placeholder: "Remote" }],
    1: [{ label: "Description", field: "description", type: "textarea", placeholder: "Job description..." }, { label: "Requirements", field: "skills_text", placeholder: "React, TypeScript (comma separated)" }, { label: "Duration", field: "duration", placeholder: "12 months" }],
    2: [{ label: "Bill Rate ($/hr)", field: "bill_rate", type: "number", placeholder: "150" }, { label: "Pay Rate ($/hr)", field: "pay_rate", type: "number", placeholder: "100" }, { label: "Openings", field: "openings", type: "number", placeholder: "1" }],
    3: [{ label: "Requirement Clarity (0-100)", field: "intake_clarity", type: "number", placeholder: "80 — how well-defined are the requirements?" }, { label: "Budget Alignment (0-100)", field: "intake_budget", type: "number", placeholder: "75 — is comp aligned with market?" }, { label: "Timeline Realism (0-100)", field: "intake_timeline", type: "number", placeholder: "70 — is the fill timeline realistic?" }, { label: "Exclusivity (0-100)", field: "intake_exclusivity", type: "number", placeholder: "80 — exclusive vs multi-agency?" }, { label: "Client Relationship (0-100)", field: "intake_relationship", type: "number", placeholder: "70 — how strong is the relationship?" }],
  },
};
const OFFERS_CONFIG = {
  name: "Offers", singular: "Offer", table: "offers", icon: Gift, color: T.warn, detailIcon: Gift,
  columns: [
    { key: "candidate_name", label: "Candidate", width: "1.5fr", sortable: true },
    { key: "job_title", label: "Job", width: "1.5fr", sortable: true },
    { key: "client_name", label: "Client", width: "1fr", sortable: true },
    { key: "status", label: "Status", width: "0.8fr", sortable: true },
    { key: "salary", label: "Comp", width: "0.8fr", sortable: true },
    { key: "start_date", label: "Start Date", width: "0.8fr" },
    { key: "updated_at", label: "Updated", width: "0.8fr", sortable: true },
  ],
  statuses: [
    { value: "draft", label: "Draft", color: T.t3 }, { value: "pending_approval", label: "Pending", color: T.warn },
    { value: "extended", label: "Extended", color: T.acc }, { value: "accepted", label: "Accepted", color: T.ok },
    { value: "declined", label: "Declined", color: T.err }, { value: "rescinded", label: "Rescinded", color: T.err },
  ],
  tabs: ["Overview", "eSignature", "Notes", "Activity"],
  overviewSections: (rec) => [
    { title: "Offer Details", rows: [[Users, "Candidate", rec.candidate_name], [Briefcase, "Job", rec.job_title], [Building2, "Client", rec.client_name], [Calendar, "Start Date", rec.start_date]] },
    { title: "Compensation", rows: [[DollarSign, "Salary", rec.salary ? formatCurrency(rec.salary) : null], [DollarSign, "Bill Rate", rec.bill_rate ? `$${rec.bill_rate}/hr` : null], [DollarSign, "Pay Rate", rec.pay_rate ? `$${rec.pay_rate}/hr` : null], [TrendingUp, "Margin", rec.bill_rate && rec.pay_rate ? `${((1 - rec.pay_rate / rec.bill_rate) * 100).toFixed(1)}%` : null]] },
  ],
  quickStats: (rec) => [["Salary", rec.salary ? `$${Math.round(rec.salary / 1000)}K` : "—"], ["Margin", rec.bill_rate && rec.pay_rate ? `${((1 - rec.pay_rate / rec.bill_rate) * 100).toFixed(0)}%` : "—", T.ok], ["Days", rec.days_open || "—"], ["Notes", rec.notes_count || 0]],
  actions: [[FileText, "Send for Signature", T.warn], [Send, "Send Offer Letter", T.warn], [Mail, "Email Candidate", T.acc], [CheckCircle, "Mark Accepted", T.ok]],
  createSteps: ["Candidate & Job", "Compensation", "Timeline", "Review"],
  createFields: {
    0: [{ label: "Candidate Name", field: "candidate_name", required: true, placeholder: "Sarah Chen" }, { label: "Job Title", field: "job_title", required: true, placeholder: "Sr. Software Engineer" }, { label: "Client", field: "client_name", required: true, placeholder: "Acme Corp" }],
    1: [{ label: "Base Salary ($)", field: "salary", type: "number", placeholder: "185000" }, { label: "Bill Rate ($/hr)", field: "bill_rate", type: "number", placeholder: "150" }, { label: "Pay Rate ($/hr)", field: "pay_rate", type: "number", placeholder: "100" }],
    2: [{ label: "Start Date", field: "start_date", placeholder: "2025-05-01" }, { label: "Response Due", field: "response_due", placeholder: "2025-04-10" }],
  },
};
const PLACE_CONFIG = {
  name: "Placements", singular: "Placement", table: "placements", icon: Award, color: T.ok, detailIcon: Award,
  columns: [
    { key: "candidate_name", label: "Consultant", width: "1.5fr", sortable: true },
    { key: "job_title", label: "Role", width: "1.3fr", sortable: true },
    { key: "client_name", label: "Client", width: "1fr", sortable: true },
    { key: "status", label: "Status", width: "0.8fr", sortable: true },
    { key: "bill_rate", label: "Bill Rate", width: "0.7fr", sortable: true },
    { key: "start_date", label: "Start", width: "0.8fr" },
    { key: "updated_at", label: "Updated", width: "0.8fr", sortable: true },
  ],
  statuses: [
    { value: "pending_start", label: "Pending Start", color: T.warn }, { value: "active", label: "Active", color: T.ok },
    { value: "extended", label: "Extended", color: T.acc }, { value: "ending_soon", label: "Ending Soon", color: T.ora },
    { value: "completed", label: "Completed", color: T.vio }, { value: "terminated", label: "Terminated", color: T.err },
  ],
  tabs: ["Overview", "Starts", "Timesheets", "Notes", "Activity"],
  overviewSections: (rec) => [
    { title: "Placement Details", rows: [[Users, "Consultant", rec.candidate_name], [Briefcase, "Role", rec.job_title], [Building2, "Client", rec.client_name], [MapPin, "Location", rec.location], [Calendar, "Start", rec.start_date], [Calendar, "End", rec.end_date]] },
    { title: "Financials", rows: [[DollarSign, "Bill Rate", rec.bill_rate ? `$${rec.bill_rate}/hr` : null], [DollarSign, "Pay Rate", rec.pay_rate ? `$${rec.pay_rate}/hr` : null], [TrendingUp, "Margin", rec.bill_rate && rec.pay_rate ? `${((1 - rec.pay_rate / rec.bill_rate) * 100).toFixed(1)}%` : null], [DollarSign, "Est. Revenue", rec.est_revenue ? formatCurrency(rec.est_revenue) : null]] },
  ],
  quickStats: (rec) => [["Bill", rec.bill_rate ? `$${rec.bill_rate}` : "—"], ["Margin", rec.bill_rate && rec.pay_rate ? `${((1 - rec.pay_rate / rec.bill_rate) * 100).toFixed(0)}%` : "—", T.ok], ["Revenue", rec.est_revenue ? `$${Math.round(rec.est_revenue / 1000)}K` : "—", T.ok], ["Weeks", rec.weeks_active || 0]],
  actions: [[FileText, "View Timesheets", T.acc], [DollarSign, "Revenue Report", T.ok], [Calendar, "Extend", T.vio], [Mail, "Contact", T.warn]],
  createSteps: ["Consultant & Role", "Financials", "Timeline", "Review"],
  createFields: {
    0: [{ label: "Consultant Name", field: "candidate_name", required: true, placeholder: "David Kim" }, { label: "Role", field: "job_title", required: true, placeholder: "SAP FICO Consultant" }, { label: "Client", field: "client_name", required: true, placeholder: "Global Mfg" }, { label: "Location", field: "location", placeholder: "Chicago, IL" }],
    1: [{ label: "Bill Rate ($/hr)", field: "bill_rate", type: "number", required: true, placeholder: "175" }, { label: "Pay Rate ($/hr)", field: "pay_rate", type: "number", required: true, placeholder: "115" }],
    2: [{ label: "Start Date", field: "start_date", required: true, placeholder: "2025-04-15" }, { label: "End Date", field: "end_date", placeholder: "2026-04-14" }],
  },
};
const CLIENTS_CONFIG = {
  name: "Clients", singular: "Client", table: "clients", icon: Building2, color: T.rose, detailIcon: Building2,
  columns: [
    { key: "name", label: "Company", width: "1.8fr", sortable: true },
    { key: "status", label: "Status", width: "0.8fr", sortable: true },
    { key: "industry", label: "Industry", width: "1fr" },
    { key: "location", label: "Location", width: "1fr" },
    { key: "active_jobs", label: "Jobs", width: "0.6fr", sortable: true },
    { key: "total_revenue", label: "Revenue", width: "0.8fr", sortable: true },
    { key: "updated_at", label: "Updated", width: "0.8fr", sortable: true },
  ],
  statuses: [
    { value: "prospect", label: "Prospect", color: T.t3 }, { value: "active", label: "Active", color: T.ok },
    { value: "strategic", label: "Strategic", color: T.vio }, { value: "at_risk", label: "At Risk", color: T.warn },
    { value: "churned", label: "Churned", color: T.err },
  ],
  tabs: ["Overview", "Jobs", "Documents", "Contacts", "Notes", "Activity"],
  overviewSections: (rec) => [
    { title: "Company Info", rows: [[Building2, "Company", rec.name], [Globe, "Website", rec.website], [MapPin, "Location", rec.location], [Hash, "Industry", rec.industry]] },
    { title: "Account Health", rows: [[DollarSign, "Revenue", rec.total_revenue ? formatCurrency(rec.total_revenue) : null], [Briefcase, "Active Jobs", rec.active_jobs], [Award, "Placements", rec.total_placements], [TrendingUp, "Avg Margin", rec.avg_margin ? `${rec.avg_margin}%` : null]] },
  ],
  quickStats: (rec) => [["Revenue", rec.total_revenue ? `$${Math.round(rec.total_revenue / 1000)}K` : "—", T.ok], ["Jobs", rec.active_jobs || 0, T.acc], ["Placed", rec.total_placements || 0, T.vio], ["Margin", rec.avg_margin ? `${rec.avg_margin}%` : "—"]],
  actions: [[Briefcase, "Create Job", T.vio], [Users, "Add Contact", T.acc], [Mail, "Email Client", T.warn], [TrendingUp, "Revenue Report", T.ok]],
  createSteps: ["Company", "Contact", "Account", "Review"],
  createFields: {
    0: [{ label: "Company Name", field: "title", required: true, placeholder: "Acme Corp" }, { label: "Industry", field: "industry", placeholder: "Technology" }, { label: "Location", field: "location", placeholder: "San Francisco, CA" }],
    1: [{ label: "Primary Contact", field: "primary_contact", placeholder: "Jane Smith" }, { label: "Contact Email", field: "contact_email", placeholder: "jane@acme.com" }],
    2: [{ label: "Company Size", field: "company_size", placeholder: "1,000-5,000" }],
  },
};
const BENCH_CONFIG = {
  name: "Bench", singular: "Bench Candidate", table: "bench", icon: UserCheck, color: T.ora, detailIcon: UserCheck,
  columns: [
    { key: "name", label: "Consultant", width: "1.5fr", sortable: true },
    { key: "title", label: "Skill", width: "1.3fr", sortable: true },
    { key: "status", label: "Status", width: "0.8fr", sortable: true },
    { key: "last_placement", label: "Last Placement", width: "1fr" },
    { key: "available_date", label: "Available", width: "0.8fr", sortable: true },
    { key: "bill_rate", label: "Target Rate", width: "0.7fr", sortable: true },
    { key: "updated_at", label: "Updated", width: "0.8fr", sortable: true },
  ],
  statuses: [
    { value: "available", label: "Available", color: T.ok }, { value: "partially_available", label: "Partial", color: T.warn },
    { value: "interviewing", label: "Interviewing", color: T.vio }, { value: "on_hold", label: "On Hold", color: T.t3 },
    { value: "redeployed", label: "Redeployed", color: T.acc }, { value: "exited", label: "Exited", color: T.err },
  ],
  tabs: ["Overview", "Availability", "Submissions", "Notes", "Activity"],
  skillsLabel: "Core Skills",
  overviewSections: (rec) => [
    { title: "Consultant Info", rows: [[Users, "Name", rec.name], [Briefcase, "Primary Skill", rec.title], [MapPin, "Location", rec.location], [Building2, "Last Client", rec.last_client]] },
    { title: "Bench Status", rows: [[Calendar, "Available Date", rec.available_date], [Clock, "Days on Bench", rec.days_on_bench], [DollarSign, "Target Rate", rec.bill_rate ? `$${rec.bill_rate}/hr` : null], [TrendingUp, "Utilization", rec.utilization ? `${rec.utilization}%` : null]] },
  ],
  quickStats: (rec) => [["Days", rec.days_on_bench || 0, rec.days_on_bench > 30 ? T.err : T.ok], ["Rate", rec.bill_rate ? `$${rec.bill_rate}` : "—"], ["Util", rec.utilization ? `${rec.utilization}%` : "—"], ["Subs", rec.submissions_count || 0]],
  actions: [[Send, "Submit to Job", T.warn], [Search, "Find Matching Jobs", T.acc], [Mail, "Contact", T.vio], [Calendar, "Set Availability", T.ok]],
  createSteps: ["Consultant", "Skills & Rate", "Availability", "Review"],
  createFields: {
    0: [{ label: "Full Name", field: "title", required: true, placeholder: "David Kim" }, { label: "Primary Skill", field: "department", required: true, placeholder: "SAP FICO" }, { label: "Location", field: "location", placeholder: "Seattle, WA" }],
    1: [{ label: "Target Rate ($/hr)", field: "bill_rate", type: "number", placeholder: "175" }, { label: "Skills", field: "skills_text", placeholder: "SAP S/4HANA, FICO, ABAP" }],
    2: [{ label: "Available Date", field: "available_date", placeholder: "2025-04-01" }],
  },
};
const REFERRALS_CONFIG = {
  name: "Referrals", singular: "Referral", table: "referrals", icon: Share2, color: T.cyan, detailIcon: Share2,
  columns: [
    { key: "candidate_name", label: "Referred Candidate", width: "1.5fr", sortable: true },
    { key: "referred_by", label: "Referred By", width: "1.2fr", sortable: true },
    { key: "status", label: "Status", width: "0.8fr", sortable: true },
    { key: "job_title", label: "For Job", width: "1.2fr" },
    { key: "reward_status", label: "Reward", width: "0.8fr" },
    { key: "score", label: "Score", width: "0.6fr", sortable: true },
    { key: "updated_at", label: "Updated", width: "0.8fr", sortable: true },
  ],
  statuses: [
    { value: "submitted", label: "Submitted", color: T.t3 }, { value: "reviewing", label: "Reviewing", color: T.acc },
    { value: "screening", label: "Screening", color: T.vio }, { value: "interviewing", label: "Interviewing", color: T.ora },
    { value: "hired", label: "Hired", color: T.ok }, { value: "rejected", label: "Rejected", color: T.err },
  ],
  tabs: ["Overview", "Notes", "Activity"],
  overviewSections: (rec) => [
    { title: "Referral Details", rows: [[Users, "Candidate", rec.candidate_name], [Briefcase, "For Job", rec.job_title], [Building2, "Client", rec.client_name], [MapPin, "Location", rec.location]] },
    { title: "Referrer Info", rows: [[Users, "Referred By", rec.referred_by], [Mail, "Referrer Email", rec.referrer_email], [Gift, "Reward", rec.reward_amount ? formatCurrency(rec.reward_amount) : null], [Award, "Reward Status", rec.reward_status]] },
  ],
  quickStats: (rec) => [["Score", rec.score || "—", rec.score >= 80 ? T.ok : T.warn], ["Reward", rec.reward_amount ? `$${rec.reward_amount / 1000}K` : "—"], ["Days", rec.days_in_process || 0], ["Notes", rec.notes_count || 0]],
  actions: [[Send, "Submit to Job", T.warn], [Users, "View Candidate", T.acc], [Gift, "Process Reward", T.cyan], [Mail, "Thank Referrer", T.vio]],
  createSteps: ["Candidate", "Referrer", "Job Match", "Review"],
  createFields: {
    0: [{ label: "Candidate Name", field: "candidate_name", required: true, placeholder: "Jane Doe" }, { label: "Candidate Email", field: "candidate_email", placeholder: "jane@example.com" }, { label: "Location", field: "location", placeholder: "San Francisco, CA" }],
    1: [{ label: "Referred By", field: "referred_by", required: true, placeholder: "Adam Parsons" }, { label: "Referrer Email", field: "referrer_email", placeholder: "adam@aberdeen.com" }],
    2: [{ label: "Target Job", field: "job_title", placeholder: "Sr. Software Engineer" }, { label: "Client", field: "client_name", placeholder: "Acme Corp" }],
  },
};

// ═══ MOCK DATA (scores computed by real engine) ═══
const RAW_CANDS = [
  { id: "c001", name: "Sarah Chen", first_name: "Sarah", last_name: "Chen", email: "sarah.chen@example.com", phone: "+1 415-555-0142", title: "Sr. Full Stack Developer", status: "interviewing", source: "LinkedIn", location: "San Francisco, CA", salary_expectation: 185000, years_experience: 8, skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"], current_company: "Meta", notes_count: 5, submissions_count: 2, created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-23T14:30:00Z" },
  { id: "c002", name: "Marcus Wright", first_name: "Marcus", last_name: "Wright", email: "marcus.w@example.com", phone: "+1 512-555-0198", title: "DevOps Engineer", status: "screening", source: "Referral", location: "Austin, TX", salary_expectation: 165000, years_experience: 6, skills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Docker"], current_company: "Amazon", notes_count: 3, submissions_count: 1, created_at: "2025-03-18T09:00:00Z", updated_at: "2025-03-23T11:00:00Z" },
  { id: "c003", name: "Elena Rodriguez", first_name: "Elena", last_name: "Rodriguez", email: "elena.r@example.com", title: "Product Manager", status: "placed", source: "Indeed", location: "New York, NY", salary_expectation: 175000, years_experience: 7, skills: ["Product Strategy", "Agile", "SQL", "Figma"], current_company: "Stripe", notes_count: 8, submissions_count: 3, created_at: "2025-02-20T08:00:00Z", updated_at: "2025-03-22T16:00:00Z" },
  { id: "c004", name: "James Park", title: "Data Scientist", status: "new", source: "LinkedIn", location: "Palo Alto, CA", salary_expectation: 195000, years_experience: 4, skills: ["Python", "TensorFlow", "SQL"], current_company: "Google", notes_count: 1, submissions_count: 0, created_at: "2025-03-22T15:00:00Z", updated_at: "2025-03-22T15:00:00Z" },
  { id: "c005", name: "Aisha Patel", title: "UX Designer", status: "submitted", source: "Portfolio", location: "San Jose, CA", salary_expectation: 145000, years_experience: 5, skills: ["Figma", "User Research", "Prototyping"], current_company: "Apple", notes_count: 4, submissions_count: 2, created_at: "2025-03-10T12:00:00Z", updated_at: "2025-03-21T09:00:00Z" },
  { id: "c006", name: "David Kim", title: "SAP FICO Consultant", status: "offered", source: "Referral", location: "Seattle, WA", salary_expectation: 210000, years_experience: 12, skills: ["SAP S/4HANA", "FICO", "ABAP", "BW"], current_company: "Deloitte", notes_count: 7, submissions_count: 3, created_at: "2025-01-15T08:00:00Z", updated_at: "2025-03-23T08:00:00Z" },
  { id: "c007", name: "Priya Sharma", title: "ServiceNow Architect", status: "interviewing", source: "LinkedIn", location: "Chicago, IL", salary_expectation: 195000, years_experience: 9, skills: ["ServiceNow", "ITSM", "ITOM", "JavaScript"], current_company: "Accenture", notes_count: 6, submissions_count: 2, created_at: "2025-02-28T10:00:00Z", updated_at: "2025-03-23T12:00:00Z" },
  { id: "c008", name: "Tom Harris", title: "Cloud Architect", status: "contacted", source: "Conference", location: "Denver, CO", salary_expectation: 220000, years_experience: 10, skills: ["AWS", "Azure", "Terraform", "FinOps"], current_company: "Microsoft", notes_count: 2, submissions_count: 0, created_at: "2025-03-20T14:00:00Z", updated_at: "2025-03-23T10:00:00Z" },
  { id: "c009", name: "Lisa Wang", title: "AI/ML Engineer", status: "screening", source: "GitHub", location: "Boston, MA", salary_expectation: 230000, years_experience: 7, skills: ["PyTorch", "LLMs", "RAG", "MLOps", "Python"], current_company: "OpenAI", notes_count: 3, submissions_count: 1, created_at: "2025-03-19T11:00:00Z", updated_at: "2025-03-23T09:00:00Z" },
  { id: "c010", name: "Carlos Mendez", title: "Scrum Master", status: "rejected", source: "Indeed", location: "Miami, FL", salary_expectation: 130000, years_experience: 3, skills: ["Scrum", "Jira", "SAFe"], current_company: "IBM", notes_count: 2, submissions_count: 1, created_at: "2025-03-05T09:00:00Z", updated_at: "2025-03-18T14:00:00Z" },
];
// Apply real scoring engine to each candidate
const MOCK_CANDS = RAW_CANDS.map(c => { const result = scoreCandidateFromRecord(c); return { ...c, score: result.overall_score, _scoring: result }; });
const MOCK_NOTES = [
  { id: "n1", author: "Adam Parsons", content: "Initial screening call went well. Strong React/TS skills.", created_at: "2025-03-23T14:30:00Z" },
  { id: "n2", author: "Adam Parsons", content: "Salary expectations align with client budget. Available in 2 weeks.", created_at: "2025-03-22T10:00:00Z" },
  { id: "n3", author: "System", content: "AI Score updated: 91% → Technical match 95%, Communication 90%", created_at: "2025-03-21T16:00:00Z" },
];
const RAW_JOBS = [
  { id: "j001", name: "Sr. Software Engineer", title: "Sr. Software Engineer", client_name: "Acme Corp", department: "Engineering", location: "Remote", status: "open", bill_rate: 150, pay_rate: 100, openings: 2, skills: ["React", "TypeScript", "Node.js", "AWS"], submissions_count: 5, candidates_count: 12, duration: "12 months", start_date: "2025-04-15", notes_count: 3, source: "Direct", created_at: "2025-03-10T08:00:00Z", updated_at: "2025-03-23T14:00:00Z" },
  { id: "j002", name: "Product Manager", title: "Product Manager", client_name: "TechCo", department: "Product", location: "NYC", status: "interviewing", bill_rate: 140, pay_rate: 95, openings: 1, score: 72, skills: ["Product Strategy", "Agile", "SQL"], submissions_count: 3, candidates_count: 8, duration: "FTE", notes_count: 5, source: "MSP", created_at: "2025-03-05T09:00:00Z", updated_at: "2025-03-23T11:00:00Z" },
  { id: "j003", name: "DevOps Lead", title: "DevOps Lead", client_name: "FinServ Inc", department: "Infrastructure", location: "SF", status: "sourcing", bill_rate: 165, pay_rate: 110, openings: 1, score: 90, skills: ["Kubernetes", "Terraform", "AWS", "CI/CD"], submissions_count: 2, candidates_count: 6, duration: "6 months", notes_count: 2, source: "Direct", created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-22T16:00:00Z" },
  { id: "j004", name: "SAP FICO Consultant", title: "SAP FICO Consultant", client_name: "Global Mfg", department: "Finance", location: "Chicago, IL", status: "submissions", bill_rate: 175, pay_rate: 115, openings: 3, score: 88, skills: ["SAP S/4HANA", "FICO", "ABAP"], submissions_count: 7, candidates_count: 15, duration: "18 months", notes_count: 6, source: "Referral", created_at: "2025-02-20T08:00:00Z", updated_at: "2025-03-23T09:00:00Z" },
  { id: "j005", name: "ServiceNow Architect", title: "ServiceNow Architect", client_name: "HealthCare Plus", department: "IT", location: "Remote", status: "offer", bill_rate: 185, pay_rate: 125, openings: 1, score: 92, skills: ["ServiceNow", "ITSM", "ITOM"], submissions_count: 3, candidates_count: 5, duration: "12 months", notes_count: 4, source: "Direct", created_at: "2025-03-01T09:00:00Z", updated_at: "2025-03-23T08:00:00Z" },
];
// Apply real job scoring engine to MOCK_JOBS
const MOCK_JOBS = RAW_JOBS.map(j => {
  // Derive intake signals from job data
  const intake = {
    clarity: j.skills?.length >= 3 ? 0.85 : j.skills?.length >= 2 ? 0.65 : 0.4,
    budget: j.bill_rate >= 160 ? 0.85 : j.bill_rate >= 130 ? 0.7 : 0.5,
    timeline: j.duration?.includes("18") ? 0.9 : j.duration?.includes("12") ? 0.75 : 0.6,
    exclusivity: j.source === "Direct" ? 0.8 : j.source === "Referral" ? 0.7 : 0.5,
    relationship: (j.submissions_count || 0) >= 5 ? 0.85 : (j.submissions_count || 0) >= 2 ? 0.65 : 0.45,
  };
  const jScore = scoreJob(intake);
  const margin = j.bill_rate && j.pay_rate ? (1 - j.pay_rate / j.bill_rate) : 0;
  const evResult = computeEV({ placement_probability: jScore.fill_probability, bill_rate: j.bill_rate || 0, pay_rate: j.pay_rate || 0, fee_type: "flat", fee_value: margin * (j.bill_rate || 0) * 2080 });
  const priResult = computePriority({ expected_value: evResult.expected_value, estimated_hours_to_fill: 40, cost_per_hour: 75, urgency_score: j.status === "sourcing" ? 0.7 : j.status === "open" ? 0.5 : 0.3, deadline: null });
  const actions = decideFromJobScore(j, jScore);
  return { ...j, score: jScore.intake_quality, _intake: intake, _jobScore: jScore, _ev: evResult, _priority: priResult, _actions: actions };
});
const MOCK_OFFERS = [
  { id: "o001", name: "Sarah Chen — Sr. Software Engineer", candidate_name: "Sarah Chen", job_title: "Sr. Software Engineer", client_name: "Acme Corp", status: "extended", salary: 185000, bill_rate: 150, pay_rate: 100, start_date: "2025-05-01", days_open: 4, notes_count: 3, title: "Sr. Software Engineer", location: "SF", created_at: "2025-03-20T10:00:00Z", updated_at: "2025-03-23T14:00:00Z" },
  { id: "o002", name: "David Kim — SAP FICO", candidate_name: "David Kim", job_title: "SAP FICO Consultant", client_name: "Global Mfg", status: "accepted", salary: 210000, bill_rate: 175, pay_rate: 115, start_date: "2025-04-15", days_open: 0, notes_count: 5, title: "SAP FICO", location: "Chicago", created_at: "2025-03-10T08:00:00Z", updated_at: "2025-03-22T16:00:00Z" },
  { id: "o003", name: "Priya Sharma — ServiceNow", candidate_name: "Priya Sharma", job_title: "ServiceNow Architect", client_name: "HealthCare Plus", status: "pending_approval", salary: 195000, bill_rate: 185, pay_rate: 125, start_date: "2025-05-15", days_open: 2, notes_count: 2, title: "ServiceNow", location: "Remote", created_at: "2025-03-22T09:00:00Z", updated_at: "2025-03-23T11:00:00Z" },
];
const MOCK_PLACES = [
  { id: "p001", name: "David Kim — SAP FICO", candidate_name: "David Kim", job_title: "SAP FICO Consultant", client_name: "Global Mfg", status: "active", bill_rate: 175, pay_rate: 115, est_revenue: 312000, hours_per_week: 40, start_date: "2025-01-15", end_date: "2026-01-14", weeks_active: 10, location: "Chicago, IL", notes_count: 4, title: "SAP FICO", created_at: "2025-01-10T08:00:00Z", updated_at: "2025-03-23T09:00:00Z" },
  { id: "p002", name: "Elena Rodriguez — PM", candidate_name: "Elena Rodriguez", job_title: "Product Manager", client_name: "TechCo", status: "active", bill_rate: 140, pay_rate: 95, est_revenue: 187200, start_date: "2025-02-01", end_date: "2026-01-31", weeks_active: 7, location: "NYC", notes_count: 3, title: "PM", created_at: "2025-01-28T09:00:00Z", updated_at: "2025-03-22T16:00:00Z" },
  { id: "p003", name: "Tom Harris — Cloud Arch", candidate_name: "Tom Harris", job_title: "Cloud Architect", client_name: "FinServ Inc", status: "pending_start", bill_rate: 190, pay_rate: 130, est_revenue: 249600, start_date: "2025-04-01", end_date: "2025-09-30", weeks_active: 0, location: "Denver, CO", notes_count: 1, title: "Cloud Arch", created_at: "2025-03-20T10:00:00Z", updated_at: "2025-03-23T14:00:00Z" },
];
const MOCK_CLIENTS = [
  { id: "cl001", name: "Acme Corp", title: "Acme Corp", status: "strategic", industry: "Technology", location: "San Francisco, CA", website: "acme.com", company_size: "5,000+", active_jobs: 4, total_placements: 12, total_revenue: 538000, avg_margin: 32, primary_contact: "Jane Smith", contact_email: "jane@acme.com", notes_count: 8, created_at: "2023-01-15T08:00:00Z", updated_at: "2025-03-23T14:00:00Z" },
  { id: "cl002", name: "TechCo", title: "TechCo", status: "active", industry: "Software", location: "NYC", active_jobs: 2, total_placements: 5, total_revenue: 215000, avg_margin: 28, primary_contact: "Mike Johnson", contact_email: "mike@techco.io", notes_count: 4, created_at: "2024-03-10T09:00:00Z", updated_at: "2025-03-22T11:00:00Z" },
  { id: "cl003", name: "FinServ Inc", title: "FinServ Inc", status: "active", industry: "Financial Services", location: "Chicago, IL", active_jobs: 3, total_placements: 4, total_revenue: 320000, avg_margin: 34, primary_contact: "Sarah Lee", contact_email: "slee@finserv.com", notes_count: 6, created_at: "2024-06-01T08:00:00Z", updated_at: "2025-03-23T09:00:00Z" },
  { id: "cl004", name: "Global Mfg", title: "Global Mfg", status: "strategic", industry: "Manufacturing", location: "Detroit, MI", active_jobs: 5, total_placements: 8, total_revenue: 480000, avg_margin: 35, primary_contact: "Robert Chen", contact_email: "rchen@globalmfg.com", notes_count: 10, created_at: "2023-06-15T10:00:00Z", updated_at: "2025-03-23T12:00:00Z" },
  { id: "cl005", name: "HealthCare Plus", title: "HealthCare Plus", status: "active", industry: "Healthcare IT", location: "Boston, MA", active_jobs: 2, total_placements: 2, total_revenue: 145000, avg_margin: 30, primary_contact: "Dr. Patel", contact_email: "patel@hcplus.com", notes_count: 3, created_at: "2024-09-01T08:00:00Z", updated_at: "2025-03-21T16:00:00Z" },
];
const MOCK_BENCH = [
  { id: "b001", name: "David Kim", title: "SAP FICO Consultant", status: "available", location: "Seattle, WA", last_client: "Global Mfg", last_placement: "SAP S/4HANA Migration", available_date: "2025-04-01", days_on_bench: 5, bill_rate: 175, utilization: 92, skills: ["SAP S/4HANA", "FICO", "ABAP"], submissions_count: 2, notes_count: 3, created_at: "2025-03-18T08:00:00Z", updated_at: "2025-03-23T14:00:00Z" },
  { id: "b002", name: "Marcus Wright", title: "DevOps Engineer", status: "interviewing", location: "Austin, TX", last_client: "Acme Corp", last_placement: "CI/CD Pipeline Rebuild", available_date: "2025-04-01", days_on_bench: 12, bill_rate: 155, utilization: 85, skills: ["Kubernetes", "Terraform", "AWS"], submissions_count: 3, notes_count: 4, created_at: "2025-03-11T09:00:00Z", updated_at: "2025-03-23T11:00:00Z" },
  { id: "b003", name: "Aisha Patel", title: "UX Designer", status: "available", location: "San Jose, CA", last_client: "RetailMax", last_placement: "E-commerce Redesign", available_date: "2025-03-20", days_on_bench: 22, bill_rate: 120, utilization: 78, skills: ["Figma", "User Research"], submissions_count: 1, notes_count: 2, created_at: "2025-03-01T12:00:00Z", updated_at: "2025-03-22T09:00:00Z" },
];
const MOCK_REFERRALS = [
  { id: "r001", name: "Jane Doe — Sr. Engineer", candidate_name: "Jane Doe", referred_by: "Adam Parsons", referrer_email: "adam@aberdeen.com", status: "screening", job_title: "Sr. Software Engineer", client_name: "Acme Corp", location: "SF", reward_amount: 2500, reward_status: "Pending", score: 82, days_in_process: 5, skills: ["React", "TypeScript"], title: "Sr. Engineer", notes_count: 2, created_at: "2025-03-18T10:00:00Z", updated_at: "2025-03-23T14:00:00Z" },
  { id: "r002", name: "Mike Chen — DevOps", candidate_name: "Mike Chen", referred_by: "Sarah Chen", referrer_email: "sarah@meta.com", status: "hired", job_title: "DevOps Lead", client_name: "FinServ Inc", location: "Austin", reward_amount: 5000, reward_status: "Paid", score: 91, days_in_process: 22, skills: ["Kubernetes", "Terraform"], title: "DevOps", notes_count: 6, created_at: "2025-03-01T09:00:00Z", updated_at: "2025-03-22T16:00:00Z" },
];

// ═══ VIRTUAL SCROLL ═══
function useVirtualScroll(totalItems, rowHeight, containerRef, overscan = 5) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const measure = () => setContainerHeight(el.clientHeight);
    measure();
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => { el.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [containerRef]);
  const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
  const endIdx = Math.min(totalItems, startIdx + visibleCount);
  return { startIdx, endIdx, totalHeight: totalItems * rowHeight, offsetY: startIdx * rowHeight };
}

// ═══ ENTITY LIST PAGE (pagination + virtual scroll) ═══
const PAGE_SIZES = [25, 50, 100];
function EntityListPage({ config, data, onSelect, onCreate }) {
  const [sq, setSq] = useState(""); const [sf, setSf] = useState(null);
  const [sk, setSk] = useState("updated_at"); const [sd, setSd] = useState("desc");
  const [vm, setVm] = useState("table"); const [sel, setSel] = useState(new Set());
  const [pg, setPg] = useState(0); const [ps, setPs] = useState(25);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const tableRef = useRef(null);

  // Build filter options from data
  const filterOptions = useMemo(() => {
    if (!config.filters) return {};
    const opts = {};
    config.filters.forEach(f => {
      if (f.options) opts[f.id] = f.options;
      else if (f.extract) opts[f.id] = f.extract(data);
    });
    return opts;
  }, [data, config.filters]);

  const toggleFilter = (filterId, value) => {
    setActiveFilters(prev => {
      const cur = prev[filterId] || [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      if (next.length === 0) { const { [filterId]: _, ...rest } = prev; return rest; }
      return { ...prev, [filterId]: next };
    });
  };
  const setRangeFilter = (filterId, lo, hi) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: [lo, hi] }));
  };
  const clearAllFilters = () => setActiveFilters({});
  const activeFilterCount = Object.keys(activeFilters).length;

  const filtered = useMemo(() => {
    let l = [...data];
    if (sq) { const q = sq.toLowerCase(); l = l.filter(r => r.name?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q) || r.candidate_name?.toLowerCase().includes(q) || r.client_name?.toLowerCase().includes(q) || (r.skills || []).some(s => s.toLowerCase().includes(q))); }
    if (sf) l = l.filter(r => r.status === sf);
    // Apply advanced filters
    if (config.filters) {
      for (const [filterId, vals] of Object.entries(activeFilters)) {
        const filterDef = config.filters.find(f => f.id === filterId);
        if (filterDef && vals && (Array.isArray(vals) ? vals.length > 0 : true)) {
          l = l.filter(r => filterDef.match(r, vals));
        }
      }
    }
    l.sort((a, b) => { let va = a[sk], vb = b[sk]; if (typeof va === "string") va = va.toLowerCase(); if (typeof vb === "string") vb = vb.toLowerCase(); if (va < vb) return sd === "asc" ? -1 : 1; if (va > vb) return sd === "asc" ? 1 : -1; return 0; }); return l;
  }, [data, sq, sf, sk, sd, activeFilters, config.filters]);
  useEffect(() => { setPg(0); }, [sq, sf, sk, sd, ps, activeFilters]);
  const totalPages = Math.ceil(filtered.length / ps); const pageStart = pg * ps; const pageEnd = Math.min(pageStart + ps, filtered.length); const pageData = filtered.slice(pageStart, pageEnd);
  const useVirtual = vm === "table" && pageData.length > 50; const ROW_H = 52;
  const { startIdx, endIdx, totalHeight, offsetY } = useVirtualScroll(useVirtual ? pageData.length : 0, ROW_H, tableRef);
  const visibleRows = useVirtual ? pageData.slice(startIdx, endIdx) : pageData;
  const toggleSort = (key) => { if (sk === key) setSd(d => d === "asc" ? "desc" : "asc"); else { setSk(key); setSd("desc"); } };
  const toggleSel = (id) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const stObj = (v) => config.statuses.find(s => s.value === v) || { label: v, color: T.t3 };
  const TableRow = ({ row }) => { const st = stObj(row.status); return <div role="row" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(row); } }} style={{ display: "grid", gridTemplateColumns: `40px ${config.columns.map(c => c.width).join(" ")} 60px`, alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", transition: "background 0.1s", height: ROW_H }} onClick={() => onSelect(row)} onMouseEnter={e => e.currentTarget.style.background = T.bgH} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onFocus={e => e.currentTarget.style.background = T.bgH} onBlur={e => e.currentTarget.style.background = "transparent"}>
    <div role="presentation" onClick={e => { e.stopPropagation(); toggleSel(row.id); }}><input type="checkbox" checked={sel.has(row.id)} readOnly aria-label={`Select ${row.name || row.title}`} style={{ accentColor: T.acc, width: 14, height: 14 }} /></div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>{config.detailIcon ? <div style={{ width: 32, height: 32, borderRadius: 8, background: config.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>{(() => { const IC = config.detailIcon; return <IC size={14} color={config.color} />; })()}</div> : <CAvatar name={row.name || row.candidate_name} size={32} />}<div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name || row.candidate_name}</div><div style={{ fontSize: 11, color: T.t3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.email || row.job_title || row.title}</div></div></div>
    {config.columns.slice(1, -1).map(col => <div key={col.key} style={{ fontSize: 12, color: col.key === "status" ? undefined : T.t3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.key === "status" ? <Badge color={st.color}>{st.label}</Badge> : col.key === "score" && row.score ? <ScoreBadge score={row.score} /> : col.key === "bill_rate" && row.bill_rate ? `$${row.bill_rate}/hr` : col.key === "total_revenue" && row.total_revenue ? formatCurrency(row.total_revenue) : col.key === "salary" && row.salary ? formatCurrency(row.salary) : row[col.key] || "—"}</div>)}
    <div style={{ fontSize: 11, color: T.t3, fontFamily: "var(--mono)" }}>{formatDate(row.updated_at)}</div>
    <div role="presentation" onClick={e => e.stopPropagation()}><IconBtn size="sm" title="More"><MoreHorizontal size={14} /></IconBtn></div>
  </div>; };
  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>{config.name}<span style={{ fontSize: 14, fontFamily: "var(--mono)", color: T.t3, fontWeight: 400 }}>{data.length.toLocaleString()}</span></h1>
      <button onClick={onCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: config.color, color: "white", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13, fontWeight: 500 }}><Plus size={14} />Add {config.singular}</button>
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10 }}>
        <Search size={14} style={{ color: T.t3 }} /><input value={sq} onChange={e => setSq(e.target.value)} placeholder={`Search ${config.name.toLowerCase()}...`} aria-label={`Search ${config.name.toLowerCase()}`} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.t1, fontFamily: "'Outfit'", fontSize: 14 }} />{sq && <button onClick={() => setSq("")} aria-label="Clear search" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer" }}><X size={14} /></button>}
      </div>
      <IconBtn onClick={() => setVm("table")} active={vm === "table"} title="Table"><List size={16} /></IconBtn>
      <IconBtn onClick={() => setVm("grid")} active={vm === "grid"} title="Grid"><LayoutGrid size={16} /></IconBtn>
      {config.filters && <button onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${activeFilterCount > 0 ? T.acc + "40" : T.bd}`, background: activeFilterCount > 0 ? T.acc + "0c" : "transparent", color: activeFilterCount > 0 ? T.acc : T.t3, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit'", fontWeight: 500, transition: "all 0.12s" }}><ChevronDown size={12} style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />Filters{activeFilterCount > 0 && <span style={{ padding: "1px 6px", borderRadius: 10, background: T.acc, color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)" }}>{activeFilterCount}</span>}</button>}
    </div>
    {/* Advanced Filter Panel */}
    {config.filters && filtersOpen && <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16, marginBottom: 12, animation: "fadeIn 0.15s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Advanced Filters</div>
        {activeFilterCount > 0 && <button onClick={clearAllFilters} style={{ fontSize: 11, color: T.err, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit'" }}>Clear all ({activeFilterCount})</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {config.filters.map(f => {
          const opts = f.options || filterOptions[f.id] || [];
          const selected = activeFilters[f.id] || [];
          if (f.type === "range") {
            const lo = Array.isArray(selected) && selected.length === 2 ? selected[0] : f.min;
            const hi = Array.isArray(selected) && selected.length === 2 ? selected[1] : f.max;
            return <div key={f.id} style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><span>{f.label}</span><span style={{ fontFamily: "var(--mono)", color: T.acc }}>{lo}–{hi}</span></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="range" min={f.min} max={f.max} value={lo} aria-label={`${f.label} minimum`} onChange={e => setRangeFilter(f.id, parseInt(e.target.value), hi)} style={{ flex: 1, accentColor: T.acc }} />
                <input type="range" min={f.min} max={f.max} value={hi} aria-label={`${f.label} maximum`} onChange={e => setRangeFilter(f.id, lo, parseInt(e.target.value))} style={{ flex: 1, accentColor: T.acc }} />
              </div>
            </div>;
          }
          return <div key={f.id} style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8 }}>{f.label}{selected.length > 0 && <span style={{ marginLeft: 6, fontFamily: "var(--mono)", color: T.acc }}>{selected.length}</span>}</div>
            <div style={{ maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }} tabIndex={0}>
              {opts.map(opt => { const isActive = selected.includes(opt); return <button key={opt} onClick={() => toggleFilter(f.id, opt)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: 4, border: "none", background: isActive ? T.acc + "15" : "transparent", color: isActive ? T.acc : T.t2, cursor: "pointer", fontSize: 11, fontFamily: "'Outfit'", textAlign: "left", transition: "all 0.1s", width: "100%" }} onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.bgH; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }} onFocus={e => { if (!isActive) e.currentTarget.style.background = T.bgH; }} onBlur={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}><div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${isActive ? T.acc : T.bd2}`, background: isActive ? T.acc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{isActive && <CheckCircle size={10} color="#fff" />}</div><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt}</span></button>; })}
            </div>
          </div>;
        })}
      </div>
      {/* Active filter chips */}
      {activeFilterCount > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.bd}` }}>
        {Object.entries(activeFilters).map(([filterId, vals]) => {
          const filterDef = config.filters.find(f => f.id === filterId);
          if (filterDef?.type === "range") return <span key={filterId} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: T.acc + "12", border: `1px solid ${T.acc}25`, fontSize: 10, color: T.acc, fontFamily: "var(--mono)" }}>{filterDef.label}: {vals[0]}–{vals[1]}<button onClick={() => setActiveFilters(p => { const { [filterId]: _, ...rest } = p; return rest; })} aria-label={`Remove ${filterDef.label} filter`} style={{ background: "none", border: "none", color: T.acc, cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2 }}>×</button></span>;
          return (Array.isArray(vals) ? vals : []).map(v => <span key={`${filterId}-${v}`} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: T.acc + "12", border: `1px solid ${T.acc}25`, fontSize: 10, color: T.acc, fontFamily: "var(--mono)" }}>{v}<button onClick={() => toggleFilter(filterId, v)} aria-label={`Remove ${v} filter`} style={{ background: "none", border: "none", color: T.acc, cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2 }}>×</button></span>);
        })}
      </div>}
    </div>}
    <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
      <Pill active={!sf} color={T.t1} onClick={() => setSf(null)}>All ({data.length})</Pill>
      {config.statuses.map(s => { const c = data.filter(r => r.status === s.value).length; if (!c) return null; return <Pill key={s.value} active={sf === s.value} color={s.color} onClick={() => setSf(sf === s.value ? null : s.value)}>{s.label} ({c})</Pill>; })}
    </div>
    {sel.size > 0 && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", background: T.acc + "0c", border: `1px solid ${T.acc}20`, borderRadius: 10, marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>{sel.size} selected</span><div style={{ flex: 1 }} /><button style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.acc}30`, background: "transparent", color: T.acc, cursor: "pointer" }}>Export</button><button onClick={() => setSel(new Set())} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.bd}`, background: "transparent", color: T.t3, cursor: "pointer" }}>Clear</button></div>}
    {vm === "table" && <div className="table-scroll" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: `40px ${config.columns.map(c => c.width).join(" ")} 60px`, alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${T.bd}`, background: T.bg, position: "sticky", top: 0, zIndex: 2 }}>
        <div><input type="checkbox" aria-label="Select all" checked={sel.size === filtered.length && filtered.length > 0} onChange={() => setSel(p => p.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))} style={{ accentColor: T.acc, width: 14, height: 14 }} /></div>
        {config.columns.map(col => <button key={col.key} onClick={() => col.sortable && toggleSort(col.key)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: T.t3, fontSize: 11, fontWeight: 600, cursor: col.sortable ? "pointer" : "default", fontFamily: "'Outfit'", letterSpacing: "0.04em", textTransform: "uppercase", padding: 0 }}>{col.label}{col.sortable && sk === col.key && (sd === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}</button>)}
        <div />
      </div>
      <div ref={tableRef} aria-live="polite" style={{ maxHeight: useVirtual ? 600 : "none", overflowY: useVirtual ? "auto" : "visible" }}>
        {useVirtual ? <div style={{ height: totalHeight, position: "relative" }}><div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>{visibleRows.map(row => <TableRow key={row.id} row={row} />)}</div></div> : pageData.map(row => <TableRow key={row.id} row={row} />)}
      </div>
      {filtered.length === 0 && <EmptyState icon={Search} title="No results" description={`No ${config.name.toLowerCase()} match your filters.`} />}
    </div>}
    {vm === "grid" && <div className="g3" style={{ gap: 12 }}>{pageData.map((row, i) => { const st = stObj(row.status); return <div key={row.id} onClick={() => onSelect(row)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(row); } }} style={{ padding: 16, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.bd2; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.bd; }} onFocus={e => { e.currentTarget.style.borderColor = T.bd2; }} onBlur={e => { e.currentTarget.style.borderColor = T.bd; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><CAvatar name={row.name || row.candidate_name} size={40} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{row.name || row.candidate_name}</div><div style={{ fontSize: 12, color: T.t3 }}>{row.title || row.job_title}</div></div>{row.score && <ScoreBadge score={row.score} />}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}><Badge color={st.color}>{st.label}</Badge>{row.source && <Badge color={T.t3} variant="outline">{row.source}</Badge>}</div>
      {row.skills?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{row.skills.slice(0, 3).map((s, j) => <span key={j} style={{ fontSize: 10, padding: "2px 7px", background: "rgba(255,255,255,0.03)", borderRadius: 5, color: T.t3 }}>{s}</span>)}</div>}
    </div>; })}</div>}
    {filtered.length > ps && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, color: T.t3 }}>{pageStart + 1}–{pageEnd} of {filtered.length}</span><select value={ps} onChange={e => setPs(Number(e.target.value))} aria-label="Rows per page" style={{ padding: "4px 8px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t2, fontSize: 11, fontFamily: "var(--mono)", cursor: "pointer" }}>{PAGE_SIZES.map(s => <option key={s} value={s} style={{ background: T.bg }}>{s}/page</option>)}</select></div>
      <div style={{ display: "flex", gap: 2 }}>{Array.from({ length: Math.min(5, totalPages) }, (_, i) => <button key={i} onClick={() => setPg(i)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${i === pg ? T.acc + "40" : T.bd}`, background: i === pg ? T.acc + "15" : "transparent", color: i === pg ? T.acc : T.t3, cursor: "pointer", fontSize: 11, fontFamily: "var(--mono)", minWidth: 32 }}>{i + 1}</button>)}</div>
    </div>}
  </div>;
}

// ═══ ENTITY DETAIL PAGE (with golden route fixes) ═══
function EntityDetailPage({ config, record, onBack, onStatusChange, onNavigate }) {
  const [tab, setTab] = useState(config.tabs[0]); const [noteIn, setNoteIn] = useState("");
  const [status, setStatus] = useState(record.status);
  const [jdText, setJdText] = useState(""); const [jdLoading, setJdLoading] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitJob, setSubmitJob] = useState(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const submitModalRef = useRef(null);
  // Interview scheduling state
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ date: "", time: "", duration: 60, type: "video", interviewer: "", notes: "", job_id: "", candidateEmail: record.email || "", additionalEmails: "" });
  const [interviewSaving, setInterviewSaving] = useState(false);
  const [interviewResult, setInterviewResult] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [customInterviewers, setCustomInterviewers] = useState([]);
  const [addingInterviewer, setAddingInterviewer] = useState(false);
  const [newInterviewer, setNewInterviewer] = useState({ name: "", email: "", role: "" });
  const interviewModalRef = useRef(null);
  // Pipeline state
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelineJob, setPipelineJob] = useState(null);
  const [pipelineStage, setPipelineStage] = useState("sourced");
  const [pipelineSaving, setPipelineSaving] = useState(false);
  const [pipelineResult, setPipelineResult] = useState(null);
  // Email compose state
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", body: "", template: "" });
  const [emailSent, setEmailSent] = useState(false);
  // Document management state
  const [documents, setDocuments] = useState(() => {
    if (config.name === "Clients") return [
      { id: "doc-1", name: "MSA_" + (record.name || "Client").replace(/\s/g, "_") + "_2025.pdf", type: "contract", size: "1.2 MB", uploadedBy: "Adam Parsons", uploadedAt: "2025-01-15T10:00:00Z", mimeType: "application/pdf", url: null },
      { id: "doc-2", name: "SOW_Phase1.pdf", type: "contract", size: "340 KB", uploadedBy: "Adam Parsons", uploadedAt: "2025-02-01T14:00:00Z", mimeType: "application/pdf", url: null },
      { id: "doc-3", name: "Rate_Card_2025.xlsx", type: "other", size: "45 KB", uploadedBy: "Adam Parsons", uploadedAt: "2025-01-20T09:00:00Z", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", url: null },
      { id: "doc-4", name: "NDA_Signed.pdf", type: "contract", size: "128 KB", uploadedBy: "System", uploadedAt: "2024-11-10T08:00:00Z", mimeType: "application/pdf", url: null },
    ];
    return [
      { id: "doc-1", name: "Resume_" + (record.name || "Candidate").replace(/\s/g, "_") + ".pdf", type: "resume", size: "248 KB", uploadedBy: "Adam Parsons", uploadedAt: "2025-03-23T14:00:00Z", mimeType: "application/pdf", url: null },
      { id: "doc-2", name: "Cover_Letter.pdf", type: "cover_letter", size: "82 KB", uploadedBy: "System", uploadedAt: "2025-03-22T10:00:00Z", mimeType: "application/pdf", url: null },
    ];
  });
  const [docUploading, setDocUploading] = useState(false);
  const [docPreview, setDocPreview] = useState(null);
  const docInputRef = useRef(null);
  // Fetch file attachments from Supabase on mount
  useEffect(() => {
    if (!record.id) return;
    (async () => { try {
      const res = await sbFetch("/rest/v1/file_attachments?entity_id=eq.${record.id}&deleted_at=is.null&order=created_at.desc", { headers: { apikey: SB_KEY } });
      if (res.ok) { const rows = await res.json(); if (rows.length > 0) setDocuments(prev => [...rows.map(r => ({ id: r.id, name: r.file_name, type: r.category || "other", size: r.file_size ? (r.file_size > 1048576 ? `${(r.file_size / 1048576).toFixed(1)} MB` : `${Math.round(r.file_size / 1024)} KB`) : "—", uploadedBy: r.uploaded_by || "System", uploadedAt: r.created_at, mimeType: r.mime_type, url: r.storage_path, _fromDb: true })), ...prev.filter(p => !p._fromDb)]); }
    } catch (e) {} })();
  }, [record.id]);
  // Inline editing state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  // eSignature / DocuSign state
  const [esigOpen, setEsigOpen] = useState(false);
  const [esigStep, setEsigStep] = useState(0);
  const [esigEnvelope, setEsigEnvelope] = useState({ template: "standard_offer", signers: [{ role: "candidate", name: record.candidate_name || record.name || "", email: record.email || "" }, { role: "hiring_manager", name: "", email: "" }], emailSubject: `Offer Letter — ${record.job_title || record.title || "Position"}`, emailBody: "Please review and sign the attached offer letter.", message: "", expiresInDays: 7 });
  const [esigSending, setEsigSending] = useState(false);
  const [esigResult, setEsigResult] = useState(null);
  const [envelopes, setEnvelopes] = useState([]);
  // Placement extend & revenue state
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendForm, setExtendForm] = useState({ newEndDate: "", newBillRate: "", newPayRate: "", reason: "" });
  const [extendResult, setExtendResult] = useState(null);
  const [revenueOpen, setRevenueOpen] = useState(false);
  // Contact management state
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", role: "", isPrimary: false });
  const [contacts, setContacts] = useState(() => {
    if (!record.primary_contact) return [];
    return [{ id: "ct-1", name: record.primary_contact, email: record.contact_email || "", phone: "", role: "Primary Contact", isPrimary: true }];
  });
  const [timesheets, setTimesheets] = useState(() => {
    if (!record.weeks_active || record.weeks_active === 0) return [];
    return Array.from({ length: Math.min(record.weeks_active || 0, 8) }, (_, i) => {
      const wkStart = new Date(record.start_date || "2025-01-15"); wkStart.setDate(wkStart.getDate() + i * 7);
      const hrs = 38 + Math.floor(Math.random() * 5);
      return { id: `ts-${i}`, week: `Week ${i + 1}`, startDate: wkStart.toISOString().split("T")[0], hours: hrs, billRate: record.bill_rate || 0, payRate: record.pay_rate || 0, revenue: hrs * (record.bill_rate || 0), cost: hrs * (record.pay_rate || 0), status: i < (record.weeks_active || 0) - 1 ? "approved" : "pending" };
    });
  });
  // Timesheet add form state (hoisted from tab)
  const [tsAdding, setTsAdding] = useState(false);
  const [tsForm, setTsForm] = useState({ weekStart: "", mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0, notes: "" });
  const [tsExpanded, setTsExpanded] = useState(null);
  // Pipeline stage management — allows moving candidates between stages
  const [pipelineMoves, setPipelineMoves] = useState({});
  // Live submissions from Supabase
  const [liveSubs, setLiveSubs] = useState([]);
  const [subsLoaded, setSubsLoaded] = useState(false);
  const [liveNotes, setLiveNotes] = useState([]);
  useEffect(() => {
    if (subsLoaded) return;
    (async () => { try {
      // Fetch submissions with joins
      const sRes = await sbFetch("/rest/v1/submissions?select=id,candidate_id,job_id,status,current_stage,match_score,cover_note,created_at,candidates(first_name,last_name),jobs(title,client_name)&order=created_at.desc&limit=50", { headers: { apikey: SB_KEY } });
      if (sRes.ok) { const rows = await sRes.json(); setLiveSubs(rows.map(r => ({ ...r, candidate_name: r.candidates ? `${r.candidates.first_name || ""} ${r.candidates.last_name || ""}`.trim() : "Unknown", job_title: r.jobs?.title || "Unknown", client_name: r.jobs?.client_name || "" }))); }
      // Fetch interviews with joins
      const iRes = await sbFetch("/rest/v1/interviews?select=id,candidate_id,job_id,interview_type,scheduled_at,duration_minutes,status,interviewers,meeting_url,notes,outcome,score,created_at,candidates(first_name,last_name),jobs(title)&order=scheduled_at.desc&limit=50", { headers: { apikey: SB_KEY } });
      if (iRes.ok) { const rows = await iRes.json(); const mapped = rows.map(r => ({ ...r, candidate_name: r.candidates ? `${r.candidates.first_name || ""} ${r.candidates.last_name || ""}`.trim() : "Unknown", job_title: r.jobs?.title || "", type: r.interview_type, date: r.scheduled_at ? r.scheduled_at.split("T")[0] : "", time: r.scheduled_at ? r.scheduled_at.split("T")[1]?.slice(0, 5) : "", interviewer_name: (r.interviewers || [])[0] || "TBD", teams_link: r.meeting_url })); setInterviews(prev => [...mapped, ...prev.filter(p => !mapped.find(m => m.id === p.id))]); }
      // Fetch notes
      const nRes = await sbFetch("/rest/v1/notes?select=id,entity_type,entity_id,content,author,pinned,created_at&order=created_at.desc&limit=100", { headers: { apikey: SB_KEY } });
      if (nRes.ok) { const rows = await nRes.json(); setLiveNotes(rows); }
    } catch (e) {} setSubsLoaded(true); })();
  }, [subsLoaded]);
  // Fetch client contacts from Supabase
  useEffect(() => {
    if (config.name !== "Clients" || !record.id) return;
    (async () => { try {
      const res = await sbFetch("/rest/v1/client_contacts?client_id=eq.${record.id}&select=id,name,email,phone,role,is_primary&order=is_primary.desc,created_at", { headers: { apikey: SB_KEY } });
      if (res.ok) { const rows = await res.json(); if (rows.length > 0) setContacts(rows.map(r => ({ ...r, isPrimary: r.is_primary }))); }
    } catch (e) {} })();
  }, [record.id, config.name]);
  // Fetch esig requests from Supabase
  useEffect(() => {
    if (config.name !== "Offers" || !record.id) return;
    (async () => { try {
      const res = await sbFetch("/rest/v1/esig_requests?select=id,document_name,signer_name,signer_email,status,sent_at,viewed_at,signed_at,declined_at,created_at&order=created_at.desc", { headers: { apikey: SB_KEY } });
      if (res.ok) { const rows = await res.json(); if (rows.length > 0) setEnvelopes(rows.map(r => ({ ...r, emailSubject: r.document_name, signers: [{ name: r.signer_name, email: r.signer_email, role: "candidate", signed: r.status === "signed" }] }))); }
    } catch (e) {} })();
  }, [record.id, config.name]);
  // Helper: upload document to Supabase Storage
  const uploadToStorage = async (file, docId) => {
    try {
          const path = `${config.table}/${record.id}/${docId}-${file.name}`;
      await fetch(`${SUPABASE_URL}/storage/v1/object/documents/${path}`, { method: "POST", body: file });
      return `${SUPABASE_URL}/storage/v1/object/public/documents/${path}`;
    } catch (e) { return null; }
  };
  const startEditing = () => { setEditing(true); setEditForm({ ...record }); };
  const cancelEditing = () => { setEditing(false); setEditForm({}); };
  const saveEdits = async () => {
    setEditSaving(true);
    try {
          const table = config.table;
      if (table && record.id) {
        await sbFetch("/rest/v1/${table}?id=eq.${record.id}", { method: "PATCH", body: JSON.stringify(editForm) });
      }
    } catch (e) { if (window.__aberdeen_toast) window.__aberdeen_toast("Save failed: " + e.message, "error"); }
    // Update local record
    Object.assign(record, editForm);
    setEditing(false);
    setEditSaving(false);
    if (window.__aberdeen_toast) window.__aberdeen_toast("Changes saved", "success");
  };
  const st = config.statuses.find(s => s.value === status) || { label: status, color: T.t3 };
  const handleStatusChange = (newStatus) => { setStatus(newStatus); if (onStatusChange) onStatusChange(record.id, newStatus); };

  // Compute match scores for all jobs when submit modal is open
  const jobMatches = useMemo(() => {
    if (!submitOpen) return [];
    return MOCK_JOBS.map(j => {
      const match = matchCandidateToJob({
        candidate: { skills: record.skills || [], score: record.score || 50, comp_expectation: record.salary_expectation || null, location: record.location || null },
        job: { skills: j.skills || [], comp_min: j.pay_rate ? j.pay_rate * 2000 : null, comp_max: j.bill_rate ? j.bill_rate * 2000 : null, location: j.location || null, remote_policy: (j.location || "").toLowerCase().includes("remote") ? "remote" : "hybrid" }
      });
      const score = match.match_score;
      const tier = score >= 80 ? "ELITE" : score >= 65 ? "STRONG" : score >= 50 ? "MODERATE" : "WEAK";
      return { ...j, _matchScore: score, _matchTier: tier, _skillOverlap: (record.skills || []).filter(s => (j.skills || []).includes(s)), _missingSkills: (j.skills || []).filter(s => !(record.skills || []).includes(s)) };
    }).sort((a, b) => b._matchScore - a._matchScore);
  }, [submitOpen, record]);

  const handleSubmit = async () => {
    if (!submitJob) return;
    setSubmitting(true);
    try {
          const body = { candidate_id: record.id, job_id: submitJob.id, status: "active", current_stage: "submitted", cover_note: submitNote || null, match_score: submitJob._matchScore || null };
      const res = await sbFetch("/rest/v1/submissions", { method: "POST", body: JSON.stringify(body) });
      setSubmitResult(res.ok ? "success" : "error"); if (window.__aberdeen_toast) window.__aberdeen_toast(res.ok ? "Candidate submitted successfully" : "Submission failed", res.ok ? "success" : "error");
    } catch (e) { setSubmitResult("error"); if (window.__aberdeen_toast) window.__aberdeen_toast("Submission failed: " + e.message, "error"); }
    setSubmitting(false);
  };

  // ═══ INTERVIEW SCHEDULING ═══
  // Mock interviewers — in production, fetched from Microsoft Graph /users
  const INTERVIEWERS = [
    { id: "i1", name: "Adam Parsons", email: "adam@aberdeen.com", role: "CEO / Lead Recruiter", avatar: "AP" },
    { id: "i2", name: "Sarah Mitchell", email: "sarah@aberdeen.com", role: "Sr. Technical Recruiter", avatar: "SM" },
    { id: "i3", name: "James Rodriguez", email: "james@aberdeen.com", role: "Hiring Manager", avatar: "JR" },
    { id: "i4", name: "Client Contact", email: "contact@client.com", role: "Client Interviewer", avatar: "CC" },
  ];
  const INT_TYPES = [
    { id: "video", label: "Video (Teams)", icon: "📹", desc: "Microsoft Teams meeting link auto-generated" },
    { id: "phone", label: "Phone Screen", icon: "📞", desc: "Phone call — no meeting link needed" },
    { id: "onsite", label: "On-Site", icon: "🏢", desc: "In-person at client office" },
    { id: "technical", label: "Technical Assessment", icon: "💻", desc: "Live coding or system design via Teams" },
    { id: "panel", label: "Panel Interview", icon: "👥", desc: "Multiple interviewers via Teams" },
  ];

  // Mock availability — in production, from Microsoft Graph GET /users/{id}/calendar/getSchedule
  const getAvailability = useMemo(() => {
    if (!interviewOpen) return [];
    const today = new Date();
    const slots = [];
    for (let d = 1; d <= 5; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends
      const dayStr = date.toISOString().split("T")[0];
      const dayLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      // Generate 9am-5pm slots with some randomly busy
      const hours = [];
      for (let h = 9; h <= 16; h++) {
        const busy = Math.random() < 0.3; // 30% chance busy
        hours.push({ hour: h, label: `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? "PM" : "AM"}`, busy });
      }
      slots.push({ date: dayStr, label: dayLabel, hours });
    }
    return slots;
  }, [interviewOpen]);

  const handleScheduleInterview = async () => {
    if (!interviewForm.date || !interviewForm.time || !interviewForm.interviewer) return;
    setInterviewSaving(true);
    try {
          const interviewer = [...INTERVIEWERS, ...customInterviewers].find(i => i.id === interviewForm.interviewer);
      const intType = INT_TYPES.find(t => t.id === interviewForm.type);
      const allParticipants = [interviewForm.candidateEmail, interviewer?.email, ...interviewForm.additionalEmails.split(",").map(e => e.trim())].filter(Boolean);

      // ┌─────────────────────────────────────────────────────────┐
      // │  🔌 MICROSOFT GRAPH INTEGRATION POINT #1                │
      // │  Create Teams Meeting                                    │
      // │  POST https://graph.microsoft.com/v1.0/me/onlineMeetings│
      // │  Headers: Authorization: Bearer {access_token}          │
      // │  Body: { subject, startDateTime, endDateTime,           │
      // │          participants: { attendees: [{emailAddress}] }  │
      // │  Response: { joinWebUrl, id }                           │
      // └─────────────────────────────────────────────────────────┘
      const mockTeamsLink = interviewForm.type === "video" || interviewForm.type === "technical" || interviewForm.type === "panel"
        ? `https://teams.microsoft.com/l/meetup-join/mock-${Date.now()}`
        : null;

      // ┌─────────────────────────────────────────────────────────┐
      // │  🔌 MICROSOFT GRAPH INTEGRATION POINT #2                │
      // │  Create Calendar Event with Teams link                   │
      // │  POST https://graph.microsoft.com/v1.0/me/events        │
      // │  Body: { subject, body: { contentType: "HTML",          │
      // │    content: "Interview with {candidate}" },             │
      // │    start: { dateTime, timeZone },                       │
      // │    end: { dateTime, timeZone },                         │
      // │    attendees: [{ emailAddress, type: "required" }],     │
      // │    onlineMeeting: { onlineMeetingProvider: "teamsForBiz"}│
      // │    isOnlineMeeting: true }                              │
      // │  This creates the event on interviewer's Outlook and    │
      // │  sends invite to candidate email                        │
      // └─────────────────────────────────────────────────────────┘

      const startDT = `${interviewForm.date}T${interviewForm.time}:00+00:00`;
      const interview = {
        candidate_id: record.id,
        job_id: interviewForm.job_id || null,
        interview_type: interviewForm.type,
        scheduled_at: startDT,
        duration_minutes: interviewForm.duration,
        status: "scheduled",
        interviewers: [interviewer?.name].filter(Boolean),
        meeting_url: mockTeamsLink,
        notes: interviewForm.notes || null,
        location: interviewForm.type === "onsite" ? "Client Office" : null,
      };
      // Local record with extra display fields
      const localInterview = { ...interview, id: `int-${Date.now()}`, candidate_name: record.name || record.candidate_name, interviewer_name: interviewer?.name, interviewer_email: interviewer?.email, candidate_email: interviewForm.candidateEmail, type: interviewForm.type, date: interviewForm.date, time: interviewForm.time, teams_link: mockTeamsLink };

      // Write to Supabase
      const res = await sbFetch("/rest/v1/interviews", {
        method: "POST",
        headers: { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(interview)
      });

      if (res.ok) {
        const saved = await res.json();
        setInterviews(prev => [...prev, { ...localInterview, id: saved[0]?.id || localInterview.id }]);
        setInterviewResult("success");
        if (window.__aberdeen_toast) window.__aberdeen_toast("Interview scheduled", "success");
      } else {
        setInterviews(prev => [...prev, localInterview]);
        setInterviewResult("success");
        if (window.__aberdeen_toast) window.__aberdeen_toast("Interview saved locally", "warning");
      }
    } catch (e) {
      setInterviews(prev => [...prev, localInterview]);
      setInterviewResult("success");
      if (window.__aberdeen_toast) window.__aberdeen_toast("Interview saved locally", "warning");
    }
    setInterviewSaving(false);
  };

  // Field key mapping for overviewSections — maps label to record field
  const LABEL_TO_FIELD = { "Title": "title", "Name": "name", "Email": "email", "Phone": "phone", "Location": "location", "Company": "current_company", "Client": "client_name", "Department": "department", "Start Date": "start_date", "Duration": "duration", "Bill Rate": "bill_rate", "Pay Rate": "pay_rate", "Openings": "openings", "Salary": "salary_expectation", "Experience": "years_experience", "Source": "source", "Website": "website", "Industry": "industry", "Company Size": "company_size", "Primary Contact": "primary_contact", "Contact Email": "contact_email" };

  const InfoSection = ({ title, rows }) => <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>
    {rows.filter(r => r[2] != null || editing).map(([Ic, l, v], i) => {
      const fieldKey = LABEL_TO_FIELD[l];
      const rawVal = fieldKey ? (editForm[fieldKey] ?? record[fieldKey] ?? "") : "";
      const isNum = fieldKey === "bill_rate" || fieldKey === "pay_rate" || fieldKey === "openings" || fieldKey === "years_experience" || fieldKey === "salary_expectation";
      return <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.bd}` }}>
        <Ic size={14} color={T.t3} />
        <span style={{ fontSize: 11, color: T.t3, width: 90 }}>{l}</span>
        {editing && fieldKey ? <input value={rawVal} onChange={e => setEditForm(p => ({ ...p, [fieldKey]: isNum ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value }))} type={isNum ? "number" : "text"} aria-label={`Edit ${l}`} style={{ flex: 1, padding: "4px 8px", background: T.bg, border: `1px solid ${T.acc}30`, borderRadius: 6, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /> : <span style={{ fontSize: 13, color: T.t1, flex: 1 }}>{v || "—"}</span>}
      </div>;
    })}
  </div>;

  const renderTab = () => {
    if (tab === "Overview") {
      const sections = config.overviewSections ? config.overviewSections(record) : [
        { title: "Contact", rows: [[Mail, "Email", record.email], [Phone, "Phone", record.phone], [MapPin, "Location", record.location], [Building2, "Company", record.current_company]] },
        { title: "Professional", rows: [[Briefcase, "Title", record.title], [Clock, "Experience", record.years_experience ? `${record.years_experience} years` : null], [DollarSign, "Salary", record.salary_expectation ? formatCurrency(record.salary_expectation) : null]] },
      ];
      return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {sections.map((sec, i) => <InfoSection key={i} title={sec.title} rows={sec.rows} />)}
        {(record.skills?.length > 0 || editing) && <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16, gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 12, textTransform: "uppercase" }}>{config.skillsLabel || "Skills"}</div>
          {editing ? <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>{(editForm.skills || record.skills || []).map((s, i) => <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: config.color + "0c", border: `1px solid ${config.color}20`, borderRadius: 8, fontSize: 12, color: config.color, fontWeight: 500 }}>{s}<button onClick={() => setEditForm(p => ({ ...p, skills: (p.skills || record.skills || []).filter((_, j) => j !== i) }))} aria-label={`Remove ${s}`} style={{ background: "none", border: "none", color: config.color, cursor: "pointer", fontSize: 14, padding: 0, marginLeft: 2, lineHeight: 1 }}>×</button></span>)}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input id="skill-add-input" placeholder="Add skill..." aria-label="Add a skill" onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim()) { setEditForm(p => ({ ...p, skills: [...(p.skills || record.skills || []), e.target.value.trim()] })); e.target.value = ""; } }} style={{ flex: 1, padding: "6px 10px", background: T.bg, border: `1px solid ${T.acc}30`, borderRadius: 6, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
              <button onClick={() => { const inp = document.getElementById("skill-add-input"); if (inp?.value.trim()) { setEditForm(p => ({ ...p, skills: [...(p.skills || record.skills || []), inp.value.trim()] })); inp.value = ""; } }} style={{ padding: "6px 12px", background: config.color + "18", border: `1px solid ${config.color}30`, borderRadius: 6, color: config.color, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit'" }}>+ Add</button>
            </div>
          </div> : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(record.skills || []).map((s, i) => <span key={i} style={{ padding: "5px 12px", background: config.color + "0c", border: `1px solid ${config.color}20`, borderRadius: 8, fontSize: 12, color: config.color, fontWeight: 500 }}>{s}</span>)}</div>}
        </div>}
        {record.score != null && <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 600, color: T.t3, textTransform: "uppercase" }}>AI Score — {record._jobScore?.recommendation || record._scoring?.recommendation || "—"}</div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Zap size={14} color={T.teal} /><span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: record.score >= 80 ? T.ok : record.score >= 60 ? T.warn : T.err }}>{record.score}</span></div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{(config.scoreFactors || Object.keys(CAND_WEIGHTS)).map(f => { const key = f.toLowerCase().replace(/ /g, "_"); const intake = record._intake; const scoring = record._scoring; const jsWeights = JOB_WEIGHTS; const val = intake?.[key] ? intake[key] : scoring?.score_json?.[key] ? scoring.score_json[key] / (CAND_WEIGHTS[key] || 0.15) : 0.5 + Math.random() * 0.3; return <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}><span style={{ width: 120, color: T.t3 }}>{f}</span><div style={{ flex: 1, height: 6, background: T.bd, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${val * 100}%`, height: "100%", background: val > 0.7 ? T.ok : val > 0.4 ? T.warn : T.err, borderRadius: 3 }} /></div><span style={{ width: 35, textAlign: "right", fontFamily: "var(--mono)", color: T.t2, fontSize: 11 }}>{(val * 100).toFixed(0)}%</span></div>; })}</div>
          {(record._jobScore?.risk_flags || record._scoring?.risk_flags || []).length > 0 && <div style={{ marginTop: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>{(record._jobScore?.risk_flags || record._scoring?.risk_flags).map((f, i) => <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.err + "15", color: T.err, fontFamily: "var(--mono)" }}>⚠ {f.replace(/_/g, " ")}</span>)}</div>}
          {record._scoring?.strengths?.length > 0 && <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>{record._scoring.strengths.map((s, i) => <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.ok + "15", color: T.ok, fontFamily: "var(--mono)" }}>✓ {s.replace(/_/g, " ")}</span>)}</div>}
        </div>}
      </div>;
    }
    if (tab === "Intelligence") {
      const js = record._jobScore;
      const intake = record._intake;
      const actions = record._actions || [];
      const generateJD = async () => {
        setJdLoading(true);
        try {
          const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: "You are a recruiting specialist. Write a structured job description. Include: Overview, Responsibilities (5-7 bullets), Requirements (5-7), Nice-to-haves (3-4), and What We Offer (4-5). Be specific and professional. No markdown headers, use plain text with sections.", messages: [{ role: "user", content: `Write a job description for: ${record.title} at ${record.client_name}. Department: ${record.department || "Engineering"}. Location: ${record.location || "Remote"}. Skills: ${(record.skills || []).join(", ")}. Duration: ${record.duration || "Full-time"}. Bill rate: $${record.bill_rate}/hr.` }] }) });
          const data = await res.json();
          setJdText(data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Failed to generate JD.");
        } catch (e) { setJdText("Error: " + e.message); }
        setJdLoading(false);
      };
      // Skill enrichment suggestions
      const relatedSkills = { "React": ["Next.js", "Redux", "TypeScript"], "TypeScript": ["JavaScript", "Node.js"], "Node.js": ["Express", "NestJS"], "AWS": ["Lambda", "ECS", "CloudFormation", "S3"], "Kubernetes": ["Docker", "Helm", "ArgoCD"], "SAP S/4HANA": ["FICO", "ABAP", "BW", "MM/SD"], "ServiceNow": ["ITSM", "ITOM", "JavaScript", "Flow Designer"], "Python": ["Django", "Flask", "FastAPI"], "Terraform": ["Ansible", "CloudFormation", "Pulumi"] };
      const suggestedSkills = [...new Set((record.skills || []).flatMap(s => relatedSkills[s] || []).filter(s => !(record.skills || []).includes(s)))].slice(0, 6);
      if (!js) return <EmptyState icon={Zap} title="No scoring data" description="Score this job using the intake wizard to see intelligence." />;
      return <div>
        <div className="g5" style={{ gap: 8, marginBottom: 16 }}>
          <MetricCard label="INTAKE QUALITY" value={js.intake_quality} color={js.intake_quality >= 75 ? T.ok : js.intake_quality >= 55 ? T.warn : T.err} />
          <MetricCard label="FILL PROBABILITY" value={`${(js.fill_probability * 100).toFixed(0)}%`} color={T.acc} />
          <MetricCard label="TIME TO FILL" value={`${js.time_to_fill_estimate_days}d`} />
          <MetricCard label="RECOMMENDATION" value={js.recommendation.replace("_", " ")} color={js.recommendation === "PRIORITIZE" ? T.ok : js.recommendation === "REVISE_JOB" ? T.warn : T.err} />
          <MetricCard label="ACTIONS" value={actions.length} color={T.teal} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 12, textTransform: "uppercase" }}>Intake Scoring (5-Factor)</div>
            {intake && Object.entries(JOB_WEIGHTS).map(([k, w]) => { const val = intake[k] || 0; return <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 8 }}><span style={{ width: 100, color: T.t3 }}>{k}</span><div style={{ flex: 1, height: 6, background: T.bd, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${val * 100}%`, height: "100%", background: val > 0.7 ? T.ok : val > 0.4 ? T.warn : T.err, borderRadius: 3 }} /></div><span style={{ width: 40, textAlign: "right", fontFamily: "var(--mono)", color: T.t2, fontSize: 11 }}>{(val * 100).toFixed(0)}%</span><span style={{ width: 30, textAlign: "right", fontFamily: "var(--mono)", color: T.t3, fontSize: 9 }}>×{w}</span></div>; })}
            {js.risk_flags?.length > 0 && <div style={{ marginTop: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>{js.risk_flags.map((f, i) => <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.err + "15", color: T.err, fontFamily: "var(--mono)" }}>⚠ {f.replace(/_/g, " ")}</span>)}</div>}
          </div>
          <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 12, textTransform: "uppercase" }}>Auto-Actions from Decision Engine</div>
            {actions.length === 0 ? <div style={{ color: T.t3, fontSize: 12 }}>No actions triggered at current score level.</div> : actions.map((a, i) => { const colors = { PRIORITIZE_JOB: T.ok, TRIGGER_SCORING: T.teal, NOTIFY_RECRUITER: T.warn, FLAG_RISK: T.err }; return <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 12 }}><Badge color={colors[a.action_type] || T.t3}>{a.action_type.replace(/_/g, " ")}</Badge><span style={{ flex: 1, color: T.t2, fontSize: 11 }}>{a.decision_reasoning.rule.replace(/_/g, " ")}</span><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: T.t3 }}>{(a.decision_reasoning.confidence * 100).toFixed(0)}%</span></div>; })}
          </div>
        </div>
        {suggestedSkills.length > 0 && <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 10, textTransform: "uppercase" }}>Skill Enrichment Suggestions</div>
          <div style={{ fontSize: 12, color: T.t2, marginBottom: 8 }}>Based on {(record.skills || []).join(", ")}, consider adding:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{suggestedSkills.map((s, i) => <span key={i} style={{ padding: "5px 12px", background: T.teal + "0c", border: `1px solid ${T.teal}20`, borderRadius: 8, fontSize: 12, color: T.teal, cursor: "pointer" }}>+ {s}</span>)}</div>
        </div>}
        <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, textTransform: "uppercase" }}>JD Generator — Claude API</div>
            <button onClick={generateJD} disabled={jdLoading} style={{ padding: "6px 16px", background: jdLoading ? T.bgA : T.acc, color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: jdLoading ? "default" : "pointer", fontFamily: "'Outfit'" }}>{jdLoading ? "Generating..." : "Generate JD"}</button>
          </div>
          {jdLoading && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12 }}><RefreshCw size={14} color={T.teal} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 12, color: T.teal }}>Calling Claude API...</span></div>}
          {jdText && <div style={{ padding: 16, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, fontSize: 13, color: T.t2, lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }} tabIndex={0}>{jdText}</div>}
        </div>
      </div>;
    }
    if (tab === "Economics") {
      const ev = record._ev;
      const pri = record._priority;
      const margin = record.bill_rate && record.pay_rate ? ((1 - record.pay_rate / record.bill_rate) * 100).toFixed(1) : 0;
      const annualRev = record.bill_rate ? record.bill_rate * 2080 : 0;
      const annualCost = record.pay_rate ? record.pay_rate * 2080 : 0;
      const annualMargin = annualRev - annualCost;
      if (!ev) return <EmptyState icon={DollarSign} title="No economics data" description="Economics computed from intake scoring." />;
      return <div>
        <div className="g5" style={{ gap: 8, marginBottom: 16 }}>
          <MetricCard label="EXPECTED VALUE" value={`$${(ev.expected_value / 1000).toFixed(1)}K`} color={ev.expected_value > 10000 ? T.ok : T.warn} />
          <MetricCard label="DEAL VALUE" value={`$${(ev.deal_value / 1000).toFixed(0)}K`} />
          <MetricCard label="PRIORITY SCORE" value={pri?.priority_score?.toFixed(0) || "—"} color={T.acc} />
          <MetricCard label="ROI" value={pri ? `${(pri.roi * 100).toFixed(0)}%` : "—"} color={pri?.roi > 1 ? T.ok : T.warn} />
          <MetricCard label="MARGIN" value={`${margin}%`} color={parseFloat(margin) >= 30 ? T.ok : parseFloat(margin) >= 20 ? T.warn : T.err} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 12, textTransform: "uppercase" }}>Revenue Model</div>
            {[[DollarSign, "Bill Rate", `$${record.bill_rate}/hr`], [DollarSign, "Pay Rate", `$${record.pay_rate}/hr`], [TrendingUp, "Spread", `$${(record.bill_rate || 0) - (record.pay_rate || 0)}/hr`], [BarChart3, "Annual Revenue", `$${(annualRev / 1000).toFixed(0)}K`], [BarChart3, "Annual Cost", `$${(annualCost / 1000).toFixed(0)}K`], [TrendingUp, "Annual Margin", `$${(annualMargin / 1000).toFixed(0)}K`]].map(([Ic, l, v], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 12 }}><Ic size={14} color={T.t3} /><span style={{ color: T.t3, width: 110 }}>{l}</span><span style={{ fontFamily: "var(--mono)", color: T.t1 }}>{v}</span></div>)}
          </div>
          <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 12, textTransform: "uppercase" }}>Priority Calculation</div>
            {pri && [[Gauge, "Expected Value", `$${ev.expected_value.toLocaleString()}`], [Clock, "Est. Hours to Fill", "40 hrs"], [DollarSign, "Cost per Hour", "$75/hr"], [DollarSign, "Total Recruiter Cost", `$${pri.cost.toLocaleString()}`], [TrendingUp, "Net EV", `$${(ev.expected_value - pri.cost).toLocaleString()}`], [Zap, "Urgency Multiplier", `${pri.urgency_multiplier}×`], [Award, "Priority Score", pri.priority_score.toFixed(1)]].map(([Ic, l, v], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 12 }}><Ic size={14} color={T.t3} /><span style={{ color: T.t3, width: 140 }}>{l}</span><span style={{ fontFamily: "var(--mono)", color: T.t1 }}>{v}</span></div>)}
          </div>
        </div>
        <div style={{ padding: 12, background: ev.expected_value > 10000 ? T.ok + "08" : T.warn + "08", border: `1px solid ${ev.expected_value > 10000 ? T.ok + "20" : T.warn + "20"}`, borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: ev.expected_value > 10000 ? T.ok : T.warn, fontFamily: "var(--mono)" }}>{ev.expected_value > 50000 ? "HIGH-VALUE PLACEMENT — Auto-prioritize" : ev.expected_value > 10000 ? "VIABLE — Standard pipeline" : "LOW ROI — Consider deprioritizing"}</div>
          <div style={{ fontSize: 11, color: T.t2, marginTop: 4 }}>EV = Fill Probability ({(record._jobScore?.fill_probability * 100).toFixed(0)}%) × Deal Value (${(ev.deal_value / 1000).toFixed(0)}K) = ${(ev.expected_value / 1000).toFixed(1)}K. Priority = (EV - Cost) / Hours × Urgency = {pri?.priority_score?.toFixed(1)}.</div>
        </div>
      </div>;
    }
    if (tab === "eSignature") {
      const ESIG_STATUSES = { draft: { label: "Draft", color: T.t3, icon: "📝" }, sent: { label: "Sent", color: T.acc, icon: "📤" }, delivered: { label: "Delivered", color: T.acc, icon: "📬" }, viewed: { label: "Viewed", color: T.vio, icon: "👁️" }, signed: { label: "Signed", color: T.ok, icon: "✍️" }, completed: { label: "Completed", color: T.ok, icon: "✅" }, declined: { label: "Declined", color: T.err, icon: "❌" }, voided: { label: "Voided", color: T.err, icon: "🚫" } };
      const ESIG_STAGES = ["sent", "delivered", "viewed", "signed", "completed"];
      return <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{envelopes.length} Envelope{envelopes.length !== 1 ? "s" : ""}</div>
          <button onClick={() => { setEsigOpen(true); setEsigStep(0); setEsigResult(null); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.warn, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}><FileText size={12} />Send for Signature</button>
        </div>
        {envelopes.length === 0 ? <EmptyState icon={FileText} title="No envelopes" description="Send an offer letter for electronic signature via DocuSign." /> :
        envelopes.map((env, i) => {
          const st = ESIG_STATUSES[env.status] || ESIG_STATUSES.draft;
          const stageIdx = ESIG_STAGES.indexOf(env.status);
          return <div key={env.id || i} style={{ padding: 16, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>{st.icon}</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>{env.emailSubject}</div><div style={{ fontSize: 11, color: T.t3 }}>Envelope ID: {env.id}</div></div></div>
              <Badge color={st.color}>{st.label}</Badge>
            </div>
            {/* Status progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 12 }}>
              {ESIG_STAGES.map((s, si) => { const active = si <= stageIdx; const est = ESIG_STATUSES[s]; return <React.Fragment key={s}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", height: 4, borderRadius: 2, background: active ? est.color : T.bd, transition: "background 0.3s" }} />
                  <span style={{ fontSize: 8, color: active ? est.color : T.t3, fontFamily: "var(--mono)" }}>{est.label}</span>
                </div>
                {si < ESIG_STAGES.length - 1 && <div style={{ width: 3, height: 3, borderRadius: "50%", background: si < stageIdx ? T.ok : T.bd, flexShrink: 0 }} />}
              </React.Fragment>; })}
            </div>
            {/* Signers */}
            <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, marginBottom: 6, textTransform: "uppercase" }}>Signers</div>
            {env.signers.map((s, si) => <div key={si} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 12 }}>
              <CAvatar name={s.name || "?"} size={24} />
              <div style={{ flex: 1 }}><span style={{ fontWeight: 500 }}>{s.name || "—"}</span><span style={{ color: T.t3, marginLeft: 6 }}>{s.email}</span></div>
              <Badge color={s.role === "candidate" ? T.acc : T.vio}>{s.role.replace("_", " ")}</Badge>
              <span style={{ fontSize: 10, color: s.signed ? T.ok : T.t3, fontFamily: "var(--mono)" }}>{s.signed ? "✓ Signed" : "Pending"}</span>
            </div>)}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button onClick={() => { setEnvelopes(prev => prev.map(e => e.id === env.id ? { ...e, status: env.status === "sent" ? "delivered" : env.status === "delivered" ? "viewed" : env.status === "viewed" ? "signed" : env.status === "signed" ? "completed" : env.status } : e)); }} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.acc}30`, background: T.acc + "0c", color: T.acc, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>Advance Status →</button>
              <button onClick={() => { setEnvelopes(prev => prev.filter(e => e.id !== env.id)); }} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.err}30`, background: T.err + "0c", color: T.err, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>Void</button>
            </div>
          </div>;
        })}
        <div style={{ padding: 10, background: T.bgH, border: `1px solid ${T.bd}`, borderRadius: 8, marginTop: 12, fontSize: 11, color: T.t3 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: T.t2 }}>🔌 DocuSign Integration Points</div>
          <div>① <strong>POST /envelopes</strong> — Creates envelope with document, signers, and tabs (signature fields)</div>
          <div>② <strong>GET /envelopes/&#123;id&#125;</strong> — Polls envelope status (or use Connect webhook for real-time)</div>
          <div>③ <strong>DocuSign Connect</strong> — Webhook fires on sent/delivered/viewed/signed/completed/declined</div>
        </div>
      </div>;
    }
    if (tab === "Notes") {
      const myNotes = liveNotes.filter(n => n.entity_id === record.id);
      const allNotes = [...myNotes, ...MOCK_NOTES.filter(mn => !myNotes.find(n => n.id === mn.id))];
      const saveNote = async () => {
        if (!noteIn.trim()) return;
        const note = { entity_type: config.singular.toLowerCase(), entity_id: record.id, content: noteIn.trim(), author: "Adam Parsons", pinned: false };
        const localNote = { ...note, id: `note-${Date.now()}`, created_at: new Date().toISOString() };
        setLiveNotes(prev => [localNote, ...prev]); setNoteIn("");
        try {
                      await sbFetch("/rest/v1/notes", { method: "POST", body: JSON.stringify(note) });
          if (window.__aberdeen_toast) window.__aberdeen_toast("Note saved", "success");
        } catch (e) { if (window.__aberdeen_toast) window.__aberdeen_toast("Note saved locally (offline)", "warning"); }
      };
      return <div>
        <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <textarea value={noteIn} onChange={e => setNoteIn(e.target.value)} placeholder="Add a note..." rows={3} aria-label="Add a note" style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: T.t1, fontSize: 14, fontFamily: "'Outfit'", lineHeight: 1.6, resize: "none" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><button onClick={saveNote} disabled={!noteIn.trim()} style={{ padding: "6px 16px", background: noteIn.trim() ? T.acc : T.bgA, color: noteIn.trim() ? "white" : T.t3, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: noteIn.trim() ? "pointer" : "default", fontFamily: "'Outfit'" }}>Save Note</button></div>
        </div>
        {allNotes.length === 0 ? <EmptyState icon={MessageSquare} title="No notes" description="Add your first note above." /> :
        allNotes.map(n => <div key={n.id} style={{ padding: 14, background: T.bgE, border: `1px solid ${n.pinned ? T.warn + "40" : T.bd}`, borderRadius: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 600, color: n.author === "System" ? T.teal : T.t1 }}>{n.pinned && "📌 "}{n.author || "Adam Parsons"}</span><span style={{ fontSize: 10, color: T.t3, fontFamily: "var(--mono)" }}>{formatDate(n.created_at)}</span></div>
          <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.6 }}>{n.content}</div>
        </div>)}
      </div>;
    }
    if (tab === "Activity") return <div>{[{ action: "Status changed to " + status, time: record.updated_at, IC: Activity, color: T.acc }, { action: "Note added by Adam Parsons", time: "2025-03-22T10:00:00Z", IC: MessageSquare, color: T.vio }, { action: `${config.singular} created`, time: record.created_at, IC: UserPlus, color: T.ok }].map((evt, i) => <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.bd}`, position: "relative" }}>{i < 2 && <div style={{ position: "absolute", left: 13, top: 36, bottom: -12, width: 1, background: T.bd }} />}<div style={{ width: 28, height: 28, borderRadius: "50%", background: evt.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}><evt.IC size={12} color={evt.color} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 13, color: T.t2 }}>{evt.action}</div><div style={{ fontSize: 10, color: T.t3, fontFamily: "var(--mono)", marginTop: 2 }}>{formatDate(evt.time)}</div></div></div>)}</div>;
    if (tab === "Submissions") {
      const mySubs = liveSubs.filter(s => s.candidate_id === record.id || s.job_id === record.id);
      const stageColor = { new: T.t3, screening: T.acc, submitted: T.warn, interviewing: T.vio, offered: T.teal, hired: T.ok, rejected: T.err };
      return <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{mySubs.length} Submission{mySubs.length !== 1 ? "s" : ""}{!subsLoaded && <span style={{ marginLeft: 8, fontSize: 11, color: T.teal }}><RefreshCw size={10} style={{ animation: "spin 1s linear infinite", verticalAlign: "middle" }} /> Loading...</span>}</div>
        {mySubs.length === 0 ? <EmptyState icon={Send} title="No submissions" description={subsLoaded ? `No submissions for this ${config.singular.toLowerCase()} yet.` : "Loading from Supabase..."} /> :
        mySubs.map(s => <div key={s.id} style={{ padding: 14, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: T.warn + "1a", display: "flex", alignItems: "center", justifyContent: "center" }}><Send size={16} color={T.warn} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{config.name === "Candidates" ? s.job_title : s.candidate_name}</div>
            <div style={{ fontSize: 12, color: T.t3 }}>{s.client_name}{s.match_score ? ` · Match: ${s.match_score}%` : ""}</div>
          </div>
          <Badge color={stageColor[s.current_stage] || T.t3}>{(s.current_stage || s.status || "").replace("_", " ")}</Badge>
          <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: T.t3 }}>{formatDate(s.created_at)}</span>
        </div>)}
      </div>;
    }
    if (tab === "Candidates") return record.candidates_count > 0 ? <div>{[{ name: "Sarah Chen", title: "Sr. Developer", status: "Interview" }, { name: "Marcus Wright", title: "DevOps Engineer", status: "Submitted" }].slice(0, record.candidates_count).map((c, i) => <div key={i} role="button" tabIndex={0} onClick={() => onNavigate && onNavigate("candidates")} onKeyDown={e => { if (e.key === "Enter") onNavigate && onNavigate("candidates"); }} style={{ padding: 14, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}><CAvatar name={c.name} size={36} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 12, color: T.t3 }}>{c.title}</div></div><Badge color={c.status === "Interview" ? T.vio : T.t3}>{c.status}</Badge></div>)}</div> : <EmptyState icon={Users} title="No candidates" description="Submit candidates to this job." />;
    if (tab === "Interviews") {
      const typeIcon = { video: "📹", phone: "📞", onsite: "🏢", technical: "💻", panel: "👥" };
      const statusColor = { scheduled: T.acc, confirmed: T.ok, completed: T.ok, cancelled: T.err, no_show: T.err };
      return <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{interviews.length} Interview{interviews.length !== 1 ? "s" : ""}</div>
          <button onClick={() => { setInterviewOpen(true); setInterviewResult(null); setInterviewForm({ date: "", time: "", duration: 60, type: "video", interviewer: "", notes: "", job_id: "", candidateEmail: record.email || "", additionalEmails: "" }); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.vio, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}><Calendar size={12} />Schedule Interview</button>
        </div>
        {interviews.length === 0 ? <EmptyState icon={Calendar} title="No interviews scheduled" description="Click 'Schedule Interview' to set up a call." /> :
        interviews.map((int, i) => <div key={int.id || i} style={{ padding: 14, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{typeIcon[int.type] || "📹"}</span>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{(INT_TYPES.find(t => t.id === int.type) || {}).label || int.type}</div><div style={{ fontSize: 11, color: T.t3 }}>with {int.interviewer_name || "TBD"}</div></div>
            </div>
            <Badge color={statusColor[int.status] || T.t3}>{(int.status || "scheduled").toUpperCase()}</Badge>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.t2, marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--mono)" }}>📅 {int.date}</span>
            <span style={{ fontFamily: "var(--mono)" }}>🕐 {int.time}</span>
            <span>{int.duration_minutes || 60} min</span>
          </div>
          {int.teams_link && <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: T.vio + "0c", border: `1px solid ${T.vio}20`, borderRadius: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12 }}>📹</span>
            <span style={{ fontSize: 11, color: T.vio, fontFamily: "var(--mono)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{int.teams_link}</span>
            <button onClick={() => navigator.clipboard?.writeText(int.teams_link)} aria-label="Copy Teams link" style={{ fontSize: 10, padding: "2px 8px", background: T.vio + "18", border: `1px solid ${T.vio}30`, borderRadius: 4, color: T.vio, cursor: "pointer", fontFamily: "var(--mono)" }}>Copy</button>
          </div>}
          {int.notes && <div style={{ fontSize: 11, color: T.t3, fontStyle: "italic" }}>"{int.notes}"</div>}
        </div>)}
      </div>;
    }
    if (tab === "Jobs") return record.active_jobs > 0 ? <div>{[{ title: "Sr. Software Engineer", status: "Open", location: "Remote" }, { title: "DevOps Lead", status: "Sourcing", location: "SF" }].slice(0, record.active_jobs).map((j, i) => <div key={i} role="button" tabIndex={0} onClick={() => onNavigate && onNavigate("jobs")} onKeyDown={e => { if (e.key === "Enter") onNavigate && onNavigate("jobs"); }} style={{ padding: 14, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}><div style={{ width: 36, height: 36, borderRadius: 8, background: T.vio + "1a", display: "flex", alignItems: "center", justifyContent: "center" }}><Briefcase size={16} color={T.vio} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{j.title}</div><div style={{ fontSize: 12, color: T.t3 }}>{j.location}</div></div><Badge color={j.status === "Open" ? T.ok : T.warn}>{j.status}</Badge></div>)}</div> : <EmptyState icon={Briefcase} title="No active jobs" description="Create a job for this client." />;
    if (tab === "Contacts") {
      return <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{contacts.length} Contact{contacts.length !== 1 ? "s" : ""}</div>
          <button onClick={() => { setContactOpen(true); setContactForm({ name: "", email: "", phone: "", role: "", isPrimary: false }); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}><Plus size={12} />Add Contact</button>
        </div>
        {/* Add contact inline form */}
        {contactOpen && <div style={{ padding: 16, background: T.bgE, border: `1px solid ${T.acc}25`, borderRadius: 10, marginBottom: 12, animation: "fadeIn 0.15s ease" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>New Contact</div>
          <div className="g2" style={{ gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>Name *</div><input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" aria-label="Contact name" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /></div>
            <div><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>Role</div><input value={contactForm.role} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} placeholder="VP Engineering, Hiring Manager..." aria-label="Contact role" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /></div>
          </div>
          <div className="g2" style={{ gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>Email *</div><input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" aria-label="Contact email" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /></div>
            <div><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>Phone</div><input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" aria-label="Contact phone" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input type="checkbox" checked={contactForm.isPrimary} onChange={e => setContactForm(p => ({ ...p, isPrimary: e.target.checked }))} id="primary-check" style={{ accentColor: T.acc }} />
            <label htmlFor="primary-check" style={{ fontSize: 12, color: T.t2 }}>Set as primary contact</label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setContactOpen(false)} style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 12 }}>Cancel</button>
            <button onClick={async () => { if (!contactForm.name || !contactForm.email) return; const newContact = { id: `ct-${Date.now()}`, ...contactForm }; if (contactForm.isPrimary) setContacts(p => p.map(c => ({ ...c, isPrimary: false }))); setContacts(p => [...p, newContact]); setContactOpen(false); try { const SB = "https://lalkdgljfkgiojfbreyq.supabase.co"; const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGtkZ2xqZmtnaW9qZmJyZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTc2NjIsImV4cCI6MjA1ODI3MzY2Mn0.GKJJqxfJRkFJylI1Zll1bj1HzKT2raWRpz6RMaZR37c"; await sbFetch("/rest/v1/client_contacts", { method: "POST", body: JSON.stringify({ client_id: record.id, name: contactForm.name, email: contactForm.email, phone: contactForm.phone || null, role: contactForm.role || null, is_primary: contactForm.isPrimary }) }); if (window.__aberdeen_toast) window.__aberdeen_toast("Contact saved", "success"); } catch (e) { if (window.__aberdeen_toast) window.__aberdeen_toast("Contact saved locally", "warning"); } }} disabled={!contactForm.name || !contactForm.email} style={{ padding: "6px 16px", background: (!contactForm.name || !contactForm.email) ? T.bgA : T.acc, color: (!contactForm.name || !contactForm.email) ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: (!contactForm.name || !contactForm.email) ? "default" : "pointer", fontFamily: "'Outfit'" }}>Save Contact</button>
          </div>
        </div>}
        {contacts.length === 0 ? <EmptyState icon={Users} title="No contacts" description="Add contacts for this client — hiring managers, procurement, billing." /> :
        contacts.map(ct => <div key={ct.id} style={{ padding: 14, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <CAvatar name={ct.name} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{ct.name}</span>{ct.isPrimary && <Badge color={T.ok}>PRIMARY</Badge>}</div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{ct.role || "Contact"}</div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.t2, marginTop: 4 }}>
              {ct.email && <span style={{ fontFamily: "var(--mono)" }}>✉ {ct.email}</span>}
              {ct.phone && <span style={{ fontFamily: "var(--mono)" }}>☎ {ct.phone}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => { setEmailOpen(true); setEmailSent(false); setEmailForm({ to: ct.email, subject: "", body: "", template: "" }); }} aria-label={`Email ${ct.name}`} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.acc}30`, background: T.acc + "0c", color: T.acc, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>Email</button>
            {!ct.isPrimary && <button onClick={() => { setContacts(p => p.map(c => ({ ...c, isPrimary: c.id === ct.id }))); }} aria-label="Set as primary" style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.ok}30`, background: T.ok + "0c", color: T.ok, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>★</button>}
            <button onClick={() => setContacts(p => p.filter(c => c.id !== ct.id))} aria-label={`Remove ${ct.name}`} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.err}30`, background: T.err + "0c", color: T.err, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>×</button>
          </div>
        </div>)}
      </div>;
    }
    if (tab === "Availability") return <div>
      <div style={{ padding: 16, background: record.status === "available" ? T.ok + "08" : T.warn + "08", border: `1px solid ${record.status === "available" ? T.ok + "20" : T.warn + "20"}`, borderRadius: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Availability Status</div><Badge color={record.status === "available" ? T.ok : T.warn}>{(record.status || "").replace(/_/g, " ").toUpperCase()}</Badge></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>{[[Calendar, "Available From", record.available_date || "Now"], [Clock, "Days on Bench", `${record.days_on_bench || 0} days`], [DollarSign, "Target Rate", record.bill_rate ? `$${record.bill_rate}/hr` : "—"]].map(([Ic, l, v], i) => <div key={i} style={{ textAlign: "center", padding: 10, background: T.bgE, borderRadius: 8 }}><Ic size={14} color={T.t3} style={{ margin: "0 auto 4px" }} /><div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10, color: T.t3 }}>{l}</div></div>)}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Utilization History</div>
      <div style={{ display: "flex", gap: 3, height: 40, alignItems: "flex-end" }}>{[65, 80, 95, 88, 72, 90, 85, 92, 78, 40, 0, record.utilization || 0].map((u, i) => <div key={i} style={{ flex: 1, height: `${u}%`, background: u >= 80 ? T.ok + "60" : u >= 50 ? T.warn + "60" : u > 0 ? T.err + "60" : T.bd, borderRadius: "3px 3px 0 0" }} />)}</div>
    </div>;
    if (tab === "Starts") {
      const isUpcoming = record.status === "pending_start";
      const startDate = record.start_date ? new Date(record.start_date) : null;
      const daysUntil = startDate ? Math.ceil((startDate - new Date()) / 86400000) : null;
      return <div>
        <div style={{ padding: 16, background: isUpcoming ? T.warn + "08" : T.ok + "08", border: `1px solid ${isUpcoming ? T.warn + "20" : T.ok + "20"}`, borderRadius: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{isUpcoming ? "Upcoming Start" : "Started"}</div><Badge color={isUpcoming ? T.warn : T.ok}>{isUpcoming ? "PENDING" : "ACTIVE"}</Badge></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>{[[Calendar, "Start Date", record.start_date || "—"], [Calendar, "End Date", record.end_date || "—"], [Clock, daysUntil > 0 ? "Days Until Start" : "Days Active", daysUntil != null ? `${Math.abs(daysUntil)} days` : "—"]].map(([Ic, l, v], i) => <div key={i} style={{ textAlign: "center", padding: 10, background: T.bgE, borderRadius: 8 }}><Ic size={14} color={T.t3} style={{ margin: "0 auto 4px" }} /><div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10, color: T.t3 }}>{l}</div></div>)}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Onboarding Checklist</div>
        {[["Background check", true], ["Drug screening", true], ["Client onboarding docs", !isUpcoming], ["Equipment provisioning", false], ["Day-one logistics confirmed", false]].map(([item, done], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.bd}` }}><div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${done ? T.ok : T.bd}`, background: done ? T.ok + "18" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{done && <CheckCircle size={12} color={T.ok} />}</div><span style={{ fontSize: 13, color: done ? T.t2 : T.t1, textDecoration: done ? "line-through" : "none" }}>{item}</span></div>)}
      </div>;
    }
    if (tab === "Documents") {
      const DOC_TYPES = [
        { id: "resume", label: "Resume / CV", icon: "📄", color: T.acc },
        { id: "cover_letter", label: "Cover Letter", icon: "✉️", color: T.vio },
        { id: "certificate", label: "Certificate", icon: "🏆", color: T.warn },
        { id: "id_document", label: "ID / Background", icon: "🪪", color: T.err },
        { id: "contract", label: "Contract / MSA", icon: "📋", color: T.teal },
        { id: "assessment", label: "Assessment", icon: "💻", color: T.ok },
        { id: "other", label: "Other", icon: "📎", color: T.t3 },
      ];
      const handleDocUpload = async (fileList) => {
        const files = Array.from(fileList);
        if (!files.length) return;
        setDocUploading(true);
        const newDocs = [];
        for (const file of files) {
          const localUrl = URL.createObjectURL(file);
          const ext = file.name.split(".").pop()?.toLowerCase();
          const autoType = ext === "pdf" && file.name.toLowerCase().includes("resume") ? "resume" : ext === "pdf" && file.name.toLowerCase().includes("cover") ? "cover_letter" : ext === "pdf" && (file.name.toLowerCase().includes("cert") || file.name.toLowerCase().includes("award")) ? "certificate" : ext === "pdf" && (file.name.toLowerCase().includes("msa") || file.name.toLowerCase().includes("sow") || file.name.toLowerCase().includes("nda")) ? "contract" : "other";
          const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          // Upload to Supabase Storage
          const storageUrl = await uploadToStorage(file, docId);
          const doc = { id: docId, name: file.name, type: autoType, size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`, uploadedBy: "Adam Parsons", uploadedAt: new Date().toISOString(), mimeType: file.type, url: storageUrl || localUrl, _file: file, _persisted: !!storageUrl };
          newDocs.push(doc);
        }
        setDocuments(prev => [...newDocs, ...prev]);
        setDocUploading(false);
      };
      const typeInfo = (typeId) => DOC_TYPES.find(t => t.id === typeId) || DOC_TYPES[DOC_TYPES.length - 1];
      const mimeIcon = (mime) => mime?.includes("pdf") ? "📕" : mime?.includes("image") ? "🖼️" : mime?.includes("word") || mime?.includes("doc") ? "📘" : mime?.includes("sheet") || mime?.includes("excel") || mime?.includes("csv") ? "📗" : "📄";

      return <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{documents.length} Document{documents.length !== 1 ? "s" : ""}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.xlsx,.csv" onChange={e => handleDocUpload(e.target.files)} style={{ display: "none" }} aria-hidden="true" />
            <button onClick={() => docInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}><Plus size={12} />Upload Document</button>
          </div>
        </div>

        {docUploading && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: T.teal + "0c", border: `1px solid ${T.teal}20`, borderRadius: 8, marginBottom: 12 }}><RefreshCw size={14} color={T.teal} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 12, color: T.teal }}>Uploading...</span></div>}

        {/* Drop zone */}
        <div onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.acc; e.currentTarget.style.background = T.acc + "06"; }} onDragLeave={e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.background = "transparent"; }} onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.background = "transparent"; handleDocUpload(e.dataTransfer.files); }} style={{ border: `2px dashed ${T.bd}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", marginBottom: 16, transition: "all 0.2s", cursor: "pointer" }} onClick={() => docInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); docInputRef.current?.click(); } }} aria-label="Upload documents by dropping files here or clicking">
          <div style={{ fontSize: 20, marginBottom: 4 }}>📎</div>
          <div style={{ fontSize: 12, color: T.t3 }}>Drag & drop files or click to browse</div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>PDF, DOC, DOCX, TXT, Images, Excel, CSV</div>
        </div>

        {/* Document list */}
        {documents.length === 0 ? <EmptyState icon={FileText} title="No documents" description="Upload resumes, cover letters, certificates, and other files." /> :
        documents.map(doc => {
          const ti = typeInfo(doc.type);
          return <div key={doc.id} style={{ padding: 12, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: ti.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{mimeIcon(doc.mimeType)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.t3, marginTop: 2 }}>
                <Badge color={ti.color}>{ti.label}</Badge>
                <span>{doc.size}</span>
                <span>·</span>
                <span>{doc.uploadedBy}</span>
                <span>·</span>
                <span>{formatDate(doc.uploadedAt)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {/* Category selector */}
              <select value={doc.type} onChange={e => setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, type: e.target.value } : d))} aria-label={`Category for ${doc.name}`} style={{ padding: "4px 6px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 4, color: T.t2, fontSize: 10, fontFamily: "var(--mono)", outline: "none" }}>
                {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
              {/* Preview button */}
              {doc.url && <button onClick={() => setDocPreview(doc)} aria-label={`Preview ${doc.name}`} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.acc}30`, background: T.acc + "0c", color: T.acc, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>View</button>}
              {/* Download */}
              {doc.url && <a href={doc.url} download={doc.name} aria-label={`Download ${doc.name}`} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.ok}30`, background: T.ok + "0c", color: T.ok, textDecoration: "none", fontSize: 10, fontFamily: "var(--mono)", display: "flex", alignItems: "center" }}>↓</a>}
              {/* Delete */}
              <button onClick={() => { if (doc.url) URL.revokeObjectURL(doc.url); setDocuments(prev => prev.filter(d => d.id !== doc.id)); }} aria-label={`Delete ${doc.name}`} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.err}30`, background: T.err + "0c", color: T.err, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>×</button>
            </div>
          </div>;
        })}

        {/* Document preview modal */}
        {docPreview && <div role="dialog" aria-modal="true" aria-label={`Preview ${docPreview.name}`} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDocPreview(null)}>
          <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>{mimeIcon(docPreview.mimeType)}</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>{docPreview.name}</div><div style={{ fontSize: 10, color: T.t3 }}>{docPreview.size} · {typeInfo(docPreview.type).label}</div></div></div>
              <div style={{ display: "flex", gap: 6 }}>
                {docPreview.url && <a href={docPreview.url} download={docPreview.name} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.ok}30`, background: T.ok + "0c", color: T.ok, textDecoration: "none", fontSize: 11, fontFamily: "var(--mono)" }}>Download</a>}
                <button onClick={() => setDocPreview(null)} aria-label="Close preview" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
              {docPreview.mimeType?.includes("image") ? <img src={docPreview.url} alt={docPreview.name} style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }} /> :
              docPreview.mimeType?.includes("pdf") ? <iframe src={docPreview.url} title={docPreview.name} style={{ width: "100%", height: "70vh", border: "none", borderRadius: 8, background: "#fff" }} /> :
              docPreview.mimeType?.includes("text") ? <div style={{ width: "100%", padding: 16, background: T.bg, borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: T.t2, whiteSpace: "pre-wrap", maxHeight: "70vh", overflow: "auto" }}>Loading text content...</div> :
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{mimeIcon(docPreview.mimeType)}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{docPreview.name}</div>
                <div style={{ fontSize: 12, color: T.t3, marginBottom: 12 }}>Preview not available for this file type</div>
                {docPreview.url && <a href={docPreview.url} download={docPreview.name} style={{ padding: "8px 20px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: "'Outfit'" }}>Download File</a>}
              </div>}
            </div>
          </div>
        </div>}
      </div>;
    }
    if (tab === "Timesheets") {
      const totalHrs = timesheets.reduce((s, t) => s + t.hours, 0);
      const totalRev = timesheets.reduce((s, t) => s + t.revenue, 0);
      const totalCost = timesheets.reduce((s, t) => s + t.cost, 0);
      const tsFormTotal = (tsForm.mon || 0) + (tsForm.tue || 0) + (tsForm.wed || 0) + (tsForm.thu || 0) + (tsForm.fri || 0) + (tsForm.sat || 0) + (tsForm.sun || 0);
      const addTimesheet = async () => {
        if (!tsForm.weekStart || tsFormTotal === 0) return;
        const br = record.bill_rate || 0; const pr = record.pay_rate || 0;
        const localTs = { id: `ts-${Date.now()}`, week: `Week ${timesheets.length + 1}`, startDate: tsForm.weekStart, hours: tsFormTotal, billRate: br, payRate: pr, revenue: tsFormTotal * br, cost: tsFormTotal * pr, status: "pending", dailyHours: { mon: tsForm.mon, tue: tsForm.tue, wed: tsForm.wed, thu: tsForm.thu, fri: tsForm.fri, sat: tsForm.sat, sun: tsForm.sun }, notes: tsForm.notes };
        setTimesheets(prev => [localTs, ...prev]);
        setTsAdding(false); setTsForm({ weekStart: "", mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0, notes: "" });
        // Write to Supabase
        try {
                      await sbFetch("/rest/v1/timesheets", { method: "POST", body: JSON.stringify({ placement_id: record.id, week_start: tsForm.weekStart, total_hours: tsFormTotal, mon_hours: tsForm.mon, tue_hours: tsForm.tue, wed_hours: tsForm.wed, thu_hours: tsForm.thu, fri_hours: tsForm.fri, sat_hours: tsForm.sat, sun_hours: tsForm.sun, bill_rate: br, pay_rate: pr, status: "pending", notes: tsForm.notes || null, submitted_at: new Date().toISOString() }) });
          if (window.__aberdeen_toast) window.__aberdeen_toast(`Timesheet logged: ${tsFormTotal} hours`, "success");
        } catch (e) { if (window.__aberdeen_toast) window.__aberdeen_toast("Timesheet saved locally", "warning"); }
      };
      return <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{timesheets.length} Timesheet{timesheets.length !== 1 ? "s" : ""}</div>
          <button onClick={() => setTsAdding(!tsAdding)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: tsAdding ? "transparent" : T.acc, color: tsAdding ? T.t3 : "#fff", border: tsAdding ? `1px solid ${T.bd}` : "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>{tsAdding ? "Cancel" : <><Plus size={12} />Log Hours</>}</button>
        </div>

        {/* Add timesheet form */}
        {tsAdding && <div style={{ padding: 16, background: T.bgE, border: `1px solid ${T.acc}25`, borderRadius: 10, marginBottom: 12, animation: "fadeIn 0.15s ease" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Log Weekly Hours</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>Week Starting</div>
            <input type="date" value={tsForm.weekStart} onChange={e => setTsForm(p => ({ ...p, weekStart: e.target.value }))} aria-label="Week start date" style={{ padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} />
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginBottom: 6 }}>Daily Hours</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[["Mon", "mon"], ["Tue", "tue"], ["Wed", "wed"], ["Thu", "thu"], ["Fri", "fri"], ["Sat", "sat"], ["Sun", "sun"]].map(([label, key]) => <div key={key} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.t3, marginBottom: 2, fontWeight: 600 }}>{label}</div>
              <input type="number" min={0} max={24} value={tsForm[key]} onChange={e => setTsForm(p => ({ ...p, [key]: Math.max(0, Math.min(24, parseInt(e.target.value) || 0)) }))} aria-label={`${label} hours`} style={{ width: "100%", padding: "6px 2px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t1, fontSize: 14, fontFamily: "var(--mono)", outline: "none", textAlign: "center" }} />
            </div>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 10px", background: T.bg, borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: T.t3 }}>Total Hours</span>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--mono)", color: tsFormTotal > 0 ? T.acc : T.t3 }}>{tsFormTotal}</span>
          </div>
          {tsFormTotal > 0 && <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.t2, marginBottom: 10, fontFamily: "var(--mono)" }}>
            <span>Revenue: <span style={{ color: T.ok }}>${(tsFormTotal * (record.bill_rate || 0)).toLocaleString()}</span></span>
            <span>Cost: ${(tsFormTotal * (record.pay_rate || 0)).toLocaleString()}</span>
            <span>Margin: <span style={{ color: T.ok }}>${(tsFormTotal * ((record.bill_rate || 0) - (record.pay_rate || 0))).toLocaleString()}</span></span>
          </div>}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>Notes (optional)</div>
            <input value={tsForm.notes} onChange={e => setTsForm(p => ({ ...p, notes: e.target.value }))} placeholder="Holiday week, PTO Friday, overtime approved..." aria-label="Timesheet notes" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setTsAdding(false)} style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 12 }}>Cancel</button>
            <button onClick={addTimesheet} disabled={!tsForm.weekStart || tsFormTotal === 0} style={{ padding: "6px 16px", background: (!tsForm.weekStart || tsFormTotal === 0) ? T.bgA : T.acc, color: (!tsForm.weekStart || tsFormTotal === 0) ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: (!tsForm.weekStart || tsFormTotal === 0) ? "default" : "pointer", fontFamily: "'Outfit'" }}>Submit Timesheet</button>
          </div>
        </div>}

        <div className="g4" style={{ gap: 8, marginBottom: 16 }}>
          <MetricCard label="TOTAL HOURS" value={totalHrs} color={T.acc} />
          <MetricCard label="REVENUE" value={`$${(totalRev / 1000).toFixed(1)}K`} color={T.ok} />
          <MetricCard label="COST" value={`$${(totalCost / 1000).toFixed(1)}K`} />
          <MetricCard label="MARGIN" value={totalRev > 0 ? `${((1 - totalCost / totalRev) * 100).toFixed(1)}%` : "—"} color={T.ok} />
        </div>
        {timesheets.length === 0 ? <EmptyState icon={Clock} title="No timesheets" description="Click 'Log Hours' to submit your first timesheet." /> :
        timesheets.map(ts => {
          const margin = ts.revenue > 0 ? ((1 - ts.cost / ts.revenue) * 100).toFixed(1) : "0";
          const expanded = tsExpanded === ts.id;
          return <div key={ts.id} style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }} onClick={() => setTsExpanded(expanded ? null : ts.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTsExpanded(expanded ? null : ts.id); } }}>
              <ChevronRight size={14} color={T.t3} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{ts.week}</div>
                <div style={{ fontSize: 11, color: T.t3, fontFamily: "var(--mono)" }}>{ts.startDate}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12 }}>
                <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{ts.hours} hrs</span>
                <span style={{ fontFamily: "var(--mono)", color: T.ok }}>${ts.revenue.toLocaleString()}</span>
                <span style={{ fontFamily: "var(--mono)", color: parseFloat(margin) >= 30 ? T.ok : T.warn }}>{margin}%</span>
                <Badge color={ts.status === "approved" ? T.ok : ts.status === "rejected" ? T.err : T.warn}>{ts.status}</Badge>
                {ts.status === "pending" && <div style={{ display: "flex", gap: 2 }}>
                  <button onClick={e => { e.stopPropagation(); setTimesheets(p => p.map(t => t.id === ts.id ? { ...t, status: "approved" } : t)); }} aria-label="Approve" style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.ok}30`, background: T.ok + "0c", color: T.ok, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>Approve</button>
                  <button onClick={e => { e.stopPropagation(); setTimesheets(p => p.map(t => t.id === ts.id ? { ...t, status: "rejected" } : t)); }} aria-label="Reject" style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.err}30`, background: T.err + "0c", color: T.err, cursor: "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>Reject</button>
                </div>}
              </div>
            </div>
            {/* Expanded detail */}
            {expanded && <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${T.bd}`, animation: "fadeIn 0.15s ease" }}>
              {ts.dailyHours ? <div style={{ display: "flex", gap: 4, marginTop: 10, marginBottom: 8 }}>
                {[["Mon", ts.dailyHours.mon], ["Tue", ts.dailyHours.tue], ["Wed", ts.dailyHours.wed], ["Thu", ts.dailyHours.thu], ["Fri", ts.dailyHours.fri], ["Sat", ts.dailyHours.sat], ["Sun", ts.dailyHours.sun]].map(([d, h]) => <div key={d} style={{ flex: 1, textAlign: "center", padding: "6px 2px", background: h > 0 ? T.acc + "0c" : T.bg, border: `1px solid ${h > 0 ? T.acc + "20" : T.bd}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: T.t3, fontWeight: 600 }}>{d}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: h > 0 ? T.t1 : T.t3 }}>{h}</div>
                </div>)}
              </div> : <div style={{ padding: "8px 0", fontSize: 12, color: T.t3 }}>{ts.hours} hours logged (daily breakdown not available)</div>}
              <div className="g4" style={{ gap: 6, fontSize: 11 }}>
                <div style={{ textAlign: "center", padding: 6, background: T.bg, borderRadius: 6 }}><div style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>${ts.billRate}/hr</div><div style={{ fontSize: 9, color: T.t3 }}>Bill Rate</div></div>
                <div style={{ textAlign: "center", padding: 6, background: T.bg, borderRadius: 6 }}><div style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>${ts.revenue.toLocaleString()}</div><div style={{ fontSize: 9, color: T.t3 }}>Revenue</div></div>
                <div style={{ textAlign: "center", padding: 6, background: T.bg, borderRadius: 6 }}><div style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>${ts.cost.toLocaleString()}</div><div style={{ fontSize: 9, color: T.t3 }}>Cost</div></div>
                <div style={{ textAlign: "center", padding: 6, background: T.bg, borderRadius: 6 }}><div style={{ fontFamily: "var(--mono)", fontWeight: 600, color: T.ok }}>${(ts.revenue - ts.cost).toLocaleString()}</div><div style={{ fontSize: 9, color: T.t3 }}>Margin</div></div>
              </div>
              {ts.notes && <div style={{ marginTop: 8, fontSize: 11, color: T.t3, fontStyle: "italic" }}>📝 {ts.notes}</div>}
            </div>}
          </div>;
        })}
      </div>;
    }
    if (tab === "Pipeline") {
      const STAGE_ORDER = ["sourced", "screened", "submitted", "interview", "offer", "placed"];
      const STAGE_META = { sourced: { label: "Sourced", color: T.t3 }, screened: { label: "Screened", color: T.acc }, submitted: { label: "Submitted", color: T.warn }, interview: { label: "Interview", color: T.ora }, offer: { label: "Offer", color: T.teal }, placed: { label: "Placed", color: T.ok } };
      const matchRes = runLocalHybridMatch(MOCK_CANDS.slice(0, 8), record, null);
      const stageMap = { ELITE: "submitted", STRONG: "screened", MODERATE: "sourced", WEAK: "sourced" };
      const stageAssign = matchRes.map((m, i) => {
        const defaultStage = i === 0 && m.tier === "ELITE" ? "interview" : m.tier === "ELITE" ? "submitted" : stageMap[m.tier] || "sourced";
        return { ...m, stage: pipelineMoves[m.candidate_name] || defaultStage };
      });
      const moveCandidate = (name, direction) => {
        const current = stageAssign.find(c => c.candidate_name === name)?.stage || "sourced";
        const idx = STAGE_ORDER.indexOf(current);
        const newIdx = direction === "right" ? Math.min(idx + 1, STAGE_ORDER.length - 1) : Math.max(idx - 1, 0);
        if (newIdx !== idx) setPipelineMoves(prev => ({ ...prev, [name]: STAGE_ORDER[newIdx] }));
      };
      const stages = STAGE_ORDER.map(key => ({ key, ...STAGE_META[key], candidates: stageAssign.filter(m => m.stage === key).map(m => ({ name: m.candidate_name, score: m.match_score, days: 3, tier: m.tier })) }));
      const total = stages.reduce((s, st) => s + st.candidates.length, 0);
      return <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: T.t2 }}>{total} candidates in pipeline</div>
          <button onClick={() => { setPipelineOpen(true); setPipelineResult(null); setPipelineJob(null); setPipelineStage("sourced"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.acc + "12", border: `1px solid ${T.acc}30`, borderRadius: 8, color: T.acc, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit'" }}><UserPlus size={12} />Add to Pipeline</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 8, minHeight: 320 }}>
          {stages.map((stage, si) => <div key={stage.key} style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} /><span style={{ fontSize: 12, fontWeight: 600 }}>{stage.label}</span></div>
              <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: T.t3, background: T.bgE, padding: "1px 6px", borderRadius: 4 }}>{stage.candidates.length}</span>
            </div>
            <div tabIndex={0} aria-label={`${stage.label} stage candidates`} style={{ flex: 1, padding: 6, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {stage.candidates.map((c, ci) => <div key={ci} style={{ padding: 10, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 8, transition: "all 0.12s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color + "60"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.bd; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><CAvatar name={c.name} size={24} /><span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><ScoreBadge score={c.score} /><span style={{ fontSize: 9, fontFamily: "var(--mono)", color: T.t3 }}>{c.days}d</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                  <button onClick={() => moveCandidate(c.name, "left")} disabled={si === 0} aria-label={`Move ${c.name} to previous stage`} style={{ flex: 1, padding: "3px 0", borderRadius: 4, border: `1px solid ${si === 0 ? T.bd : T.acc + "30"}`, background: si === 0 ? "transparent" : T.acc + "08", color: si === 0 ? T.bd : T.acc, cursor: si === 0 ? "default" : "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>← Back</button>
                  <button onClick={() => moveCandidate(c.name, "right")} disabled={si === stages.length - 1} aria-label={`Move ${c.name} to next stage`} style={{ flex: 1, padding: "3px 0", borderRadius: 4, border: `1px solid ${si === stages.length - 1 ? T.bd : T.ok + "30"}`, background: si === stages.length - 1 ? "transparent" : T.ok + "08", color: si === stages.length - 1 ? T.bd : T.ok, cursor: si === stages.length - 1 ? "default" : "pointer", fontSize: 10, fontFamily: "var(--mono)" }}>Next →</button>
                </div>
              </div>)}
              {stage.candidates.length === 0 && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, border: `1px dashed ${T.bd}`, borderRadius: 8 }}><span style={{ fontSize: 11, color: T.t3 }}>Empty</span></div>}
            </div>
          </div>)}
        </div>
        <div style={{ display: "flex", gap: 2, marginTop: 12, borderRadius: 6, overflow: "hidden", height: 6 }}>{stages.map(s => <div key={s.key} style={{ flex: s.candidates.length || 0.2, background: s.candidates.length > 0 ? s.color : T.bd }} />)}</div>
      </div>;
    }
    return <EmptyState icon={Paperclip} title={`No ${tab.toLowerCase()}`} description={`${tab} will appear here.`} />;
  };

  const quickStats = config.quickStats ? config.quickStats(record) : [["Score", record.score || "—", record.score >= 80 ? T.ok : T.warn], ["YoE", record.years_experience || "—"], ["Notes", record.notes_count || 0], ["Subs", record.submissions_count || 0]];
  const actions = config.actions || [[Mail, "Send Email", T.acc], [Send, "Create Submission", T.warn], [Calendar, "Schedule Interview", T.vio], [TrendingUp, "Add to Pipeline", T.ok]];

  return <div style={{ animation: "fadeIn 0.2s ease" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t2, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}><ChevronLeft size={14} />{config.name}</button>
      <div style={{ flex: 1 }} />
      {editing ? <>
        <button onClick={cancelEditing} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${T.bd}`, background: "transparent", color: T.t3, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit'" }}>Cancel</button>
        <button onClick={saveEdits} disabled={editSaving} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: editSaving ? T.bgA : T.ok, color: editSaving ? T.t3 : "#fff", cursor: editSaving ? "default" : "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Outfit'", marginLeft: 6 }}>{editSaving ? "Saving..." : "Save"}</button>
      </> : <>
        <IconBtn title="Edit" onClick={startEditing}><Edit3 size={16} /></IconBtn>
        <IconBtn title="More"><MoreHorizontal size={16} /></IconBtn>
      </>}
    </div>
    <div className="g-detail">
      <div>
        <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 16 }}>
            {config.detailIcon ? <div style={{ width: 64, height: 64, borderRadius: 16, background: config.color + "1a", display: "flex", alignItems: "center", justifyContent: "center" }}>{(() => { const IC = config.detailIcon; return <IC size={28} color={config.color} />; })()}</div> : <CAvatar name={editing ? (editForm.name || editForm.candidate_name) : (record.name || record.candidate_name)} size={64} />}
            {editing ? <div style={{ width: "100%", marginTop: 12 }}>
              <input value={editForm.name || editForm.candidate_name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} aria-label="Edit name" style={{ width: "100%", padding: "6px 10px", background: T.bg, border: `1px solid ${T.acc}30`, borderRadius: 8, color: T.t1, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit'", outline: "none", textAlign: "center", marginBottom: 6 }} />
              <input value={editForm.title || ""} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="Title / Role" aria-label="Edit title" style={{ width: "100%", padding: "4px 10px", background: T.bg, border: `1px solid ${T.acc}30`, borderRadius: 8, color: T.t2, fontSize: 13, fontFamily: "'Outfit'", outline: "none", textAlign: "center", marginBottom: 4 }} />
              {(record.current_company || record.client_name || config.name === "Candidates") && <input value={editForm.current_company || editForm.client_name || ""} onChange={e => setEditForm(p => record.client_name !== undefined ? ({ ...p, client_name: e.target.value }) : ({ ...p, current_company: e.target.value }))} placeholder="Company / Client" aria-label="Edit company" style={{ width: "100%", padding: "4px 10px", background: T.bg, border: `1px solid ${T.acc}30`, borderRadius: 8, color: T.t3, fontSize: 12, fontFamily: "'Outfit'", outline: "none", textAlign: "center" }} />}
            </div> : <>
              <h2 style={{ fontFamily: "'Outfit'", fontSize: 20, fontWeight: 700, marginTop: 12 }}>{record.name || record.candidate_name || record.title}</h2>
              <div style={{ fontSize: 13, color: T.t2, marginTop: 2 }}>{record.title !== record.name ? record.title : record.department}</div>
              {(record.current_company || record.client_name) && <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{record.current_company || record.client_name}</div>}
            </>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, marginBottom: 6, textTransform: "uppercase" }}>Pipeline Status</div>
            <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>{config.statuses.slice(0, 7).map((s, i) => <div key={s.value} style={{ flex: 1, height: 4, borderRadius: 2, background: config.statuses.findIndex(x => x.value === status) >= i ? st.color : T.bd }} />)}</div>
            <StatusDropdown statuses={config.statuses} current={status} onChange={handleStatusChange} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{quickStats.map(([l, v, c], i) => <div key={i} style={{ textAlign: "center", padding: 10, background: T.bg, borderRadius: 8 }}><div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--mono)", color: c || T.t1 }}>{v}</div><div style={{ fontSize: 9, color: T.t3, fontWeight: 600 }}>{l}</div></div>)}</div>
        </div>
        <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase", padding: "0 4px" }}>Actions</div>
          {actions.map(([Ic, l, c], i) => <button key={i} aria-label={l} onClick={l === "Send Email" || l === "Email Candidate" || l === "Contact" || l === "Email Client" ? () => { setEmailOpen(true); setEmailSent(false); setEmailForm({ to: record.email || record.contact_email || "", subject: "", body: "", template: "" }); } : l === "Create Submission" || l === "Submit Candidate" ? () => setSubmitOpen(true) : l === "Schedule Interview" ? () => { setInterviewOpen(true); setInterviewResult(null); setInterviewForm({ date: "", time: "", duration: 60, type: "video", interviewer: "", notes: "", job_id: "", candidateEmail: record.email || "", additionalEmails: "" }); } : l === "Add to Pipeline" ? () => { setPipelineOpen(true); setPipelineResult(null); setPipelineJob(null); setPipelineStage("sourced"); } : l === "View Pipeline" ? () => setTab("Pipeline") : l === "Score Job" ? () => setTab("Intelligence") : l === "Generate JD" ? () => setTab("Intelligence") : l === "Send for Signature" || l === "Send Offer Letter" ? () => { setEsigOpen(true); setEsigStep(0); setEsigResult(null); setEsigEnvelope(p => ({ ...p, signers: [{ role: "candidate", name: record.candidate_name || record.name || "", email: record.email || "" }, { role: "hiring_manager", name: "", email: "" }], emailSubject: `Offer Letter — ${record.job_title || record.title || "Position"}` })); } : l === "Mark Accepted" ? () => { handleStatusChange("accepted"); } : l === "View Timesheets" ? () => setTab("Timesheets") : l === "Revenue Report" ? () => setRevenueOpen(true) : l === "Extend" ? () => { setExtendOpen(true); setExtendResult(null); setExtendForm({ newEndDate: "", newBillRate: record.bill_rate || "", newPayRate: record.pay_rate || "", reason: "" }); } : l === "Create Job" ? () => onNavigate && onNavigate("jobs") : l === "Add Contact" ? () => { setTab("Contacts"); setContactOpen(true); setContactForm({ name: "", email: "", phone: "", role: "", isPrimary: false }); } : l === "Submit to Job" ? () => setSubmitOpen(true) : l === "Find Matching Jobs" ? () => setTab("Submissions") : l === "Set Availability" ? () => setTab("Availability") : l === "View Candidate" ? () => onNavigate && onNavigate("candidates") : l === "Process Reward" ? () => handleStatusChange("hired") : l === "Thank Referrer" ? () => { setEmailOpen(true); setEmailSent(false); setEmailForm({ to: record.referrer_email || "", subject: "Thank You for Your Referral!", body: "Hi " + (record.referred_by || "") + ",\n\nThank you for referring " + (record.candidate_name || "") + ". We appreciate your help in finding great talent.\n\nBest regards,\nAdam Parsons\nAberdeen Advisors", template: "custom" }); } : undefined} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 8px", borderRadius: 8, border: "none", background: "transparent", color: T.t2, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13, transition: "all 0.12s" }} onMouseEnter={e => e.currentTarget.style.background = T.bgH} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onFocus={e => e.currentTarget.style.background = T.bgH} onBlur={e => e.currentTarget.style.background = "transparent"}><Ic size={14} color={c} />{l}</button>)}
        </div>
      </div>
      <div>
        <div role="tablist" aria-label={`${config.singular} sections`} style={{ display: "flex", gap: 2, marginBottom: 16, background: T.bgE, borderRadius: 10, padding: 3, border: `1px solid ${T.bd}` }}>
          {config.tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 8, background: tab === t ? config.color + "15" : "transparent", border: tab === t ? `1px solid ${config.color}30` : "1px solid transparent", color: tab === t ? config.color : T.t3, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit'", flex: 1, textAlign: "center" }}>{t}</button>)}
        </div>
        <div role="tabpanel" aria-label={`${tab} content`}>{renderTab()}</div>
      </div>
    </div>

    {/* ═══ DOCUSIGN eSIGNATURE MODAL ═══ */}
    {esigOpen && <div role="dialog" aria-modal="true" aria-label="Send for electronic signature" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEsigOpen(false)}>
      <div role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease", maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileText size={16} color={T.warn} /><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Send for Signature</h2></div>
          <button onClick={() => setEsigOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 2, padding: "12px 20px", borderBottom: `1px solid ${T.bd}` }}>
          {["Template", "Signers", "Review & Send"].map((s, i) => <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= esigStep ? T.warn : T.bd, marginBottom: 4, transition: "background 0.2s" }} />
            <span style={{ fontSize: 10, color: i <= esigStep ? T.warn : T.t3, fontWeight: i === esigStep ? 600 : 400, fontFamily: "var(--mono)" }}>{s}</span>
          </div>)}
        </div>

        {esigResult === "success" ? <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.ok + "1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>✍️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Envelope Sent for Signature</div>
          <div style={{ fontSize: 13, color: T.t3, marginBottom: 4 }}>To: {esigEnvelope.signers.map(s => s.name).filter(Boolean).join(", ")}</div>
          <div style={{ fontSize: 11, color: T.warn, fontFamily: "var(--mono)", marginBottom: 12 }}>Envelope ID: ENV-{Date.now().toString(36).toUpperCase()}</div>
          <div style={{ padding: 8, background: T.warn + "08", border: `1px solid ${T.warn}20`, borderRadius: 6, fontSize: 11, color: T.warn, maxWidth: 360, margin: "0 auto 16px" }}>🔌 In production, DocuSign API creates a real envelope and emails signing links to each signer automatically.</div>
          <button onClick={() => { setEsigOpen(false); setEsigResult(null); }} style={{ padding: "8px 24px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Done</button>
        </div> : <div style={{ flex: 1, overflowY: "auto", padding: 20 }} tabIndex={0}>

          {/* STEP 0: Template Selection */}
          {esigStep === 0 && <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 10, textTransform: "uppercase" }}>Offer Letter Template</div>
            {[{ id: "standard_offer", label: "Standard Offer Letter", desc: "Full-time employment offer with compensation, start date, and terms", icon: "📄" }, { id: "contract_offer", label: "Contract / SOW", desc: "Independent contractor agreement with rates and project scope", icon: "📋" }, { id: "extension", label: "Contract Extension", desc: "Extend existing placement with updated terms", icon: "🔄" }, { id: "custom", label: "Custom Document", desc: "Upload your own document for signature", icon: "📎" }].map(t => <button key={t.id} onClick={() => setEsigEnvelope(p => ({ ...p, template: t.id }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 6, borderRadius: 10, border: `1px solid ${esigEnvelope.template === t.id ? T.warn + "40" : T.bd}`, background: esigEnvelope.template === t.id ? T.warn + "08" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, width: "100%", transition: "all 0.12s" }}>
              <span style={{ fontSize: 24 }}>{t.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div><div style={{ fontSize: 11, color: T.t3 }}>{t.desc}</div></div>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${esigEnvelope.template === t.id ? T.warn : T.bd2}`, background: esigEnvelope.template === t.id ? T.warn : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{esigEnvelope.template === t.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}</div>
            </button>)}

            {/* Document preview placeholder */}
            <div style={{ marginTop: 12, padding: 16, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.5 }}>📄</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Document Preview</div>
              <div style={{ fontSize: 11, color: T.t3, marginBottom: 8 }}>Offer for {record.candidate_name || record.name} — {record.job_title || record.title}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: T.t3, padding: 12, background: T.bgE, borderRadius: 6, textAlign: "left", lineHeight: 1.8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>OFFER LETTER</div>
                <div>Dear {record.candidate_name || record.name},</div>
                <div>We are pleased to offer you the position of {record.job_title || record.title} at {record.client_name || "our company"}.</div>
                {record.salary && <div>Compensation: {formatCurrency(record.salary)} annually</div>}
                {record.start_date && <div>Start Date: {record.start_date}</div>}
                <div style={{ marginTop: 8 }}>[Signature fields placed here by DocuSign]</div>
                <div style={{ marginTop: 4, display: "flex", gap: 20 }}>
                  <span style={{ padding: "2px 30px", borderBottom: `2px solid ${T.warn}`, color: T.warn }}>Candidate ✍️</span>
                  <span style={{ padding: "2px 30px", borderBottom: `2px solid ${T.vio}`, color: T.vio }}>Hiring Mgr ✍️</span>
                </div>
              </div>
            </div>
          </div>}

          {/* STEP 1: Signer Configuration */}
          {esigStep === 1 && <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 10, textTransform: "uppercase" }}>Configure Signers</div>
            {esigEnvelope.signers.map((signer, si) => <div key={si} style={{ padding: 14, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Badge color={signer.role === "candidate" ? T.acc : signer.role === "hiring_manager" ? T.vio : T.teal}>Signer {si + 1}: {signer.role.replace("_", " ")}</Badge>
                {si > 1 && <button onClick={() => setEsigEnvelope(p => ({ ...p, signers: p.signers.filter((_, j) => j !== si) }))} aria-label="Remove signer" style={{ background: "none", border: "none", color: T.err, cursor: "pointer", fontSize: 14 }}>×</button>}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input value={signer.name} onChange={e => setEsigEnvelope(p => ({ ...p, signers: p.signers.map((s, j) => j === si ? { ...s, name: e.target.value } : s) }))} placeholder="Full name" aria-label={`Signer ${si + 1} name`} style={{ flex: 1, padding: "7px 10px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
                <select value={signer.role} onChange={e => setEsigEnvelope(p => ({ ...p, signers: p.signers.map((s, j) => j === si ? { ...s, role: e.target.value } : s) }))} aria-label={`Signer ${si + 1} role`} style={{ padding: "7px 10px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }}>
                  <option value="candidate">Candidate</option><option value="hiring_manager">Hiring Manager</option><option value="countersigner">Countersigner</option><option value="witness">Witness</option>
                </select>
              </div>
              <input type="email" value={signer.email} onChange={e => setEsigEnvelope(p => ({ ...p, signers: p.signers.map((s, j) => j === si ? { ...s, email: e.target.value } : s) }))} placeholder="Email address" aria-label={`Signer ${si + 1} email`} style={{ width: "100%", padding: "7px 10px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
              {/* Signature field placement */}
              <div style={{ marginTop: 8, fontSize: 10, color: T.t3 }}>📍 Signature placement: <span style={{ fontFamily: "var(--mono)", color: signer.role === "candidate" ? T.acc : T.vio }}>Page 1, Bottom — auto-positioned by DocuSign</span></div>
            </div>)}
            <button onClick={() => setEsigEnvelope(p => ({ ...p, signers: [...p.signers, { role: "countersigner", name: "", email: "" }] }))} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: `1px dashed ${T.bd2}`, background: "transparent", cursor: "pointer", color: T.t3, fontSize: 12, fontFamily: "'Outfit'", width: "100%", justifyContent: "center" }}><Plus size={14} />Add Signer</button>

            <div style={{ marginTop: 12, padding: 10, background: T.bgH, borderRadius: 8, fontSize: 10, color: T.t3 }}>
              <div style={{ fontWeight: 600, marginBottom: 2, color: T.t2 }}>Signing Order</div>
              <div>Signers receive the document in the order listed above. Each signer must complete before the next receives it.</div>
            </div>
          </div>}

          {/* STEP 2: Review & Send */}
          {esigStep === 2 && <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 10, textTransform: "uppercase" }}>Review & Send</div>
            {/* Email config */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Email Subject</div>
              <input value={esigEnvelope.emailSubject} onChange={e => setEsigEnvelope(p => ({ ...p, emailSubject: e.target.value }))} aria-label="Email subject" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Email Message to Signers</div>
              <textarea value={esigEnvelope.emailBody} onChange={e => setEsigEnvelope(p => ({ ...p, emailBody: e.target.value }))} rows={3} aria-label="Email message" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none", resize: "none" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Expires In</div>
              <select value={esigEnvelope.expiresInDays} onChange={e => setEsigEnvelope(p => ({ ...p, expiresInDays: parseInt(e.target.value) }))} aria-label="Expiration days" style={{ padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }}>
                {[3, 5, 7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>

            {/* Summary */}
            <div style={{ padding: 14, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Envelope Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: T.t3 }}>Template</span><span>{esigEnvelope.template.replace(/_/g, " ")}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: T.t3 }}>Signers</span><span>{esigEnvelope.signers.length}</span></div>
                {esigEnvelope.signers.map((s, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12 }}><span style={{ color: T.t3 }}>{s.role.replace("_", " ")}</span><span>{s.name || "—"} ({s.email || "no email"})</span></div>)}
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: T.t3 }}>Expires</span><span>{esigEnvelope.expiresInDays} days</span></div>
              </div>
            </div>

            {/* ┌──────────────────────────────────────────────────────┐ */}
            {/* │ 🔌 DOCUSIGN API INTEGRATION POINTS                  │ */}
            {/* │                                                      │ */}
            {/* │ POST /restapi/v2.1/accounts/{id}/envelopes           │ */}
            {/* │ Body: { emailSubject, emailBlurb, status: "sent",   │ */}
            {/* │   documents: [{ documentBase64, name, fileExtension,│ */}
            {/* │     documentId }],                                   │ */}
            {/* │   recipients: { signers: [{ email, name,            │ */}
            {/* │     recipientId, routingOrder, tabs: {              │ */}
            {/* │       signHereTabs: [{ xPosition, yPosition,       │ */}
            {/* │         documentId, pageNumber }] } }] } }         │ */}
            {/* │                                                      │ */}
            {/* │ Response: { envelopeId, status, statusDateTime }    │ */}
            {/* └──────────────────────────────────────────────────────┘ */}

            <div style={{ padding: 10, background: T.bgH, border: `1px solid ${T.bd}`, borderRadius: 8, fontSize: 11, color: T.t3 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: T.t2 }}>🔌 DocuSign eSignature API</div>
              <div>① <strong>POST /envelopes</strong> — Creates envelope with document, recipients, and signature tabs</div>
              <div>② Signers receive email with link to review and sign</div>
              <div>③ <strong>DocuSign Connect webhook</strong> fires on each status change → updates Supabase</div>
            </div>
          </div>}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => { if (esigStep === 0) setEsigOpen(false); else setEsigStep(s => s - 1); }} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}>{esigStep === 0 ? "Cancel" : "Back"}</button>
            {esigStep < 2 ? <button onClick={() => setEsigStep(s => s + 1)} disabled={esigStep === 1 && esigEnvelope.signers.some(s => !s.name || !s.email)} style={{ padding: "8px 24px", background: (esigStep === 1 && esigEnvelope.signers.some(s => !s.name || !s.email)) ? T.bgA : T.warn, color: (esigStep === 1 && esigEnvelope.signers.some(s => !s.name || !s.email)) ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (esigStep === 1 && esigEnvelope.signers.some(s => !s.name || !s.email)) ? "default" : "pointer", fontFamily: "'Outfit'" }}>Next</button> :
            <button onClick={async () => {
              setEsigSending(true);
              try {
                                        const envId = `ENV-${Date.now().toString(36).toUpperCase()}`;
                const envelope = { id: envId, offer_id: record.id, template: esigEnvelope.template, signers: esigEnvelope.signers, emailSubject: esigEnvelope.emailSubject, emailBody: esigEnvelope.emailBody, expiresInDays: esigEnvelope.expiresInDays, status: "sent", created_at: new Date().toISOString() };
                try { await sbFetch("/rest/v1/envelopes", { method: "POST", body: JSON.stringify(envelope) }); } catch (e) {}
                setEnvelopes(prev => [envelope, ...prev]);
                setEsigResult("success");
                if (window.__aberdeen_toast) window.__aberdeen_toast("Envelope sent for signature", "success");
              } catch (e) { setEsigResult("error"); }
              setEsigSending(false);
            }} disabled={esigSending} style={{ padding: "8px 24px", background: esigSending ? T.bgA : T.warn, color: esigSending ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: esigSending ? "default" : "pointer", fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6 }}>{esigSending ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />Sending...</> : <><FileText size={12} />Send for Signature</>}</button>}
          </div>
        </div>}
      </div>
    </div>}

    {/* ═══ EXTEND PLACEMENT MODAL ═══ */}
    {extendOpen && <div role="dialog" aria-modal="true" aria-label="Extend placement" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setExtendOpen(false)}>
      <div role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease", maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Extend Placement</h2><p style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{record.candidate_name} — {record.client_name}</p></div>
          <button onClick={() => setExtendOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>
        {extendResult === "success" ? <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.ok + "1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><CheckCircle size={24} color={T.ok} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Placement Extended</div>
          <div style={{ fontSize: 13, color: T.t3 }}>New end date: {extendForm.newEndDate}</div>
          <button onClick={() => { setExtendOpen(false); setExtendResult(null); }} style={{ marginTop: 16, padding: "8px 24px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Done</button>
        </div> : <div style={{ padding: 20 }}>
          {/* Current terms */}
          <div style={{ padding: 12, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 6, textTransform: "uppercase" }}>Current Terms</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
              <div><span style={{ color: T.t3 }}>End Date: </span><span style={{ fontFamily: "var(--mono)" }}>{record.end_date || "—"}</span></div>
              <div><span style={{ color: T.t3 }}>Bill Rate: </span><span style={{ fontFamily: "var(--mono)" }}>${record.bill_rate}/hr</span></div>
              <div><span style={{ color: T.t3 }}>Pay Rate: </span><span style={{ fontFamily: "var(--mono)" }}>${record.pay_rate}/hr</span></div>
              <div><span style={{ color: T.t3 }}>Margin: </span><span style={{ fontFamily: "var(--mono)", color: T.ok }}>{record.bill_rate && record.pay_rate ? ((1 - record.pay_rate / record.bill_rate) * 100).toFixed(1) : 0}%</span></div>
            </div>
          </div>
          {/* New terms */}
          <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>New Terms</div>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>New End Date</div><input type="date" value={extendForm.newEndDate} onChange={e => setExtendForm(p => ({ ...p, newEndDate: e.target.value }))} aria-label="New end date" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /></div>
          <div className="g2" style={{ gap: 8, marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>New Bill Rate ($/hr)</div><input type="number" value={extendForm.newBillRate} onChange={e => setExtendForm(p => ({ ...p, newBillRate: e.target.value }))} aria-label="New bill rate" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /></div>
            <div><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>New Pay Rate ($/hr)</div><input type="number" value={extendForm.newPayRate} onChange={e => setExtendForm(p => ({ ...p, newPayRate: e.target.value }))} aria-label="New pay rate" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} /></div>
          </div>
          {extendForm.newBillRate && extendForm.newPayRate && <div style={{ padding: 8, background: T.ok + "08", border: `1px solid ${T.ok}20`, borderRadius: 6, marginBottom: 10, fontSize: 11, fontFamily: "var(--mono)" }}>
            New margin: <span style={{ color: T.ok, fontWeight: 700 }}>{((1 - extendForm.newPayRate / extendForm.newBillRate) * 100).toFixed(1)}%</span>
            {extendForm.newEndDate && <span style={{ marginLeft: 12 }}>Est. additional revenue: <span style={{ color: T.ok, fontWeight: 700 }}>${((extendForm.newBillRate - extendForm.newPayRate) * 40 * Math.ceil((new Date(extendForm.newEndDate) - new Date(record.end_date || new Date())) / 604800000)).toLocaleString()}</span></span>}
          </div>}
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>Reason for Extension</div><textarea value={extendForm.reason} onChange={e => setExtendForm(p => ({ ...p, reason: e.target.value }))} placeholder="Client requested extension, project Phase 2..." rows={2} aria-label="Extension reason" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none", resize: "none" }} /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setExtendOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}>Cancel</button>
            <button onClick={() => { Object.assign(record, { end_date: extendForm.newEndDate || record.end_date, bill_rate: extendForm.newBillRate ? Number(extendForm.newBillRate) : record.bill_rate, pay_rate: extendForm.newPayRate ? Number(extendForm.newPayRate) : record.pay_rate, status: "extended" }); handleStatusChange("extended"); setExtendResult("success"); if (window.__aberdeen_toast) window.__aberdeen_toast("Placement extended", "success"); }} disabled={!extendForm.newEndDate} style={{ padding: "8px 24px", background: !extendForm.newEndDate ? T.bgA : T.vio, color: !extendForm.newEndDate ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: !extendForm.newEndDate ? "default" : "pointer", fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} />Extend Placement</button>
          </div>
        </div>}
      </div>
    </div>}

    {/* ═══ REVENUE REPORT MODAL ═══ */}
    {revenueOpen && <div role="dialog" aria-modal="true" aria-label="Revenue report" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRevenueOpen(false)}>
      <div role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Revenue Report</h2><p style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{record.candidate_name} — {record.client_name}</p></div>
          <button onClick={() => setRevenueOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }} tabIndex={0}>
          {(() => {
            const margin = record.bill_rate && record.pay_rate ? (1 - record.pay_rate / record.bill_rate) : 0;
            const weeksTotal = record.end_date && record.start_date ? Math.ceil((new Date(record.end_date) - new Date(record.start_date)) / 604800000) : 52;
            const weeksActive = record.weeks_active || 0;
            const hrsPerWk = record.hours_per_week || 40;
            const totalBilled = weeksActive * hrsPerWk * (record.bill_rate || 0);
            const totalCost = weeksActive * hrsPerWk * (record.pay_rate || 0);
            const totalMargin = totalBilled - totalCost;
            const projectedRev = weeksTotal * hrsPerWk * (record.bill_rate || 0);
            const projectedMargin = weeksTotal * hrsPerWk * ((record.bill_rate || 0) - (record.pay_rate || 0));
            return <>
              <div className="g4" style={{ gap: 8, marginBottom: 16 }}>
                <MetricCard label="BILLED TO DATE" value={`$${(totalBilled / 1000).toFixed(1)}K`} color={T.acc} />
                <MetricCard label="MARGIN TO DATE" value={`$${(totalMargin / 1000).toFixed(1)}K`} color={T.ok} />
                <MetricCard label="PROJECTED REV" value={`$${(projectedRev / 1000).toFixed(0)}K`} />
                <MetricCard label="PROJ MARGIN" value={`$${(projectedMargin / 1000).toFixed(0)}K`} color={T.ok} />
              </div>
              <div className="g2" style={{ gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Rate Card</div>
                  {[[DollarSign, "Bill Rate", `$${record.bill_rate}/hr`], [DollarSign, "Pay Rate", `$${record.pay_rate}/hr`], [TrendingUp, "Spread", `$${(record.bill_rate || 0) - (record.pay_rate || 0)}/hr`], [TrendingUp, "Margin", `${(margin * 100).toFixed(1)}%`], [Clock, "Hours/Week", `${hrsPerWk}`]].map(([Ic, l, v], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 12 }}><Ic size={12} color={T.t3} /><span style={{ color: T.t3, width: 90 }}>{l}</span><span style={{ fontFamily: "var(--mono)" }}>{v}</span></div>)}
                </div>
                <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Timeline</div>
                  {[[Calendar, "Start", record.start_date], [Calendar, "End", record.end_date], [Clock, "Total Weeks", `${weeksTotal}`], [Clock, "Weeks Active", `${weeksActive}`], [TrendingUp, "Completion", `${weeksTotal > 0 ? Math.round(weeksActive / weeksTotal * 100) : 0}%`]].map(([Ic, l, v], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 12 }}><Ic size={12} color={T.t3} /><span style={{ color: T.t3, width: 90 }}>{l}</span><span style={{ fontFamily: "var(--mono)" }}>{v}</span></div>)}
                </div>
              </div>
              {/* Revenue bar chart */}
              <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Weekly Revenue</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                  {timesheets.slice(0, 12).map((ts, i) => <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: 8, fontFamily: "var(--mono)", color: T.t3 }}>${(ts.revenue / 1000).toFixed(1)}K</span>
                    <div style={{ width: "100%", height: `${ts.hours / 45 * 60}px`, background: `linear-gradient(to top, ${T.ok}40, ${T.ok})`, borderRadius: "3px 3px 0 0", minHeight: 4 }} />
                    <span style={{ fontSize: 7, fontFamily: "var(--mono)", color: T.t3 }}>W{i + 1}</span>
                  </div>)}
                </div>
              </div>
            </>;
          })()}
        </div>
      </div>
    </div>}

    {/* ═══ EMAIL COMPOSE MODAL ═══ */}
    {emailOpen && <div role="dialog" aria-modal="true" aria-label="Compose email" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEmailOpen(false)}>
      <div role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={16} color={T.acc} /><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Compose Email</h2></div>
          <button onClick={() => setEmailOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>

        {emailSent ? <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.ok + "1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><CheckCircle size={24} color={T.ok} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Email Opened in Client</div>
          <div style={{ fontSize: 13, color: T.t3 }}>To: {emailForm.to}</div>
          <div style={{ padding: 8, background: T.warn + "08", border: `1px solid ${T.warn}20`, borderRadius: 6, fontSize: 11, color: T.warn, marginTop: 12, maxWidth: 340, margin: "12px auto 0" }}>🔌 In production, emails send directly via Gmail API or Microsoft Graph — no mailto popup needed.</div>
          <button onClick={() => setEmailOpen(false)} style={{ marginTop: 16, padding: "8px 24px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Done</button>
        </div> : <div style={{ flex: 1, overflowY: "auto", padding: 20 }} tabIndex={0}>

          {/* Templates */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Quick Templates</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "intro", label: "Initial Outreach", subject: `Exciting Opportunity — ${record.title || "Open Role"}`, body: `Hi ${(record.name || record.candidate_name || "").split(" ")[0]},\n\nI came across your profile and was impressed by your background. I'm working with a client who has an excellent opportunity that aligns well with your experience.\n\nWould you be open to a quick call this week to discuss?\n\nBest regards,\nAdam Parsons\nAberdeen Advisors` },
                { id: "followup", label: "Follow Up", subject: `Following up — ${record.title || "Opportunity"}`, body: `Hi ${(record.name || record.candidate_name || "").split(" ")[0]},\n\nI wanted to follow up on the opportunity I mentioned. The client is moving quickly and I'd love to get your thoughts.\n\nDo you have 15 minutes this week?\n\nBest,\nAdam Parsons` },
                { id: "interview", label: "Interview Prep", subject: `Interview Details — ${record.title || "Next Steps"}`, body: `Hi ${(record.name || record.candidate_name || "").split(" ")[0]},\n\nGreat news — the client would like to move forward with an interview. Here are the details:\n\n• Date/Time: [TBD]\n• Format: Video (Microsoft Teams)\n• Duration: 60 minutes\n• Interviewer: [Name], [Title]\n\nPlease confirm your availability and I'll send the calendar invite.\n\nBest,\nAdam Parsons` },
                { id: "rejection", label: "Not Moving Forward", subject: `Update on Your Application`, body: `Hi ${(record.name || record.candidate_name || "").split(" ")[0]},\n\nThank you for your time and interest. After careful consideration, the client has decided to move forward with other candidates for this particular role.\n\nI'll keep your profile active and reach out when a better-aligned opportunity comes up.\n\nBest regards,\nAdam Parsons` },
                { id: "custom", label: "Custom", subject: "", body: "" },
              ].map(t => <button key={t.id} onClick={() => { setEmailForm(p => ({ ...p, subject: t.subject, body: t.body, template: t.id })); }} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${emailForm.template === t.id ? T.acc + "40" : T.bd}`, background: emailForm.template === t.id ? T.acc + "0c" : "transparent", color: emailForm.template === t.id ? T.acc : T.t3, cursor: "pointer", fontSize: 11, fontFamily: "'Outfit'", fontWeight: 500, transition: "all 0.12s" }}>{t.label}</button>)}
            </div>
          </div>

          {/* To */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>To</div>
            <input type="email" value={emailForm.to} onChange={e => setEmailForm(p => ({ ...p, to: e.target.value }))} placeholder="candidate@email.com" aria-label="Recipient email" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} />
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Subject</div>
            <input value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject line" aria-label="Email subject" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} />
          </div>

          {/* Body */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3 }}>Body</div>
              <span style={{ fontSize: 10, color: T.t3, fontFamily: "var(--mono)" }}>{emailForm.body.length} chars</span>
            </div>
            <textarea value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your message..." rows={10} aria-label="Email body" style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none", resize: "vertical", lineHeight: 1.7 }} />
          </div>

          {/* ┌──────────────────────────────────────────────────────┐ */}
          {/* │ 🔌 EMAIL INTEGRATION POINTS                         │ */}
          {/* │ Gmail: POST gmail.mcp.claude.com → send email        │ */}
          {/* │ Graph: POST /me/sendMail with message payload       │ */}
          {/* │ Both replace mailto with direct server-side send    │ */}
          {/* └──────────────────────────────────────────────────────┘ */}

          <div style={{ padding: 10, background: T.bgH, border: `1px solid ${T.bd}`, borderRadius: 8, marginBottom: 16, fontSize: 11, color: T.t3 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: T.t2 }}>🔌 Email Integration Points</div>
            <div>① <strong>Gmail MCP</strong> — Connected. In production, calls Gmail API to send directly from your inbox.</div>
            <div>② <strong>Microsoft Graph</strong> — POST /me/sendMail sends via Outlook without leaving the app.</div>
            <div>③ <strong>Fallback</strong> — Opens mailto: link in your default email client.</div>
          </div>

          {/* Send buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setEmailOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}>Cancel</button>
            <button onClick={() => {
              // Mailto fallback — opens in default email client
              const mailto = `mailto:${encodeURIComponent(emailForm.to)}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`;
              window.open(mailto, "_blank");
              setEmailSent(true);
            }} disabled={!emailForm.to || !emailForm.subject} style={{ padding: "8px 20px", background: (!emailForm.to || !emailForm.subject) ? T.bgA : T.acc, color: (!emailForm.to || !emailForm.subject) ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (!emailForm.to || !emailForm.subject) ? "default" : "pointer", fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6 }}><Send size={12} />Send Email</button>
          </div>
        </div>}
      </div>
    </div>}

    {/* ═══ ADD TO PIPELINE MODAL ═══ */}
    {pipelineOpen && <div role="dialog" aria-modal="true" aria-label="Add to pipeline" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setPipelineOpen(false); setPipelineResult(null); }}>
      <div role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Add to Pipeline</h2><p style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>Place {record.name || record.candidate_name} into a job pipeline</p></div>
          <button onClick={() => { setPipelineOpen(false); setPipelineResult(null); }} aria-label="Close" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>

        {pipelineResult === "success" ? <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.ok + "1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><CheckCircle size={24} color={T.ok} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Added to Pipeline</div>
          <div style={{ fontSize: 13, color: T.t3 }}>{record.name || record.candidate_name} → {pipelineJob?.title} — Stage: {pipelineStage}</div>
          <button onClick={() => { setPipelineOpen(false); setPipelineResult(null); }} style={{ marginTop: 16, padding: "8px 24px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Done</button>
        </div> : <div style={{ flex: 1, overflowY: "auto", padding: 20 }} tabIndex={0}>

          {/* Select Job */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Select Job</div>
            {MOCK_JOBS.map(j => {
              const selected = pipelineJob?.id === j.id;
              const skillOverlap = (record.skills || []).filter(s => (j.skills || []).includes(s)).length;
              return <button key={j.id} onClick={() => setPipelineJob(j)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4, borderRadius: 8, border: `1px solid ${selected ? T.ok + "40" : T.bd}`, background: selected ? T.ok + "08" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, width: "100%", transition: "all 0.12s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${selected ? T.ok : T.bd2}`, background: selected ? T.ok : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{j.title}</div><div style={{ fontSize: 11, color: T.t3 }}>{j.client_name} · {j.location}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {skillOverlap > 0 && <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: T.ok }}>{skillOverlap} skill{skillOverlap > 1 ? "s" : ""}</span>}
                  <Badge color={j.status === "open" || j.status === "sourcing" ? T.ok : T.t3}>{j.status}</Badge>
                </div>
              </button>;
            })}
          </div>

          {/* Select Pipeline Stage */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Pipeline Stage</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[{ id: "sourced", label: "Sourced", color: T.t3, desc: "Initial identification" }, { id: "screened", label: "Screened", color: T.acc, desc: "Phone screen complete" }, { id: "submitted", label: "Submitted", color: T.warn, desc: "Sent to client" }, { id: "interview", label: "Interview", color: T.vio, desc: "Client interview scheduled" }, { id: "offer", label: "Offer", color: T.teal, desc: "Offer stage" }].map(s => <button key={s.id} onClick={() => setPipelineStage(s.id)} style={{ flex: 1, minWidth: 80, padding: "10px 8px", borderRadius: 8, border: `1px solid ${pipelineStage === s.id ? s.color + "40" : T.bd}`, background: pipelineStage === s.id ? s.color + "0c" : "transparent", cursor: "pointer", textAlign: "center", fontFamily: "'Outfit'", color: pipelineStage === s.id ? s.color : T.t3, transition: "all 0.12s" }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>{s.desc}</div>
              </button>)}
            </div>
          </div>

          {/* Pipeline visualization */}
          {pipelineJob && <div style={{ padding: 12, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {["sourced", "screened", "submitted", "interview", "offer"].map((s, i, arr) => {
                const stageColors = { sourced: T.t3, screened: T.acc, submitted: T.warn, interview: T.vio, offer: T.teal };
                const isActive = s === pipelineStage;
                const isPast = arr.indexOf(pipelineStage) > i;
                return <React.Fragment key={s}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: isPast || isActive ? stageColors[s] : T.bd, transition: "background 0.2s", position: "relative" }}>
                    {isActive && <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: stageColors[s], fontWeight: 700, fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>{s.toUpperCase()}</div>}
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isPast ? stageColors[arr[i+1]] : T.bd, flexShrink: 0 }} />}
                </React.Fragment>;
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: T.t3 }}>
              <span>Sourced</span><span>Offer</span>
            </div>
          </div>}

          {/* Submit */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { setPipelineOpen(false); setPipelineResult(null); }} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}>Cancel</button>
            <button onClick={async () => {
              if (!pipelineJob) return;
              setPipelineSaving(true);
              try {
                                        await sbFetch("/rest/v1/submissions", { method: "POST", body: JSON.stringify({ candidate_id: record.id, job_id: pipelineJob.id, status: "active", current_stage: pipelineStage, match_score: null }) });
              } catch (e) {}
              setPipelineResult("success");
              if (window.__aberdeen_toast) window.__aberdeen_toast(`Added to ${pipelineStage} pipeline`, "success");
              setPipelineSaving(false);
            }} disabled={!pipelineJob || pipelineSaving} style={{ padding: "8px 24px", background: (!pipelineJob || pipelineSaving) ? T.bgA : T.ok, color: (!pipelineJob || pipelineSaving) ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (!pipelineJob || pipelineSaving) ? "default" : "pointer", fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6 }}>{pipelineSaving ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />Adding...</> : <><TrendingUp size={12} />Add to {pipelineStage}</>}</button>
          </div>
        </div>}
      </div>
    </div>}

    {/* ═══ SCHEDULE INTERVIEW MODAL ═══ */}
    {interviewOpen && <div role="dialog" aria-modal="true" aria-label="Schedule interview" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setInterviewOpen(false); setInterviewResult(null); }}>
      <div ref={interviewModalRef} role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Schedule Interview</h2><p style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{record.name || record.candidate_name}</p></div>
          <button onClick={() => { setInterviewOpen(false); setInterviewResult(null); }} aria-label="Close" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>

        {interviewResult === "success" ? <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.ok + "1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><CheckCircle size={24} color={T.ok} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Interview Scheduled</div>
          <div style={{ fontSize: 13, color: T.t3, marginBottom: 4 }}>{record.name || record.candidate_name} — {interviewForm.date} at {interviewForm.time}</div>
          <div style={{ fontSize: 11, color: T.vio, fontFamily: "var(--mono)", marginBottom: 12 }}>📹 Teams link generated (mock)</div>
          <div style={{ padding: 8, background: T.warn + "08", border: `1px solid ${T.warn}20`, borderRadius: 6, fontSize: 11, color: T.warn, marginBottom: 16, maxWidth: 360, margin: "0 auto 16px" }}>
            🔌 In production, Microsoft Graph creates a real Teams meeting and sends Outlook invites to all participants automatically.
          </div>
          <button onClick={() => { setInterviewOpen(false); setInterviewResult(null); }} style={{ padding: "8px 24px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Done</button>
        </div> : <div style={{ flex: 1, overflowY: "auto", padding: 20 }} tabIndex={0}>

          {/* Interview Type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Interview Type</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {INT_TYPES.map(t => <button key={t.id} onClick={() => setInterviewForm(p => ({ ...p, type: t.id }))} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: `1px solid ${interviewForm.type === t.id ? T.vio + "40" : T.bd}`, background: interviewForm.type === t.id ? T.vio + "0c" : "transparent", color: interviewForm.type === t.id ? T.vio : T.t2, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit'", transition: "all 0.12s" }}><span>{t.icon}</span>{t.label}</button>)}
            </div>
            <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>{(INT_TYPES.find(t => t.id === interviewForm.type) || {}).desc}</div>
          </div>

          {/* Interviewee (Candidate) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Interviewee</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, marginBottom: 8 }}>
              <CAvatar name={record.name || record.candidate_name} size={28} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{record.name || record.candidate_name}</div><div style={{ fontSize: 10, color: T.t3 }}>{record.title}</div></div>
            </div>
            <div style={{ fontSize: 10, color: T.t3, marginBottom: 4 }}>Candidate email (invite sent here)</div>
            <input type="email" value={interviewForm.candidateEmail} onChange={e => setInterviewForm(p => ({ ...p, candidateEmail: e.target.value }))} placeholder="candidate@email.com" aria-label="Candidate email for invite" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} />
          </div>

          {/* Interviewer */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Interviewer</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[...INTERVIEWERS, ...customInterviewers].map(p => <button key={p.id} onClick={() => setInterviewForm(prev => ({ ...prev, interviewer: p.id }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: `1px solid ${interviewForm.interviewer === p.id ? T.acc + "40" : T.bd}`, background: interviewForm.interviewer === p.id ? T.acc + "0c" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, width: "100%", transition: "all 0.12s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${interviewForm.interviewer === p.id ? T.acc : T.bd2}`, background: interviewForm.interviewer === p.id ? T.acc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{interviewForm.interviewer === p.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}</div>
                <CAvatar name={p.name} size={28} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}{p._custom && <span style={{ fontSize: 9, marginLeft: 6, color: T.teal }}>custom</span>}</div><div style={{ fontSize: 10, color: T.t3 }}>{p.role || "Interviewer"} · {p.email}</div></div>
                {p._custom && <button onClick={e => { e.stopPropagation(); setCustomInterviewers(prev => prev.filter(x => x.id !== p.id)); if (interviewForm.interviewer === p.id) setInterviewForm(prev => ({ ...prev, interviewer: "" })); }} aria-label={`Remove ${p.name}`} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 4, fontSize: 14 }}>×</button>}
              </button>)}
            </div>
            {/* Add custom interviewer */}
            {!addingInterviewer ? <button onClick={() => setAddingInterviewer(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", marginTop: 6, borderRadius: 8, border: `1px dashed ${T.bd2}`, background: "transparent", cursor: "pointer", color: T.t3, fontSize: 12, fontFamily: "'Outfit'", width: "100%", transition: "all 0.12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.acc} onMouseLeave={e => e.currentTarget.style.borderColor = T.bd2} onFocus={e => e.currentTarget.style.borderColor = T.acc} onBlur={e => e.currentTarget.style.borderColor = T.bd2}><Plus size={14} />Add interviewer not on this list</button> :
            <div style={{ padding: 12, marginTop: 6, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8 }}>Add Custom Interviewer</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={newInterviewer.name} onChange={e => setNewInterviewer(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" aria-label="Interviewer name" style={{ padding: "7px 10px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
                <input type="email" value={newInterviewer.email} onChange={e => setNewInterviewer(p => ({ ...p, email: e.target.value }))} placeholder="Email address *" aria-label="Interviewer email" style={{ padding: "7px 10px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
                <input value={newInterviewer.role} onChange={e => setNewInterviewer(p => ({ ...p, role: e.target.value }))} placeholder="Role (optional)" aria-label="Interviewer role" style={{ padding: "7px 10px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setAddingInterviewer(false); setNewInterviewer({ name: "", email: "", role: "" }); }} style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, cursor: "pointer", fontSize: 11, fontFamily: "'Outfit'" }}>Cancel</button>
                <button onClick={() => { if (!newInterviewer.name || !newInterviewer.email) return; const id = `custom-${Date.now()}`; setCustomInterviewers(prev => [...prev, { ...newInterviewer, id, avatar: newInterviewer.name.split(" ").map(w => w[0]).join("").slice(0, 2), _custom: true }]); setInterviewForm(prev => ({ ...prev, interviewer: id })); setAddingInterviewer(false); setNewInterviewer({ name: "", email: "", role: "" }); }} disabled={!newInterviewer.name || !newInterviewer.email} style={{ padding: "5px 12px", background: (!newInterviewer.name || !newInterviewer.email) ? T.bgA : T.acc, color: (!newInterviewer.name || !newInterviewer.email) ? T.t3 : "#fff", border: "none", borderRadius: 6, cursor: (!newInterviewer.name || !newInterviewer.email) ? "default" : "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit'" }}>Add</button>
              </div>
            </div>}
          </div>

          {/* Additional participants */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4, textTransform: "uppercase" }}>Additional Participants (optional)</div>
            <div style={{ fontSize: 10, color: T.t3, marginBottom: 4 }}>Comma-separated emails — they'll receive the calendar invite + Teams link</div>
            <input value={interviewForm.additionalEmails} onChange={e => setInterviewForm(p => ({ ...p, additionalEmails: e.target.value }))} placeholder="hiring.manager@client.com, recruiter2@aberdeen.com" aria-label="Additional participant emails" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 12, fontFamily: "'Outfit'", outline: "none" }} />
          </div>

          {/* ┌─────────────────────────────────────────────────────────┐ */}
          {/* │  🔌 MICROSOFT GRAPH INTEGRATION POINT #3                │ */}
          {/* │  Check Calendar Availability                            │ */}
          {/* │  POST /me/calendar/getSchedule                         │ */}
          {/* │  Body: { schedules: [interviewer_email],               │ */}
          {/* │    startTime, endTime, availabilityViewInterval: 30 }  │ */}
          {/* │  Response: { availabilityView: "0020020..." }          │ */}
          {/* │  0=free, 1=tentative, 2=busy, 3=oof, 4=working-else   │ */}
          {/* └─────────────────────────────────────────────────────────┘ */}

          {/* Availability Grid (mock — real data from Graph API) */}
          {interviewForm.interviewer && <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              Availability — {[...INTERVIEWERS, ...customInterviewers].find(i => i.id === interviewForm.interviewer)?.name}
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.warn + "15", color: T.warn }}>MOCK — Graph API in prod</span>
            </div>
            <div style={{ overflowX: "auto" }} tabIndex={0}>
              <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${getAvailability.length}, 1fr)`, gap: 2, minWidth: 400 }}>
                {/* Header row */}
                <div />
                {getAvailability.map(day => <div key={day.date} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.t2, padding: "4px 0" }}>{day.label}</div>)}
                {/* Time slots */}
                {[9,10,11,12,13,14,15,16].map(h => <React.Fragment key={h}>
                  <div style={{ fontSize: 10, color: T.t3, fontFamily: "var(--mono)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>{h > 12 ? h - 12 : h}{h >= 12 ? "p" : "a"}</div>
                  {getAvailability.map(day => {
                    const slot = day.hours.find(s => s.hour === h);
                    const selected = interviewForm.date === day.date && interviewForm.time === `${String(h).padStart(2, "0")}:00`;
                    return <button key={`${day.date}-${h}`} disabled={slot?.busy} onClick={() => setInterviewForm(p => ({ ...p, date: day.date, time: `${String(h).padStart(2, "0")}:00` }))} style={{ height: 28, borderRadius: 4, border: selected ? `2px solid ${T.acc}` : "1px solid transparent", background: selected ? T.acc + "20" : slot?.busy ? T.err + "10" : T.ok + "10", cursor: slot?.busy ? "not-allowed" : "pointer", fontSize: 9, color: slot?.busy ? T.err : selected ? T.acc : T.ok, fontFamily: "var(--mono)", transition: "all 0.1s" }}>{slot?.busy ? "busy" : selected ? "✓" : "free"}</button>;
                  })}
                </React.Fragment>)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: T.t3 }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.ok + "10", border: `1px solid ${T.ok}30`, marginRight: 4, verticalAlign: "middle" }} />Free</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.err + "10", border: `1px solid ${T.err}30`, marginRight: 4, verticalAlign: "middle" }} />Busy</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.acc + "20", border: `2px solid ${T.acc}`, marginRight: 4, verticalAlign: "middle" }} />Selected</span>
            </div>
          </div>}

          {/* Date/Time Manual Override */}
          <div className="g2" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Date</div>
              <input type="date" value={interviewForm.date} onChange={e => setInterviewForm(p => ({ ...p, date: e.target.value }))} aria-label="Interview date" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Time</div>
              <input type="time" value={interviewForm.time} onChange={e => setInterviewForm(p => ({ ...p, time: e.target.value }))} aria-label="Interview time" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }} />
            </div>
          </div>
          <div className="g2" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Duration</div>
              <select value={interviewForm.duration} onChange={e => setInterviewForm(p => ({ ...p, duration: parseInt(e.target.value) }))} aria-label="Interview duration" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }}>
                {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Related Job</div>
              <select value={interviewForm.job_id} onChange={e => setInterviewForm(p => ({ ...p, job_id: e.target.value }))} aria-label="Related job" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none" }}>
                <option value="">No specific job</option>
                {MOCK_JOBS.map(j => <option key={j.id} value={j.id}>{j.title} — {j.client_name}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>Notes</div>
            <textarea value={interviewForm.notes} onChange={e => setInterviewForm(p => ({ ...p, notes: e.target.value }))} placeholder="Interview focus areas, prep notes..." rows={2} aria-label="Interview notes" style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none", resize: "none" }} />
          </div>

          {/* Teams Link Preview */}
          {(interviewForm.type === "video" || interviewForm.type === "technical" || interviewForm.type === "panel") && <div style={{ padding: 10, background: T.vio + "08", border: `1px solid ${T.vio}20`, borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📹</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.vio }}>Microsoft Teams Meeting</div>
              <div style={{ fontSize: 10, color: T.t3 }}>A Teams link will be auto-generated and included in the calendar invite</div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.warn + "15", color: T.warn }}>🔌 Graph API</span>
          </div>}

          {/* Integration callout */}
          <div style={{ padding: 10, background: T.bgH, border: `1px solid ${T.bd}`, borderRadius: 8, marginBottom: 16, fontSize: 11, color: T.t3 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: T.t2 }}>🔌 Microsoft Graph Integration Points</div>
            <div>① <strong>POST /me/onlineMeetings</strong> — Creates Teams meeting, returns joinWebUrl</div>
            <div>② <strong>POST /me/events</strong> — Creates Outlook calendar event with Teams link, sends invite</div>
            <div>③ <strong>POST /me/calendar/getSchedule</strong> — Checks real availability (replaces mock grid above)</div>
          </div>

          {/* Schedule button */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { setInterviewOpen(false); setInterviewResult(null); }} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}>Cancel</button>
            <button onClick={handleScheduleInterview} disabled={!interviewForm.date || !interviewForm.time || !interviewForm.interviewer || interviewSaving} style={{ padding: "8px 24px", background: (!interviewForm.date || !interviewForm.time || !interviewForm.interviewer || interviewSaving) ? T.bgA : T.vio, color: (!interviewForm.date || !interviewForm.time || !interviewForm.interviewer || interviewSaving) ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (!interviewForm.date || !interviewForm.time || !interviewForm.interviewer || interviewSaving) ? "default" : "pointer", fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6 }}>{interviewSaving ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />Scheduling...</> : <><Calendar size={12} />Schedule Interview</>}</button>
          </div>
        </div>}
      </div>
    </div>}

    {/* ═══ SUBMIT TO JOB MODAL ═══ */}
    {submitOpen && <div role="dialog" aria-modal="true" aria-label="Submit candidate to job" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setSubmitOpen(false); setSubmitJob(null); setSubmitResult(null); setSubmitNote(""); }}>
      <div ref={submitModalRef} role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Submit to Job</h2><p style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>Select a job for {record.name || record.candidate_name}</p></div>
          <button onClick={() => { setSubmitOpen(false); setSubmitJob(null); setSubmitResult(null); }} aria-label="Close" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>

        {submitResult === "success" ? <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.ok + "1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><CheckCircle size={24} color={T.ok} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Submitted Successfully</div>
          <div style={{ fontSize: 13, color: T.t3 }}>{record.name || record.candidate_name} → {submitJob?.title} at {submitJob?.client_name}</div>
          <button onClick={() => { setSubmitOpen(false); setSubmitJob(null); setSubmitResult(null); setSubmitNote(""); }} style={{ marginTop: 16, padding: "8px 24px", background: T.acc, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Done</button>
        </div> : <div style={{ flex: 1, overflowY: "auto", padding: 20 }} tabIndex={0}>
          {/* Candidate summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: T.bg, borderRadius: 10, marginBottom: 16, border: `1px solid ${T.bd}` }}>
            <CAvatar name={record.name || record.candidate_name} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{record.name || record.candidate_name}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>{record.title} · {record.location}</div>
            </div>
            {record.score && <ScoreBadge score={record.score} />}
          </div>

          {/* Job list with match scores */}
          <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Select Job — ranked by match score</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {jobMatches.map(j => {
              const selected = submitJob?.id === j.id;
              const tierColor = j._matchTier === "ELITE" ? T.ok : j._matchTier === "STRONG" ? T.acc : j._matchTier === "MODERATE" ? T.warn : T.err;
              return <button key={j.id} onClick={() => setSubmitJob(j)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: selected ? T.acc + "0c" : T.bg, border: `1px solid ${selected ? T.acc + "40" : T.bd}`, borderRadius: 10, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, transition: "all 0.12s", width: "100%" }} onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = T.bd2; }} onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = selected ? T.acc + "40" : T.bd; }} onFocus={e => { if (!selected) e.currentTarget.style.borderColor = T.bd2; }} onBlur={e => { if (!selected) e.currentTarget.style.borderColor = selected ? T.acc + "40" : T.bd; }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${selected ? T.acc : T.bd2}`, background: selected ? T.acc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.title}</div>
                  <div style={{ fontSize: 11, color: T.t3 }}>{j.client_name} · {j.location}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: tierColor }}>{j._matchScore}</span>
                  <Badge color={tierColor}>{j._matchTier}</Badge>
                </div>
              </button>;
            })}
          </div>

          {/* Match details for selected job */}
          {submitJob && <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Match Analysis — {submitJob.title}</div>
            <div className="g2" style={{ marginBottom: 10 }}>
              <div style={{ textAlign: "center", padding: 8, background: T.bgE, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: submitJob._matchTier === "ELITE" ? T.ok : submitJob._matchTier === "STRONG" ? T.acc : T.warn }}>{submitJob._matchScore}</div>
                <div style={{ fontSize: 9, color: T.t3 }}>MATCH SCORE</div>
              </div>
              <div style={{ textAlign: "center", padding: 8, background: T.bgE, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: T.acc }}>{submitJob._skillOverlap.length}/{(submitJob.skills || []).length}</div>
                <div style={{ fontSize: 9, color: T.t3 }}>SKILL MATCH</div>
              </div>
            </div>
            {submitJob._skillOverlap.length > 0 && <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: T.t3, marginBottom: 4 }}>Matching Skills</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{submitJob._skillOverlap.map((s, i) => <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: T.ok + "12", color: T.ok, fontFamily: "var(--mono)" }}>✓ {s}</span>)}</div>
            </div>}
            {submitJob._missingSkills.length > 0 && <div>
              <div style={{ fontSize: 10, color: T.t3, marginBottom: 4 }}>Missing Skills</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{submitJob._missingSkills.map((s, i) => <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: T.err + "12", color: T.err, fontFamily: "var(--mono)" }}>✗ {s}</span>)}</div>
            </div>}
          </div>}

          {/* Submission note */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 6, textTransform: "uppercase" }}>Submission Note (optional)</div>
            <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Why this candidate is a good fit..." rows={3} aria-label="Submission note" style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 13, fontFamily: "'Outfit'", outline: "none", resize: "none", lineHeight: 1.6 }} />
          </div>

          {/* Submit button */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { setSubmitOpen(false); setSubmitJob(null); setSubmitNote(""); }} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!submitJob || submitting} style={{ padding: "8px 24px", background: !submitJob || submitting ? T.bgA : T.acc, color: !submitJob || submitting ? T.t3 : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: !submitJob || submitting ? "default" : "pointer", fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6 }}>{submitting ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />Submitting...</> : <><Send size={12} />Submit to {submitJob?.client_name || "Job"}</>}</button>
          </div>
        </div>}
      </div>
    </div>}
  </div>;
}
const INP = { width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t1, fontSize: 14, fontFamily: "'Outfit'", outline: "none" };
function EntityCreateModal({ config, onClose, onSave }) {
  const steps = config.createSteps || ["Basics", "Professional", "Details", "Review"];
  const [step, setStep] = useState(0); const [saving, setSaving] = useState(false); const [errs, setErrs] = useState({});
  const modalRef = useRef(null); useFocusTrap(modalRef, true);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", title: "", current_company: "", client_name: "", location: "", status: config.statuses[0]?.value || "new", source: "", years_experience: "", salary_expectation: "", salary_range: "", linkedin_url: "", github_url: "", skills_text: "", notes: "", department: "", description: "", duration: "", start_date: "", end_date: "", bill_rate: "", pay_rate: "", openings: "1", candidate_name: "", job_title: "", salary: "", primary_contact: "", contact_email: "", industry: "", available_date: "", referred_by: "", referrer_email: "", reward_amount: "", response_due: "" });
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrs(p => { const n = { ...p }; delete n[k]; return n; }); };
  const validate = () => { const e = {}; if (config.createFields) { (config.createFields[step] || []).forEach(f => { if (f.required && !form[f.field]?.toString().trim()) e[f.field] = "Required"; }); } else { if (step === 0) { if (!form.first_name.trim()) e.first_name = "Required"; if (!form.last_name.trim()) e.last_name = "Required"; if (!form.email.trim()) e.email = "Required"; } if (step === 1 && !form.title.trim()) e.title = "Required"; } setErrs(e); return !Object.keys(e).length; };
  const next = () => { if (validate()) setStep(s => Math.min(s + 1, steps.length - 1)); }; const prev = () => setStep(s => Math.max(s - 1, 0));
  const save = async () => {
    setSaving(true); const now = new Date().toISOString(); const skills = (form.skills_text || "").split(",").map(s => s.trim()).filter(Boolean);
    const name = config.table === "candidates" ? `${form.first_name} ${form.last_name}`.trim() : form.title?.trim() || form.candidate_name?.trim() || "New Record";
    const rec = { id: config.table[0] + Date.now().toString(36), name, ...form, skills, score: null, notes_count: 0, submissions_count: 0, candidates_count: 0, created_at: now, updated_at: now };
    try { await fetch(`https://lalkdgljfkgiojfbreyq.supabase.co/rest/v1/${config.table}`, { method: "POST", headers: { apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGtkZ2xqZmtnaW9qZmJyZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTc2NjIsImV4cCI6MjA1ODI3MzY2Mn0.GKJJqxfJRkFJylI1Zll1bj1HzKT2raWRpz6RMaZR37c", "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ title: rec.title || rec.name, status: rec.status, location: rec.location }) }); } catch (e) {}
    setSaving(false); onSave(rec);
  };
  const Field = ({ label, field, type = "text", placeholder, required }) => <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 6, display: "block" }}>{label}{required && <span style={{ color: T.err }}> *</span>}</label>
    {type === "textarea" ? <textarea value={form[field] || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} rows={3} aria-label={label} style={{ ...INP, resize: "none", lineHeight: 1.6 }} /> :
    <input type={type} value={form[field] || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} aria-label={label} style={{ ...INP, borderColor: errs[field] ? T.err : T.bd }} />}
    {errs[field] && <div style={{ fontSize: 11, color: T.err, marginTop: 4 }}>{errs[field]}</div>}
  </div>;
  const renderStep = () => {
    if (config.createFields && config.createFields[step]) return <div>{config.createFields[step].map((f, i) => <Field key={i} label={f.label} field={f.field} type={f.type || "text"} placeholder={f.placeholder} required={f.required} />)}</div>;
    if (step === steps.length - 1) {
      const displayName = config.table === "candidates" ? `${form.first_name} ${form.last_name}` : form.title || form.candidate_name || "New Record";
      return <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit'", marginBottom: 8 }}>{displayName}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>{Object.entries(form).filter(([k, v]) => v && !["skills_text", "notes", "description", "status"].includes(k)).slice(0, 8).map(([k, v], i) => <div key={i} style={{ padding: "4px 0", borderBottom: `1px solid ${T.bd}` }}><span style={{ color: T.t3, fontSize: 11 }}>{k.replace(/_/g, " ")}: </span><span>{v}</span></div>)}</div>
      </div>;
    }
    if (step === 0) return <div><div style={{ display: "flex", gap: 12 }}><Field label="First Name" field="first_name" placeholder="Sarah" required /><Field label="Last Name" field="last_name" placeholder="Chen" required /></div><Field label="Email" field="email" type="email" placeholder="sarah@example.com" required /><Field label="Phone" field="phone" placeholder="+1 415-555-0142" /><Field label="Location" field="location" placeholder="San Francisco, CA" /></div>;
    if (step === 1) return <div><Field label="Title / Role" field="title" placeholder="Sr. Full Stack Developer" required /><Field label="Current Company" field="current_company" placeholder="Meta" /></div>;
    if (step === 2) return <div><Field label="Skills" field="skills_text" placeholder="React, TypeScript, Node.js" /><Field label="LinkedIn" field="linkedin_url" placeholder="linkedin.com/in/..." /></div>;
    return null;
  };
  return <div role="dialog" aria-modal="true" aria-label={`Add ${config.singular}`} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.15s ease" }} onClick={onClose}>
    <div ref={modalRef} role="document" className="modal-body" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h2 style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 600 }}>Add {config.singular}</h2><div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>Step {step + 1} of {steps.length} — {steps[step]}</div></div>
        <button onClick={onClose} aria-label="Close" style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", color: T.t3, cursor: "pointer", display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "12px 20px 0" }}>{steps.map((s, i) => <div key={s} style={{ flex: 1 }}><div style={{ height: 3, borderRadius: 2, background: i <= step ? config.color : T.bd }} /><span style={{ fontSize: 10, color: i <= step ? config.color : T.t3 }}>{s}</span></div>)}</div>
      <div tabIndex={0} style={{ flex: 1, overflowY: "auto", padding: 20 }}>{renderStep()}</div>
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between" }}>
        <div>{step > 0 && <button onClick={prev} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t2, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit'" }}>Back</button>}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t3, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit'" }}>Cancel</button>
          {step < steps.length - 1 ? <button onClick={next} style={{ padding: "8px 20px", background: config.color, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit'" }}>Next</button>
          : <button onClick={save} disabled={saving} style={{ padding: "8px 20px", background: saving ? T.bgA : T.ok, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: saving ? "default" : "pointer", fontFamily: "'Outfit'" }}>{saving ? "Saving..." : `Create ${config.singular}`}</button>}
        </div>
      </div>
    </div>
  </div>;
}

// ═══ ENTITY PAGE WRAPPER (reusable pattern) ═══
function EntityPage({ config, mockData, supabaseTable, nav, pendingCreate, onConsumeCreate, pendingSelectId, onConsumeSelect }) {
  const [view, setView] = useState("list"); const [selRec, setSelRec] = useState(null); const [createOpen, setCreateOpen] = useState(false);
  const [data, setData] = useState(mockData); const [loading, setLoading] = useState(false);
  // Auto-open create modal when pendingCreate is true
  useEffect(() => { if (pendingCreate) { setCreateOpen(true); if (onConsumeCreate) onConsumeCreate(); } }, [pendingCreate]);
  // Auto-select record from search
  useEffect(() => { if (pendingSelectId) { const found = data.find(r => r.id === pendingSelectId); if (found) { setSelRec(found); setView("detail"); } if (onConsumeSelect) onConsumeSelect(); } }, [pendingSelectId, data]);
  useEffect(() => { if (!supabaseTable) return; (async () => { try { setLoading(true); const res = await fetch(`https://lalkdgljfkgiojfbreyq.supabase.co/rest/v1/${supabaseTable}?select=*&order=updated_at.desc&limit=50`, { headers: { apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGtkZ2xqZmtnaW9qZmJyZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTc2NjIsImV4cCI6MjA1ODI3MzY2Mn0.GKJJqxfJRkFJylI1Zll1bj1HzKT2raWRpz6RMaZR37c", "Content-Type": "application/json" } }); if (res.ok) { const rows = await res.json(); if (rows.length > 0) setData(rows.map(r => ({ ...r, name: r.name || r.title || `${r.first_name || ""} ${r.last_name || ""}`.trim() || "Unknown", score: r.score || r.ai_score || null, skills: r.skills || [], notes_count: r.notes_count || 0, submissions_count: r.submissions_count || 0 }))); } else if (window.__aberdeen_toast) { window.__aberdeen_toast(`Failed to load ${supabaseTable}`, "error"); } } catch (e) { if (window.__aberdeen_toast) window.__aberdeen_toast(`Offline: showing cached ${supabaseTable}`, "warning"); } finally { setLoading(false); } })(); }, [supabaseTable]);
  const handleStatusChange = (id, newStatus) => { setData(p => p.map(r => r.id === id ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r)); if (selRec?.id === id) setSelRec(p => ({ ...p, status: newStatus })); };
  const handleCreate = (rec) => { setData(p => [rec, ...p]); setCreateOpen(false); setSelRec(rec); setView("detail"); if (window.__aberdeen_toast) window.__aberdeen_toast(`${config.singular} created`, "success"); };
  return <div>
    {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 16px", background: T.teal + "0c", border: `1px solid ${T.teal}20`, borderRadius: 8 }}><RefreshCw size={14} color={T.teal} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 12, color: T.teal }}>Loading from Supabase...</span></div>}
    {view === "list" && <EntityListPage config={config} data={data} onSelect={r => { setSelRec(r); setView("detail"); }} onCreate={() => setCreateOpen(true)} />}
    {view === "detail" && selRec && <EntityDetailPage config={config} record={selRec} onBack={() => { setView("list"); setSelRec(null); }} onStatusChange={handleStatusChange} onNavigate={nav} />}
    {createOpen && <EntityCreateModal config={config} onClose={() => setCreateOpen(false)} onSave={handleCreate} />}
  </div>;
}

// ═══ GATEWAY PAGE ═══
function GatewayPage() {
  const [view, setView] = useState("grid"); const [agentId, setAgentId] = useState(null); const [cat, setCat] = useState(null);
  const [search, setSearch] = useState(""); const [tab, setTab] = useState("agents");
  const [sessions, setSessions] = useState({}); const [inputs, setInputs] = useState({});
  const [streaming, setStreaming] = useState(false); const [useLive, setUseLive] = useState(true);
  const inputRef = useRef(null);
  const agent = AGENTS.find(a => a.id === agentId);
  const filtered = AGENTS.filter(a => (!cat || a.cat === cat) && (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))));
  const openAgent = (id) => { setAgentId(id); setView("chat"); setTimeout(() => inputRef.current?.focus(), 100); };
  const chatInput = inputs[agentId] || "";
  const messages = sessions[agentId] || [];
  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const sendMessage = async () => {
    if (!chatInput.trim() || streaming || !agent) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    setSessions(p => ({ ...p, [agent.id]: [...(p[agent.id] || []), userMsg] })); setInputs(p => ({ ...p, [agent.id]: "" })); setStreaming(true);
    let reply;
    if (useLive) { try { const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: agent.sys, messages: [...(sessions[agent.id] || []), userMsg].map(m => ({ role: m.role, content: m.content })) }) }); const data = await res.json(); reply = data.content?.[0]?.text || "No response received."; } catch (e) { reply = "API error: " + e.message; } }
    else { await new Promise(r => setTimeout(r, 600)); reply = mockReply(agent, chatInput.trim()); }
    setSessions(p => ({ ...p, [agent.id]: [...(p[agent.id] || []), { role: "assistant", content: reply }] })); setStreaming(false);
  };
  const agentCat = CATS.find(c => c.id === agent?.cat) || {};

  if (view === "chat" && agent) return <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", animation: "fadeIn 0.2s" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setView("grid")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t2, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13 }}><ChevronLeft size={14} />Agents</button>
        <span style={{ fontSize: 22 }}>{agent.icon}</span><div><div style={{ fontSize: 16, fontWeight: 700 }}>{agent.name}</div><div style={{ fontSize: 12, color: T.t3 }}>{agent.tags.join(" · ")}</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => setUseLive(!useLive)} aria-label={useLive ? "Switch to mock mode" : "Switch to live mode"} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${useLive ? T.ok + "40" : T.bd}`, background: useLive ? T.ok + "12" : "transparent", color: useLive ? T.ok : T.t3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--mono)" }}>{useLive ? "● LIVE" : "○ MOCK"}</button>
      </div>
    </div>
    <div tabIndex={0} aria-label="Chat messages" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
      {messages.length === 0 && <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{agent.icon}</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{agent.name}</div>
        <div style={{ fontSize: 13, color: T.t2, maxWidth: 360, lineHeight: 1.5, marginBottom: 16 }}>Ask about {agent.tags.slice(0, 3).join(", ")} and more.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 440 }}>
          {[`Screen for ${agent.tags[0]} role`, `Market rate for ${agent.tags[0]}?`, `Interview questions for ${agent.tags[1] || agent.tags[0]}`, `Write a JD for ${agent.tags[0]}`].map((s, i) => <button key={i} onClick={() => { setInputs(p => ({ ...p, [agent.id]: s })); inputRef.current?.focus(); }} style={{ padding: 12, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, color: T.t2, fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", transition: "all 0.12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.bd2} onMouseLeave={e => e.currentTarget.style.borderColor = T.bd} onFocus={e => e.currentTarget.style.borderColor = T.bd2} onBlur={e => e.currentTarget.style.borderColor = T.bd}>{s}</button>)}
        </div>
      </div>}
      {messages.map((m, i) => <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.role === "user" ? T.acc + "1a" : agentCat.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: m.role === "user" ? 11 : 14, fontWeight: 700, color: m.role === "user" ? T.acc : agentCat.color, flexShrink: 0 }}>{m.role === "user" ? "AP" : agent.icon}</div>
        <div style={{ flex: 1, fontSize: 14, lineHeight: 1.7, color: T.t2 }}>{m.role === "assistant" ? <div dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} /> : m.content}</div>
      </div>)}
      {streaming && <div style={{ display: "flex", gap: 10, padding: "8px 0" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: agentCat.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{agent.icon}</div><div style={{ display: "flex", gap: 4, padding: "8px 0" }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: agentCat.color, animation: `pulse 1s ${i * 0.15}s infinite` }} />)}</div></div>}
    </div>
    <div style={{ padding: "8px 0 0" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 10px 10px 16px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 14 }}>
        <textarea ref={inputRef} value={chatInput} onChange={e => setInputs(p => ({ ...p, [agent.id]: e.target.value }))} onKeyDown={handleKey} placeholder={`Ask ${agent.name}...`} rows={1} aria-label={`Message ${agent.name}`} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.t1, fontSize: 15, fontFamily: "'Outfit'", lineHeight: 1.5, resize: "none", maxHeight: 120, padding: "4px 0" }} disabled={streaming} />
        <button onClick={sendMessage} disabled={!chatInput.trim() || streaming} aria-label="Send message" style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, border: "none", background: chatInput.trim() && !streaming ? (agentCat.color || T.teal) : T.bgA, color: chatInput.trim() && !streaming ? "#000" : T.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowUp size={18} /></button>
      </div>
    </div>
  </div>;

  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ marginBottom: 20 }}><h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600 }}>AI Gateway</h1><p style={{ color: T.t2, marginTop: 4, fontSize: 14 }}>{AGENTS.length} domain agents · Live Claude API</p></div>
    <div role="group" aria-label="Filter by category" style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}><Pill active={!cat} color={T.teal} onClick={() => setCat(null)}>All ({AGENTS.length})</Pill>{CATS.map(c => { const count = AGENTS.filter(a => a.cat === c.id).length; return <Pill key={c.id} active={cat === c.id} color={c.color} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.icon} {c.label} ({count})</Pill>; })}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 16 }}>
      <Search size={14} style={{ color: T.t3 }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter agents..." aria-label="Filter agents" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.t1, fontFamily: "'Outfit'", fontSize: 14 }} />{search && <button onClick={() => setSearch("")} aria-label="Clear filter" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer" }}>×</button>}
    </div>
    <div className="g3" style={{ gap: 12 }}>
      {filtered.map(a => { const hasChat = sessions[a.id]?.length > 0; return <div key={a.id} onClick={() => openAgent(a.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAgent(a.id); } }} style={{ padding: 16, background: T.bgE, border: `1px solid ${hasChat ? T.bd2 : T.bd}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s", position: "relative" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.bd2; }} onMouseLeave={e => { e.currentTarget.style.borderColor = hasChat ? T.bd2 : T.bd; }} onFocus={e => { e.currentTarget.style.borderColor = T.bd2; }} onBlur={e => { e.currentTarget.style.borderColor = hasChat ? T.bd2 : T.bd; }}>
        {hasChat && <><div aria-hidden="true" style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: T.teal }} /><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>Active chat session</span></>}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{a.icon}</span><div><div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 11, color: T.t3 }}>{CATS.find(c => c.id === a.cat)?.label}</div></div></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{a.tags.map((t, j) => <span key={j} style={{ fontSize: 10, padding: "2px 7px", background: "rgba(255,255,255,0.03)", borderRadius: 5, color: T.t3 }}>{t}</span>)}</div>
        <div style={{ marginTop: 8, fontSize: 11, fontFamily: "var(--mono)", color: T.t3 }}>${a.rate[0]}–${a.rate[1]}/hr</div>
      </div>; })}
    </div>
    {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.t3 }}>No agents match.</div>}
  </div>;
}

// ═══ COMMAND CENTER ═══
const CC_TABS = [
  { id: "pipeline", label: "Pipeline", emoji: "🔗", color: T.teal },
  { id: "decision", label: "Decision", emoji: "🧠", color: T.vio },
  { id: "identity", label: "Identity", emoji: "🕸️", color: T.acc },
  { id: "dealdesk", label: "Deal Desk", emoji: "💰", color: T.err },
  { id: "execution", label: "Execution", emoji: "⚙️", color: T.ok },
  { id: "learning", label: "Learning", emoji: "📈", color: T.warn },
  { id: "orchestration", label: "Orchestrate", emoji: "🎯", color: T.rose },
  { id: "voice", label: "Voice", emoji: "📞", color: T.cyan },
  { id: "agents", label: "Agents", emoji: "🏪", color: T.ora },
  { id: "trust", label: "Trust", emoji: "🔐", color: T.acc },
];

// ═══ LAWRENCE 4-GATE RAG PIPELINE ═══
const LAWRENCE_GATES = [
  { id: "gate-intake", label: "Intake", emoji: "📥", color: T.acc, status: "healthy", description: "Ingest sources into durable buffer", sources: [{ id: "s3_docs", type: "S3", label: "lawrence-prod-docs/intake/", throughput: "142/hr" }, { id: "kafka_events", type: "Kafka", label: "lawrence.intake.raw", throughput: "1,847/hr" }], prechecks: ["schema.validate", "dlp.scan", "virus.scan"], output: "lawrence.intake.ready", metrics: { ingested_24h: 4218, avg_latency_ms: 42, error_rate: 0.002, buffer_depth: 156, buffer_ttl: "7d" } },
  { id: "gate-parsing", label: "Parsing", emoji: "📄", color: T.warn, status: "healthy", description: "Parse, normalize, chunk with semantic splitter", parsers: [{ id: "pdf_parser", type: "PDF", tool: "pdfplumber", fallback: "OCR", docs_24h: 892 }, { id: "html_parser", type: "HTML", tool: "readability", sanitize: true, docs_24h: 3326 }], chunking: { method: "semantic", chunk_bytes: "50KB", overlap_bytes: "5KB" }, normalization: ["strip_bom", "normalize_unicode", "lowercase_headings"], output: "lawrence.parsed.chunks", metrics: { chunks_24h: 28450, avg_chunk_size: "12.4KB", parse_errors: 3, avg_latency_ms: 128 } },
  { id: "gate-embedding", label: "Embed + RAG", emoji: "🧬", color: T.vio, status: "healthy", description: "Embed chunks, store vectors, retrieve for RAG", embed_model: { name: "bge-large", provider: "Azure OpenAI", tps: 10, rpm: 600 }, vector_store: { type: "pgvector", index: "ivfflat", ttl: "90d", vectors_total: 1247830 }, retrieval: { top_k: 8, doc_types: ["policy", "kb", "runbook"] }, output: "lawrence.rag.materialized", metrics: { embedded_24h: 28450, retrieval_p50_ms: 18, retrieval_p95_ms: 67, index_size_gb: 4.2, cache_hit_rate: 0.73 } },
  { id: "gate-decisions", label: "Decisions", emoji: "⚖️", color: T.ok, status: "healthy", description: "Policy enforcement, model routing, outcome disposition", policy: { engine: "Rego", version: "2026-03-23", rules: [{ id: "doc_disposition", when: "doc.sensitivity == 'restricted'", action: "reject", hits_24h: 47 }, { id: "long_docs", when: "doc.chunk_count > 500", action: "route:batch", hits_24h: 12 }, { id: "default_accept", when: "true", action: "accept", hits_24h: 4159 }] }, model_routing: { default: "gpt-4.1-mini", heavy: "gpt-4.1", p95_budget_ms: 2000 }, outputs: { accept: { topic: "lawrence.decisions.accepted", count_24h: 4159 }, reject: { topic: "lawrence.decisions.rejected", count_24h: 47 }, batch: { topic: "lawrence.decisions.batch", count_24h: 12 } }, metrics: { decisions_24h: 4218, accept_rate: 0.986, avg_latency_ms: 340, policy_eval_ms: 8 } },
];
const LAWRENCE_EXPORTS = [
  { id: "export-accepted", type: "Snowflake", sink: "LAWRENCE_PROD.PIPELINE.ACCEPTED", lineage: true, rows_24h: 4159 },
  { id: "export-rejected", type: "S3 Audit", sink: "lawrence-prod-audit/rejected/", retention: "365d", rows_24h: 47 },
];
const LAWRENCE_TELEMETRY = { tracing: { endpoint: "telemetry.lawrence.internal:4317", sampling_rate: 0.15, full_trace_on: ["reject", "error"] }, metrics: { collectors: 1, dimensions: ["gate", "source", "doc_type", "parser", "embed_model", "policy_version"] }, events: { topic: "lawrence.pipeline.events", schema: "lawrence.telemetry.v1" } };
const LAWRENCE_TOPICS = ["lawrence.intake.raw", "lawrence.intake.ready", "lawrence.parsed.chunks", "lawrence.rag.materialized", "lawrence.decisions.accepted", "lawrence.decisions.rejected", "lawrence.decisions.batch", "lawrence.pipeline.events"];
// Command Center data — computed by real engines
const CC_SCORED = MOCK_CANDS.slice(0, 5).map(c => {
  const result = scoreCandidateFromRecord(c);
  return { id: c.id, name: c.name, score: result.overall_score, recommendation: result.recommendation, urgency: result.overall_score >= 80 ? "immediate" : result.overall_score >= 60 ? "today" : "low", risk: result.risk_flags.length > 0 ? result.risk_flags[0] : null, strengths: result.strengths, risk_flags: result.risk_flags };
});
const CC_DEALS = MOCK_JOBS.slice(0, 4).map(j => {
  const margin = j.bill_rate && j.pay_rate ? (1 - j.pay_rate / j.bill_rate) : 0;
  const evInput = { placement_probability: (j.score || 50) / 100, bill_rate: j.bill_rate || 0, pay_rate: j.pay_rate || 0, fee_type: "flat", fee_value: (j.bill_rate - j.pay_rate) * 2080 * margin };
  const ev = computeEV(evInput);
  const decision = margin >= 0.3 ? "allow" : margin >= 0.2 ? "constrain" : "block";
  return { candidate: j.title, job: j.client_name, bill: j.bill_rate, pay: j.pay_rate, margin, ev: ev.expected_value, decision };
});

function CommandCenterPage() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [selScore, setSelScore] = useState(null);
  const [banditArms, setBanditArms] = useState(DEFAULT_BANDIT_ARMS);
  // Fetch real Thompson Sampling arms from Supabase
  useEffect(() => {
    (async () => { try {
      const res = await sbFetch("/rest/v1/thompson_arms?select=arm_key,segment,alpha,beta_param,total_pulls,total_reward,mean_reward&order=arm_key", { headers: { apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGtkZ2xqZmtnaW9qZmJyZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTc2NjIsImV4cCI6MjA1ODI3MzY2Mn0.GKJJqxfJRkFJylI1Zll1bj1HzKT2raWRpz6RMaZR37c" } });
      if (res.ok) { const rows = await res.json(); if (rows.length > 0) setBanditArms(rows.map(r => ({ arm: r.segment || r.arm_key, alpha: parseFloat(r.alpha), beta: parseFloat(r.beta_param), total_pulls: r.total_pulls, total_rewards: parseFloat(r.total_reward) }))); }
    } catch (e) {} })();
  }, []);
  const [sampledW, setSampledW] = useState(null);
  const sorted = [...CC_SCORED].sort((a, b) => b.score - a.score);
  // Run Thompson Sampling on mount
  useEffect(() => { setSampledW(sampleThompsonWeights(banditArms)); }, [banditArms]);
  const expectedW = getExpectedWeights(banditArms);
  // Run hybrid matching + decision engine
  const matchResults = useMemo(() => runLocalHybridMatch(MOCK_CANDS, MOCK_JOBS[0], sampledW), [sampledW]);
  const decisionActions = useMemo(() => {
    const actions = [];
    matchResults.slice(0, 5).forEach(m => { const cand = MOCK_CANDS.find(c => c.id === m.candidate_id); if (cand) actions.push(...decideFromMatch(m, MOCK_JOBS[0], cand)); });
    // Job scoring decisions
    MOCK_JOBS.slice(0, 3).forEach(j => { const jScore = scoreJob({ clarity: j.skills?.length > 3 ? 0.8 : 0.5, budget: j.bill_rate > 140 ? 0.8 : 0.5, timeline: 0.6, exclusivity: 0.7, relationship: 0.6 }); actions.push(...decideFromJobScore(j, jScore)); });
    // Economics decisions
    const ranked = rankJobsLocally(MOCK_JOBS, MOCK_CANDS);
    actions.push(...decideFromEconomics(ranked));
    return actions;
  }, [matchResults]);
  // Drift detection
  const [driftData, setDriftData] = useState(() => detectDrift(Array.from({ length: 40 }, (_, i) => 0.65 + Math.sin(i * 0.2) * 0.15)));
  useEffect(() => {
    (async () => { try {
      const res = await sbFetch("/rest/v1/candidate_job_matches?select=overall_score&order=created_at.desc&limit=50", { headers: { apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGtkZ2xqZmtnaW9qZmJyZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTc2NjIsImV4cCI6MjA1ODI3MzY2Mn0.GKJJqxfJRkFJylI1Zll1bj1HzKT2raWRpz6RMaZR37c" } });
      if (res.ok) { const rows = await res.json(); if (rows.length >= 20) setDriftData(detectDrift(rows.map(r => (r.overall_score || 0) / 100))); }
    } catch (e) {} })();
  }, []);

  const renderContent = () => {
    if (activeTab === "pipeline") {
      const GateCard = ({ gate, isLast }) => {
        const stColor = gate.status === "healthy" ? T.ok : gate.status === "degraded" ? T.warn : T.err;
        return <div style={{ position: "relative" }}>
          <div style={{ padding: 16, background: T.bg, border: `1px solid ${gate.color}25`, borderRadius: 12, borderLeft: `3px solid ${gate.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>{gate.emoji}</span><div><div style={{ fontSize: 13, fontWeight: 700 }}>{gate.label}</div><div style={{ fontSize: 10, color: T.t3 }}>{gate.id}</div></div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: stColor, boxShadow: `0 0 6px ${stColor}40` }} /><span style={{ fontSize: 10, fontFamily: "var(--mono)", color: stColor }}>{gate.status.toUpperCase()}</span></div>
            </div>
            <div style={{ fontSize: 11, color: T.t2, marginBottom: 10, lineHeight: 1.4 }}>{gate.description}</div>
            <div className="g4" style={{ gap: 6, marginBottom: 10 }}>{Object.entries(gate.metrics).slice(0, 4).map(([k, v]) => <div key={k} style={{ textAlign: "center", padding: "6px 4px", background: T.bgE, borderRadius: 6 }}><div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--mono)", color: T.t1 }}>{typeof v === "number" ? (v > 1000 ? (v / 1000).toFixed(1) + "K" : v.toLocaleString()) : v}</div><div style={{ fontSize: 8, color: T.t3, marginTop: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.replace(/_/g, " ").replace("24h", "/24h")}</div></div>)}</div>
            {gate.sources && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, fontWeight: 600, color: T.t3, marginBottom: 4, textTransform: "uppercase" }}>Sources</div>{gate.sources.map(s => <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 0" }}><Badge color={s.type === "Kafka" ? T.warn : T.acc}>{s.type}</Badge><span style={{ color: T.t2, fontFamily: "var(--mono)", fontSize: 10 }}>{s.label}</span><span style={{ marginLeft: "auto", fontSize: 9, color: T.t3 }}>{s.throughput}</span></div>)}</div>}
            {gate.parsers && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, fontWeight: 600, color: T.t3, marginBottom: 4, textTransform: "uppercase" }}>Parsers</div>{gate.parsers.map(p => <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 0" }}><Badge color={gate.color}>{p.type}</Badge><span style={{ color: T.t2, fontSize: 10 }}>{p.tool}{p.fallback ? ` → ${p.fallback}` : ""}</span><span style={{ marginLeft: "auto", fontSize: 9, color: T.t3, fontFamily: "var(--mono)" }}>{p.docs_24h?.toLocaleString()}/24h</span></div>)}</div>}
            {gate.embed_model && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, fontWeight: 600, color: T.t3, marginBottom: 4, textTransform: "uppercase" }}>Model</div><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}><Badge color={T.vio}>{gate.embed_model.name}</Badge><span style={{ color: T.t3, fontSize: 10 }}>{gate.embed_model.provider} · {gate.embed_model.tps} TPS</span></div>{gate.vector_store && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, marginTop: 4 }}><Badge color={T.teal}>pgvector</Badge><span style={{ color: T.t3, fontSize: 10, fontFamily: "var(--mono)" }}>{(gate.vector_store.vectors_total / 1000000).toFixed(1)}M vectors · {gate.retrieval.top_k} top-k</span></div>}</div>}
            {gate.policy && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, fontWeight: 600, color: T.t3, marginBottom: 4, textTransform: "uppercase" }}>Policy Rules ({gate.policy.engine} v{gate.policy.version})</div>{gate.policy.rules.map(r => <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, padding: "4px 0", borderBottom: `1px solid ${T.bd}` }}><Badge color={r.action === "reject" ? T.err : r.action === "accept" ? T.ok : T.warn}>{r.action}</Badge><span style={{ color: T.t2, fontFamily: "var(--mono)", flex: 1, fontSize: 9 }}>{r.when}</span><span style={{ fontSize: 9, color: T.t3 }}>{r.hits_24h} hits</span></div>)}</div>}
            {gate.prechecks && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{gate.prechecks.map((p, i) => <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.ok + "10", color: T.ok, fontFamily: "var(--mono)" }}>✓ {p}</span>)}</div>}
            {gate.outputs && <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>{Object.entries(gate.outputs).map(([k, v]) => <div key={k} style={{ textAlign: "center", padding: "6px 4px", background: k === "reject" ? T.err + "08" : k === "batch" ? T.warn + "08" : T.ok + "08", borderRadius: 6, border: `1px solid ${k === "reject" ? T.err : k === "batch" ? T.warn : T.ok}15` }}><div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)", color: k === "reject" ? T.err : k === "batch" ? T.warn : T.ok }}>{v.count_24h}</div><div style={{ fontSize: 8, color: T.t3, textTransform: "uppercase" }}>{k}</div></div>)}</div>}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: T.t3, fontFamily: "var(--mono)" }}><ArrowRight size={10} />{gate.output}</div>
          </div>
          {!isLast && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0" }}><div style={{ width: 1, height: 16, background: T.bd2 }} /><div style={{ width: 8, height: 8, borderRadius: "50%", border: `1px solid ${T.bd2}`, background: T.bgE, display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowDown size={6} color={T.t3} /></div><div style={{ width: 1, height: 8, background: T.bd2 }} /></div>}
        </div>;
      };
      return <div>
        <div className="g5" style={{ gap: 8, marginBottom: 16 }}>
          <MetricCard label="DOCS/24H" value={(LAWRENCE_GATES[0].metrics.ingested_24h).toLocaleString()} color={T.acc} />
          <MetricCard label="CHUNKS/24H" value={(LAWRENCE_GATES[1].metrics.chunks_24h / 1000).toFixed(1) + "K"} />
          <MetricCard label="VECTORS" value={(LAWRENCE_GATES[2].vector_store.vectors_total / 1000000).toFixed(1) + "M"} color={T.vio} />
          <MetricCard label="ACCEPT RATE" value={(LAWRENCE_GATES[3].metrics.accept_rate * 100).toFixed(1) + "%"} color={T.ok} />
          <MetricCard label="E2E LATENCY" value={LAWRENCE_GATES.reduce((s, g) => s + g.metrics.avg_latency_ms, 0) + "ms"} />
        </div>
        <div className="g-side" style={{ gap: 16 }}>
          <div>{LAWRENCE_GATES.map((g, i) => <GateCard key={g.id} gate={g} isLast={i === LAWRENCE_GATES.length - 1} />)}</div>
          <div>
            <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Exports</div>
              {LAWRENCE_EXPORTS.map(e => <div key={e.id} style={{ padding: 8, background: T.bgE, borderRadius: 6, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><Badge color={e.type === "Snowflake" ? T.acc : T.warn}>{e.type}</Badge><span style={{ fontSize: 10, fontFamily: "var(--mono)", color: T.t2 }}>{e.rows_24h.toLocaleString()}/24h</span></div>
                <div style={{ fontSize: 9, color: T.t3, fontFamily: "var(--mono)" }}>{e.sink}</div>
                {e.retention && <div style={{ fontSize: 9, color: T.t3, marginTop: 2 }}>Retention: {e.retention}</div>}
                {e.lineage && <span style={{ fontSize: 8, color: T.teal }}>✓ lineage</span>}
              </div>)}
            </div>
            <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Telemetry</div>
              <div style={{ fontSize: 10, marginBottom: 6 }}><Badge color={T.ok}>OTLP</Badge><span style={{ color: T.t3, fontSize: 9, marginLeft: 6 }}>{LAWRENCE_TELEMETRY.tracing.endpoint}</span></div>
              <div style={{ fontSize: 10, marginBottom: 6 }}><span style={{ color: T.t3 }}>Sampling: </span><span style={{ fontFamily: "var(--mono)", color: T.t2 }}>{(LAWRENCE_TELEMETRY.tracing.sampling_rate * 100)}%</span><span style={{ color: T.t3, fontSize: 9 }}> (100% on {LAWRENCE_TELEMETRY.tracing.full_trace_on.join(", ")})</span></div>
              <div style={{ fontSize: 10 }}><span style={{ color: T.t3 }}>Dimensions: </span><span style={{ fontFamily: "var(--mono)", color: T.t2, fontSize: 9 }}>{LAWRENCE_TELEMETRY.metrics.dimensions.join(", ")}</span></div>
            </div>
            <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Kafka Topics ({LAWRENCE_TOPICS.length})</div>
              {LAWRENCE_TOPICS.map((t, i) => <div key={i} style={{ fontSize: 9, fontFamily: "var(--mono)", color: T.t2, padding: "3px 0", borderBottom: `1px solid ${T.bd}`, display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 4, height: 4, borderRadius: "50%", background: T.ok }} />{t}</div>)}
            </div>
          </div>
        </div>
      </div>;
    }
    if (activeTab === "decision") return <div className="g-side" style={{ gap: 16 }}>
      <div>
        <div className="g4" style={{ gap: 8, marginBottom: 16 }}>
          <MetricCard label="SCORED" value={CC_SCORED.length} /><MetricCard label="AVG" value={Math.round(CC_SCORED.reduce((s, x) => s + x.score, 0) / CC_SCORED.length) + "%"} /><MetricCard label="RISKS" value={CC_SCORED.filter(x => x.risk).length} color={T.err} /><MetricCard label="FAST TRACK" value={CC_SCORED.filter(x => x.recommendation === "FAST_TRACK").length} color={T.ok} />
        </div>
        {sorted.map((c, i) => <div key={c.id} onClick={() => setSelScore(c.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelScore(c.id); } }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 2, background: selScore === c.id ? T.vio + "12" : "rgba(255,255,255,0.008)", border: `1px solid ${selScore === c.id ? T.vio + "30" : T.bd}`, borderRadius: 8, cursor: "pointer" }}><span style={{ fontSize: 11, fontFamily: "var(--mono)", color: T.t3, width: 20 }}>#{i + 1}</span><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.name}</span><span style={{ fontFamily: "var(--mono)", fontSize: 12, color: c.score > 80 ? T.ok : c.score > 60 ? T.warn : T.err }}>{c.score}%</span>{c.risk && <span style={{ fontSize: 9, color: T.err }}>⚠ {c.risk.replace(/_/g, " ")}</span>}<Badge color={c.recommendation === "FAST_TRACK" ? T.ok : c.recommendation === "REVIEW" ? T.warn : T.err}>{c.recommendation}</Badge></div>)}
      </div>
      <div style={{ borderLeft: `1px solid ${T.bd}`, paddingLeft: 16 }}>{selScore ? (() => { const rec = MOCK_CANDS.find(c => c.id === selScore); const scoring = rec?._scoring; return <div><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{CC_SCORED.find(s => s.id === selScore)?.name}</div>{scoring && Object.entries(CAND_WEIGHTS).map(([k, w]) => { const val = (scoring.score_json[k] || 0) / w; return <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, marginBottom: 6 }}><span style={{ width: 90, color: T.t3, fontFamily: "var(--mono)" }}>{k}</span><div style={{ flex: 1, height: 6, background: T.bd, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${val * 100}%`, height: "100%", background: val > 0.7 ? T.ok : val > 0.4 ? T.warn : T.err, borderRadius: 3 }} /></div><span style={{ width: 30, textAlign: "right", fontFamily: "var(--mono)", color: T.t2, fontSize: 10 }}>{(val * 100).toFixed(0)}%</span></div>; })}{scoring?.risk_flags?.length > 0 && <div style={{ marginTop: 8 }}>{scoring.risk_flags.map((f, i) => <div key={i} style={{ fontSize: 10, color: T.err, fontFamily: "var(--mono)", marginBottom: 2 }}>⚠ {f.replace(/_/g, " ")}</div>)}</div>}{scoring?.strengths?.length > 0 && <div style={{ marginTop: 6 }}>{scoring.strengths.map((s, i) => <div key={i} style={{ fontSize: 10, color: T.ok, fontFamily: "var(--mono)", marginBottom: 2 }}>✓ {s.replace(/_/g, " ")}</div>)}</div>}</div>; })() : <div style={{ color: T.t3, fontSize: 12, padding: 20 }}>Select a candidate</div>}</div>
    </div>;
    if (activeTab === "dealdesk") return <div>
      <div className="g5" style={{ gap: 8, marginBottom: 16 }}><MetricCard label="EVALUATED" value={CC_DEALS.length} /><MetricCard label="ALLOWED" value={CC_DEALS.filter(d => d.decision === "allow").length} color={T.ok} /><MetricCard label="BLOCKED" value={CC_DEALS.filter(d => d.decision === "block").length} color={T.err} /><MetricCard label="AVG MARGIN" value={(CC_DEALS.reduce((s, d) => s + d.margin, 0) / CC_DEALS.length * 100).toFixed(1) + "%"} /><MetricCard label="TOTAL EV" value={"$" + CC_DEALS.filter(d => d.decision === "allow").reduce((s, d) => s + d.ev, 0).toLocaleString()} color={T.ok} /></div>
      {CC_DEALS.map((d, i) => <div key={i} style={{ padding: 14, marginBottom: 6, background: d.decision === "block" ? T.err + "08" : d.decision === "constrain" ? T.warn + "08" : T.ok + "08", border: `1px solid ${d.decision === "block" ? T.err + "20" : d.decision === "constrain" ? T.warn + "20" : T.ok + "20"}`, borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div><span style={{ fontWeight: 600, fontSize: 13 }}>{d.candidate}</span><span style={{ color: T.t3, fontSize: 12, marginLeft: 10 }}>{d.job}</span></div><Badge color={d.decision === "block" ? T.err : d.decision === "constrain" ? T.warn : T.ok}>{d.decision.toUpperCase()}</Badge></div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, fontFamily: "var(--mono)", color: T.t2 }}><span>Bill: ${d.bill}/hr</span><span>Pay: ${d.pay}/hr</span><span style={{ color: d.margin < 0.2 ? T.err : T.ok }}>Margin: {(d.margin * 100).toFixed(1)}%</span><span>EV: ${typeof d.ev === "number" ? d.ev.toLocaleString() : d.ev}</span></div>
      </div>)}
    </div>;
    if (activeTab === "execution") { const steps = decisionActions.slice(0, 5).map((a, i) => ({ role: a.action_type.toLowerCase().replace(/_/g, " "), action: `${a.action_type}: ${a.payload?.candidate_name || a.payload?.message?.slice(0, 40) || a.entity_id?.slice(0, 8)}`, status: i < 2 ? "completed" : i === 2 ? "executing" : "planned", confidence: (a.decision_reasoning.confidence * 100).toFixed(0) + "%" })); const rc = { "submit candidate": T.acc, "suggest shortlist": T.vio, "send outreach": T.warn, "prioritize job": T.ok, "trigger scoring": T.teal, "flag risk": T.err, "notify recruiter": T.ora }; return <div><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}><MetricCard label="ACTIONS GENERATED" value={decisionActions.length} /><MetricCard label="AUTO-APPROVED" value={decisionActions.filter(a => !a.requires_approval).length} color={T.ok} /><MetricCard label="NEEDS REVIEW" value={decisionActions.filter(a => a.requires_approval).length} color={T.warn} /></div>{steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, paddingLeft: 4, position: "relative" }}>{i < steps.length - 1 && <div style={{ position: "absolute", left: 7, top: 18, bottom: -14, width: 1, background: T.bd }} />}<div style={{ width: 14, height: 14, borderRadius: "50%", background: s.status === "completed" ? (rc[s.role] || T.ok) : T.bd, flexShrink: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.status === "completed" && <span style={{ fontSize: 8, color: "#000" }}>✓</span>}</div><div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12 }}><span style={{ color: rc[s.role] || T.t3, fontFamily: "var(--mono)", fontSize: 10 }}>[{s.role}]</span> {s.action}</span><span style={{ fontSize: 11, color: s.status === "completed" ? T.ok : s.status === "executing" ? T.warn : T.t3 }}>{s.confidence} {s.status}</span></div></div>)}</div>; }
    if (activeTab === "learning") { return <div><div className="g4" style={{ gap: 8, marginBottom: 16 }}><MetricCard label="ACCURACY" value={driftData.drift_detected ? `${((1 - driftData.drift_score) * 100).toFixed(0)}%` : `${((driftData.left_avg || 0.75) * 100).toFixed(0)}%`} color={driftData.drift_detected ? T.warn : T.ok} /><MetricCard label="OBSERVATIONS" value={banditArms.reduce((s, a) => s + a.total_pulls, 0)} /><MetricCard label="DRIFT" value={`${(driftData.drift_score * 100).toFixed(1)}%`} color={driftData.drift_detected ? T.err : T.ok} /><MetricCard label="METHOD" value="Thompson" /></div><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Adaptive Weights (Thompson Sampling)</div>{Object.entries(expectedW).map(([k, v]) => <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, marginBottom: 8 }}><span style={{ width: 80, color: T.t3, fontFamily: "var(--mono)" }}>{k}</span><div style={{ flex: 1, height: 6, background: T.bd, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${v * 100}%`, height: "100%", background: T.teal, borderRadius: 3 }} /></div><span style={{ width: 40, textAlign: "right", fontFamily: "var(--mono)", color: T.t2, fontSize: 10 }}>{(v * 100).toFixed(1)}%</span></div>)}<div style={{ fontSize: 11, fontWeight: 600, marginTop: 16, marginBottom: 8, color: T.t3 }}>Bandit Arms (α/β posteriors)</div>{banditArms.map(a => <div key={a.arm} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, marginBottom: 4 }}><span style={{ width: 80, fontFamily: "var(--mono)", color: T.t2 }}>{a.arm}</span><span style={{ fontFamily: "var(--mono)", color: T.ok, width: 50 }}>α={a.alpha}</span><span style={{ fontFamily: "var(--mono)", color: T.err, width: 50 }}>β={a.beta}</span><span style={{ fontFamily: "var(--mono)", color: T.t3 }}>pulls={a.total_pulls}</span></div>)}{driftData.drift_detected && <div style={{ marginTop: 12, padding: 10, background: T.err + "08", border: `1px solid ${T.err}20`, borderRadius: 8, fontSize: 11, color: T.err }}>⚠ DRIFT DETECTED — score {(driftData.drift_score * 100).toFixed(1)}% exceeds {DRIFT_THRESHOLD * 100}% threshold. Arms reset recommended.</div>}</div>; }
    if (activeTab === "orchestration") return <div><div className="g4" style={{ gap: 8, marginBottom: 16 }}><MetricCard label="ACTIVE AGENTS" value="6" /><MetricCard label="TASKS" value="3" /><MetricCard label="COMPLETED" value="142" /><MetricCard label="AVG DURATION" value="4.2s" /></div>{[["Research", "Context gathering", T.acc], ["Decision", "Scoring & ranking", T.vio], ["Validator", "Compliance gates", T.warn], ["Execution", "Outreach & scheduling", T.ok], ["Learning", "Outcome tracking", T.teal], ["Observer", "Anomaly detection", T.rose]].map(([role, desc, color], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.bd}` }}><div aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: color }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{role}</div><div style={{ fontSize: 11, color: T.t3 }}>{desc}</div></div><div aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: T.ok }} /><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>Status: healthy</span></div>)}</div>;
    if (activeTab === "voice") { const calls = [{ name: "Sarah Chen", agent: "SAP Agent", status: "completed", score: 87, result: "pass", dur: "5:40" }, { name: "Elena Rodriguez", agent: "DevOps Agent", status: "completed", score: 72, result: "review", dur: "4:20" }, { name: "Tom Harris", agent: "ServiceNow Agent", status: "in_progress", score: null, result: null, dur: "2:25" }]; return <div><div className="g4" style={{ gap: 8, marginBottom: 16 }}><MetricCard label="CALLS" value={calls.length} /><MetricCard label="PASS RATE" value="50%" /><MetricCard label="AVG SCORE" value="80" /><MetricCard label="LIVE" value="1" color={T.warn} /></div>{calls.map((c, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.bd}` }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: c.status === "in_progress" ? T.warn : T.ok }} /><CAvatar name={c.name} size={28} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: T.t3 }}>{c.agent} · {c.dur}</div></div>{c.score && <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: c.score >= 70 ? T.ok : T.warn }}>{c.score}</span>}<Badge color={c.status === "in_progress" ? T.warn : c.result === "pass" ? T.ok : T.rose}>{c.status === "in_progress" ? "LIVE" : c.result?.toUpperCase()}</Badge></div>)}</div>; }
    if (activeTab === "agents") { const templates = [{ name: "Tech Recruiter", installs: 847, rating: 4.8, color: T.acc }, { name: "SAP Screening", installs: 312, rating: 4.6, color: T.vio }, { name: "ServiceNow Pipeline", installs: 256, rating: 4.5, color: T.teal }, { name: "Outbound Sales", installs: 1204, rating: 4.7, color: T.warn }, { name: "Voice Screening", installs: 89, rating: 4.9, color: T.rose }, { name: "Ops Automation", installs: 178, rating: 4.3, color: T.ora }]; return <div style={{  }}>{templates.map((t, i) => <div key={i} style={{ padding: 14, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10 }}><div style={{ width: 36, height: 36, borderRadius: 8, background: t.color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}><Zap size={16} color={t.color} /></div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.name}</div><div style={{ fontSize: 11, color: T.t3, fontFamily: "var(--mono)", marginBottom: 8 }}>★ {t.rating} · {t.installs.toLocaleString()}</div><button aria-label={`Install ${t.name}`} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 6, border: `1px solid ${t.color}30`, background: t.color + "10", color: t.color, cursor: "pointer", fontWeight: 600, fontFamily: "var(--mono)" }}>INSTALL</button></div>)}</div>; }
    if (activeTab === "trust") return <div><div className="g4" style={{ gap: 8, marginBottom: 16 }}><MetricCard label="CHAIN" value="1,847" /><MetricCard label="MERKLE" value="12" /><MetricCard label="SEQ" value="#1847" /><MetricCard label="INTEGRITY" value="✓" color={T.ok} /></div><div style={{ fontFamily: "var(--mono)", fontSize: 10, padding: 12, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, lineHeight: 2 }}><div style={{ color: T.t3 }}>LATEST HASH</div><div style={{ color: T.acc }}>sha256:a91f3e7c82d4b6f1...e12c</div><div style={{ color: T.t3, marginTop: 6 }}>MERKLE ROOT</div><div style={{ color: T.teal }}>root:7f2a9b...4a8f</div></div><div style={{ display: "flex", gap: 6, marginTop: 10 }}><button aria-label="Attest" style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.acc}30`, background: T.acc + "10", color: T.acc, cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "var(--mono)" }}>ATTEST</button><button aria-label="Verify" style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.teal}30`, background: T.teal + "10", color: T.teal, cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "var(--mono)" }}>VERIFY</button></div></div>;
    return null;
  };
  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ marginBottom: 20 }}><h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>Command Center<span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: T.teal + "15", color: T.teal, fontFamily: "var(--mono)", fontWeight: 600 }}>LAWRENCE v1.0</span></h1><p style={{ color: T.t2, marginTop: 4, fontSize: 14 }}>4-Gate RAG pipeline · Decision engine · Governance</p></div>
    <div role="tablist" aria-label="Command Center sections" style={{ display: "flex", gap: 2, marginBottom: 20, background: T.bgE, borderRadius: 10, padding: 3, border: `1px solid ${T.bd}` }}>{CC_TABS.map(t => <button key={t.id} role="tab" aria-selected={activeTab === t.id} aria-controls={`cc-panel-${t.id}`} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 10px", borderRadius: 8, background: activeTab === t.id ? t.color + "15" : "transparent", border: activeTab === t.id ? `1px solid ${t.color}30` : "1px solid transparent", color: activeTab === t.id ? t.color : T.t3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit'", flex: 1, justifyContent: "center" }}><span aria-hidden="true">{t.emoji}</span>{t.label}</button>)}</div>
    <div id={`cc-panel-${activeTab}`} role="tabpanel" aria-label={`${CC_TABS.find(t=>t.id===activeTab)?.label} panel`} style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 20, minHeight: 400 }}>{renderContent()}</div>
  </div>;
}

// ═══ DASHBOARD ═══
// ═══ DASHBOARD DATA — Time-period aware metrics ═══
const PERIODS = [
  { id: "1w", label: "1 Week", days: 7 },
  { id: "1m", label: "1 Month", days: 30 },
  { id: "3m", label: "3 Months", days: 90 },
  { id: "6m", label: "6 Months", days: 180 },
  { id: "1y", label: "1 Year", days: 365 },
  { id: "ytd", label: "YTD", days: null },
  { id: "all", label: "All Time", days: null },
];
// Simulated metrics by period — in production these come from Supabase aggregation queries
// Compute dashboard metrics from actual entity data
const computeMetrics = () => {
  const cands = MOCK_CANDS.length;
  const openJobs = MOCK_JOBS.filter(j => j.status === "open" || j.status === "sourcing").length;
  const totalJobs = MOCK_JOBS.length;
  const subs = MOCK_CANDS.reduce((a, c) => a + (c.submissions_count || 0), 0) || 43;
  const interviews = MOCK_CANDS.filter(c => c.status === "interview").length * 3 || 12;
  const offers = MOCK_OFFERS.length;
  const placements = MOCK_PLACES.length;
  const clients = MOCK_CLIENTS.length;
  const revenue = MOCK_PLACES.reduce((a, p) => a + (p.est_revenue || 0), 0);
  const marginPct = MOCK_PLACES.length > 0 ? MOCK_PLACES.reduce((a, p) => a + (p.bill_rate && p.pay_rate ? (1 - p.pay_rate / p.bill_rate) * 100 : 0), 0) / MOCK_PLACES.length : 0;
  const fillRate = totalJobs > 0 ? (placements / totalJobs) * 100 : 0;
  return { candidates: cands, jobs: openJobs, submissions: subs, interviews, offers, placements, totalJobs, clients, revenue, margin: Math.round(marginPct * 10) / 10, fillRate: Math.round(fillRate * 10) / 10 };
};
const LIVE_METRICS = computeMetrics();
const METRICS_BY_PERIOD = {
  "1w": { ...LIVE_METRICS, candidates: Math.round(LIVE_METRICS.candidates * 0.08), submissions: Math.round(LIVE_METRICS.submissions * 0.1), revenue: Math.round(LIVE_METRICS.revenue * 0.05) },
  "1m": { ...LIVE_METRICS, candidates: Math.round(LIVE_METRICS.candidates * 0.3), submissions: Math.round(LIVE_METRICS.submissions * 0.35), revenue: Math.round(LIVE_METRICS.revenue * 0.15) },
  "3m": { ...LIVE_METRICS, candidates: Math.round(LIVE_METRICS.candidates * 0.6), submissions: Math.round(LIVE_METRICS.submissions * 0.6), revenue: Math.round(LIVE_METRICS.revenue * 0.4) },
  "6m": { ...LIVE_METRICS, candidates: Math.round(LIVE_METRICS.candidates * 0.85), submissions: Math.round(LIVE_METRICS.submissions * 0.8), revenue: Math.round(LIVE_METRICS.revenue * 0.7) },
  "1y": LIVE_METRICS,
  "ytd": { ...LIVE_METRICS, candidates: Math.round(LIVE_METRICS.candidates * 0.7), submissions: Math.round(LIVE_METRICS.submissions * 0.7), revenue: Math.round(LIVE_METRICS.revenue * 0.6) },
  "all": LIVE_METRICS,
};
// Previous period — simulated as ~85% of current for realistic change %
const mkPrev = (m) => ({ candidates: Math.round(m.candidates * 0.88), jobs: Math.max(m.jobs - 1, 1), submissions: Math.round(m.submissions * 0.92), interviews: Math.round(m.interviews * 0.85), offers: Math.round(m.offers * 0.83), placements: Math.max(m.placements - 1, 0), totalJobs: Math.round(m.totalJobs * 0.9), clients: Math.max(m.clients - 1, 1) });
const PREV_PERIOD = {
  "1w": mkPrev(METRICS_BY_PERIOD["1w"]),
  "1m": mkPrev(METRICS_BY_PERIOD["1m"]),
  "3m": mkPrev(METRICS_BY_PERIOD["3m"]),
  "6m": mkPrev(METRICS_BY_PERIOD["6m"]),
  "1y": mkPrev(METRICS_BY_PERIOD["1y"]),
  "ytd": mkPrev(METRICS_BY_PERIOD["ytd"]),
  "all": mkPrev(METRICS_BY_PERIOD["all"]),
};

const RC = [{ n: "Sarah Chen", t: "Sr. Full Stack Developer", i: "SC", d: "Mar 23" }, { n: "Marcus Wright", t: "DevOps Engineer", i: "MW", d: "Mar 23" }, { n: "Elena Rodriguez", t: "Product Manager", i: "ER", d: "Mar 22" }];
const RJ = [{ t: "Sr. Software Engineer", dep: "Engineering · Remote", s: "open" }, { t: "Product Manager", dep: "Product · NYC", s: "open" }, { t: "DevOps Lead", dep: "Infrastructure · SF", s: "open" }];
const RS = [{ n: "Sarah Chen", r: "Sr. Software Engineer", s: "Interview" }, { n: "Marcus Wright", r: "DevOps Lead", s: "Submitted" }, { n: "Elena Rodriguez", r: "Product Manager", s: "Hired" }];

function DashboardPage({ nav }) {
  const [period, setPeriod] = useState("all");
  const m = METRICS_BY_PERIOD[period];
  const prev = PREV_PERIOD[period];
  const pct = (cur, prv) => prv > 0 ? Math.round(((cur - prv) / prv) * 100) : 0;
  const fmt = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const activePeriod = PERIODS.find(p => p.id === period);

  const cards = [
    { title: "Candidates", value: fmt(m.candidates), IconC: Users, color: T.acc + "1a", iconColor: T.acc, change: pct(m.candidates, prev.candidates), target: "candidates" },
    { title: "Open Jobs", value: String(m.jobs), IconC: TrendingUp, color: T.ok + "1a", iconColor: T.ok, change: pct(m.jobs, prev.jobs), target: "jobs" },
    { title: "Submissions", value: fmt(m.submissions), IconC: Send, color: T.warn + "1a", iconColor: T.warn, change: pct(m.submissions, prev.submissions), target: "candidates" },
    { title: "Interviews", value: String(m.interviews), IconC: Calendar, color: T.vio + "1a", iconColor: T.vio, change: pct(m.interviews, prev.interviews), target: "candidates" },
    { title: "Offers", value: String(m.offers), IconC: Gift, color: T.warn + "1a", iconColor: T.warn, change: pct(m.offers, prev.offers), target: "offers" },
    { title: "Placements", value: String(m.placements), IconC: Award, color: T.ok + "1a", iconColor: T.ok, change: pct(m.placements, prev.placements), target: "placements" },
    { title: "Total Jobs", value: String(m.totalJobs), IconC: Briefcase, color: T.vio + "1a", iconColor: "#818cf8", change: pct(m.totalJobs, prev.totalJobs), target: "jobs" },
    { title: "Clients", value: String(m.clients), IconC: Building2, color: T.rose + "1a", iconColor: T.rose, change: pct(m.clients, prev.clients), target: "clients" },
  ];

  // Trend sparkline data — shows 6 data points for the selected period
  const trendData = useMemo(() => {
    const base = m.placements || 1;
    return Array.from({ length: 6 }, (_, i) => {
      const noise = 0.7 + Math.sin(i * 1.2 + period.length) * 0.25 + Math.random() * 0.1;
      return Math.round(base * noise * (0.6 + i * 0.08));
    });
  }, [period, m.placements]);
  const maxTrend = Math.max(...trendData, 1);

  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div><h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600 }}>Dashboard</h1><p style={{ color: T.t2, marginTop: 4, fontSize: 14 }}>Welcome back. Here's your recruiting overview.</p></div>
      <div role="group" aria-label="Time period filter" className="period-bar" style={{ background: T.bgE, borderRadius: 8, padding: 2, border: `1px solid ${T.bd}` }}>
        {PERIODS.map(p => <button key={p.id} onClick={() => setPeriod(p.id)} aria-pressed={period === p.id} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: period === p.id ? T.acc + "18" : "transparent", color: period === p.id ? T.acc : T.t3, fontSize: 11, fontWeight: period === p.id ? 600 : 400, cursor: "pointer", fontFamily: "'Outfit'", transition: "all 0.12s", whiteSpace: "nowrap" }}>{p.label}</button>)}
      </div>
    </div>

    {/* Period context bar */}
    <div className="period-ctx" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: "8px 14px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 8 }}>
      <span style={{ fontSize: 11, color: T.t3 }}>Period:</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.acc, fontFamily: "var(--mono)" }}>{activePeriod?.label}</span>
      <div style={{ width: 1, height: 14, background: T.bd2 }} />
      <span style={{ fontSize: 11, color: T.t3 }}>Revenue:</span>
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)" }}>{fmt(m.revenue)}</span>
      <div style={{ width: 1, height: 14, background: T.bd2 }} />
      <span style={{ fontSize: 11, color: T.t3 }}>Margin:</span>
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)", color: m.margin >= 30 ? T.ok : T.warn }}>{m.margin}%</span>
      <div style={{ width: 1, height: 14, background: T.bd2 }} />
      <span style={{ fontSize: 11, color: T.t3 }}>Fill Rate:</span>
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)" }}>{m.fillRate}%</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10, color: T.t3, fontFamily: "var(--mono)" }}>vs. prev {activePeriod?.label.toLowerCase()}</span>
    </div>

    {/* KPI cards */}
    <div className="g4" style={{ gap: 12, marginBottom: 24 }}>
      {cards.map((c, i) => <button key={i} onClick={() => nav && nav(c.target)} aria-label={`${c.title}: ${c.value}, ${c.change >= 0 ? "up" : "down"} ${Math.abs(c.change)}% — click to view ${c.target}`} style={{ padding: 16, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = c.iconColor; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.transform = "translateY(0)"; }}
        onFocus={e => { e.currentTarget.style.borderColor = c.iconColor; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.transform = "translateY(0)"; }}>
        <div><p style={{ fontSize: 12, color: T.t3, fontWeight: 500 }}>{c.title}</p><p style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600, marginTop: 4, lineHeight: 1.2 }}>{c.value}</p><div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, color: c.change >= 0 ? T.ok : T.err }}>{c.change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}<span>{Math.abs(c.change)}%</span><span style={{ color: T.t3, fontSize: 10, marginLeft: 4 }}>vs prev</span></div></div>
        <div style={{ padding: 10, borderRadius: 10, background: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}><c.IconC size={20} color={c.iconColor} /></div>
      </button>)}
    </div>

    {/* Trend sparkline */}
    <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Placement Trend — {activePeriod?.label}</div>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: T.t3 }}>{m.placements} placements</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60 }}>
        {trendData.map((v, i) => <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: T.t3 }}>{v}</span>
          <div style={{ width: "100%", height: `${(v / maxTrend) * 44}px`, background: `linear-gradient(to top, ${T.acc}40, ${T.acc})`, borderRadius: "4px 4px 0 0", minHeight: 2, transition: "height 0.3s ease" }} />
        </div>)}
      </div>
    </div>

    {/* Recent lists */}
    <div className="g3" style={{ gap: 24 }}>
      {[["Recent Candidates", RC, "candidates", (c, i) => <button key={i} onClick={() => nav && nav("candidates")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${T.bd}`, width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, transition: "background 0.12s" }} onMouseEnter={e => e.currentTarget.style.background = T.bgH} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onFocus={e => e.currentTarget.style.background = T.bgH} onBlur={e => e.currentTarget.style.background = "transparent"}><CAvatar name={c.n} size={36} /><div style={{ flex: 1, textAlign: "left" }}><p style={{ fontSize: 13, fontWeight: 500 }}>{c.n}</p><p style={{ fontSize: 12, color: T.t3 }}>{c.t}</p></div><span style={{ fontFamily: "var(--mono)", fontSize: 11, color: T.t3 }}>{c.d}</span></button>],
        ["Recent Jobs", RJ, "jobs", (j, i) => <button key={i} onClick={() => nav && nav("jobs")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, transition: "background 0.12s" }} onMouseEnter={e => e.currentTarget.style.background = T.bgH} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onFocus={e => e.currentTarget.style.background = T.bgH} onBlur={e => e.currentTarget.style.background = "transparent"}><div style={{ flex: 1, textAlign: "left" }}><p style={{ fontSize: 13, fontWeight: 500 }}>{j.t}</p><p style={{ fontSize: 12, color: T.t3 }}>{j.dep}</p></div><Badge color={j.s === "open" ? T.ok : T.t3}>{j.s}</Badge></button>],
        ["Recent Submissions", RS, "candidates", (s, i) => <button key={i} onClick={() => nav && nav("candidates")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit'", color: T.t1, transition: "background 0.12s" }} onMouseEnter={e => e.currentTarget.style.background = T.bgH} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onFocus={e => e.currentTarget.style.background = T.bgH} onBlur={e => e.currentTarget.style.background = "transparent"}><div style={{ flex: 1, textAlign: "left" }}><p style={{ fontSize: 13, fontWeight: 500 }}>{s.n}</p><p style={{ fontSize: 12, color: T.t3 }}>{s.r}</p></div><Badge color={s.s === "Interview" ? T.acc : s.s === "Hired" ? T.ok : T.t3}>{s.s}</Badge></button>],
      ].map(([title, items, target, renderItem], idx) => <div key={idx} style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: "'Outfit'", fontSize: 14, fontWeight: 600 }}>{title}</h3>
          <button onClick={() => nav && nav(target)} style={{ fontSize: 12, color: T.acc, cursor: "pointer", background: "none", border: "none", fontFamily: "'Outfit'" }}>View all →</button>
        </div>
        {items.map(renderItem)}
      </div>)}
    </div>
  </div>;
}

// ═══ ANALYTICS PAGE ═══
function AnalyticsPage() {
  const [activePanel, setActivePanel] = useState("powerbi");
  const [liveStats, setLiveStats] = useState(null);
  useEffect(() => {
    (async () => { try {
          const [pRes, cRes] = await Promise.all([
        sbFetch("/rest/v1/placements?select=bill_rate,pay_rate,status,client_name&deleted_at=is.null", { headers: { apikey: SK } }),
        sbFetch("/rest/v1/clients?select=name,total_revenue&deleted_at=is.null", { headers: { apikey: SK } }),
      ]);
      if (pRes.ok && cRes.ok) {
        const placements = await pRes.json();
        const clients = await cRes.json();
        const totalRev = placements.reduce((s, p) => s + (p.bill_rate || 0) * 40 * 26, 0);
        const avgMargin = placements.filter(p => p.bill_rate > 0).reduce((s, p, _, a) => s + ((1 - (p.pay_rate || 0) / p.bill_rate) * 100) / a.length, 0);
        const avgBill = placements.filter(p => p.bill_rate).reduce((s, p, _, a) => s + p.bill_rate / a.length, 0);
        const clientRev = clients.filter(c => c.total_revenue).sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0)).slice(0, 5);
        setLiveStats({ totalRev, avgMargin, avgBill, revPerHead: placements.length > 0 ? totalRev / placements.length : 0, clientRev, placements });
      }
    } catch (e) {} })();
  }, []);
  const panels = [{ id: "powerbi", label: "Executive", icon: TrendingUp, color: T.acc, desc: "Revenue & pipeline" }, { id: "grafana", label: "Operations", icon: Activity, color: T.ok, desc: "System monitoring" }, { id: "control", label: "Control Tower", icon: Shield, color: T.vio, desc: "Decision governance" }];
  const revenueData = [{ month: "Oct", rev: 142, target: 160 }, { month: "Nov", rev: 168, target: 165 }, { month: "Dec", rev: 155, target: 170 }, { month: "Jan", rev: 189, target: 175 }, { month: "Feb", rev: 201, target: 180 }, { month: "Mar", rev: 215, target: 190 }];
  const maxRev = Math.max(...revenueData.map(d => Math.max(d.rev, d.target)));
  const ls = liveStats;
  const renderPowerBI = () => <div>
    <div className="g4" style={{ gap: 12, marginBottom: 16 }}>{[["Total Revenue", ls ? `$${(ls.totalRev / 1000000).toFixed(1)}M` : "$—", ls ? "+18%" : "—", T.ok, TrendingUp], ["Gross Margin", ls ? `${ls.avgMargin.toFixed(1)}%` : "—", ls ? "+2.1pp" : "—", T.teal, Gauge], ["Avg Bill Rate", ls ? `$${Math.round(ls.avgBill)}/hr` : "—", ls ? "+$8" : "—", T.acc, DollarSign], ["Revenue/Head", ls ? `$${Math.round(ls.revPerHead / 1000)}K` : "—", ls ? "+12%" : "—", T.vio, Users]].map(([label, value, change, color, IC], i) => <div key={i} style={{ padding: 16, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}><div style={{ fontSize: 11, color: T.t3, fontWeight: 600, textTransform: "uppercase" }}>{label}</div><div style={{ padding: 6, borderRadius: 8, background: color + "12" }}><IC size={14} color={color} /></div></div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--mono)" }}>{value}</div><div style={{ fontSize: 12, color: T.ok, marginTop: 4 }}><ArrowUp size={10} /> {change}</div></div>)}</div>
    <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Revenue vs Target</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>{revenueData.map((d, i) => <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><div style={{ width: "100%", display: "flex", gap: 4, alignItems: "flex-end", height: 150 }}><div style={{ flex: 1, height: `${(d.rev / maxRev) * 100}%`, background: `linear-gradient(to top, ${T.acc}40, ${T.acc})`, borderRadius: "4px 4px 0 0", minHeight: 4 }} /><div style={{ flex: 1, height: `${(d.target / maxRev) * 100}%`, border: `1px dashed ${T.t3}40`, borderBottom: "none", borderRadius: "4px 4px 0 0", minHeight: 4 }} /></div><span style={{ fontSize: 10, color: T.t3, fontFamily: "var(--mono)" }}>{d.month}</span></div>)}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Revenue by Client</div>{[["Acme Corp", 538, T.acc], ["Global Mfg", 480, T.vio], ["FinServ Inc", 320, T.teal], ["TechCo", 215, T.warn], ["HealthCare Plus", 145, T.ok]].map(([name, rev, color], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.bd}` }}><span style={{ fontSize: 12, flex: 1 }}>{name}</span><div style={{ width: 100, height: 6, background: T.bd, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(rev / 538) * 100}%`, height: "100%", background: color, borderRadius: 3 }} /></div><span style={{ fontSize: 11, fontFamily: "var(--mono)", color: T.t2, width: 50, textAlign: "right" }}>${rev}K</span></div>)}</div>
      <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Margin Distribution</div>{[["35%+", 8, T.ok], ["30-35%", 14, T.teal], ["25-30%", 11, T.warn], ["20-25%", 5, T.ora], ["<20%", 2, T.err]].map(([range, count, color], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.bd}` }}><Badge color={color}>{range}</Badge><div style={{ flex: 1, height: 6, background: T.bd, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(count / 14) * 100}%`, height: "100%", background: color, borderRadius: 3 }} /></div><span style={{ fontSize: 11, fontFamily: "var(--mono)", color: T.t2 }}>{count}</span></div>)}</div>
    </div>
  </div>;
  const renderGrafana = () => <div>
    <div className="g5" style={{ gap: 8, marginBottom: 16 }}>{[["API Latency", "142ms", T.ok], ["Supabase", "99.97%", T.ok], ["AI Gateway", "23 RPS", T.ok], ["Error Rate", "0.02%", T.ok], ["Queue Depth", "3", T.warn]].map(([l, v, c], i) => <div key={i} style={{ padding: 12, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, textAlign: "center" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: c, margin: "0 auto 6px", boxShadow: `0 0 8px ${c}40` }} /><div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)" }}>{v}</div><div style={{ fontSize: 10, color: T.t3 }}>{l}</div></div>)}</div>
    <div className="g-2fr1fr" style={{ gap: 12 }}>
      <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Request Throughput</div><div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100 }}>{Array.from({ length: 30 }, (_, i) => { const val = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 15; return <div key={i} style={{ flex: 1, height: `${val}%`, background: val > 60 ? T.ok + "80" : T.acc + "80", borderRadius: "2px 2px 0 0" }} />; })}</div></div>
      <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Services</div>{[["Candidates API", "healthy"], ["AI Scoring", "healthy"], ["Email Service", "degraded"], ["DLQ Processor", "healthy"]].map(([svc, status], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.bd}` }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: status === "healthy" ? T.ok : T.warn }} /><span style={{ fontSize: 11, flex: 1 }}>{svc}</span></div>)}</div>
    </div>
  </div>;
  const renderControl = () => <div>
    <div className="g4" style={{ gap: 8, marginBottom: 16 }}>{[["Pending", "7", T.warn], ["Auto-Approved", "142", T.ok], ["Override", "3", T.vio], ["Blocked", "1", T.err]].map(([l, v, c], i) => <div key={i} style={{ padding: 14, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: c }}>{v}</div><div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{l}</div></div>)}</div>
    <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Decision Queue</div>
      {[{ type: "OFFER_APPROVAL", entity: "Lisa Wang → AI/ML Engineer", urgency: "high", margin: "31.6%" }, { type: "FIN_LOCK_REVIEW", entity: "RetailMax → Data Analyst", urgency: "critical", margin: "18.2%" }, { type: "CANDIDATE_OVERRIDE", entity: "Carlos Mendez → score 45", urgency: "medium", margin: "—" }].map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.bd}` }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.urgency === "critical" ? T.err : d.urgency === "high" ? T.warn : T.acc }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{d.type.replace(/_/g, " ")}</div><div style={{ fontSize: 11, color: T.t3 }}>{d.entity}</div></div>
        <Badge color={d.urgency === "critical" ? T.err : T.warn}>{d.urgency}</Badge>
        <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: parseFloat(d.margin) < 25 ? T.err : T.ok }}>{d.margin}</span>
        <button aria-label="Approve" style={{ padding: "4px 10px", background: T.ok + "15", border: `1px solid ${T.ok}30`, borderRadius: 6, color: T.ok, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Approve</button>
      </div>)}
    </div>
  </div>;
  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div><h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>Analytics<span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: T.ok + "15", color: T.ok, fontFamily: "var(--mono)", fontWeight: 600 }}>LIVE</span></h1><p style={{ color: T.t3, fontSize: 13, marginTop: 4 }}>Executive dashboards · System monitoring · Decision governance</p></div>
    </div>
    <div role="tablist" aria-label="Analytics panels" style={{ display: "flex", gap: 8, marginBottom: 20 }}>{panels.map(p => <button key={p.id} role="tab" aria-selected={activePanel === p.id} onClick={() => setActivePanel(p.id)} style={{ flex: 1, padding: "12px 16px", background: activePanel === p.id ? p.color + "0c" : T.bgE, border: `1px solid ${activePanel === p.id ? p.color + "40" : T.bd}`, borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }} onMouseEnter={e => { if (activePanel !== p.id) e.currentTarget.style.borderColor = T.bd2; }} onMouseLeave={e => { if (activePanel !== p.id) e.currentTarget.style.borderColor = T.bd; }} onFocus={e => { if (activePanel !== p.id) e.currentTarget.style.borderColor = T.bd2; }} onBlur={e => { if (activePanel !== p.id) e.currentTarget.style.borderColor = T.bd; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ padding: 8, borderRadius: 8, background: p.color + "15" }}><p.icon size={16} color={p.color} /></div><div><div style={{ fontSize: 14, fontWeight: 600, color: activePanel === p.id ? p.color : T.t1 }}>{p.label}</div><div style={{ fontSize: 11, color: T.t3 }}>{p.desc}</div></div></div>
    </button>)}</div>
    <div role="tabpanel" aria-label={`${activePanel} panel`} aria-live="polite">{activePanel === "powerbi" && renderPowerBI()}{activePanel === "grafana" && renderGrafana()}{activePanel === "control" && renderControl()}</div>
  </div>;
}

// ═══ SEARCH PAGE ═══
function SearchPage({ onNavigate }) {
  const [query, setQuery] = useState(""); const [results, setResults] = useState([]); const [entityFilter, setEntityFilter] = useState("all");
  const [hasSearched, setHasSearched] = useState(false); const [focusIdx, setFocusIdx] = useState(-1);
  const [recentSearches] = useState(["SAP FICO consultant", "remote DevOps", "Acme Corp"]);
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);
  const executeSearch = useCallback((q) => {
    if (!q.trim()) { setResults([]); setHasSearched(false); return; }
    setHasSearched(true); setFocusIdx(-1);
    const lo = q.toLowerCase();
    const score = (text, weight = 1) => { if (!text) return 0; const t = text.toLowerCase(); if (t === lo) return 100 * weight; if (t.includes(lo)) return 60 * weight; const words = lo.split(/\s+/); const matches = words.filter(w => t.includes(w)).length; return matches > 0 ? (matches / words.length) * 50 * weight : 0; };
    const cands = MOCK_CANDS.map(c => ({ ...c, _type: "candidate", _score: score(c.name, 2) + score(c.title, 1.5) + score(c.location, 0.8) + (c.skills || []).reduce((a, sk) => a + score(sk, 1.2), 0), _icon: "👤", _color: T.acc, _subtitle: c.title })).filter(r => r._score > 0);
    const jobs = MOCK_JOBS.map(j => ({ ...j, _type: "job", _score: score(j.title, 2) + score(j.client_name, 1.5) + score(j.location, 0.8) + (j.skills || []).reduce((a, sk) => a + score(sk, 1.2), 0), _icon: "💼", _color: T.vio, _subtitle: j.client_name })).filter(r => r._score > 0);
    let all = [...cands, ...jobs].sort((a, b) => b._score - a._score);
    if (entityFilter !== "all") all = all.filter(r => r._type === entityFilter);
    setResults(all);
  }, [entityFilter]);
  const handleKey = (e) => { if (e.key === "Enter" && focusIdx < 0) executeSearch(query); if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(p => Math.min(p + 1, results.length - 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx(p => Math.max(p - 1, -1)); } if (e.key === "Enter" && focusIdx >= 0 && results[focusIdx]) { const r = results[focusIdx]; onNavigate && onNavigate(r._type === "candidate" ? "candidates" : "jobs", r.id); } };
  return <div style={{ animation: "fadeIn 0.25s ease", maxWidth: 800, margin: "0 auto" }}>
    <div style={{ textAlign: "center", paddingTop: 20, marginBottom: 32 }}><h1 style={{ fontFamily: "'Outfit'", fontSize: 32, fontWeight: 700 }}>Search <span style={{ color: T.teal }}>Everything</span></h1><p style={{ color: T.t3, fontSize: 14 }}>Candidates, jobs, clients — ranked by relevance</p></div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 14, marginBottom: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
      <Search size={18} color={T.t3} /><input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); if (e.target.value.length > 1) executeSearch(e.target.value); }} onKeyDown={handleKey} placeholder="Search candidates, jobs, skills..." aria-label="Search everything" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.t1, fontSize: 16, fontFamily: "'Outfit'" }} />{query && <button onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }} aria-label="Clear" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer" }}><X size={16} /></button>}
    </div>
    <div role="group" aria-label="Filter by entity type" style={{ display: "flex", gap: 6, marginBottom: 20, justifyContent: "center" }}>{[["all", "All", T.t1], ["candidate", "Candidates", T.acc], ["job", "Jobs", T.vio]].map(([key, label, color]) => <Pill key={key} active={entityFilter === key} color={color} onClick={() => { setEntityFilter(key); if (query.trim()) executeSearch(query); }}>{label}</Pill>)}</div>
    {hasSearched && results.length > 0 && <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, color: T.t3, fontFamily: "var(--mono)" }}>{results.length} results</div>
      {results.map((r, i) => { const focused = i === focusIdx; const stObj = (r._type === "candidate" ? CAND_CONFIG : JOBS_CONFIG).statuses.find(s => s.value === r.status); return <div key={r.id + r._type} onClick={() => onNavigate && onNavigate(r._type === "candidate" ? "candidates" : "jobs", r.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") onNavigate && onNavigate(r._type === "candidate" ? "candidates" : "jobs", r.id); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: focused ? T.acc + "0c" : T.bgE, border: `1px solid ${focused ? T.acc + "30" : T.bd}`, borderRadius: 12, cursor: "pointer", transition: "all 0.12s" }} onMouseEnter={e => { if (!focused) e.currentTarget.style.borderColor = T.bd2; }} onMouseLeave={e => { if (!focused) e.currentTarget.style.borderColor = T.bd; }} onFocus={e => { if (!focused) e.currentTarget.style.borderColor = T.bd2; }} onBlur={e => { if (!focused) e.currentTarget.style.borderColor = T.bd; }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: r._color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{r._icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{r.name || r.title}</span><Badge color={r._color} variant="outline">{r._type}</Badge>{stObj && <Badge color={stObj.color}>{stObj.label}</Badge>}</div><div style={{ fontSize: 12, color: T.t2, marginTop: 2 }}>{r._subtitle} · {r.location}</div></div>
        {r.score && <ScoreBadge score={r.score} />}<ArrowRight size={14} color={T.t3} />
      </div>; })}
    </div>}
    {hasSearched && results.length === 0 && <EmptyState icon={Search} title="No results" description={`Nothing matches "${query}"`} />}
    {!hasSearched && <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 10, textTransform: "uppercase" }}>Recent Searches</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{recentSearches.map((s, i) => <button key={i} onClick={() => { setQuery(s); executeSearch(s); }} style={{ padding: "8px 16px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10, color: T.t2, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={e => e.currentTarget.style.borderColor = T.bd2} onMouseLeave={e => e.currentTarget.style.borderColor = T.bd} onFocus={e => e.currentTarget.style.borderColor = T.bd2} onBlur={e => e.currentTarget.style.borderColor = T.bd}><Search size={12} />{s}</button>)}</div>
      <div className="g4" style={{ gap: 12, marginTop: 32 }}>{[["Candidates", MOCK_CANDS.length, T.acc, "👤"], ["Jobs", MOCK_JOBS.length, T.vio, "💼"], ["Placed", MOCK_CANDS.filter(c => c.status === "placed").length, T.ok, "✅"], ["Open Jobs", MOCK_JOBS.filter(j => j.status === "open").length, T.warn, "📋"]].map(([label, val, color, icon], i) => <div key={i} style={{ padding: 16, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, textAlign: "center" }}><div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color }}>{val}</div><div style={{ fontSize: 10, color: T.t3 }}>{label}</div></div>)}</div>
    </div>}
  </div>;
}

// ═══ KNOWLEDGE PAGE ═══
function KnowledgePage() {
  const [searchQ, setSearchQ] = useState(""); const [selCat, setSelCat] = useState("all");
  const docs = [
    { id: "k1", title: "SAP FICO Screening Playbook", cat: "playbooks", desc: "Complete screening methodology for SAP FICO consultants.", tags: ["SAP", "FICO", "Screening"], reads: 847 },
    { id: "k2", title: "ServiceNow Recruiting SOP", cat: "sops", desc: "Standard operating procedure for ServiceNow talent acquisition.", tags: ["ServiceNow", "SOP"], reads: 623 },
    { id: "k3", title: "Offer Letter Template", cat: "templates", desc: "Standard offer letter with variable fields for salary and benefits.", tags: ["Offers", "Template"], reads: 1204 },
    { id: "k4", title: "Client Onboarding Guide", cat: "guides", desc: "Step-by-step guide for onboarding new MSP clients.", tags: ["Clients", "Onboarding"], reads: 456 },
    { id: "k5", title: "Rate Card Benchmarking", cat: "playbooks", desc: "Market rate analysis for top 20 IT skill categories.", tags: ["Rates", "Benchmarking"], reads: 932 },
    { id: "k6", title: "Interview Evaluation Template", cat: "templates", desc: "Structured evaluation form with scoring rubric.", tags: ["Interviews", "Template"], reads: 789 },
  ];
  const filtered = docs.filter(d => (selCat === "all" || d.cat === selCat) && (!searchQ || d.title.toLowerCase().includes(searchQ.toLowerCase()) || d.tags.some(t => t.toLowerCase().includes(searchQ.toLowerCase()))));
  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ marginBottom: 20 }}><h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600 }}>Knowledge Center</h1><p style={{ color: T.t3, fontSize: 13, marginTop: 4 }}>Playbooks, SOPs, templates, and guides</p></div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10 }}><Search size={14} style={{ color: T.t3 }} /><input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search knowledge base..." aria-label="Search knowledge" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.t1, fontFamily: "'Outfit'", fontSize: 14 }} /></div>
    </div>
    <div role="group" aria-label="Filter by category" style={{ display: "flex", gap: 6, marginBottom: 16 }}>{[["all", "All"], ["playbooks", "Playbooks"], ["sops", "SOPs"], ["templates", "Templates"], ["guides", "Guides"]].map(([key, label]) => <Pill key={key} active={selCat === key} color={T.acc} onClick={() => setSelCat(key)}>{label}</Pill>)}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>{filtered.map(doc => <div key={doc.id} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.preventDefault(); }} style={{ padding: 16, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, cursor: "pointer", transition: "all 0.12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.bd2} onMouseLeave={e => e.currentTarget.style.borderColor = T.bd} onFocus={e => e.currentTarget.style.borderColor = T.bd2} onBlur={e => e.currentTarget.style.borderColor = T.bd}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{doc.title}</div><Badge color={T.t3}>{doc.cat}</Badge></div>
      <div style={{ fontSize: 12, color: T.t3, lineHeight: 1.5, marginBottom: 10 }}>{doc.desc}</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ display: "flex", gap: 4 }}>{doc.tags.map((tag, j) => <span key={j} style={{ fontSize: 10, padding: "2px 7px", background: T.acc + "0c", borderRadius: 5, color: T.acc }}>{tag}</span>)}</div><span style={{ fontSize: 10, color: T.t3, fontFamily: "var(--mono)" }}>{doc.reads} reads</span></div>
    </div>)}</div>
    {filtered.length === 0 && <EmptyState icon={BookOpen} title="No results" description="No articles match your search." />}
  </div>;
}

// ═══ PLACEHOLDER PAGE ═══
// ═══ INGESTION PIPELINE ═══
// Resume parsing · LinkedIn applicant report import · Bulk CSV
// Extracts skills, experience, contact info → scores via real engine → writes to Supabase

// --- SKILL EXTRACTION ENGINE ---
const KNOWN_SKILLS = ["React","TypeScript","JavaScript","Node.js","Python","Java","C#","Go","Rust","SQL","PostgreSQL","MongoDB","AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","Git","GraphQL","REST","HTML","CSS","Tailwind","Next.js","Vue","Angular","Svelte","Redux","Django","Flask","Spring","Rails",".NET","SAP","S/4HANA","FICO","ABAP","BW","MM/SD","ServiceNow","ITSM","ITOM","HRSD","CSM","SecOps","Oracle","Workday","Salesforce","Power BI","Tableau","Snowflake","Databricks","Spark","Airflow","dbt","Kafka","Redis","ElasticSearch","TensorFlow","PyTorch","LLMs","RAG","MLOps","NLP","Figma","Sketch","Adobe XD","User Research","Prototyping","Agile","Scrum","Jira","Confluence","PMP","SAFe","ITIL","Six Sigma","Product Strategy","OKRs","Roadmap","A/B Testing","FinOps","DevOps","SRE","Linux","Networking","Security","IAM","Lambda","VPC","ECS","RDS","CloudFormation"];
const SKILL_SET = new Set(KNOWN_SKILLS.map(s => s.toLowerCase()));

function extractSkills(text) {
  if (!text) return [];
  const words = text.replace(/[,;\/\|\(\)]/g, " ").split(/\s+/);
  const found = new Set();
  // Single word matches
  words.forEach(w => { const lo = w.toLowerCase().replace(/[^a-z0-9+#.]/g, ""); if (SKILL_SET.has(lo)) found.add(KNOWN_SKILLS.find(s => s.toLowerCase() === lo)); });
  // Multi-word matches (2-word and 3-word)
  for (let i = 0; i < words.length - 1; i++) {
    const two = (words[i] + " " + words[i+1]).toLowerCase().replace(/[^a-z0-9+#. ]/g, "");
    if (SKILL_SET.has(two)) found.add(KNOWN_SKILLS.find(s => s.toLowerCase() === two));
    if (i < words.length - 2) { const three = (words[i] + " " + words[i+1] + " " + words[i+2]).toLowerCase().replace(/[^a-z0-9+#. ]/g, ""); if (SKILL_SET.has(three)) found.add(KNOWN_SKILLS.find(s => s.toLowerCase() === three)); }
  }
  return [...found].filter(Boolean);
}

function extractEmail(text) { const m = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/); return m ? m[0] : null; }
function extractPhone(text) { const m = text.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}/); return m ? m[0].trim() : null; }
function extractYearsExperience(text) {
  const patterns = [/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i, /experience[:\s]*(\d+)\s*years?/i, /(\d+)\s*yrs?/i];
  for (const p of patterns) { const m = text.match(p); if (m) return parseInt(m[1]); }
  // Count date ranges
  const ranges = text.match(/\b(19|20)\d{2}\b/g);
  if (ranges && ranges.length >= 2) { const years = ranges.map(Number).sort(); return Math.max(1, years[years.length - 1] - years[0]); }
  return null;
}
function extractLocation(text) {
  const patterns = [/(?:located?\s*(?:in|at|:)\s*)([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,?\s*[A-Z]{2})/i, /([A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5})/,/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})/];
  for (const p of patterns) { const m = text.match(p); if (m) return m[1].trim(); }
  return null;
}
function extractTitle(text) {
  const lines = text.split("\n").filter(l => l.trim());
  const titlePatterns = [/^(sr\.?|senior|lead|principal|staff|junior|mid|chief)\s/i, /engineer|developer|architect|manager|analyst|designer|consultant|director/i];
  for (const line of lines.slice(0, 10)) {
    const clean = line.trim();
    if (clean.length > 5 && clean.length < 60 && titlePatterns.some(p => p.test(clean))) return clean;
  }
  return null;
}
function extractName(text) {
  const lines = text.split("\n").filter(l => l.trim().length > 1);
  // First non-empty line that looks like a name (2-4 words, all capitalized)
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim();
    const words = clean.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z]/.test(w)) && clean.length < 40 && !/[@#\d]/.test(clean)) return clean;
  }
  return null;
}

// --- LINKEDIN COLUMN DETECTION ---
const LINKEDIN_COLUMNS = {
  "first name": "first_name", "first": "first_name", "firstname": "first_name",
  "last name": "last_name", "last": "last_name", "lastname": "last_name",
  "email": "email", "email address": "email", "e-mail": "email",
  "company": "current_company", "company name": "current_company", "organization": "current_company",
  "title": "title", "position": "title", "job title": "title", "headline": "title",
  "location": "location", "city": "location",
  "connected on": "connected_on", "connection date": "connected_on",
  "phone": "phone", "phone number": "phone",
  "url": "linkedin_url", "profile url": "linkedin_url", "linkedin url": "linkedin_url",
  "skills": "skills_text", "tags": "skills_text",
};

function detectLinkedInColumns(headers) {
  const mapping = {};
  headers.forEach((h, i) => {
    const normalized = h.toLowerCase().trim();
    if (LINKEDIN_COLUMNS[normalized]) mapping[i] = LINKEDIN_COLUMNS[normalized];
    // Fuzzy match
    else { for (const [pattern, field] of Object.entries(LINKEDIN_COLUMNS)) { if (normalized.includes(pattern) || pattern.includes(normalized)) { mapping[i] = field; break; } } }
  });
  return mapping;
}

// --- CSV PARSER (handles quoted fields, newlines in quotes) ---
function parseCSV(text) {
  const rows = []; let row = []; let field = ""; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') inQuotes = false; else field += c; }
    else { if (c === '"') inQuotes = true; else if (c === ',') { row.push(field.trim()); field = ""; } else if (c === '\n' || (c === '\r' && text[i + 1] === '\n')) { row.push(field.trim()); if (row.some(f => f)) rows.push(row); row = []; field = ""; if (c === '\r') i++; } else field += c; }
  }
  if (field || row.length > 0) { row.push(field.trim()); if (row.some(f => f)) rows.push(row); }
  return rows;
}

// --- DEDUP CHECK ---
function findDuplicates(newRecords, existingRecords) {
  const existingEmails = new Set(existingRecords.filter(r => r.email).map(r => r.email.toLowerCase()));
  const existingNames = new Set(existingRecords.map(r => (r.name || "").toLowerCase()));
  return newRecords.map(rec => {
    const dupes = [];
    if (rec.email && existingEmails.has(rec.email.toLowerCase())) dupes.push("email_match");
    if (rec.name && existingNames.has(rec.name.toLowerCase())) dupes.push("name_match");
    return { ...rec, _duplicates: dupes, _isDupe: dupes.length > 0 };
  });
}

function IngestionPage({ nav }) {
  const [activeTab, setActiveTab] = useState("resume");
  const [files, setFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState([]);
  const [csvText, setCsvText] = useState("");
  const [csvParsed, setCsvParsed] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvMapping, setCsvMapping] = useState({});
  const [linkedinParsed, setLinkedinParsed] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const csvFileRef = useRef(null);
  const linkedinFileRef = useRef(null);

  // --- RESUME FILE HANDLING ---
  const handleFiles = async (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type === "application/pdf" || f.type === "text/plain" || f.name.endsWith(".txt") || f.name.endsWith(".pdf") || f.type.includes("word"));
    if (arr.length === 0) return;
    setFiles(arr);
    setParsing(true);
    const results = [];
    for (const file of arr) {
      try {
        let text = "";
        if (file.type === "text/plain" || file.name.endsWith(".txt")) { text = await file.text(); }
        else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          // Use pdf.js via CDN for browser-side PDF parsing
          try {
            const arrayBuf = await file.arrayBuffer();
            const pdfjsLib = window.pdfjsLib || (await loadPdfJs());
            const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
            const pages = [];
            for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); pages.push(content.items.map(item => item.str).join(" ")); }
            text = pages.join("\n");
          } catch (pdfErr) { text = `[PDF parsing failed: ${pdfErr.message}. Upload as .txt for best results]`; }
        } else { text = await file.text(); }
        // Extract fields
        const name = extractName(text) || file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
        const email = extractEmail(text);
        const phone = extractPhone(text);
        const title = extractTitle(text);
        const skills = extractSkills(text);
        const yoe = extractYearsExperience(text);
        const location = extractLocation(text);
        const scoring = scoreCandidate({ technical: Math.min(0.5 + skills.length * 0.06, 1), stability: yoe ? (yoe >= 5 ? 0.8 : yoe >= 3 ? 0.6 : 0.4) : 0.5, communication: 0.6, domain: Math.min(0.4 + skills.length * 0.05, 1), leadership: yoe && yoe >= 8 ? 0.7 : 0.4, extras: 0.5 });
        results.push({ fileName: file.name, fileSize: file.size, name, email, phone, title, skills, years_experience: yoe, location, rawText: text.slice(0, 2000), score: scoring.overall_score, recommendation: scoring.recommendation, risk_flags: scoring.risk_flags, strengths: scoring.strengths, _scoring: scoring, status: "parsed" });
      } catch (err) { results.push({ fileName: file.name, error: err.message, status: "error" }); }
    }
    setParsed(findDuplicates(results, MOCK_CANDS));
    setParsing(false);
  };

  // --- LINKEDIN EXCEL IMPORT ---
  const handleLinkedInFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      let rows, headers;
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        const text = await file.text();
        const allRows = parseCSV(text);
        headers = allRows[0] || [];
        rows = allRows.slice(1);
      } else {
        // Excel via SheetJS
        const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        headers = (json[0] || []).map(String);
        rows = json.slice(1);
      }
      const mapping = detectLinkedInColumns(headers);
      setCsvHeaders(headers);
      setCsvMapping(mapping);
      const candidates = rows.filter(r => r.some(c => c)).map((row, idx) => {
        const rec = { _row: idx + 2 };
        Object.entries(mapping).forEach(([colIdx, field]) => { rec[field] = row[parseInt(colIdx)] || ""; });
        rec.name = [rec.first_name, rec.last_name].filter(Boolean).join(" ") || `Row ${idx + 2}`;
        rec.skills = rec.skills_text ? extractSkills(rec.skills_text) : [];
        const scoring = scoreCandidate({ technical: 0.5, stability: 0.5, communication: 0.5, domain: (rec.skills || []).length > 2 ? 0.6 : 0.4, leadership: 0.4, extras: rec.email ? 0.6 : 0.3 });
        rec.score = scoring.overall_score;
        rec._scoring = scoring;
        rec.status = "parsed";
        return rec;
      });
      setLinkedinParsed(findDuplicates(candidates, MOCK_CANDS));
    } catch (err) { setLinkedinParsed([{ error: err.message, status: "error" }]); }
    setParsing(false);
  };

  // --- BULK CSV IMPORT ---
  const handleCsvFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      const text = await file.text();
      const allRows = parseCSV(text);
      const headers = allRows[0] || [];
      const rows = allRows.slice(1);
      setCsvHeaders(headers);
      const autoMapping = {};
      headers.forEach((h, i) => {
        const lo = h.toLowerCase().trim();
        if (lo.includes("name") && !lo.includes("last") && !lo.includes("first")) autoMapping[i] = "name";
        else if (lo.includes("first")) autoMapping[i] = "first_name";
        else if (lo.includes("last")) autoMapping[i] = "last_name";
        else if (lo.includes("email")) autoMapping[i] = "email";
        else if (lo.includes("phone")) autoMapping[i] = "phone";
        else if (lo.includes("title") || lo.includes("role") || lo.includes("position")) autoMapping[i] = "title";
        else if (lo.includes("company") || lo.includes("org")) autoMapping[i] = "current_company";
        else if (lo.includes("location") || lo.includes("city")) autoMapping[i] = "location";
        else if (lo.includes("skill")) autoMapping[i] = "skills_text";
        else if (lo.includes("source")) autoMapping[i] = "source";
        else if (lo.includes("status")) autoMapping[i] = "status";
      });
      setCsvMapping(autoMapping);
      const candidates = rows.filter(r => r.some(c => c)).map((row, idx) => {
        const rec = { _row: idx + 2 };
        Object.entries(autoMapping).forEach(([colIdx, field]) => { rec[field] = row[parseInt(colIdx)] || ""; });
        if (!rec.name && rec.first_name) rec.name = [rec.first_name, rec.last_name].filter(Boolean).join(" ");
        if (!rec.name) rec.name = `Row ${idx + 2}`;
        rec.skills = rec.skills_text ? rec.skills_text.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : [];
        const scoring = scoreCandidate({ technical: (rec.skills || []).length > 3 ? 0.7 : 0.5, stability: 0.5, communication: 0.5, domain: (rec.skills || []).length > 3 ? 0.7 : 0.5, stability: 0.5, communication: 0.5, domain_SKIP: 0.5, leadership: 0.4, extras: rec.source === "Referral" ? 0.7 : 0.4 });
        rec.score = scoring.overall_score;
        rec._scoring = scoring;
        rec.status = "parsed";
        return rec;
      });
      setCsvParsed(findDuplicates(candidates, MOCK_CANDS));
    } catch (err) { setCsvParsed([{ error: err.message, status: "error" }]); }
    setParsing(false);
  };

  // --- IMPORT TO SUPABASE ---
  const importCandidates = async (records) => {
    setImporting(true);
    const results = { success: 0, failed: 0, skipped: 0, errors: [] };
    for (const rec of records) {
      if (rec._isDupe && rec._skipDupe) { results.skipped++; continue; }
      if (rec.error) { results.failed++; continue; }
      try {
        const nameParts = (rec.name || "").split(" ");
        const body = { first_name: nameParts[0] || null, last_name: nameParts.slice(1).join(" ") || null, title: rec.title || rec.name, name: rec.name, status: "active", location: rec.location || null, source: rec.source || "import", email: rec.email || null, phone: rec.phone || null, skills: rec.skills || [], ai_score: rec.score || null };
        const res = await sbFetch("/rest/v1/candidates", { method: "POST", body: JSON.stringify(body) });
        if (res.ok) results.success++; else { results.failed++; results.errors.push(`${rec.name}: ${res.statusText}`); }
      } catch (e) { results.failed++; results.errors.push(`${rec.name}: ${e.message}`); }
    }
    setImporting(false);
    setImportResult(results);
  };

  // --- DROP ZONE ---
  const DropZone = ({ onFiles, accept, label, inputRef }) => (
    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      style={{ border: `2px dashed ${dragOver ? T.acc : T.bd2}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", background: dragOver ? T.acc + "08" : T.bg, transition: "all 0.2s", cursor: "pointer" }}
      onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }} aria-label={label}>
      <input ref={inputRef} type="file" accept={accept} multiple onChange={e => onFiles(e.target.files)} style={{ display: "none" }} aria-hidden="true" />
      <div style={{ fontSize: 28, marginBottom: 8, color: T.acc }}>📄</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: T.t3 }}>Drag & drop or click to browse</div>
    </div>
  );

  // --- PARSED CANDIDATE ROW ---
  const CandidateRow = ({ rec, idx }) => {
    if (rec.error) return <div style={{ padding: 12, background: T.err + "08", border: `1px solid ${T.err}20`, borderRadius: 8, marginBottom: 6, fontSize: 12 }}><span style={{ color: T.err, fontWeight: 600 }}>Error:</span> {rec.fileName || `Row ${idx}`} — {rec.error}</div>;
    return <div style={{ padding: 12, background: rec._isDupe ? T.warn + "06" : T.bgE, border: `1px solid ${rec._isDupe ? T.warn + "25" : T.bd}`, borderRadius: 8, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CAvatar name={rec.name} size={32} />
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>{rec.name}</div>{rec.title && <div style={{ fontSize: 11, color: T.t3 }}>{rec.title}</div>}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {rec._isDupe && <Badge color={T.warn}>DUPE: {rec._duplicates.join(", ")}</Badge>}
          {rec.score && <ScoreBadge score={rec.score} />}
          <Badge color={rec.recommendation === "FAST_TRACK" ? T.ok : rec.recommendation === "REVIEW" ? T.warn : T.err}>{rec.recommendation || "—"}</Badge>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: T.t2, flexWrap: "wrap" }}>
        {rec.email && <span style={{ fontFamily: "'IBM Plex Mono'" }}>✉ {rec.email}</span>}
        {rec.phone && <span style={{ fontFamily: "'IBM Plex Mono'" }}>☎ {rec.phone}</span>}
        {rec.location && <span>📍 {rec.location}</span>}
        {rec.years_experience && <span>{rec.years_experience} YoE</span>}
        {rec.current_company && <span>🏢 {rec.current_company}</span>}
      </div>
      {rec.skills?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>{rec.skills.slice(0, 8).map((s, j) => <span key={j} style={{ fontSize: 10, padding: "2px 6px", background: T.acc + "0c", border: `1px solid ${T.acc}20`, borderRadius: 5, color: T.acc }}>{s}</span>)}{rec.skills.length > 8 && <span style={{ fontSize: 10, color: T.t3 }}>+{rec.skills.length - 8}</span>}</div>}
      {rec.risk_flags?.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 4 }}>{rec.risk_flags.map((f, j) => <span key={j} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: T.err + "12", color: T.err, fontFamily: "'IBM Plex Mono'" }}>⚠ {f.replace(/_/g, " ")}</span>)}</div>}
    </div>;
  };

  // --- IMPORT SUMMARY ---
  const ImportSummary = ({ result, onClose }) => (
    <div style={{ padding: 16, background: result.failed > 0 ? T.warn + "08" : T.ok + "08", border: `1px solid ${result.failed > 0 ? T.warn + "25" : T.ok + "25"}`, borderRadius: 10, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Import Complete</div>
        <button onClick={onClose} aria-label="Dismiss" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", fontSize: 14 }}>×</button>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
        <span style={{ color: T.ok, fontFamily: "'IBM Plex Mono'" }}>✓ {result.success} imported</span>
        {result.skipped > 0 && <span style={{ color: T.warn, fontFamily: "'IBM Plex Mono'" }}>⊘ {result.skipped} skipped (dupes)</span>}
        {result.failed > 0 && <span style={{ color: T.err, fontFamily: "'IBM Plex Mono'" }}>✗ {result.failed} failed</span>}
      </div>
      {result.errors.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: T.err, fontFamily: "'IBM Plex Mono'" }}>{result.errors.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}</div>}
    </div>
  );

  const currentRecords = activeTab === "resume" ? parsed : activeTab === "linkedin" ? linkedinParsed : csvParsed;
  const validRecords = currentRecords.filter(r => !r.error);

  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div><h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>Ingestion Pipeline<span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: T.acc + "15", color: T.acc, fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>LAWRENCE Gate 1</span></h1><p style={{ color: T.t2, marginTop: 4, fontSize: 14 }}>Resume parsing · LinkedIn import · Bulk CSV · Auto-scoring</p></div>
    </div>

    {importResult && <ImportSummary result={importResult} onClose={() => setImportResult(null)} />}

    <div role="tablist" aria-label="Import methods" style={{ display: "flex", gap: 2, marginBottom: 16, background: T.bgE, borderRadius: 10, padding: 3, border: `1px solid ${T.bd}` }}>
      {[["resume", "📄 Resume Upload", T.acc], ["linkedin", "🔗 LinkedIn Import", T.vio], ["csv", "📊 Bulk CSV", T.teal]].map(([id, label, color]) =>
        <button key={id} role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: activeTab === id ? color + "15" : "transparent", border: activeTab === id ? `1px solid ${color}30` : "1px solid transparent", color: activeTab === id ? color : T.t3, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'", textAlign: "center" }}>{label}</button>
      )}
    </div>

    <div role="tabpanel" aria-label={`${activeTab} import panel`}>
      {activeTab === "resume" && <div>
        <DropZone onFiles={handleFiles} accept=".pdf,.txt,.doc,.docx" label="Upload Resumes (PDF, TXT, DOCX)" inputRef={fileRef} />
        {parsing && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 16px", background: T.teal + "0c", border: `1px solid ${T.teal}20`, borderRadius: 8 }}><RefreshCw size={14} color={T.teal} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 12, color: T.teal }}>Parsing resumes...</span></div>}
        {parsed.length > 0 && <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{parsed.length} resume{parsed.length > 1 ? "s" : ""} parsed · {parsed.filter(r => !r.error).length} valid · {parsed.filter(r => r._isDupe).length} potential duplicates</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setParsed([])} style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit'" }}>Clear</button>
              <button onClick={() => importCandidates(validRecords)} disabled={importing || validRecords.length === 0} style={{ padding: "6px 16px", background: importing ? T.bgA : T.acc, color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: importing ? "default" : "pointer", fontFamily: "'Outfit'" }}>{importing ? "Importing..." : `Import ${validRecords.length} to Supabase`}</button>
            </div>
          </div>
          {parsed.map((rec, i) => <CandidateRow key={i} rec={rec} idx={i} />)}
        </div>}
      </div>}

      {activeTab === "linkedin" && <div>
        <DropZone onFiles={fl => handleLinkedInFile(fl[0])} accept=".xlsx,.xls,.csv" label="Upload LinkedIn Applicant Report (Excel or CSV)" inputRef={linkedinFileRef} />
        {parsing && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 16px", background: T.teal + "0c", border: `1px solid ${T.teal}20`, borderRadius: 8 }}><RefreshCw size={14} color={T.teal} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 12, color: T.teal }}>Parsing LinkedIn report...</span></div>}
        {csvHeaders.length > 0 && activeTab === "linkedin" && <div style={{ marginTop: 12, padding: 12, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 6, textTransform: "uppercase" }}>Column Mapping (auto-detected)</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{csvHeaders.map((h, i) => <div key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: csvMapping[i] ? T.ok + "12" : T.bgH, border: `1px solid ${csvMapping[i] ? T.ok + "25" : T.bd}`, color: csvMapping[i] ? T.ok : T.t3 }}><span style={{ fontWeight: 600 }}>{h}</span>{csvMapping[i] && <span style={{ marginLeft: 4, fontFamily: "'IBM Plex Mono'" }}>→ {csvMapping[i]}</span>}</div>)}</div>
        </div>}
        {linkedinParsed.length > 0 && <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{linkedinParsed.length} contacts parsed · {linkedinParsed.filter(r => r._isDupe).length} duplicates</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { setLinkedinParsed([]); setCsvHeaders([]); setCsvMapping({}); }} style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit'" }}>Clear</button>
              <button onClick={() => importCandidates(linkedinParsed.filter(r => !r.error))} disabled={importing} style={{ padding: "6px 16px", background: importing ? T.bgA : T.vio, color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: importing ? "default" : "pointer", fontFamily: "'Outfit'" }}>{importing ? "Importing..." : `Import ${linkedinParsed.filter(r => !r.error).length} to Supabase`}</button>
            </div>
          </div>
          {linkedinParsed.map((rec, i) => <CandidateRow key={i} rec={rec} idx={i} />)}
        </div>}
      </div>}

      {activeTab === "csv" && <div>
        <DropZone onFiles={fl => handleCsvFile(fl[0])} accept=".csv,.tsv,.txt" label="Upload CSV File (any format with headers)" inputRef={csvFileRef} />
        {parsing && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 16px", background: T.teal + "0c", border: `1px solid ${T.teal}20`, borderRadius: 8 }}><RefreshCw size={14} color={T.teal} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 12, color: T.teal }}>Parsing CSV...</span></div>}
        {csvHeaders.length > 0 && activeTab === "csv" && <div style={{ marginTop: 12, padding: 12, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 6, textTransform: "uppercase" }}>Column Mapping</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6 }}>{csvHeaders.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}><span style={{ fontWeight: 600, color: T.t2, minWidth: 60 }}>{h}</span><span style={{ color: T.t3 }}>→</span><select aria-label={`Map column ${h}`} value={csvMapping[i] || ""} onChange={e => setCsvMapping(p => ({ ...p, [i]: e.target.value || undefined }))} style={{ flex: 1, padding: "3px 6px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 4, color: T.t1, fontSize: 10, fontFamily: "'IBM Plex Mono'" }}><option value="">skip</option>{["name","first_name","last_name","email","phone","title","current_company","location","skills_text","source","status"].map(f => <option key={f} value={f}>{f}</option>)}</select></div>)}</div>
        </div>}
        {csvParsed.length > 0 && <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{csvParsed.length} rows parsed · {csvParsed.filter(r => r._isDupe).length} duplicates</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { setCsvParsed([]); setCsvHeaders([]); setCsvMapping({}); }} style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit'" }}>Clear</button>
              <button onClick={() => importCandidates(csvParsed.filter(r => !r.error))} disabled={importing} style={{ padding: "6px 16px", background: importing ? T.bgA : T.teal, color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: importing ? "default" : "pointer", fontFamily: "'Outfit'" }}>{importing ? "Importing..." : `Import ${csvParsed.filter(r => !r.error).length} to Supabase`}</button>
            </div>
          </div>
          {csvParsed.map((rec, i) => <CandidateRow key={i} rec={rec} idx={i} />)}
        </div>}
      </div>}
    </div>

    <div style={{ marginTop: 20, padding: 14, background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase" }}>Pipeline Status — LAWRENCE Gate 1: Intake</div>
      <div className="g5" style={{ gap: 8 }}>
        <MetricCard label="PARSED" value={currentRecords.length} color={T.acc} />
        <MetricCard label="VALID" value={validRecords.length} color={T.ok} />
        <MetricCard label="DUPES" value={currentRecords.filter(r => r._isDupe).length} color={T.warn} />
        <MetricCard label="ERRORS" value={currentRecords.filter(r => r.error).length} color={T.err} />
        <MetricCard label="AVG SCORE" value={validRecords.length > 0 ? Math.round(validRecords.reduce((s, r) => s + (r.score || 0), 0) / validRecords.length) : "—"} />
      </div>
    </div>
  </div>;
}

// PDF.js loader (lazy, from CDN)
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
    script.type = "module";
    // Fallback to legacy build for broader compat
    const legacy = document.createElement("script");
    legacy.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    legacy.onload = () => { if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(window.pdfjsLib); } };
    legacy.onerror = reject;
    document.head.appendChild(legacy);
  });
}

// ═══ PLACEHOLDER PAGE ═══
function PlaceholderPage({ title, desc, IconC }) {
  return <div style={{ animation: "fadeIn 0.25s ease" }}>
    <div style={{ marginBottom: 24 }}><h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 600 }}>{title}</h1><p style={{ color: T.t2, marginTop: 4, fontSize: 14 }}>{desc}</p></div>
    <div style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, background: T.bgH, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{IconC ? <IconC size={32} color={T.t3} /> : <BarChart3 size={32} color={T.t3} />}</div>
      <p style={{ color: T.t2, fontSize: 14 }}>Full {title} module renders here</p>
    </div>
  </div>;
}

// ═══ MAIN — MASTERSHELL ═══
export default function AberdeenUnified() {
  // Auth state
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = sessionStorage.getItem("sb_access_token");
        if (token) {
          const res = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` } });
          if (res.ok) { const user = await res.json(); setAuthUser(user); }
          else sessionStorage.removeItem("sb_access_token");
        }
      } catch (e) {}
      setAuthLoading(false);
    })();
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true); setLoginError("");
    try {
      const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        sessionStorage.setItem("sb_access_token", data.access_token);
        setAuthUser(data.user);
      } else { setLoginError(data.error_description || data.msg || "Invalid credentials"); }
    } catch (e) { setLoginError("Connection failed"); }
    setLoginLoading(false);
  };

  const handleLogout = () => { sessionStorage.removeItem("sb_access_token"); setAuthUser(null); };
  const skipAuth = () => { setAuthUser({ email: "demo@aberdeen.com", user_metadata: { name: "Demo User" }, _demo: true }); };

  // Login screen
  if (authLoading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0d14", fontFamily: "'Outfit'" }}><div style={{ color: "#82849C", fontSize: 14 }}>Loading...</div></div>;
  if (!authUser) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0d14", fontFamily: "'Outfit'" }}>
    <div style={{ width: 380, padding: 32, background: "#131520", border: "1px solid #1E2035", borderRadius: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg, #41B6E6, #00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>Aberdeen AI</div>
        <div style={{ fontSize: 13, color: "#82849C" }}>Sign in to your recruiting platform</div>
      </div>
      {loginError && <div style={{ padding: "8px 12px", background: "#EF444418", border: "1px solid #EF444440", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#EF4444" }}>{loginError}</div>}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#82849C", marginBottom: 4, fontWeight: 600 }}>Email</div>
        <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="adam@aberdeen.com" onKeyDown={e => { if (e.key === "Enter") handleLogin(); }} autoFocus style={{ width: "100%", padding: "10px 12px", background: "#0c0d14", border: "1px solid #1E2035", borderRadius: 8, color: "#E6E8EB", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#82849C", marginBottom: 4, fontWeight: 600 }}>Password</div>
        <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" onKeyDown={e => { if (e.key === "Enter") handleLogin(); }} style={{ width: "100%", padding: "10px 12px", background: "#0c0d14", border: "1px solid #1E2035", borderRadius: 8, color: "#E6E8EB", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
      </div>
      <button onClick={handleLogin} disabled={loginLoading || !loginForm.email || !loginForm.password} style={{ width: "100%", padding: "10px 16px", background: (!loginForm.email || !loginForm.password || loginLoading) ? "#1E2035" : "linear-gradient(135deg, #41B6E6, #00D4AA)", border: "none", borderRadius: 8, color: (!loginForm.email || !loginForm.password || loginLoading) ? "#82849C" : "#000", fontSize: 14, fontWeight: 600, cursor: (!loginForm.email || !loginForm.password || loginLoading) ? "default" : "pointer", fontFamily: "'Outfit'", marginBottom: 12 }}>{loginLoading ? "Signing in..." : "Sign In"}</button>
      <button onClick={skipAuth} style={{ width: "100%", padding: "8px 16px", background: "transparent", border: "1px solid #1E2035", borderRadius: 8, color: "#82849C", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit'" }}>Continue as Demo User</button>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#4A4D5E" }}>Supabase Auth · RLS · Multi-tenant · RBAC</div>
    </div>
  </div>;

  // Main app (authenticated) — render inner shell
  return <AberdeenShell authUser={authUser} onLogout={handleLogout} />;
}

function AberdeenShell({ authUser, onLogout }) {
  const handleLogout = onLogout;
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [toasts, setToasts] = useState([]);
  const cmdRef = useRef(null);
  const cmdModalRef = useRef(null);
  const qaModalRef = useRef(null);
  useFocusTrap(cmdModalRef, cmdOpen);
  useFocusTrap(qaModalRef, qaOpen);

  // Global toast notification system
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  // Expose globally for child components
  useEffect(() => { window.__aberdeen_toast = addToast; return () => { delete window.__aberdeen_toast; }; }, [addToast]);

  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true); }
      if (e.key === "Escape") { setCmdOpen(false); setQaOpen(false); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);
  useEffect(() => { if (cmdOpen && cmdRef.current) cmdRef.current.focus(); }, [cmdOpen]);

  const [pendingSelectId, setPendingSelectId] = useState(null);
  const nav = useCallback((p, opts) => { setPage(p); setCmdOpen(false); setQaOpen(false); setMobileNav(false); if (opts?.create) setPendingCreate(true); if (opts?.selectId) setPendingSelectId(opts.selectId); else setPendingSelectId(null); }, []);

  const [mobileNav, setMobileNav] = useState(false);

  const renderPage = () => {
    if (page === "dashboard") return <DashboardPage nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "candidates") return <EntityPage config={CAND_CONFIG} mockData={MOCK_CANDS} supabaseTable="candidates" nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "jobs") return <EntityPage config={JOBS_CONFIG} mockData={MOCK_JOBS} supabaseTable="jobs" nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "offers") return <EntityPage config={OFFERS_CONFIG} mockData={MOCK_OFFERS} supabaseTable="offers" nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "placements") return <EntityPage config={PLACE_CONFIG} mockData={MOCK_PLACES} supabaseTable="placements" nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "clients") return <EntityPage config={CLIENTS_CONFIG} mockData={MOCK_CLIENTS} supabaseTable="clients" nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "bench") return <EntityPage config={BENCH_CONFIG} mockData={MOCK_BENCH} supabaseTable="bench" nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "referrals") return <EntityPage config={REFERRALS_CONFIG} mockData={MOCK_REFERRALS} supabaseTable="referrals" nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    if (page === "search") return <SearchPage onNavigate={(entity, recordId) => nav(entity, { selectId: recordId })} />;
    if (page === "analytics") return <AnalyticsPage />;
    if (page === "knowledge") return <KnowledgePage />;
    if (page === "ai-gateway") return <GatewayPage />;
    if (page === "command-center") return <CommandCenterPage />;
    if (page === "ingestion") return <IngestionPage nav={nav} pendingCreate={pendingCreate} onConsumeCreate={() => setPendingCreate(false)} pendingSelectId={pendingSelectId} onConsumeSelect={() => setPendingSelectId(null)} />;
    const m = PM[page] || [page, ""];
    const ik = [...CORE, ...OPS, ...TOOLS].find(n => n.id === page)?.icon || "layout";
    const IC = iconMap[ik] || BarChart3;
    return <PlaceholderPage title={m[0]} desc={m[1]} IconC={IC} />;
  };

  const NavItem = ({ item }) => {
    const active = page === item.id;
    const IC = iconMap[item.icon] || BarChart3;
    return (
      <button onClick={() => nav(item.id)} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined}
        style={{ display: "flex", alignItems: "center", gap: 7, padding: collapsed ? "7px 8px" : "6px 8px", borderRadius: 6, border: "none", borderLeft: active ? `2px solid ${T.acc}` : "2px solid transparent", width: "calc(100% - 8px)", margin: "1px 4px", textAlign: "left", background: active ? `${T.acc}12` : "transparent", color: active ? T.acc : T.t3, fontFamily: "'Outfit', -apple-system, sans-serif", fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.12s var(--spring)", justifyContent: collapsed ? "center" : "flex-start", minHeight: 32 }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = T.t2; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.t3; } }}
        onFocus={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = T.t2; } }}
        onBlur={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.t3; } }}>
        <IC size={16} style={{ flexShrink: 0, color: active ? T.acc : (T.t4 || T.t3) }} />
        {!collapsed && <span className="nav-label" style={{ flex: 1 }}>{item.label}</span>}
        {!collapsed && item.count && <span className="nav-count" style={{ fontFamily: "var(--mono)", fontSize: 10, color: T.t4 || T.t3 }}>{item.count.toLocaleString()}</span>}
        {!collapsed && item.badge && <span className="nav-badge" style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: T.rose + "20", color: T.rose, fontWeight: 700, fontFamily: "var(--mono)" }}>{item.badge}</span>}
      </button>
    );
  };

  return (
    <div lang="en" style={{ fontFamily: "'Outfit', -apple-system, sans-serif", background: T.bg, color: T.t1, height: "100vh", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        :root { --mono: 'JetBrains Mono', monospace; --spring: cubic-bezier(0.32, 0.72, 0, 1); --bounce: cubic-bezier(0.34, 1.56, 0.64, 1); --sidebar-w: 200px; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: rgba(65,182,230,0.2); color: #fff; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(6px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes dropIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:.2}50%{opacity:.8}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes beacon{0%,100%{opacity:0.5;transform:scale(0.8)}50%{opacity:1;transform:scale(1.1)}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}}
        *:focus-visible{outline:2px solid #41B6E680;outline-offset:2px;border-radius:4px}
        .skip-link{position:absolute;top:-40px;left:0;background:#41B6E6;color:#000;padding:8px 16px;z-index:200;font-size:13px;font-weight:600;text-decoration:none;border-radius:0 0 6px 0;transition:top 0.2s}
        .skip-link:focus{top:0}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

        /* ═══ F6: dvh fallback ═══ */
        .app-shell { height: 100vh; height: 100dvh; }
        .chat-h { height: calc(100vh - 140px); height: calc(100dvh - 140px); }

        /* ═══ RESPONSIVE UTILITY CLASSES ═══ */
        /* Grid responsive helpers */
        .g5 { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
        .g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .g3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .g2 { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .g-detail { display:grid; grid-template-columns:300px 1fr; gap:20px; }
        .g-side { display:grid; grid-template-columns:1fr 260px; gap:16px; }
        .g-2fr1fr { display:grid; grid-template-columns:2fr 1fr; gap:12px; }

        /* F5: Scrollable table wrapper */
        .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

        /* F11: Period selector scroll */
        .period-bar { display:flex; gap:2px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .period-bar::-webkit-scrollbar { display:none; }

        /* F9: Top bar responsive */
        .topbar-metrics { display:flex; align-items:center; gap:8px; }

        /* F10: Modal responsive */
        .modal-body { width:calc(100% - 32px); max-width:540px; }
        .modal-cmd { width:calc(100% - 32px); max-width:520px; }
        .modal-qa { width:calc(100% - 32px); max-width:440px; }

        /* F2: Sidebar responsive */
        .sidebar { width:var(--sidebar-w); min-width:var(--sidebar-w); transition:width 0.25s var(--spring),min-width 0.25s var(--spring),transform 0.25s var(--spring); }

        /* F8: Touch target helper */
        .touch-btn { min-height:44px; min-width:44px; }

        /* ═══ TABLET ≤1024px ═══ */
        @media(max-width:1024px){
          :root { --sidebar-w: 48px; }
          .sidebar { width:48px!important; min-width:48px!important; }
          .sidebar .nav-label, .sidebar .nav-count, .sidebar .nav-badge, .sidebar .brand-text, .sidebar .add-btn, .sidebar .user-info { display:none!important; }
          .g5 { grid-template-columns:repeat(3,1fr); }
          .g4 { grid-template-columns:repeat(2,1fr); }
          .g3 { grid-template-columns:repeat(2,1fr); }
          .g-side { grid-template-columns:1fr; }
          .g-2fr1fr { grid-template-columns:1fr; }
          .topbar-metrics .metric-item:nth-child(n+3) { display:none; }
          .topbar-metrics .metric-sep:nth-child(n+3) { display:none; }
          .main-pad { padding:16px; }
          .period-ctx { display:none; }
        }

        /* ═══ MOBILE ≤640px ═══ */
        @media(max-width:640px){
          :root { --sidebar-w: 0px; }
          .sidebar { width:0!important; min-width:0!important; border:none!important; transform:translateX(-100%); position:fixed; z-index:90; height:100%; }
          .sidebar.open { transform:translateX(0); width:200px!important; min-width:200px!important; box-shadow:4px 0 24px rgba(0,0,0,0.5); }
          .sidebar.open .nav-label, .sidebar.open .nav-count, .sidebar.open .nav-badge, .sidebar.open .brand-text, .sidebar.open .add-btn, .sidebar.open .user-info { display:flex!important; }
          .mobile-menu-btn { display:flex!important; }
          .g5 { grid-template-columns:repeat(2,1fr); }
          .g4 { grid-template-columns:repeat(2,1fr); }
          .g3 { grid-template-columns:1fr; }
          .g2 { grid-template-columns:1fr; }
          .g-detail { grid-template-columns:1fr; }
          .g-side { grid-template-columns:1fr; }
          .g-2fr1fr { grid-template-columns:1fr; }
          .topbar-metrics { display:none!important; }
          .dash-kpi-val { font-size:22px!important; }
          .main-pad { padding:12px; }
          .cmd-kbd { display:none; }
          .period-ctx { display:none; }
          h1 { font-size:22px!important; }
          .modal-body, .modal-cmd, .modal-qa { width:calc(100% - 16px); border-radius:12px; }

          /* F7: Bump tiny fonts on mobile */
          .mono-xs { font-size:10px!important; }

          /* F8: Larger touch targets */
          .touch-btn { min-height:44px; min-width:44px; }
        }

        /* Mobile menu button — hidden on desktop */
        .mobile-menu-btn { display:none; align-items:center; justify-content:center; padding:6px; border:none; background:transparent; color:inherit; cursor:pointer; border-radius:6px; }

        /* Mobile overlay */
        .mobile-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:89; }
        @media(max-width:640px){ .mobile-overlay.open { display:block; } }
      `}</style>

      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div style={{ display: "flex" }} className="app-shell">
        {/* Mobile overlay */}
        <div className={`mobile-overlay ${mobileNav ? "open" : ""}`} onClick={() => setMobileNav(false)} />
        {/* SIDEBAR */}
        <aside role="navigation" aria-label="Main navigation" className={`sidebar ${mobileNav ? "open" : ""}`} style={{ background: T.sidebar, borderRight: `1px solid ${T.bd2}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.bd}` }}>
            <button aria-label="Go to dashboard" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "none", border: "none", color: T.t1, padding: 0 }} onClick={() => nav("dashboard")}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#000", flexShrink: 0 }}>A</div>
              {!collapsed && <div className="brand-text"><div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Outfit'" }}>Aberdeen</div><div style={{ fontSize: 10, color: T.t4 || T.t3, fontWeight: 700, letterSpacing: "0.08em" }}>TALENTOS</div></div>}
            </button>
            <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", color: T.t3, cursor: "pointer", display: "flex", flexShrink: 0 }}>
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
          <div tabIndex={0} style={{ flex: 1, overflow: "auto", padding: "8px 6px" }}>
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: T.t4 || T.t3, padding: "8px 12px 3px", marginTop: 4 }}>CORE</div>}
            {CORE.map(item => <NavItem key={item.id} item={item} />)}
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: T.t4 || T.t3, padding: "8px 12px 3px", marginTop: 12 }}>OPERATIONS</div>}
            {OPS.map(item => <NavItem key={item.id} item={item} />)}
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: T.t4 || T.t3, padding: "8px 12px 3px", marginTop: 12 }}>TOOLS</div>}
            {TOOLS.map(item => <NavItem key={item.id} item={item} />)}
          </div>
          {!collapsed && <div style={{ padding: 10, borderTop: `1px solid ${T.bd2}`, display: "flex", alignItems: "center", gap: 8 }}>
            <CAvatar name="Adam Parsons" size={28} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>Adam</div><div style={{ fontSize: 10, color: T.t3 }}>Administrator</div></div>
          </div>}
        </aside>

        {/* MAIN AREA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* KPI Strip */}
          <div role="status" aria-label="Platform metrics" style={{ height: 36, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", background: T.sidebar, borderBottom: `1px solid ${T.bd2}`, fontSize: 11, fontFamily: "var(--mono)" }}>
            <span style={{ color: T.acc }}>Revenue <strong>$2.4M</strong></span>
            <span style={{ color: T.rose }}>Margin <strong>28.3%</strong></span>
            <span style={{ color: T.acc }}>Fill <strong>34.2%</strong></span>
            <span style={{ color: T.err }}>Risk <strong>12</strong></span>
          </div>

          {/* Header */}
          <header role="banner" style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: T.sidebar, borderBottom: `1px solid ${T.bd2}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <button className="mobile-menu-btn" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation menu"><Menu size={18} color={T.t2} /></button>
              <span style={{ fontFamily: "Outfit", fontWeight: 400, fontSize: 12, color: T.t2, flexShrink: 0 }}>{(PM[page] || [page])[0]}</span>
              <button onClick={() => setCmdOpen(true)} aria-label="Open search (Cmd+K)" style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", background: T.card, border: `1px solid ${T.bd2}`, borderRadius: 6, color: T.t4 || T.t3, cursor: "pointer", fontSize: 11, fontFamily: "'Outfit'" }}>
                <span>⌕</span><span style={{ marginLeft: 2 }}>Search</span>
                <kbd className="cmd-kbd" style={{ fontSize: 10, color: T.t4 || T.t3, marginLeft: 6, padding: "0px 4px", border: `1px solid ${T.bd2}`, borderRadius: 3, fontFamily: "var(--mono)" }}>⌘K</kbd>
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => nav("analytics")} aria-label="Analytics" style={{ padding: 6, borderRadius: 6, border: "none", background: page === "analytics" ? `${T.acc}18` : "transparent", color: page === "analytics" ? T.acc : T.t3, cursor: "pointer", display: "flex" }}><Activity size={14} /></button>
              <button onClick={() => setQaOpen(true)} aria-label="Add new item" style={{ padding: "3px 10px", background: T.gradient, border: "none", borderRadius: 4, color: "#000", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--mono)" }}>+ ADD</button>
              <button aria-label="Notifications" style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", color: T.t3, cursor: "pointer", display: "flex", position: "relative" }}><Bell size={16} /><div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: T.err }} /></button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                <CAvatar name={authUser?.email || "User"} size={24} />
                <span style={{ fontSize: 11, color: T.t3, fontFamily: "var(--mono)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser?._demo ? "Demo" : (authUser?.email || "").split("@")[0]}</span>
                {!authUser?._demo && <button onClick={handleLogout} aria-label="Sign out" style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${T.bd}`, background: "transparent", color: T.t3, cursor: "pointer", fontSize: 9, fontFamily: "var(--mono)" }}>Logout</button>}
              </div>
            </div>
          </header>

          <main id="main-content" role="main" tabIndex={-1} className="main-pad" style={{ flex: 1, overflowY: "auto", padding: 24 }}>{renderPage()}</main>
        </div>
      </div>

      {/* COMMAND PALETTE */}
      {cmdOpen && (
        <div role="dialog" aria-modal="true" aria-label="Command palette" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "18vh" }} onClick={() => setCmdOpen(false)}>
          <div ref={cmdModalRef} role="document" className="modal-cmd" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 48px rgba(0,0,0,0.5)", animation: "dropIn 0.15s ease-out" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${T.bd}` }}>
              <Search size={18} style={{ color: T.t3 }} />
              <input ref={cmdRef} placeholder="Search..." aria-label="Command palette search" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.t1, fontFamily: "'Outfit'", fontSize: 14 }} />
              <span style={{ padding: "2px 6px", background: T.bgH, border: `1px solid ${T.bd}`, borderRadius: 4, fontFamily: "var(--mono)", fontSize: 11, color: T.t3 }}>ESC</span>
            </div>
            <div style={{ padding: "8px" }}>
              {[{ l: "Dashboard", p: "dashboard", C: Home, c: T.acc }, { l: "AI Gateway", p: "ai-gateway", C: Zap, c: T.teal }, { l: "Command Center", p: "command-center", C: Command, c: T.vio }, { l: "Analytics", p: "analytics", C: BarChart3, c: T.ok }].map(a => (
                <button key={a.p} onClick={() => nav(a.p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 8, border: "none", width: "100%", background: "transparent", color: T.t2, cursor: "pointer", fontFamily: "'Outfit'", fontSize: 14, transition: "background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bgH} onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onFocus={e => e.currentTarget.style.background = T.bgH} onBlur={e => e.currentTarget.style.background = "transparent"}>
                  <a.C size={16} color={a.c} />{a.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD */}
      {qaOpen && (
        <div role="dialog" aria-modal="true" aria-label="Quick add" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setQaOpen(false)}>
          <div ref={qaModalRef} role="document" className="modal-qa" style={{ background: T.bgE, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: "0 24px 48px rgba(0,0,0,0.5)", animation: "dropIn 0.15s ease-out" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 16, borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 500 }}>Quick Add</h2>
              <button onClick={() => setQaOpen(false)} aria-label="Close" style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", color: T.t3, cursor: "pointer", display: "flex" }}><X size={16} /></button>
            </div>
            <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ l: "Candidate", d: "Add new talent", C: Users, c: T.acc, target: "candidates" }, { l: "Job", d: "Post a position", C: Briefcase, c: T.vio, target: "jobs" }, { l: "Submission", d: "Submit candidate", C: Send, c: T.warn, target: "candidates" }, { l: "Client", d: "New account", C: Building2, c: T.rose, target: "clients" }, { l: "Placement", d: "Record a start", C: Award, c: T.ok, target: "placements" }, { l: "Offer", d: "Extend offer", C: Gift, c: T.warn, target: "offers" }].map(item => (
                <button key={item.l} aria-label={`Add ${item.l}`} onClick={() => nav(item.target, { create: true })} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, border: `1px solid ${T.bd}`, background: "transparent", cursor: "pointer", textAlign: "left", transition: "all 0.12s", fontFamily: "'Outfit'", color: T.t1 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.c; e.currentTarget.style.background = item.c + "0a"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.background = "transparent"; }}
                  onFocus={e => { e.currentTarget.style.borderColor = item.c; e.currentTarget.style.background = item.c + "0a"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ width: 40, height: 40, background: item.c + "1a", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><item.C size={20} color={item.c} /></div>
                  <div><p style={{ fontSize: 13, fontWeight: 500, color: T.t1 }}>{item.l}</p><p style={{ fontSize: 11, color: T.t3 }}>{item.d}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      {toasts.length > 0 && <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }} aria-live="polite">
        {toasts.map(t => {
          const colors = { success: { bg: T.ok + "18", border: T.ok + "40", color: T.ok, icon: "✓" }, error: { bg: T.err + "18", border: T.err + "40", color: T.err, icon: "✗" }, warning: { bg: T.warn + "18", border: T.warn + "40", color: T.warn, icon: "⚠" }, info: { bg: T.acc + "18", border: T.acc + "40", color: T.acc, icon: "ℹ" } };
          const c = colors[t.type] || colors.info;
          return <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: T.bgE, border: `1px solid ${c.border}`, borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,0.3)", animation: "slideUp 0.2s ease", minWidth: 280, maxWidth: 400 }}>
            <span style={{ fontSize: 14, color: c.color, fontWeight: 700 }}>{c.icon}</span>
            <span style={{ fontSize: 13, color: T.t2, flex: 1, fontFamily: "'Outfit'" }}>{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} aria-label="Dismiss" style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: 2, fontSize: 14 }}>×</button>
          </div>;
        })}
      </div>}
    </div>
  );
}
