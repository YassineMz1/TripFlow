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
    const recognitionRef = useRef<any | null>(null);
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
        // If not currently listening, start.
        if (!listening) {
            // Prefer Web Speech API when available for live recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                try {
                    const recog = new SpeechRecognition();
                    recognitionRef.current = recog;
                    recog.lang = sourceLang || 'en-US';
                    recog.interimResults = false;
                    recog.maxAlternatives = 1;
                    recog.onresult = (ev: any) => {
                        try {
                            const text = ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
                            if (text) setOriginalText(String(text));
                        } catch (e) {
                            console.warn('speech recognition result parse failed', e);
                        }
                    };
                    recog.onerror = (e: any) => {
                        console.warn('SpeechRecognition error', e);
                        // Stop and fallback to MediaRecorder flow if recognition fails in a recoverable way
                        try {
                            recog.stop();
                        } catch {}
                        recognitionRef.current = null;
                        setListening(false);
                        // fallback to MediaRecorder flow below
                        void startMediaRecorderFallback();
                    };
                    recog.onend = () => {
                        setListening(false);
                        recognitionRef.current = null;
                    };
                    recog.start();
                    setListening(true);
                    return;
                } catch (err) {
                    console.warn('SpeechRecognition start failed, falling back to recorder', err);
                    // continue to recorder fallback
                }
            }

            // Recorder fallback (existing flow)
            await startMediaRecorderFallback();
        } else {
            // currently listening — stop whichever mechanism is active
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {}
                recognitionRef.current = null;
                setListening(false);
                return;
            }
            mediaRecorder?.stop();
            setListening(false);
        }
    };

    // Helper to start existing MediaRecorder + upload fallback
    async function startMediaRecorderFallback() {
        if (!recordingSupported) {
            alert('Audio recording not supported in this browser.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new window.MediaRecorder(stream);
            setMediaRecorder(recorder);
            setAudioChunks([]);
            recorder.ondataavailable = (e: any) => {
                if (e.data && e.data.size > 0) setAudioChunks((prev) => [...prev, e.data]);
            };
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob);
                formData.append('lang', sourceLang);
                try {
                    const resp = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
                    let data: any = null;
                    try { data = await resp.json(); } catch { data = null; }
                    if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
                        setOriginalText(data.text);
                        return;
                    }
                    if (typeof data === 'string' && data.trim().length > 0) { setOriginalText(data.trim()); return; }
                    // fallback: no alert, but empty string so user can try again
                    setOriginalText('');
                    console.warn('speech-to-text: no transcript', resp.status, data);
                } catch (err) {
                    console.warn('speech-to-text fetch failed', err);
                    setOriginalText('');
                }
            };
            recorder.start();
            setListening(true);
        } catch (err) {
            alert('Could not start audio recording.');
        }
    }

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
                void translateText();
            }, 600);

            return () => clearTimeout(timer);
        }, [originalText, sourceLang, targetLang, listening]);

    return (
        <main className="min-h-screen pt-16 pb-12 px-4 sm:px-6" style={{ background: "var(--background)", color: "var(--foreground)" }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9] bg-clip-text text-transparent">
                        Voice Translator
                    </h1>
                    <p className="text-sm sm:text-base" style={{ color: "var(--muted-foreground)" }}>
                        Speak naturally and get instant translations in 50+ languages
                    </p>
                </div>

                {/* Main Translation Card */}
                <div 
                    className="rounded-3xl p-6 sm:p-8 mb-6 backdrop-blur-sm"
                    style={{ 
                        background: "var(--surface)", 
                        border: "1px solid var(--border)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.12)"
                    }}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8">
                        {/* Source Language Section */}
                        <div className="space-y-4">
                            {/* Language Selector */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={sourceLang}
                                    onChange={(e) => setSourceLang(e.target.value)}
                                    className="flex-1 text-sm sm:text-base px-4 py-2.5 rounded-xl border-2 transition-all outline-none font-semibold"
                                    style={{ 
                                        background: "var(--background)",
                                        color: "var(--foreground)",
                                        borderColor: "var(--border)"
                                    }}
                                    aria-label="Source language"
                                >
                                    {languages.map((l) => (
                                        <option key={l.code} value={l.code}>
                                            {l.name}
                                        </option>
                                    ))}
                                </select>
                                {detectedLangName && (
                                    <div 
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap animate-in fade-in slide-in-from-top-2"
                                        style={{ 
                                            background: "linear-gradient(135deg, #29D1FF15, #2EA7D915)",
                                            border: "1px solid #29D1FF30",
                                            color: "#29D1FF"
                                        }}
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2l2 7h7l-5.5 4.5L18 21l-6-4.5L6 21l2.5-7.5L3 9h7l2-7z"/>
                                        </svg>
                                        <button
                                            onClick={() => {
                                                if (!detectedLangCode) return;
                                                setSourceLang(detectedLangCode);
                                                setDetectedLangCode(null);
                                                setDetectedLangName(null);
                                            }}
                                            className="font-medium hover:underline"
                                        >
                                            {detectedLangName}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Voice Input Section */}
                            <div className="relative">
                                <textarea
                                    ref={inputRef}
                                    value={originalText}
                                    onChange={(e) => setOriginalText(e.target.value)}
                                    rows={6}
                                    placeholder="Speak or type here..."
                                    className="w-full p-4 rounded-2xl border-2 resize-none text-base sm:text-lg transition-all outline-none"
                                    style={{ 
                                        background: "var(--background)",
                                        color: "var(--foreground)",
                                        borderColor: listening ? "#29D1FF" : "var(--border)",
                                        boxShadow: listening ? "0 0 0 3px rgba(41, 209, 255, 0.1)" : "none"
                                    }}
                                />
                                
                                {/* Mic Button - Floating inside textarea */}
                                <button
                                    onClick={onToggleListen}
                                    className={`absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${
                                        listening ? "animate-pulse" : ""
                                    }`}
                                    style={{ 
                                        background: listening 
                                            ? "linear-gradient(135deg, #ef4444, #dc2626)" 
                                            : "linear-gradient(135deg, #29D1FF, #2EA7D9)",
                                        boxShadow: listening
                                            ? "0 10px 30px rgba(239, 68, 68, 0.4)"
                                            : "0 10px 30px rgba(41, 209, 255, 0.3)"
                                    }}
                                    aria-pressed={listening}
                                    title={listening ? "Stop listening" : "Start speaking"}
                                >
                                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 14a3.5 3.5 0 0 0 3.5-3.5V6.5A3.5 3.5 0 0 0 12 3h0a3.5 3.5 0 0 0-3.5 3.5v4A3.5 3.5 0 0 0 12 14z" />
                                        <path d="M19 11v.5A7 7 0 0 1 5 11.5V11" />
                                        <path d="M12 19v4M8 23h8" />
                                    </svg>
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                <span className="flex-1">
                                    {listening ? (
                                        <span className="flex items-center gap-2 text-[#29D1FF]">
                                            <span className="flex gap-1">
                                                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                            </span>
                                            Listening...
                                        </span>
                                    ) : (
                                        "Click the mic to start"
                                    )}
                                </span>
                                <button
                                    onClick={() => {
                                        setOriginalText("");
                                        setTranslatedText("");
                                        setDetectedLangName(null);
                                        if (inputRef.current) inputRef.current.value = "";
                                    }}
                                    className="px-4 py-1.5 rounded-lg hover:bg-opacity-80 transition-colors"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Swap Button */}
                        <div className="hidden lg:flex items-center justify-center">
                            <button
                                onClick={() => {
                                    const temp = sourceLang;
                                    setSourceLang(targetLang);
                                    setTargetLang(temp);
                                    const tempText = originalText;
                                    setOriginalText(translatedText);
                                    setTranslatedText(tempText);
                                }}
                                className="p-3 rounded-full hover:bg-opacity-80 transition-all transform hover:rotate-180"
                                style={{ background: "var(--background)", border: "2px solid var(--border)" }}
                                title="Swap languages"
                            >
                                <svg className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M7 16V4M7 4L3 8M7 4l4 4" />
                                    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            </button>
                        </div>

                        {/* Target Language Section */}
                        <div className="space-y-4">
                            {/* Language Selector */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                    className="flex-1 text-sm sm:text-base px-4 py-2.5 rounded-xl border-2 transition-all outline-none font-semibold"
                                    style={{ 
                                        background: "var(--background)",
                                        color: "var(--foreground)",
                                        borderColor: "var(--border)"
                                    }}
                                    aria-label="Target language"
                                >
                                    {languages.map((l) => (
                                        <option key={l.code} value={l.code}>
                                            {l.name}
                                        </option>
                                    ))}
                                </select>
                                {translating && (
                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#29D1FF" }}>
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" opacity="0.25"/>
                                            <path d="M12 2a10 10 0 0110 10" opacity="0.75"/>
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Translation Output */}
                            <div 
                                className="relative p-4 rounded-2xl border-2 min-h-[200px] text-base sm:text-lg"
                                style={{ 
                                    background: translatedText ? "linear-gradient(135deg, #29D1FF08, #2EA7D908)" : "var(--background)",
                                    borderColor: "var(--border)"
                                }}
                            >
                                {translatedText ? (
                                    <p className="leading-relaxed">{translatedText}</p>
                                ) : (
                                    <p style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                                        Translation will appear here...
                                    </p>
                                )}
                                
                                {/* Action Buttons - Floating inside */}
                                {translatedText && (
                                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (navigator.clipboard && window.isSecureContext) {
                                                    navigator.clipboard.writeText(translatedText);
                                                } else {
                                                    const textarea = document.createElement('textarea');
                                                    textarea.value = translatedText;
                                                    textarea.style.position = 'fixed';
                                                    textarea.style.opacity = '0';
                                                    document.body.appendChild(textarea);
                                                    textarea.select();
                                                    document.execCommand('copy');
                                                    document.body.removeChild(textarea);
                                                }
                                            }}
                                            className="p-2.5 rounded-lg hover:bg-opacity-80 transition-all"
                                            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                                            title="Copy translation"
                                        >
                                            <svg className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (speaking) stopSpeaking();
                                                else speakTranslation();
                                            }}
                                            className={`p-2.5 rounded-lg transition-all ${speaking ? 'animate-pulse' : ''}`}
                                            style={{ 
                                                background: speaking ? "#29D1FF" : "var(--background)",
                                                border: `1px solid ${speaking ? "#29D1FF" : "var(--border)"}`,
                                                color: speaking ? "white" : "var(--muted-foreground)"
                                            }}
                                            title={speaking ? "Stop" : "Listen"}
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                {speaking ? (
                                                    <>
                                                        <rect x="6" y="4" width="4" height="16" rx="2"/>
                                                        <rect x="14" y="4" width="4" height="16" rx="2"/>
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                                        <path d="M19 8a5 5 0 010 8" />
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                                <span>Instant translation as you speak</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div 
                    className="rounded-2xl p-4 sm:p-6 text-center"
                    style={{ 
                        background: "linear-gradient(135deg, #29D1FF10, #2EA7D910)",
                        border: "1px solid #29D1FF30"
                    }}
                >
                    <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
                        <svg className="w-5 h-5 text-[#29D1FF]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span style={{ color: "var(--foreground)" }}>
                            Powered by <strong className="text-[#29D1FF]">TripFlow</strong> — Supporting 50+ languages with voice recognition
                        </span>
                    </div>
                </div>
            </div>
        </main>
    );
}
