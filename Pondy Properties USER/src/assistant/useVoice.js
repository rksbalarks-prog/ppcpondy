// Voice capture + playback. Handles the browser gotchas from the brief:
//  - Filename extension is derived from recorder.mimeType (webm/mp4/ogg differ by
//    browser); uploading the wrong extension makes STT mis-parse the audio.
//  - playBlob() returns a boolean (played / blocked). audio.play() REJECTS on a
//    page with no user activation, so callers must show a "tap to play" fallback.

import { useCallback, useEffect, useRef, useState } from 'react';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function extFromMime(mime = '') {
  const m = mime.toLowerCase().split(';')[0].trim();
  if (m.includes('webm')) return 'webm';
  if (m.includes('mp4') || m.includes('m4a')) return 'mp4';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  return 'webm';
}

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [supported] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined'
  );
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);      // single reusable TTS <audio> element
  const unlockedRef = useRef(false);  // has it been "blessed" by a user gesture?
  const listenAbortRef = useRef(null); // abort fn for an in-progress recordUntilSilence

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    // Effect owns the resources; tear them down on unmount.
    cleanupStream();
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
  }, [cleanupStream]);

  const getAudioEl = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  };

  // Tiny valid 0-sample WAV — played (muted) inside a user gesture to unlock the
  // audio element, so a LATER TTS reply (after an async fetch, when the original
  // gesture's activation has expired) can play without being blocked.
  const silentWav = () => {
    const b = new Uint8Array(44);
    const v = new DataView(b.buffer);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    w(36, 'data'); v.setUint32(40, 0, true);
    let bin = ''; b.forEach((x) => (bin += String.fromCharCode(x)));
    return 'data:audio/wav;base64,' + btoa(bin);
  };

  // Call SYNCHRONOUSLY inside a real user gesture (widget open / mic / send /
  // speaker toggle). Blesses the reusable element once for the session.
  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    try {
      const el = getAudioEl();
      el.muted = true;
      el.src = silentWav();
      const p = el.play();
      const done = () => { try { el.pause(); el.currentTime = 0; } catch {} el.muted = false; unlockedRef.current = true; };
      if (p && p.then) p.then(done).catch(() => {});
      else done();
    } catch { /* ignore */ }
  }, []);

  // Proactively request microphone permission INSIDE the user's tap, so mobile
  // browsers (Android especially) surface the permission prompt right away rather
  // than deep inside the async voice loop where a rejection would be swallowed.
  // Returns { ok:true } once granted, or { ok:false, error } (error is the
  // DOMException name, e.g. 'NotAllowedError' / 'NotFoundError') so the UI can
  // guide a blocked user. The mic is released immediately — the recorder
  // re-acquires it, and holding it open here would keep the mic indicator lit.
  const ensureMic = useCallback(async () => {
    if (!supported || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { ok: false, error: 'unsupported' };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err && err.name) || 'error' };
    }
  }, [supported]);

  const startRecording = useCallback(async () => {
    if (!supported) throw new Error('voice_unsupported');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mimeType = pickMimeType();
    const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    recorderRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [supported]);

  // Resolves to { blob, filename } — filename extension matches the container.
  const stopRecording = useCallback(() => {
    return new Promise((resolve, reject) => {
      const rec = recorderRef.current;
      if (!rec) return reject(new Error('not_recording'));
      rec.onstop = () => {
        const type = rec.mimeType || (chunksRef.current[0] && chunksRef.current[0].type) || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        cleanupStream();
        setIsRecording(false);
        resolve({ blob, filename: `voice.${extFromMime(type)}` });
      };
      try { rec.stop(); } catch (e) { cleanupStream(); setIsRecording(false); reject(e); }
    });
  }, [cleanupStream]);

  // Returns true if playback started, false if blocked by autoplay policy.
  // Reuses the single (unlocked) element so replies play without a fresh gesture.
  const playBlob = useCallback(async (blob) => {
    if (!blob) return false;
    try {
      const el = getAudioEl();
      const url = URL.createObjectURL(blob);
      el.muted = false;
      el.src = url;
      el.onended = () => URL.revokeObjectURL(url);
      await el.play();
      unlockedRef.current = true;
      return true;
    } catch {
      return false; // caller shows a "tap to play" affordance
    }
  }, []);

  // ── Hands-free helpers (continuous voice mode) ──────────────────────────────
  // recordUntilSilence: record and auto-stop once the speaker goes quiet, using a
  // Web Audio analyser for voice-activity detection. Resolves { blob, filename } —
  // or null if aborted / nobody spoke. Recording still works if the analyser fails
  // (we just fall back to the maxMs cap).
  const recordUntilSilence = useCallback((opts = {}) => {
    const { silenceMs = 1400, maxMs = 15000, noSpeechMs = 8000, threshold = 12 } = opts;
    return new Promise((resolve, reject) => {
      if (!supported) return reject(new Error('voice_unsupported'));
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        streamRef.current = stream;
        const mimeType = pickMimeType();
        const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        chunksRef.current = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
        recorderRef.current = rec;

        let audioCtx = null, analyser = null, data = null;
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AC();
          if (audioCtx.resume) audioCtx.resume().catch(() => {});
          const src = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          src.connect(analyser);
          data = new Uint8Array(analyser.frequencyBinCount);
        } catch { audioCtx = null; }

        let done = false, hasSpoken = false, silenceStart = 0, poll = 0;
        const t0 = performance.now();

        const finish = (aborted) => {
          if (done) return; done = true;
          if (poll) clearInterval(poll);
          listenAbortRef.current = null;
          if (audioCtx) { try { audioCtx.close(); } catch { /* ignore */ } }
          rec.onstop = () => {
            const type = rec.mimeType || (chunksRef.current[0] && chunksRef.current[0].type) || 'audio/webm';
            const blob = new Blob(chunksRef.current, { type });
            cleanupStream();
            setIsRecording(false);
            resolve(aborted ? null : { blob, filename: `voice.${extFromMime(type)}` });
          };
          try { rec.stop(); } catch { cleanupStream(); setIsRecording(false); resolve(null); }
        };

        listenAbortRef.current = () => finish(true);
        setIsRecording(true);
        rec.start();

        poll = setInterval(() => {
          const now = performance.now();
          if (analyser) {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) { const v = data[i] - 128; sum += v * v; }
            const rms = Math.sqrt(sum / data.length);
            if (rms > threshold) { hasSpoken = true; silenceStart = 0; }
            else if (hasSpoken) {
              if (!silenceStart) silenceStart = now;
              else if (now - silenceStart >= silenceMs) return finish(false);
            }
          }
          if (now - t0 >= maxMs) return finish(!hasSpoken);        // cap reached: submit if we heard speech
          if (!hasSpoken && now - t0 >= noSpeechMs) return finish(true); // nobody spoke → skip this turn
        }, 100);
      }).catch((err) => reject(err));
    });
  }, [supported, cleanupStream]);

  // Abort the current recordUntilSilence turn (used when ending voice mode).
  const cancelListening = useCallback(() => {
    if (listenAbortRef.current) listenAbortRef.current();
  }, []);

  // Like playBlob, but resolves only when playback ENDS — so a hands-free loop can
  // wait for the reply to finish before listening again (prevents self-recording).
  const playBlobAwait = useCallback((blob) => {
    return new Promise((resolve) => {
      if (!blob) return resolve(false);
      try {
        const el = getAudioEl();
        const url = URL.createObjectURL(blob);
        el.muted = false;
        el.src = url;
        el.onended = () => { try { URL.revokeObjectURL(url); } catch { /* */ } resolve(true); };
        el.onerror = () => { try { URL.revokeObjectURL(url); } catch { /* */ } resolve(false); };
        const p = el.play();
        if (p && p.then) p.then(() => { unlockedRef.current = true; }).catch(() => { try { URL.revokeObjectURL(url); } catch { /* */ } resolve(false); });
      } catch { resolve(false); }
    });
  }, []);

  return { supported, isRecording, ensureMic, startRecording, stopRecording, playBlob, playBlobAwait, unlockAudio, recordUntilSilence, cancelListening };
}

export default useVoice;
