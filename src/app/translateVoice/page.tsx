"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { withApiBase } from "../../lib/env";
import { translateAndCache } from "../../lib/translate";

export default function TranslateVoicePage() {
    // Prevent scroll restoration from jumping to top
    if (typeof window !== "undefined") {
        window.history.scrollRestoration = "manual";
    }
    const [listening, setListening] = useState(false);
    const [originalText, setOriginalText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("fr");
    const [translating, setTranslating] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [recordingSupported, setRecordingSupported] = useState(false);

    // Use MediaRecorder for cross-platform audio capture
    useEffect(() => {
        if (typeof window !== "undefined" && navigator.mediaDevices && window.MediaRecorder) {
            setRecordingSupported(true);
        }
    }, []);

    const onToggleListen = async () => {
        if (!listening) {
            if (!recordingSupported) {
                alert("Audio recording not supported in this browser.");
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new window.MediaRecorder(stream);
                setMediaRecorder(recorder);
                setAudioChunks([]);
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) setAudioChunks((prev) => [...prev, e.data]);
                };
                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    // Upload audioBlob to backend for speech-to-text
                    const formData = new FormData();
                    formData.append('audio', audioBlob);
                    formData.append('lang', sourceLang);
                    try {
                        const resp = await fetch('/api/speech-to-text', {
                            method: 'POST',
                            body: formData,
                        });
                        const data = await resp.json();
                        if (resp.ok && data.text) {
                            setOriginalText(data.text);
                        } else {
                            setOriginalText('');
                            alert('Speech recognition failed.');
                        }
                    } catch (err) {
                        setOriginalText('');
                        alert('Speech recognition error.');
                    }
                };
                recorder.start();
                setListening(true);
            } catch (err) {
                alert('Could not start audio recording.');
            }
        } else {
            mediaRecorder?.stop();
            setListening(false);
        }
    };

    // Remove browser SpeechRecognition logic

    // shared language map for recognition and TTS
    const LANG_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", ar: "ar-SA", ja: "ja-JP" };

    const [speaking, setSpeaking] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [detectedLangName, setDetectedLangName] = useState<string | null>(null);
    const [detectedLangCode, setDetectedLangCode] = useState<string | null>(null);

    // static fallback language list (ISO 639-1 when available)
    const STATIC_LANGUAGES: { code: string; name: string }[] = [
        { code: "en", name: "English" },
        { code: "fr", name: "French" },
        { code: "es", name: "Spanish" },
        { code: "de", name: "German" },
        { code: "it", name: "Italian" },
        { code: "pt", name: "Portuguese" },
        { code: "ru", name: "Russian" },
        { code: "ja", name: "Japanese" },
        { code: "ko", name: "Korean" },
        { code: "zh", name: "Chinese" },
        { code: "ar", name: "Arabic" },
        { code: "hi", name: "Hindi" },
        { code: "bn", name: "Bengali" },
        { code: "pa", name: "Punjabi" },
        { code: "ur", name: "Urdu" },
        { code: "fa", name: "Persian" },
        { code: "tr", name: "Turkish" },
        { code: "vi", name: "Vietnamese" },
        { code: "id", name: "Indonesian" },
        { code: "ms", name: "Malay" },
        { code: "nl", name: "Dutch" },
        { code: "pl", name: "Polish" },
        { code: "sv", name: "Swedish" },
        { code: "no", name: "Norwegian" },
        { code: "da", name: "Danish" },
        { code: "fi", name: "Finnish" },
        { code: "cs", name: "Czech" },
        { code: "sk", name: "Slovak" },
        { code: "hu", name: "Hungarian" },
        { code: "ro", name: "Romanian" },
        { code: "bg", name: "Bulgarian" },
        { code: "sr", name: "Serbian" },
        { code: "hr", name: "Croatian" },
        { code: "sl", name: "Slovenian" },
        { code: "el", name: "Greek" },
        { code: "he", name: "Hebrew" },
        { code: "th", name: "Thai" },
        { code: "km", name: "Khmer" },
        { code: "lo", name: "Lao" },
        { code: "sw", name: "Swahili" },
        { code: "zu", name: "Zulu" },
        { code: "xh", name: "Xhosa" },
        { code: "af", name: "Afrikaans" },
        { code: "sq", name: "Albanian" },
        { code: "hy", name: "Armenian" },
        { code: "az", name: "Azerbaijani" },
        { code: "eu", name: "Basque" },
        { code: "bn", name: "Bengali" },
        { code: "be", name: "Belarusian" },
        { code: "ca", name: "Catalan" },
        { code: "eo", name: "Esperanto" },
        { code: "gl", name: "Galician" },
        { code: "is", name: "Icelandic" },
        { code: "ga", name: "Irish" },
        { code: "mk", name: "Macedonian" },
        { code: "mt", name: "Maltese" },
        { code: "sq", name: "Albanian" },
        { code: "cy", name: "Welsh" },
        { code: "tl", name: "Filipino" },
    ];

    // helper to dedupe by code (preserve first)
    const dedupeByCode = (arr: { code: string; name: string }[]) => {
        const seen = new Set<string>();
        const out: { code: string; name: string }[] = [];
        for (const a of arr) {
            const c = String(a.code).toLowerCase();
            if (!seen.has(c)) {
                seen.add(c);
                out.push({ code: c, name: a.name });
            }
        }
        return out;
    };

    const [languages, setLanguages] = useState<{ code: string; name: string }[]>(() => dedupeByCode(STATIC_LANGUAGES));

    // Try to load languages from a public translate API (LibreTranslate) and fall back to the static list
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetch('https://libretranslate.de/languages');
                if (!resp.ok) return;
                const data = await resp.json();
                // data is usually an array of {code,name}
                if (Array.isArray(data) && !cancelled) {
                    // remove duplicates and prefer API ordering
                    const merged = data.map((d: any) => ({ code: String(d.code), name: String(d.name) }));
                    setLanguages(dedupeByCode(merged));
                }
            } catch (e) {
                // silently ignore and stay with static list
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // SpeechRecognition logic removed; now handled by backend

    // Detect language of the given text (or current originalText) using public service then fallbacks.
    async function detectLanguageFromText(text?: string) {
        const txt = (text ?? originalText ?? "").trim();
        if (!txt) {
            // nothing to detect
            setDetectedLangName(null);
            return;
        }
        setDetecting(true);
        setDetectedLangName(null);
        try {
                // Try server-side DetectLanguage proxy first
                try {
                    const resp = await fetch('/api/detect-language', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: txt }),
                    });
                    const data = await resp.json().catch(() => ({}));
                    if (resp.ok && data) {
                        const code = String(data?.language ?? '').toLowerCase();
                        if (code) {
                            const found = languages.find((l) => l.code.toLowerCase() === code);
                            setDetectedLangCode(found ? found.code : code);
                            setDetectedLangName(found ? found.name : (data?.name ?? code.toUpperCase()));
                            return;
                        }
                    } else {
                        console.warn('Server detect response', resp.status, data);
                    }
                } catch (err) {
                    console.warn('Server detect failed', err);
                }

                // Try LibreTranslate detect as a secondary remote option
                try {
                    const resp = await fetch('https://libretranslate.de/detect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ q: txt }),
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        if (Array.isArray(data) && data.length > 0 && data[0].language) {
                            const lang = String(data[0].language).toLowerCase();
                            const found = languages.find((l) => l.code.toLowerCase() === lang);
                            // do not overwrite user selection; store detected values instead
                            setDetectedLangCode(found ? found.code : lang);
                            setDetectedLangName(found ? found.name : lang.toUpperCase());
                            return;
                        }
                    }
                } catch (err) {
                    console.warn('LibreTranslate detect failed', err);
                }

            // Try franc dynamic import (if available) - returns ISO639-3 codes
            try {
                const mod = await import('franc-min');
                const francFn = (mod as any).default ?? (mod as any);
                if (typeof francFn === 'function') {
                    const iso3 = francFn(txt || '');
                    if (iso3 && iso3 !== 'und') {
                        const short = iso3.slice(0, 2).toLowerCase();
                        const found = languages.find((l) => l.code.toLowerCase() === short);
                        setDetectedLangCode(found ? found.code : short);
                        setDetectedLangName(found ? found.name : short.toUpperCase());
                        return;
                    }
                }
            } catch (err) {
                // dynamic import may fail if package isn't installed or blocked; continue to heuristics
                console.warn('franc import/detect failed', err);
            }

            // Heuristic script/character checks as a last resort
            const heuristics: { re: RegExp; code: string; name: string }[] = [
                { re: /\p{Script=Arabic}/u, code: 'ar', name: 'Arabic' },
                { re: /[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9fff]/u, code: 'ja', name: 'Japanese/Chinese' },
                { re: /[\u4e00-\u9fff]/u, code: 'zh', name: 'Chinese' },
                { re: /[\uac00-\ud7af]/u, code: 'ko', name: 'Korean' },
                { re: /[\u0400-\u04FF]/u, code: 'ru', name: 'Russian' },
                { re: /[\u0900-\u097F]/u, code: 'hi', name: 'Hindi' },
                { re: /[\u0590-\u05FF]/u, code: 'he', name: 'Hebrew' },
                { re: /[\u0E00-\u0E7F]/u, code: 'th', name: 'Thai' },
            ];
            for (const h of heuristics) {
                try {
                    if (h.re.test(txt)) {
                        setDetectedLangCode(h.code);
                        setDetectedLangName(h.name);
                        return;
                    }
                } catch (e) {
                    // regex may fail in some engines; ignore
                }
            }

            // give up - set unknown
            setDetectedLangName('Unknown');
            setDetectedLangCode(null);
        } finally {
            setDetecting(false);
        }
    }

    // Text-to-Speech (Web Speech Synthesis)
    const speakTranslation = () => {
        if (!translatedText) return;
        if (typeof window === "undefined" || !window.speechSynthesis) {
            alert("SpeechSynthesis not supported in this browser.");
            return;
        }

        const synth = window.speechSynthesis;
        // cancel any ongoing speech
        synth.cancel();

        // Try to reload voices if not loaded
        let voices = synth.getVoices();
        if (!voices || voices.length === 0) {
            // Some browsers need onvoiceschanged event to load voices
            synth.onvoiceschanged = () => {
                voices = synth.getVoices();
            };
            voices = synth.getVoices();
        }
        if (!voices || voices.length === 0) {
            alert("No voices available for speech synthesis. Try reloading the page or using a different browser.");
            return;
        }

        const utter = new SpeechSynthesisUtterance(translatedText);
        utter.lang = LANG_MAP[targetLang] || `${targetLang}`;

        // try to pick a matching voice
        let match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith((utter.lang || '').toLowerCase().split('-')[0]));
        if (!match) {
            match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith((targetLang || '').toLowerCase()));
        }
        if (match) utter.voice = match;

        utter.rate = 1;
        utter.pitch = 1;

        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);

        synth.speak(utter);
    };

    const stopSpeaking = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        setSpeaking(false);
    };

    useEffect(() => {
        // ensure voices are loaded in some browsers
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            // trigger loading
            window.speechSynthesis.getVoices();
        }
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, []);

    // When user types (not only when speaking), detect language after a short debounce.
    useEffect(() => {
        // don't auto-detect while actively listening (we already detect on recognition end)
        if (listening) return;

        const txt = (originalText || '').trim();
        if (!txt) {
            // clear badge when input emptied
            setDetectedLangName(null);
            return;
        }

        // SpeechRecognition debounce logic removed
        const timer = setTimeout(() => {
            void detectLanguageFromText(txt);
        }, 600);
        return () => clearTimeout(timer);
    }, [originalText, listening]);

    // Removed unused stopRecognition function

    // Translate using a public LibreTranslate instance by default
    async function translateText() {
        try {
            setTranslating(true);
            // use the selected source language (UI does not include 'auto')
            const source = sourceLang || 'auto';
            const target = targetLang; // 'fr','en','es','de','it'

            // Quick path: try the shared helper which translates with caching.
            // Infer source from recognition language or selected sourceLang
            try {
                if (originalText && originalText.trim()) {
                    const quick = await (await import('../../lib/translate')).translateTextAPI(originalText, target, source);
                    if (quick && quick !== originalText) {
                        setTranslatedText(quick);
                        // cache it as well
                        try { (await import('../../lib/translate')).setCachedTranslation(originalText, target, quick); } catch {}
                        return;
                    }
                }
            } catch (e) {
                // ignore quick path failures and continue to main flow
            }
            // if user selected the same language for source and target, just echo the text
            if (source !== 'auto' && source === target) {
                setTranslatedText(originalText);
                return;
            }

            const body = { q: originalText, source, target, format: 'text' };
            // Try public LibreTranslate instance first (may be rate-limited or CORS-blocked)
            try {
                const resp = await fetch('https://libretranslate.de/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (!resp.ok) throw new Error(`translate service ${resp.status}`);
                const data = await resp.json();
                // handle error shapes that LibreTranslate may return
                const possibleError = (data && (data.error || data.message || '')) as string;
                if (possibleError && /please,? specify two different languages/i.test(possibleError)) {
                    throw new Error('libretranslate-same-language');
                }
                if (data && data.translatedText) {
                    const txt: string = data.translatedText;
                    // defensive: if translation equals the original text and languages differ, still accept it
                    if (/please,? specify two different languages/i.test(txt)) {
                        throw new Error('libretranslate-same-language');
                    }
                    setTranslatedText(txt);
                    return;
                }
            } catch (err) {
                console.warn('LibreTranslate failed, falling back to MyMemory', err);
                // fallthrough to fallback
            }

            // Fallback: MyMemory free API (GET).
            const inferredSource = source;
            const memTarget = targetLang;

            // if inferred source equals target, just echo original text
            if (inferredSource === memTarget) {
                setTranslatedText(originalText);
                return;
            }
            try {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalText)}&langpair=${inferredSource}|${memTarget}`;
                const resp2 = await fetch(url);
                if (resp2.ok) {
                    const d2 = await resp2.json();
                    if (d2 && d2.responseData && d2.responseData.translatedText) {
                        const txt2 = d2.responseData.translatedText;
                        if (/please,? specify two different languages/i.test(txt2)) {
                            // MyMemory or intermediate service asked for different languages — fallback to echo
                            setTranslatedText(originalText);
                            return;
                        }
                        setTranslatedText(txt2);
                        return;
                    }
                }
                // last resort fallback
                setTranslatedText(`(${target.toUpperCase()}) ${originalText}`);
            } catch (err) {
                console.error('fallback translate failed', err);
                setTranslatedText(`(${target.toUpperCase()}) ${originalText}`);
            }
        } catch (err) {
            console.error('translation failed', err);
            setTranslatedText(`(${targetLang.toUpperCase()}) ${originalText}`);
        } finally {
            setTranslating(false);
        }
    }

        // Auto-translate when text or language selections change (debounced)
        useEffect(() => {
            if (listening) return; // don't auto-translate while recording
            const txt = (originalText || '').trim();
            if (!txt) {
                setTranslatedText('');
                return;
            }

            const timer = setTimeout(() => {
                if (!translating) void translateText();
            }, 600);

            return () => clearTimeout(timer);
        }, [originalText, sourceLang, targetLang, listening, translating]);

    return (
        <main className="min-h-screen pt-20 pb-12 px-6 bg-[var(--background)] text-[var(--foreground)]">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-extrabold">Voice Translator</h1>
                </div>

                <section className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-5">
                        <div className="rounded-2xl p-6 bg-[var(--surface-muted)] border border-[var(--border)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1">
                                    <p className="text-sm text-[var(--muted-foreground)]">Speak and translate</p>
                                    <h2 className="text-lg font-semibold">Live voice → text</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={sourceLang}
                                        onChange={(e) => setSourceLang(e.target.value)}
                                        className="text-sm px-3 py-2 rounded-md border bg-white text-[#0b1724] border-[#274158] dark:bg-slate-800 dark:text-slate-100 focus:outline-none"
                                        aria-label="Source language"
                                    >
                                        {languages.map((l) => (
                                            <option key={l.code} value={l.code}>
                                                {l.name} ({l.code.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <button
                                    onClick={onToggleListen}
                                    className={`flex items-center justify-center w-40 h-40 rounded-full transition-transform shadow-md ${listening ? "bg-red-500 scale-95" : "bg-gradient-to-b from-[#6BD3FF] to-[#2EA7D9]"
                                        }`}
                                    aria-pressed={listening}
                                    aria-label="Start speaking"
                                >
                                    {/* Microphone icon */}
                                    <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                        <path d="M12 14a3.5 3.5 0 0 0 3.5-3.5V6.5A3.5 3.5 0 0 0 12 3h0a3.5 3.5 0 0 0-3.5 3.5v4A3.5 3.5 0 0 0 12 14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M19 11v.5A7 7 0 0 1 5 11.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 19v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                <div className="mt-4 text-center">
                                    <p className="text-sm text-[var(--muted-foreground)]">{listening ? "Listening..." : "Click to speak"}</p>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={() => {
                                            setOriginalText("");
                                            setTranslatedText("");
                                            setDetectedLangName(null);
                                            if (inputRef.current) inputRef.current.value = "";
                                        }}
                                        className="px-8 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-base font-medium shadow-sm hover:shadow-md"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-7">
                        <div className="rounded-2xl p-6 bg-[var(--surface-muted)] border border-[var(--border)] space-y-4">
                            <div>
                                <div className="flex items-center relative">
                                    <div className="flex-1 min-w-0">
                                        <label className="text-sm text-[var(--muted-foreground)] truncate">Recognized text</label>
                                    </div>
                                    {/* Small-screen (in-flow) badge — occupies layout and is only visible on small screens */}
                                    <div
                                        aria-hidden={!detectedLangName}
                                        className={`ml-3 flex-shrink-0 flex items-center gap-2 text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] transition-opacity duration-200 ease-out max-w-[50%] truncate ${detectedLangName ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} md:hidden`}
                                        style={{ willChange: 'opacity' }}
                                    >
                                        {/* Sparkles / AI icon to match the provided screenshot */}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-blue-500 dark:text-blue-400">
                                            <path d="M11 2l1.2 2.8L15 6l-2.8 1.2L11 10l-1.2-2.8L7 6l2.8-1.2L11 2z" fill="currentColor" opacity="0.95" />
                                            <path d="M19 6l.8 1.9L22 9l-2.2.9L19 12l-.8-1.9L16 9l2.2-.9L19 6z" fill="currentColor" opacity="0.9" />
                                        </svg>
                                        <span className="text-[var(--muted-foreground)] truncate">Langue source :</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!detectedLangCode) return;
                                                setSourceLang(detectedLangCode);
                                                // clear suggestion after accepting
                                                setDetectedLangCode(null);
                                                setDetectedLangName(null);
                                            }}
                                            className="ml-1 text-blue-600 dark:text-blue-400 font-normal hover:underline truncate"
                                        >
                                            {detectedLangName}
                                        </button>
                                    </div>

                                    {/* Md+ absolute badge — overlaid so it doesn't shift layout */}
                                    <div
                                        aria-hidden={!detectedLangName}
                                        className={`hidden md:flex items-center gap-2 text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] transition-opacity transition-transform duration-200 ease-out max-w-[40%] ${detectedLangName ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-[6px] pointer-events-none'} md:absolute md:right-3 md:top-1/2 md:-translate-y-1/2`}
                                        style={{ willChange: 'opacity, transform' }}
                                    >
                                        {/* Sparkles / AI icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-blue-500 dark:text-blue-400">
                                            <path d="M11 2l1.2 2.8L15 6l-2.8 1.2L11 10l-1.2-2.8L7 6l2.8-1.2L11 2z" fill="currentColor" opacity="0.95" />
                                            <path d="M19 6l.8 1.9L22 9l-2.2.9L19 12l-.8-1.9L16 9l2.2-.9L19 6z" fill="currentColor" opacity="0.9" />
                                        </svg>
                                        <span className="text-[var(--muted-foreground)] truncate">Langue source :</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!detectedLangCode) return;
                                                setSourceLang(detectedLangCode);
                                                // clear suggestion after accepting
                                                setDetectedLangCode(null);
                                                setDetectedLangName(null);
                                            }}
                                            className="ml-1 text-blue-600 dark:text-blue-400 font-normal hover:underline truncate"
                                        >
                                            {detectedLangName}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    ref={inputRef}
                                    value={originalText}
                                    onChange={(e) => setOriginalText(e.target.value)}
                                    rows={4}
                                    placeholder="The voice recognition output will appear here..."
                                    className="w-full mt-2 p-3 bg-[var(--surface)] rounded-md border border-[var(--border)] resize-none text-sm text-[var(--foreground)] placeholder-[color:var(--muted-foreground)] placeholder-opacity-90"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-[var(--muted-foreground)]">Translation ({targetLang.toUpperCase()})</label>
                                <div className="mt-2 p-3 bg-[var(--surface)] rounded-md border border-[var(--border)] min-h-[96px] text-sm">
                                    {translatedText ? (
                                        <p>{translatedText}</p>
                                    ) : (
                                        <p className="text-[var(--muted-foreground)]">Translation will appear here after recognition / when sent to the translator.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-sm text-[var(--muted-foreground)] mb-2 md:mb-0">
                                    <p className="leading-relaxed">TripFlow — speak to translate: click the mic, then Translate or Listen.</p>
                                </div>
                                <div className="flex flex-col gap-3 w-full md:flex-row md:w-auto md:items-center">
                                    <select
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className="text-sm px-3 py-2 rounded-md border bg-white text-[#0b1724] border-[#274158] dark:bg-slate-800 dark:text-slate-100 focus:outline-none w-full md:w-auto"
                                        aria-label="Target language (bottom)"
                                    >
                                        {languages.map((l) => (
                                            <option key={l.code} value={l.code}>
                                                {l.name} ({l.code.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => {
                                            if (translatedText) {
                                                // Try Clipboard API first
                                                if (navigator.clipboard && window.isSecureContext) {
                                                    navigator.clipboard.writeText(translatedText).catch(() => {
                                                        // fallback below
                                                        const textarea = document.createElement('textarea');
                                                        textarea.value = translatedText;
                                                        textarea.style.position = 'fixed';
                                                        textarea.style.opacity = '0';
                                                        document.body.appendChild(textarea);
                                                        textarea.focus();
                                                        textarea.select();
                                                        try {
                                                            document.execCommand('copy');
                                                        } catch {}
                                                        document.body.removeChild(textarea);
                                                    });
                                                } else {
                                                    // fallback for insecure context or unsupported clipboard
                                                    const textarea = document.createElement('textarea');
                                                    textarea.value = translatedText;
                                                    textarea.style.position = 'fixed';
                                                    textarea.style.opacity = '0';
                                                    document.body.appendChild(textarea);
                                                    textarea.focus();
                                                    textarea.select();
                                                    try {
                                                        document.execCommand('copy');
                                                    } catch {}
                                                    document.body.removeChild(textarea);
                                                }
                                            }
                                        }}
                                        className="px-3 py-2 rounded-md bg-white text-[#0b1724] border border-[#274158] dark:bg-slate-800 dark:text-slate-100 text-sm hover:shadow-sm w-full md:w-auto"
                                        title="Copy translation"
                                    >
                                        Copy
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (speaking) stopSpeaking();
                                            else speakTranslation();
                                        }}
                                        disabled={!translatedText}
                                        aria-pressed={speaking}
                                        className={`p-2 rounded-md border text-sm flex items-center justify-center w-full md:w-auto ${speaking ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-[#0b1724] border-[#274158] dark:bg-slate-800 dark:text-slate-100'} hover:shadow-sm`}
                                        title={speaking ? "Stop" : "Listen"}
                                    >
                                        {speaking ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm8 0a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                                <path d="M19 8a5 5 0 010 8" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3" />
                    </div>
                </section>
            </div>
        </main>
    );
}
