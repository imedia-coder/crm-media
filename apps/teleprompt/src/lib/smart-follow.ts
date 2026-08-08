/**
 * Smart Follow — aligns recognized speech to a position in the script so the
 * prompter can follow the presenter's voice (cahier des charges §36-39).
 *
 * Pure, DOM-free matching so it can be unit-tested without a browser: feed it
 * script text once, then feed it transcript chunks as speech recognition
 * produces them, and read back a word-index position + speed multiplier.
 */

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-z0-9']/g, "");
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean);
}

/** Short function words are excluded from scoring — they're too common to be
 * distinctive and cause false-positive matches on unrelated windows. */
function isDistinctive(word: string): boolean {
  return word.length >= 3;
}

function overlapScore(spoken: string[], windowWords: string[]): number {
  const remaining = new Map<string, number>();
  for (const w of windowWords) {
    if (!isDistinctive(w)) continue;
    remaining.set(w, (remaining.get(w) ?? 0) + 1);
  }
  let score = 0;
  for (const w of spoken) {
    if (!isDistinctive(w)) continue;
    const count = remaining.get(w) ?? 0;
    if (count > 0) {
      score += 1;
      remaining.set(w, count - 1);
    }
  }
  return score;
}

function stepToward(current: number, target: number, maxStep: number): number {
  const delta = target - current;
  if (Math.abs(delta) <= maxStep) return target;
  return current + Math.sign(delta) * maxStep;
}

const FORWARD_SEARCH_WORDS = 60;
const BACKTRACK_WORDS = 6;
const MIN_MATCH_RATIO = 0.4;
const MIN_SPOKEN_WORDS = 3;
const PACE_WINDOW_MS = 15_000;
const SILENCE_HOLD_MS = 3_000;
const MAX_SPEED_STEP = 0.08;
const MIN_SPEED_MULTIPLIER = 0.5;
const MAX_SPEED_MULTIPLIER = 1.8;
const IDLE_SPEED_MULTIPLIER = 0.15;

export interface SmartFollowMatch {
  /** Word index the reader has now reached (end of the matched region). */
  wordIndex: number;
  /** 0..1 confidence for this match. */
  score: number;
}

export class SmartFollowTracker {
  private readonly scriptWords: string[];
  readonly totalWords: number;
  private cursor = 0;
  private paceSamples: { wordIndex: number; timestamp: number }[] = [];

  constructor(scriptText: string) {
    this.scriptWords = tokenize(scriptText);
    this.totalWords = this.scriptWords.length;
  }

  get progress(): number {
    return this.totalWords === 0 ? 0 : this.cursor / this.totalWords;
  }

  get wordIndex(): number {
    return this.cursor;
  }

  reset(position = 0) {
    this.cursor = position;
    this.paceSamples = [];
  }

  /** Feed a chunk of newly recognized speech. Returns a match only when
   * confident enough — an unmatched or noisy chunk leaves the cursor alone
   * rather than losing the reader's place (§38). */
  matchTranscript(chunk: string, atTime = Date.now()): SmartFollowMatch | null {
    const spoken = tokenize(chunk);
    if (spoken.length < MIN_SPOKEN_WORDS || this.totalWords === 0) return null;

    const searchStart = Math.max(0, this.cursor - BACKTRACK_WORDS);
    const searchEnd = Math.min(this.totalWords, this.cursor + FORWARD_SEARCH_WORDS);

    let bestScore = 0;
    let bestEnd = -1;

    // Window length intentionally matches the spoken chunk 1:1 (no padding):
    // padding the window made bestEnd overshoot past the words that actually
    // matched, which corrupted pace estimation between successive calls.
    for (let start = searchStart; start < searchEnd; start++) {
      const windowLen = Math.min(spoken.length, this.totalWords - start);
      if (windowLen <= 0) continue;
      const windowWords = this.scriptWords.slice(start, start + windowLen);
      const score = overlapScore(spoken, windowWords);
      if (score > bestScore) {
        bestScore = score;
        bestEnd = start + windowLen;
      }
    }

    const ratio = bestScore / spoken.length;
    if (bestEnd === -1 || ratio < MIN_MATCH_RATIO) {
      return null;
    }

    this.cursor = Math.max(this.cursor, bestEnd);
    this.paceSamples.push({ wordIndex: this.cursor, timestamp: atTime });
    const cutoff = atTime - PACE_WINDOW_MS;
    this.paceSamples = this.paceSamples.filter((s) => s.timestamp >= cutoff);

    return { wordIndex: this.cursor, score: ratio };
  }

  /** Speed multiplier tracking the presenter's actual pace against the
   * script's baseline WPM — rate-limited so it never jumps abruptly (§39),
   * and decays toward a near-standstill when nothing has been heard for a
   * few seconds rather than continuing to auto-scroll blindly. */
  estimateSpeedMultiplier(
    baselineWpm: number,
    previousMultiplier: number,
    now: number = Date.now(),
  ): number {
    const lastSample = this.paceSamples[this.paceSamples.length - 1];
    const silenceMs = lastSample ? now - lastSample.timestamp : Infinity;
    if (silenceMs > SILENCE_HOLD_MS) {
      return stepToward(previousMultiplier, IDLE_SPEED_MULTIPLIER, MAX_SPEED_STEP);
    }

    if (this.paceSamples.length < 2 || baselineWpm <= 0) return previousMultiplier;

    const first = this.paceSamples[0];
    const elapsedMinutes = (lastSample.timestamp - first.timestamp) / 60_000;
    if (elapsedMinutes <= 0) return previousMultiplier;

    const wordsCovered = lastSample.wordIndex - first.wordIndex;
    const currentWpm = wordsCovered / elapsedMinutes;
    const target = Math.min(
      MAX_SPEED_MULTIPLIER,
      Math.max(MIN_SPEED_MULTIPLIER, currentWpm / baselineWpm),
    );
    return stepToward(previousMultiplier, target, MAX_SPEED_STEP);
  }
}
