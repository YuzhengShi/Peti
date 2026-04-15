/**
 * Profile Manager — writes PROFILE.md + STATE.md to disk before container spawn.
 * Reads STATE.md back after session to sync state to DB.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { prisma } from './db';

const SESSIONS_BASE = process.env.PETI_SESSIONS_DIR || path.join(os.tmpdir(), 'peti-sessions');

// Container runs as node (uid 1000, gid 1000). Files written by the API (root)
// must be owned by node so the agent can read and write STATE.md, PROFILE.md.
const CONTAINER_UID = 1000;
const CONTAINER_GID = 1000;

class ProfileManager {
  getUserDir(userId: string): string {
    return path.join(SESSIONS_BASE, userId);
  }

  getSessionDir(userId: string): string {
    return path.join(SESSIONS_BASE, userId, '.claude');
  }

  /**
   * Write PROFILE.md + STATE.md to disk for the container to read.
   */
  async writeUserFiles(userId: string): Promise<void> {
    const userDir = this.getUserDir(userId);
    const sessionDir = this.getSessionDir(userId);

    fs.mkdirSync(userDir, { recursive: true });
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.chownSync(userDir, CONTAINER_UID, CONTAINER_GID);
    fs.chownSync(sessionDir, CONTAINER_UID, CONTAINER_GID);

    // Write PROFILE.md — prefer UserProfile.content (LLM-generated), fall back to test results
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const profilePath = path.join(userDir, 'PROFILE.md');
    if (profile?.content) {
      fs.writeFileSync(profilePath, profile.content);
    } else {
      const built = await this.buildProfileFromResults(userId);
      fs.writeFileSync(profilePath, built);
    }
    fs.chownSync(profilePath, CONTAINER_UID, CONTAINER_GID);

    // Write STATE.md from UserState table
    const userState = await prisma.userState.findUnique({ where: { userId } });
    const statePath = path.join(userDir, 'STATE.md');

    if (userState) {
      const lastSeen = userState.lastSeen.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
      const daysSince = Math.floor(
        (Date.now() - userState.lastSeen.getTime()) / (1000 * 60 * 60 * 24),
      );

      const stateContent = [
        `mood: ${userState.mood}`,
        `energy: ${userState.energy}`,
        `last_felt: `,
        `animation: ${userState.animation}`,
        `activity: resting`,
        `streak_days: ${userState.streak}`,
        `days_since_last_chat: ${daysSince}`,
        `last_user_seen: ${lastSeen}`,
        `pending_proactive_message: ${userState.pendingMessage || ''}`,
        `proactive_message_sent_today: false`,
        `relationship_stage: stranger`,
      ].join('\n') + '\n';

      fs.writeFileSync(statePath, stateContent);
    } else {
      // Blank STATE.md for new users
      const blankState = [
        'mood: content',
        'energy: good',
        'last_felt: ',
        'animation: idle',
        'activity: resting',
        'streak_days: 0',
        'days_since_last_chat: 0',
        'last_user_seen: ',
        'pending_proactive_message: ',
        'proactive_message_sent_today: false',
        'relationship_stage: stranger',
      ].join('\n') + '\n';

      fs.writeFileSync(statePath, blankState);
    }
    fs.chownSync(statePath, CONTAINER_UID, CONTAINER_GID);
  }

  /**
   * Build PROFILE.md from ProfileResult records when no LLM-generated profile exists.
   */
  private async buildProfileFromResults(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pet: true, profileResults: true },
    });

    if (!user || user.profileResults.length === 0) {
      return '# New User\nNo profile yet.\n';
    }

    const pet = user.pet;
    const results = new Map(
      user.profileResults.map((r) => [r.dimensionType, r.scores as any]),
    );

    // Helper: get subscale/aggregate band — values are plain strings, not objects
    const sub = (dim: string, name: string) =>
      results.get(dim)?.subscales?.[name] || 'unknown';
    const agg = (dim: string) =>
      results.get(dim)?.aggregate || 'unknown';

    // Derive attachment style from anxiety + avoidance bands
    const anxietyBand = sub('attachment', 'anxiety');
    const avoidanceBand = sub('attachment', 'avoidance');
    let attachmentStyle = 'secure';
    if (anxietyBand === 'higher' && avoidanceBand === 'higher') attachmentStyle = 'disorganized';
    else if (anxietyBand === 'higher') attachmentStyle = 'anxious';
    else if (avoidanceBand === 'higher') attachmentStyle = 'avoidant';

    const lines = [
      '# User Profile',
      '',
      '## The Basics',
      `- Name: ${user.username}`,
      `- Pet name: ${pet?.name || 'unnamed'}`,
      `- Together since: ${pet?.createdAt?.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) || 'unknown'}`,
      '- Relationship stage: stranger',
      '',
      '---',
      '',
      '## Personality (Big Five)',
      `- Openness: ${sub('bigFive', 'openness')}`,
      `- Conscientiousness: ${sub('bigFive', 'conscientiousness')}`,
      `- Extraversion: ${sub('bigFive', 'extraversion')}`,
      `- Agreeableness: ${sub('bigFive', 'agreeableness')}`,
      `- Neuroticism: ${sub('bigFive', 'neuroticism')}`,
      '',
      '---',
      '',
      '## Attachment Style',
      `Attachment: ${attachmentStyle}`,
      `- Anxiety: ${anxietyBand}`,
      `- Avoidance: ${avoidanceBand}`,
      '',
      '---',
      '',
      '## Personality Functioning',
      `Overall: ${agg('personalityFunctioning')}`,
      `- Identity: ${sub('personalityFunctioning', 'identity')}`,
      `- Self-direction: ${sub('personalityFunctioning', 'self-direction')}`,
      `- Empathy: ${sub('personalityFunctioning', 'empathy')}`,
      `- Intimacy: ${sub('personalityFunctioning', 'intimacy')}`,
      '',
      '---',
      '',
      '## Sleep & Energy Baseline',
      `Sleep: ${agg('sleepRegulation')}`,
      `- Quality: ${sub('sleepRegulation', 'quality')}`,
      `- Continuity: ${sub('sleepRegulation', 'continuity')}`,
      `- Daytime impact: ${sub('sleepRegulation', 'daytime-impact')}`,
      '',
      '---',
      '',
      '## Emotion Regulation Baseline',
      `Overall: ${agg('emotionRegulation')}`,
      `- Awareness: ${sub('emotionRegulation', 'awareness')}`,
      `- Acceptance: ${sub('emotionRegulation', 'acceptance')}`,
      `- Reappraisal: ${sub('emotionRegulation', 'reappraisal')}`,
      `- Problem-focused: ${sub('emotionRegulation', 'problem-focused')}`,
      `- Suppression: ${sub('emotionRegulation', 'suppression')}`,
      `- Rumination: ${sub('emotionRegulation', 'rumination')}`,
      '',
      '---',
      '',
      '## Daily Functioning Baseline',
      `Overall: ${agg('dailyFunctioning')}`,
      `- Cognition: ${sub('dailyFunctioning', 'cognition')}`,
      `- Mobility: ${sub('dailyFunctioning', 'mobility')}`,
      `- Self-care: ${sub('dailyFunctioning', 'self-care')}`,
      `- Getting along: ${sub('dailyFunctioning', 'getting-along')}`,
      `- Life activities: ${sub('dailyFunctioning', 'life-activities')}`,
      `- Participation: ${sub('dailyFunctioning', 'participation')}`,
      '',
      '---',
      '',
      '## What Peti Knows About Them',
      '[none yet — first meeting]',
      '',
      '---',
      '',
      '## Notes for Peti',
      '[none yet]',
      '',
    ];

    return lines.join('\n');
  }

  /**
   * Read STATE.md back from disk and sync to UserState DB table.
   * Called after SSE disconnects.
   */
  async syncStateFromDisk(userId: string): Promise<void> {
    const statePath = path.join(this.getUserDir(userId), 'STATE.md');
    if (!fs.existsSync(statePath)) return;

    const content = fs.readFileSync(statePath, 'utf-8');
    const state: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        state[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }

    await prisma.userState.upsert({
      where: { userId },
      update: {
        mood: state.mood || 'content',
        energy: state.energy || 'good',
        animation: state.animation || 'idle',
        streak: parseInt(state.streak_days || '0', 10),
        lastSeen: new Date(),
        pendingMessage: state.pending_proactive_message || null,
      },
      create: {
        userId,
        mood: state.mood || 'content',
        energy: state.energy || 'good',
        animation: state.animation || 'idle',
        streak: parseInt(state.streak_days || '0', 10),
        lastSeen: new Date(),
        pendingMessage: state.pending_proactive_message || null,
      },
    });
  }
}

export const profileManager = new ProfileManager();
