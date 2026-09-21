import React, { useState, useRef, useEffect } from "react";
import { callClaude } from "./lib/api";
import { storage } from "./lib/storage";

const STEPS = [
  { key: "intake", label: "Raw material" },
  { key: "uvp", label: "Value proposition" },
  { key: "ideas", label: "Product ideas" },
  { key: "journey", label: "Transformation" },
  { key: "modules", label: "Curriculum" },
  { key: "offer", label: "Offer page" },
  { key: "blueprint", label: "Blueprint" },
];

const SYSTEM = "You output ONLY valid JSON. No markdown fences, no preamble, no commentary, no trailing text. If you cannot comply, output an empty JSON object.";

function Rivet() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4a4136", marginTop: "6px" }} />;
}

function Rail({ step, onJump, maxReached }) {
  return (
    <div className="flex md:flex-col gap-0 md:gap-1 overflow-x-auto md:overflow-visible">
      {STEPS.map((s, i) => {
        const state = i < step ? "done" : i === step ? "current" : "upcoming";
        const clickable = i <= maxReached;
        return (
          <div
            key={s.key}
            className="flex md:flex-row items-center md:items-stretch gap-3 flex-shrink-0 md:flex-shrink"
            style={{ cursor: clickable ? "pointer" : "default" }}
            onClick={() => clickable && onJump(i)}
          >
            <div className="flex md:flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{
                  border: `1px solid ${state === "upcoming" ? "#3a352c" : "#c9793a"}`,
                  background: state === "done" ? "#c9793a" : "transparent",
                  color: state === "done" ? "#171310" : state === "current" ? "#e8a466" : "#6b6255",
                }}
              >
                {state === "done" ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block w-px flex-1 my-1"
                  style={{ background: i < step ? "#c9793a" : "#3a352c", minHeight: "18px" }}
                />
              )}
            </div>
            <div
              className="text-sm pb-4 md:pb-0 whitespace-nowrap md:whitespace-normal"
              style={{ color: state === "upcoming" ? "#6b6255" : "#ece5d8", fontWeight: state === "current" ? 600 : 400 }}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Plate({ children, glow }) {
  return (
    <div
      className="rounded-sm p-6 md:p-8"
      style={{
        background: "#221d17",
        border: `1px solid ${glow ? "#c9793a55" : "#3a352c"}`,
        boxShadow: glow ? "0 0 0 1px #c9793a22, 0 8px 30px -12px #c9793a33" : "none",
      }}
    >
      {children}
    </div>
  );
}

function Loading({ text }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3 py-10 justify-center">
      <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid #3a352c", borderTopColor: "#c9793a" }} />
      <span style={{ color: "#a89e8c" }} className="text-sm">{text}{".".repeat(dots)}</span>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="px-5 py-2.5 rounded-sm text-sm font-medium transition-opacity disabled:opacity-40"
      style={{ background: "#c9793a", color: "#171310" }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="px-5 py-2.5 rounded-sm text-sm font-medium transition-opacity disabled:opacity-40"
      style={{ background: "transparent", color: "#a89e8c", border: "1px solid #3a352c" }}>
      {children}
    </button>
  );
}

function EditableText({ value, onChange, className, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      spellCheck={false}
      className={"kiln-editable " + (className || "")}
      style={{ ...style, background: "transparent", border: "none", outline: "none", resize: "none", width: "100%", overflow: "hidden", fontFamily: "inherit", padding: "2px 4px", margin: "-2px -4px" }}
    />
  );
}

function EditHint() {
  return <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "#6b6255" }}><span style={{ color: "#c9793a" }}>✎</span> Click any text below to edit it</p>;
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildBlueprintText({ form, uvp, selectedIdea, journey, modules, offer }) {
  return `# ${selectedIdea.title}

## Value proposition
${uvp.uvp}

_Why this angle: ${uvp.angle}_

## Product
**Format:** ${selectedIdea.format}
**Promise:** ${selectedIdea.promise}

## Transformation
**Before:** ${journey.before}
**After:** ${journey.after}

Milestones:
${journey.milestones.map((m) => `- ${m}`).join("\n")}

## Curriculum
${modules.map((m, i) => {
  const header = `${i + 1}. **${m.title}** — ${m.description}`;
  if (m.lessonContent && m.lessonContent.length) {
    return `${header}\n${m.lessonContent.map((l, j) => `   ### ${j + 1}. ${l.title}\n   ${l.content}`).join("\n\n")}`;
  }
  return `${header}\n${m.lessons.map((l) => `   - ${l}`).join("\n")}`;
}).join("\n\n")}

## Offer page
### ${offer.headline}
${offer.subheadline}

${offer.bullets.map((b) => `- ${b}`).join("\n")}

**Pricing:** ${offer.price_anchor}
**Call to action:** ${offer.cta}

---
Built for: ${form.audience}
Their struggle: ${form.struggle}
`;
}

export default function Kiln() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ niche: "", skills: "", audience: "", struggle: "" });
  const [uvp, setUvp] = useState(null);
  const [ideas, setIdeas] = useState(null);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [journey, setJourney] = useState(null);
  const [modules, setModules] = useState(null);
  const [offer, setOffer] = useState(null);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const [lessonLoading, setLessonLoading] = useState({});
  const [lessonError, setLessonError] = useState({});

  const contentRef = useRef(null);
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.opacity = 0;
      contentRef.current.style.transform = "translateY(6px)";
      requestAnimationFrame(() => {
        contentRef.current.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        contentRef.current.style.opacity = 1;
        contentRef.current.style.transform = "translateY(0)";
      });
    }
  }, [step, loading]);

  function goTo(i) {
    setStep(i);
  }
  function advance(i) {
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
  }

  const contextBlock = () =>
    `Niche/topic: ${form.niche}\nExpertise: ${form.skills}\nTarget audience: ${form.audience}\nAudience's biggest struggle: ${form.struggle}`;

  async function generateUvp() {
    setLoading(true);
    setError(null);
    try {
      const result = await callClaude(SYSTEM,
        `Based on this creator's background, write a sharp unique value proposition for a digital product they could sell.\n\n${contextBlock()}\n\nReturn JSON exactly like: {"uvp": "one punchy sentence, under 25 words, in the creator's voice, no jargon", "angle": "one sentence explaining why this angle will resonate with this specific audience"}`);
      setUvp(result);
      advance(1);
    } catch (e) { setError(e.message || "Something went wrong."); } finally { setLoading(false); }
  }

  async function generateIdeas() {
    setLoading(true);
    setError(null);
    try {
      const result = await callClaude(SYSTEM,
        `${contextBlock()}\nValue proposition: ${uvp.uvp}\n\nPropose 3 distinct digital product ideas this creator could build and sell. Vary the format (e.g. course, template pack, cohort, guide).\n\nReturn JSON exactly like: {"ideas": [{"title": "product name", "format": "e.g. video course / template kit / group program", "promise": "one sentence on the transformation it delivers"}]}`);
      setIdeas(result.ideas || []);
      advance(2);
    } catch (e) { setError(e.message || "Something went wrong."); } finally { setLoading(false); }
  }

  async function generateJourney(idea) {
    setSelectedIdea(idea);
    setLoading(true);
    setError(null);
    try {
      const result = await callClaude(SYSTEM,
        `${contextBlock()}\nChosen product: ${idea.title} (${idea.format}) — ${idea.promise}\n\nMap the transformation this product delivers.\n\nReturn JSON exactly like: {"before": "one sentence describing where the customer starts", "after": "one sentence describing where they end up", "milestones": ["short milestone 1", "short milestone 2", "short milestone 3", "short milestone 4"]}`);
      setJourney(result);
      advance(3);
    } catch (e) { setError(e.message || "Something went wrong."); } finally { setLoading(false); }
  }

  async function generateModules() {
    setLoading(true);
    setError(null);
    try {
      const result = await callClaude(SYSTEM,
        `${contextBlock()}\nChosen product: ${selectedIdea.title} (${selectedIdea.format})\nBefore state: ${journey.before}\nAfter state: ${journey.after}\nMilestones: ${journey.milestones.join("; ")}\n\nBuild a curriculum of 4-6 modules that moves the customer through these milestones in order. Each module needs 2-4 short lessons.\n\nReturn JSON exactly like: {"modules": [{"title": "module title", "description": "one sentence on what it covers", "lessons": ["lesson 1", "lesson 2"]}]}`);
      setModules(result.modules || []);
      advance(4);
    } catch (e) { setError(e.message || "Something went wrong."); } finally { setLoading(false); }
  }

  async function generateLessonContent(moduleIndex) {
    const m = modules[moduleIndex];
    setLessonLoading((prev) => ({ ...prev, [moduleIndex]: true }));
    setLessonError((prev) => ({ ...prev, [moduleIndex]: null }));
    try {
      const result = await callClaude(SYSTEM,
        `${contextBlock()}\nProduct: ${selectedIdea.title} (${selectedIdea.format})\nModule: ${m.title} — ${m.description}\nLesson titles, in order: ${m.lessons.map((l, i) => `${i + 1}. ${l}`).join("; ")}\n\nWrite the full written lesson content for each lesson listed above, in order. Write directly to the student in second person, practical and concrete, no fluff intros. Each lesson should be 80-130 words.\n\nReturn JSON exactly like: {"lessons": [{"title": "must match the lesson title given", "content": "the full lesson text"}]}`);
      const content = result.lessons || [];
      setModules((prevModules) => {
        const next = [...prevModules];
        next[moduleIndex] = { ...next[moduleIndex], lessonContent: content };
        return next;
      });
    } catch (e) {
      setLessonError((prev) => ({ ...prev, [moduleIndex]: e.message || "Couldn't write these lessons. Try again." }));
    } finally {
      setLessonLoading((prev) => ({ ...prev, [moduleIndex]: false }));
    }
  }

  async function generateOffer() {
    setLoading(true);
    setError(null);
    try {
      const moduleSummary = modules.map((m) => m.title).join("; ");
      const result = await callClaude(SYSTEM,
        `${contextBlock()}\nProduct: ${selectedIdea.title} (${selectedIdea.format})\nValue proposition: ${uvp.uvp}\nModules: ${moduleSummary}\n\nWrite offer page copy for this product.\n\nReturn JSON exactly like: {"headline": "under 12 words", "subheadline": "one sentence", "bullets": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"], "price_anchor": "a suggested price range with one sentence of reasoning", "cta": "button text, 2-4 words"}`);
      setOffer(result);
      advance(5);
    } catch (e) { setError(e.message || "Something went wrong."); } finally { setLoading(false); }
  }

  async function saveToLibrary() {
    const id = savedId || Date.now().toString();
    const record = { id, title: selectedIdea.title, createdAt: new Date().toISOString(), form, uvp, selectedIdea, journey, modules, offer };
    try {
      await storage.set(`forges:${id}`, JSON.stringify(record));
      let index = [];
      try {
        const idxRes = await storage.get("forge-index");
        index = idxRes ? JSON.parse(idxRes.value) : [];
      } catch (_) { index = []; }
      index = index.filter((e) => e.id !== id);
      index.unshift({ id, title: record.title, createdAt: record.createdAt });
      await storage.set("forge-index", JSON.stringify(index));
      setSavedId(id);
    } catch (e) {
      setError("Couldn't save to your library right now.");
    }
  }

  async function openLibrary() {
    setLibraryOpen(true);
    setLibraryLoading(true);
    try {
      const idxRes = await storage.get("forge-index");
      setLibrary(idxRes ? JSON.parse(idxRes.value) : []);
    } catch (_) {
      setLibrary([]);
    } finally {
      setLibraryLoading(false);
    }
  }

  async function loadForge(id) {
    try {
      const res = await storage.get(`forges:${id}`);
      const record = JSON.parse(res.value);
      setForm(record.form);
      setUvp(record.uvp);
      setSelectedIdea(record.selectedIdea);
      setJourney(record.journey);
      setModules(record.modules);
      setOffer(record.offer);
      setSavedId(record.id);
      setMaxReached(6);
      setStep(6);
      setLibraryOpen(false);
    } catch (e) {
      setError("Couldn't load that forge.");
    }
  }

  async function deleteForge(id, e) {
    e.stopPropagation();
    try {
      await storage.delete(`forges:${id}`);
      const idxRes = await storage.get("forge-index");
      let index = idxRes ? JSON.parse(idxRes.value) : [];
      index = index.filter((entry) => entry.id !== id);
      await storage.set("forge-index", JSON.stringify(index));
      setLibrary(index);
    } catch (_) {}
  }

  function reset() {
    setStep(0);
    setMaxReached(0);
    setForm({ niche: "", skills: "", audience: "", struggle: "" });
    setUvp(null); setIdeas(null); setSelectedIdea(null); setJourney(null); setModules(null); setOffer(null);
    setSavedId(null);
    setError(null);
  }

  function copyBlueprint() {
    const text = buildBlueprintText({ form, uvp, selectedIdea, journey, modules, offer });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const canSubmitIntake = form.niche.trim() && form.skills.trim() && form.audience.trim() && form.struggle.trim();

  return (
    <div className="min-h-screen w-full" style={{ background: "#171310", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .kiln-serif { font-family: 'Fraunces', serif; }
        .kiln-input { background: #1b1712; border: 1px solid #3a352c; color: #ece5d8; border-radius: 2px; padding: 10px 12px; font-family: 'IBM Plex Sans', sans-serif; font-size: 14px; width: 100%; }
        .kiln-input:focus { outline: none; border-color: #c9793a; }
        .kiln-input::placeholder { color: #6b6255; }
        .kiln-card-select { transition: border-color 0.15s ease, background 0.15s ease; cursor: pointer; }
        .kiln-card-select:hover { border-color: #c9793a99 !important; background: #2a241c; }
        .kiln-editable { border-radius: 2px; cursor: text; transition: background 0.15s ease; }
        .kiln-editable:hover { background: #2a241c66; }
        .kiln-editable:focus { background: #2a241c; }
        .kiln-lib-row { transition: background 0.15s ease; cursor: pointer; }
        .kiln-lib-row:hover { background: #2a241c; }
      `}</style>

      <div className="max-w-5xl mx-auto px-5 md:px-10 py-10 md:py-14">
        <div className="mb-10 md:mb-14 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#c9793a" }} />
              <span className="text-xs tracking-wide" style={{ color: "#a89e8c" }}>Digital product forge</span>
            </div>
            <h1 className="kiln-serif text-3xl md:text-4xl" style={{ color: "#ece5d8" }}>Turn what you know into something sellable.</h1>
            <p className="mt-2 text-sm md:text-base max-w-xl" style={{ color: "#a89e8c" }}>
              Feed in your niche and expertise. Walk out with an editable, exportable product blueprint.
            </p>
          </div>
          <div className="flex-shrink-0 relative">
            <GhostButton onClick={openLibrary}>My forges</GhostButton>
            {libraryOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-sm z-10" style={{ background: "#221d17", border: "1px solid #3a352c", boxShadow: "0 12px 30px -8px #00000088" }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #3a352c" }}>
                  <span className="text-sm" style={{ color: "#ece5d8" }}>Saved forges</span>
                  <button onClick={() => setLibraryOpen(false)} className="text-sm" style={{ color: "#6b6255" }}>✕</button>
                </div>
                <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                  {libraryLoading && <p className="text-xs px-4 py-4" style={{ color: "#6b6255" }}>Loading...</p>}
                  {!libraryLoading && library.length === 0 && (
                    <p className="text-xs px-4 py-4" style={{ color: "#6b6255" }}>Nothing saved yet. Finish a forge and save it from the Blueprint step.</p>
                  )}
                  {!libraryLoading && library.map((entry) => (
                    <div key={entry.id} className="kiln-lib-row flex items-center justify-between px-4 py-3" onClick={() => loadForge(entry.id)}>
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: "#ece5d8" }}>{entry.title}</p>
                        <p className="text-xs" style={{ color: "#6b6255" }}>{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={(e) => deleteForge(entry.id, e)} className="text-xs flex-shrink-0 ml-2" style={{ color: "#6b6255" }}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-12">
          <Rail step={step} onJump={goTo} maxReached={maxReached} />

          <div ref={contentRef}>
            {error && (
              <div className="mb-4 text-sm px-4 py-3 rounded-sm" style={{ background: "#2a1a14", color: "#e8a466", border: "1px solid #c9793a55" }}>{error}</div>
            )}

            {step === 0 && (
              <Plate>
                <h2 className="kiln-serif text-xl mb-5" style={{ color: "#ece5d8" }}>What are you working with?</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: "#a89e8c" }}>Niche or topic</label>
                    <input className="kiln-input" placeholder="e.g. freelance copywriting, home baking, personal finance" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: "#a89e8c" }}>Your expertise or experience</label>
                    <input className="kiln-input" placeholder="e.g. 6 years writing email sequences for SaaS companies" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: "#a89e8c" }}>Who you'd sell to</label>
                    <input className="kiln-input" placeholder="e.g. new freelancers trying to land their first client" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: "#a89e8c" }}>Their biggest struggle right now</label>
                    <input className="kiln-input" placeholder="e.g. they don't know how to price their work" value={form.struggle} onChange={(e) => setForm({ ...form, struggle: e.target.value })} />
                  </div>
                </div>
                <div className="mt-6">
                  {loading ? <Loading text="Reading the raw material" /> : <PrimaryButton onClick={generateUvp} disabled={!canSubmitIntake}>Start the forge</PrimaryButton>}
                </div>
              </Plate>
            )}

            {step === 1 && uvp && !loading && (
              <Plate glow>
                <h2 className="kiln-serif text-xl mb-1" style={{ color: "#ece5d8" }}>Your value proposition</h2>
                <p className="text-xs mb-3" style={{ color: "#6b6255" }}>What makes this worth paying for</p>
                <EditHint />
                <div className="kiln-serif text-2xl leading-snug mb-4" style={{ color: "#e8a466" }}>
                  <EditableText value={uvp.uvp} onChange={(v) => setUvp({ ...uvp, uvp: v })} style={{ color: "#e8a466" }} />
                </div>
                <EditableText value={uvp.angle} onChange={(v) => setUvp({ ...uvp, angle: v })} className="text-sm" style={{ color: "#a89e8c" }} />
                <div className="mt-6 flex gap-3">
                  <PrimaryButton onClick={generateIdeas}>Continue to product ideas</PrimaryButton>
                  <GhostButton onClick={generateUvp}>Regenerate</GhostButton>
                </div>
              </Plate>
            )}
            {step === 1 && loading && <Plate><Loading text="Shaping the value proposition" /></Plate>}

            {step === 2 && ideas && !loading && (
              <Plate>
                <h2 className="kiln-serif text-xl mb-1" style={{ color: "#ece5d8" }}>Pick a product to build</h2>
                <p className="text-xs mb-5" style={{ color: "#6b6255" }}>Three ways to package what you know</p>
                <div className="space-y-3">
                  {ideas.map((idea, i) => (
                    <div key={i} className="kiln-card-select rounded-sm p-4" style={{ border: "1px solid #3a352c", background: "#1b1712" }} onClick={() => generateJourney(idea)}>
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <span className="kiln-serif text-lg" style={{ color: "#ece5d8" }}>{idea.title}</span>
                        <span className="text-xs flex-shrink-0" style={{ color: "#e8a466" }}>{idea.format}</span>
                      </div>
                      <p className="text-sm" style={{ color: "#a89e8c" }}>{idea.promise}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6"><GhostButton onClick={generateIdeas}>Regenerate ideas</GhostButton></div>
              </Plate>
            )}
            {step === 2 && loading && <Plate><Loading text="Casting product ideas" /></Plate>}

            {step === 3 && journey && !loading && (
              <Plate glow>
                <h2 className="kiln-serif text-xl mb-1" style={{ color: "#ece5d8" }}>{selectedIdea.title}</h2>
                <p className="text-xs mb-3" style={{ color: "#6b6255" }}>The transformation it delivers</p>
                <EditHint />
                <div className="flex flex-col md:flex-row gap-4 mb-5">
                  <div className="flex-1 p-4 rounded-sm" style={{ background: "#1b1712", border: "1px solid #3a352c" }}>
                    <p className="text-xs mb-1" style={{ color: "#6b6255" }}>Before</p>
                    <EditableText value={journey.before} onChange={(v) => setJourney({ ...journey, before: v })} className="text-sm" style={{ color: "#ece5d8" }} />
                  </div>
                  <div className="flex-1 p-4 rounded-sm" style={{ background: "#241a12", border: "1px solid #c9793a55" }}>
                    <p className="text-xs mb-1" style={{ color: "#e8a466" }}>After</p>
                    <EditableText value={journey.after} onChange={(v) => setJourney({ ...journey, after: v })} className="text-sm" style={{ color: "#ece5d8" }} />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  {journey.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm" style={{ color: "#a89e8c" }}>
                      <Rivet />
                      <div className="flex-1">
                        <EditableText value={m} onChange={(v) => { const next = [...journey.milestones]; next[i] = v; setJourney({ ...journey, milestones: next }); }} style={{ color: "#a89e8c" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <PrimaryButton onClick={generateModules}>Build the curriculum</PrimaryButton>
                  <GhostButton onClick={() => goTo(2)}>Choose a different idea</GhostButton>
                </div>
              </Plate>
            )}
            {step === 3 && loading && <Plate><Loading text="Mapping the transformation" /></Plate>}

            {step === 4 && modules && !loading && (
              <Plate>
                <h2 className="kiln-serif text-xl mb-1" style={{ color: "#ece5d8" }}>Curriculum</h2>
                <p className="text-xs mb-3" style={{ color: "#6b6255" }}>{modules.length} modules, in order</p>
                <EditHint />
                <div className="space-y-4">
                  {modules.map((m, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="kiln-serif text-lg flex-shrink-0 w-6 text-right" style={{ color: "#c9793a" }}>{i + 1}</div>
                      <div className="flex-1 pb-4" style={{ borderBottom: i < modules.length - 1 ? "1px solid #3a352c" : "none" }}>
                        <EditableText value={m.title} onChange={(v) => { const next = [...modules]; next[i] = { ...m, title: v }; setModules(next); }} className="text-base mb-1" style={{ color: "#ece5d8" }} />
                        <EditableText value={m.description} onChange={(v) => { const next = [...modules]; next[i] = { ...m, description: v }; setModules(next); }} className="text-sm mb-2" style={{ color: "#a89e8c" }} />

                        {!m.lessonContent && (
                          <>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {m.lessons.map((l, j) => (
                                <span key={j} className="text-xs px-2 py-1 rounded-sm" style={{ background: "#1b1712", color: "#6b6255", border: "1px solid #3a352c" }}>{l}</span>
                              ))}
                            </div>
                            {lessonLoading[i] ? (
                              <Loading text="Writing this module's lessons" />
                            ) : (
                              <GhostButton onClick={() => generateLessonContent(i)}>Write full lessons for this module</GhostButton>
                            )}
                            {lessonError[i] && <p className="text-xs mt-2" style={{ color: "#e8a466" }}>{lessonError[i]}</p>}
                          </>
                        )}

                        {m.lessonContent && (
                          <div className="space-y-3 mt-1">
                            {m.lessonContent.map((l, j) => (
                              <div key={j} className="p-3 rounded-sm" style={{ background: "#1b1712", border: "1px solid #3a352c" }}>
                                <EditableText value={l.title} onChange={(v) => { const next = [...modules]; const lc = [...next[i].lessonContent]; lc[j] = { ...lc[j], title: v }; next[i] = { ...next[i], lessonContent: lc }; setModules(next); }} className="text-sm mb-1" style={{ color: "#e8a466" }} />
                                <EditableText value={l.content} onChange={(v) => { const next = [...modules]; const lc = [...next[i].lessonContent]; lc[j] = { ...lc[j], content: v }; next[i] = { ...next[i], lessonContent: lc }; setModules(next); }} className="text-sm" style={{ color: "#a89e8c" }} />
                              </div>
                            ))}
                            {lessonLoading[i] ? (
                              <Loading text="Rewriting this module's lessons" />
                            ) : (
                              <GhostButton onClick={() => generateLessonContent(i)}>Regenerate lessons</GhostButton>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <PrimaryButton onClick={generateOffer}>Write the offer page</PrimaryButton>
                  <GhostButton onClick={generateModules}>Regenerate curriculum</GhostButton>
                </div>
              </Plate>
            )}
            {step === 4 && loading && <Plate><Loading text="Firing the curriculum" /></Plate>}

            {step === 5 && offer && !loading && (
              <Plate glow>
                <p className="text-xs mb-3" style={{ color: "#6b6255" }}>Offer page</p>
                <EditHint />
                <div className="kiln-serif text-3xl leading-tight mb-3" style={{ color: "#ece5d8" }}>
                  <EditableText value={offer.headline} onChange={(v) => setOffer({ ...offer, headline: v })} style={{ color: "#ece5d8" }} />
                </div>
                <EditableText value={offer.subheadline} onChange={(v) => setOffer({ ...offer, subheadline: v })} className="text-base mb-6" style={{ color: "#a89e8c" }} />
                <div className="space-y-2 mb-6">
                  {offer.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm" style={{ color: "#ece5d8" }}>
                      <span style={{ color: "#c9793a" }}>—</span>
                      <div className="flex-1"><EditableText value={b} onChange={(v) => { const next = [...offer.bullets]; next[i] = v; setOffer({ ...offer, bullets: next }); }} style={{ color: "#ece5d8" }} /></div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-sm mb-6" style={{ background: "#1b1712", border: "1px solid #3a352c" }}>
                  <p className="text-xs mb-1" style={{ color: "#6b6255" }}>Pricing</p>
                  <EditableText value={offer.price_anchor} onChange={(v) => setOffer({ ...offer, price_anchor: v })} className="text-sm" style={{ color: "#a89e8c" }} />
                </div>
                <button className="px-6 py-3 rounded-sm text-sm font-medium" style={{ background: "#c9793a", color: "#171310" }}>{offer.cta}</button>
                <div className="mt-8 flex gap-3">
                  <PrimaryButton onClick={() => advance(6)}>View full blueprint</PrimaryButton>
                  <GhostButton onClick={generateOffer}>Regenerate copy</GhostButton>
                </div>
              </Plate>
            )}
            {step === 5 && loading && <Plate><Loading text="Writing the offer page" /></Plate>}

            {step === 6 && offer && (
              <Plate glow>
                <div className="flex items-center justify-between mb-1 gap-3 flex-wrap">
                  <h2 className="kiln-serif text-xl" style={{ color: "#ece5d8" }}>Your blueprint</h2>
                  <div className="flex gap-2">
                    <GhostButton onClick={copyBlueprint}>{copied ? "Copied" : "Copy"}</GhostButton>
                    <GhostButton onClick={() => downloadFile(`${selectedIdea.title.replace(/\s+/g, "-").toLowerCase()}-blueprint.md`, buildBlueprintText({ form, uvp, selectedIdea, journey, modules, offer }))}>Download .md</GhostButton>
                    <PrimaryButton onClick={saveToLibrary}>{savedId ? "Saved ✓" : "Save to library"}</PrimaryButton>
                  </div>
                </div>
                <p className="text-xs mb-6" style={{ color: "#6b6255" }}>Everything you built, in one document. Edits from earlier steps are already baked in.</p>

                <div className="space-y-6">
                  <div>
                    <p className="kiln-serif text-2xl" style={{ color: "#e8a466" }}>{selectedIdea.title}</p>
                    <p className="text-sm mt-1" style={{ color: "#a89e8c" }}>{uvp.uvp}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#6b6255" }}>Transformation</p>
                    <p className="text-sm" style={{ color: "#ece5d8" }}>{journey.before} → {journey.after}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-2" style={{ color: "#6b6255" }}>Curriculum</p>
                    <div className="space-y-1">
                      {modules.map((m, i) => (
                        <p key={i} className="text-sm" style={{ color: "#ece5d8" }}>
                          {i + 1}. {m.title}
                          {m.lessonContent && <span className="text-xs ml-2" style={{ color: "#c9793a" }}>lessons written</span>}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#6b6255" }}>Offer</p>
                    <p className="text-sm" style={{ color: "#ece5d8" }}>{offer.headline} — {offer.price_anchor}</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <GhostButton onClick={reset}>Start a new product</GhostButton>
                </div>
              </Plate>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
