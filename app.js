import "./style.css";
import {
  COURSE_META,
  PART1_DATA,
  PART2_DATA,
  PART3_DATA,
  PART4_DIFERENCIAS,
  PART5_EXAMEN_25,
  PART6_ABIERTAS,
  PART7_BOSQUE,
  EXAMEN_80
} from "./data.js";

const STORAGE_KEY = "lengua_eso_state_v1";

const state = {
  view: "theory", // 'theory' | 'quiz25' | 'open' | 'exam80' | 'answers'
  theoryPart: "parte1", // 'parte1' | 'parte2' | 'parte3' | 'parte4'
  figuraFilter: "all", // 'all' | 'semanticas' | 'repeticion' | 'sonido'
  figuraSearch: "",
  showAllTranslations: false,
  openTranslations: new Set(),
  showSinalefaDetails: true,
  // Part 4 (diferencias) individual revealed answers
  revealedDiff: new Set(),
  // Part 5 (25-question test)
  quizIndex: 0,
  quizAnswers: {}, // { [num]: 'A'|'B'|'C'|'D' }
  quizSubMode: "questions", // 'questions' | 'answers'
  // Part 6 & 7 (open + bosque)
  openSubMode: "questions", // 'questions' | 'answers'
  openNotes: {}, // { [key]: string }
  revealedBosque: new Set(),
  // Exam 80
  exam80Part: "p1", // 'p1' | 'p2' | 'p3' | 'p4' | 'p5'
  exam80SubMode: "questions", // 'questions' | 'answers'
  exam80UserAnswers: {}, // { [num]: string }
  revealedExam80: new Set(),
  // Answers Hub filter
  answersSection: "all", // 'all' | 'quiz25' | 'open' | 'bosque' | 'exam80_1' | 'exam80_2' | 'exam80_3' | 'exam80_4' | 'exam80_5'
  mobileMenuOpen: false
};

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.quizAnswers) state.quizAnswers = saved.quizAnswers;
    if (saved.openNotes) state.openNotes = saved.openNotes;
    if (saved.exam80UserAnswers) state.exam80UserAnswers = saved.exam80UserAnswers;
  } catch {
    // Ignore storage errors
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        quizAnswers: state.quizAnswers,
        openNotes: state.openNotes,
        exam80UserAnswers: state.exam80UserAnswers
      })
    );
  } catch {
    // Ignore storage errors
  }
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(str) {
  return esc(str).replace(/\n/g, "<br>");
}

function isTranslationOpen(id) {
  return state.showAllTranslations || state.openTranslations.has(id);
}

/**
 * Renders clickable Spanish text. Armenian translation is hidden by default
 * and opens only when clicking the Spanish phrase (or toggling all).
 */
function esPhrase(id, esText, hyText, opts = {}) {
  const open = isTranslationOpen(id);
  const inline = opts.inline || false;
  const esClass = opts.esClass || "font-medium text-stone-900 text-base sm:text-lg";
  const wrapperClass = inline ? "inline-block align-top" : "block";

  return `
    <span class="${wrapperClass} max-w-full" data-es-wrap="${esc(id)}">
      <button
        type="button"
        class="es-phrase-btn group"
        data-es-toggle="${esc(id)}"
        aria-expanded="${open ? "true" : "false"}"
        title="Սեղմիր՝ հայերեն թարգմանությունը բացելու համար"
      >
        <span class="es-underline ${esClass}">${nl2br(esText)}</span>
        <span class="ml-1.5 inline-block text-xs font-semibold text-orange-700/90 group-hover:text-orange-800 select-none">[Հայ]</span>
      </button>
      <span
        class="hy-translation ${open ? "block" : "hidden"}"
        data-hy-box="${esc(id)}"
      >${nl2br(hyText)}</span>
    </span>
  `;
}

function renderTopBar() {
  const navItems = [
    { id: "theory", label: "Տեսություն" },
    { id: "quiz25", label: "Թեստ (25)" },
    { id: "open", label: "Բաց և տեքստ" },
    { id: "exam80", label: "80 վարժություն" },
    { id: "answers", label: "Պատասխաններ" }
  ];

  const navLinksHtml = navItems
    .map((item) => {
      const active = state.view === item.id;
      return `
        <button
          type="button"
          data-nav="${item.id}"
          class="whitespace-nowrap shrink-0 px-1 py-1 text-base font-semibold transition-colors border-b-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-orange-600 ${
            active
              ? "border-orange-600 text-orange-800"
              : "border-transparent text-stone-600 hover:text-stone-900 hover:border-amber-300"
          }"
        >
          ${esc(item.label)}
        </button>
      `;
    })
    .join("");

  const mobileLinksHtml = navItems
    .map((item) => {
      const active = state.view === item.id;
      return `
        <button
          type="button"
          data-nav="${item.id}"
          class="w-full text-left px-3.5 py-2.5 rounded-lg text-base font-semibold transition-colors cursor-pointer ${
            active ? "bg-amber-100 text-orange-900" : "text-stone-700 hover:bg-amber-50"
          }"
        >
          ${esc(item.label)}
        </button>
      `;
    })
    .join("");

  return `
    <header class="sticky top-0 z-30 bg-[#FFFDF7]/95 backdrop-blur border-b border-amber-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <button
          type="button"
          data-nav="theory"
          class="font-display text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-orange-600 rounded"
        >
          Lengua 1.º ESO
        </button>

        <nav class="hidden md:flex items-center gap-6" aria-label="Գլխավոր մենյու">
          ${navLinksHtml}
        </nav>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-toggle-all-hy="true"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-orange-600 ${
              state.showAllTranslations
                ? "bg-amber-500 text-stone-950 hover:bg-amber-400"
                : "bg-orange-600 text-white hover:bg-orange-700"
            }"
          >
            ${state.showAllTranslations ? "Փակել հայերենը" : "Բացել բոլոր թարգման."}
          </button>
          <button
            type="button"
            data-toggle-mobile-menu="true"
            aria-label="Մենյու"
            aria-expanded="${state.mobileMenuOpen ? "true" : "false"}"
            class="md:hidden p-2 rounded-lg border border-amber-300 text-stone-800 hover:bg-amber-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      ${
        state.mobileMenuOpen
          ? `<div class="md:hidden border-t border-amber-200 bg-[#FFFDF7] px-4 py-3 space-y-1">${mobileLinksHtml}</div>`
          : ""
      }
    </header>
  `;
}

function renderHeroBanner() {
  return `
    <section class="bg-gradient-to-b from-amber-50/90 to-[#FFFBF2] border-b border-amber-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div class="max-w-4xl">
          <p class="text-sm text-orange-800 font-semibold mb-2">
            <span>${esc(COURSE_META.subtitle)}</span>
            <span aria-hidden="true" class="mx-1.5">·</span>
            <span>Սեղմիր ցանկացած իսպաներեն տեքստի վրա՝ հայերեն թարգմանությունը բացելու համար</span>
          </p>
          <h1 class="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
            ${esPhrase("hero_title", COURSE_META.titleEs, COURSE_META.titleHy, {
              esClass: "font-display text-3xl sm:text-4xl font-bold text-stone-900"
            })}
          </h1>
          <p class="mt-4 text-base sm:text-lg text-stone-700 max-w-3xl">
            ${esc(COURSE_META.introHy)}
          </p>
        </div>

        <div class="mt-7 pt-6 border-t border-amber-200/80">
          <p class="text-base font-bold text-stone-900 mb-3">${esc(COURSE_META.prepNoteHy)}</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${COURSE_META.concepts
              .map(
                (c, i) => `
              <div class="p-5 rounded-xl bg-white border border-amber-200 shadow-xs">
                <div class="text-xs font-mono font-semibold text-orange-700 mb-1.5">0${i + 1}</div>
                <div>
                  ${esPhrase(`concept_${i}`, c.es, `${c.hy} — ${c.descHy}`, {
                    esClass: "text-lg font-bold text-stone-900"
                  })}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderTheorySubNav() {
  const tabs = [
    { id: "parte1", label: "Մաս 1 · Փոխաբերական լեզու" },
    { id: "parte2", label: "Մաս 2 · Գրական ժանրեր" },
    { id: "parte3", label: "Մաս 3 · Ռոմանս և Սինալեֆա" },
    { id: "parte4", label: "Մաս 4 · Կարևոր տարբերություններ" }
  ];

  return `
    <div class="flex flex-wrap items-center gap-1.5 p-1.5 bg-amber-100/70 rounded-xl border border-amber-200 w-fit max-w-full">
      ${tabs
        .map((t) => {
          const active = state.theoryPart === t.id;
          return `
            <button
              type="button"
              data-theory-part="${t.id}"
              class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-stone-700 hover:text-stone-900 hover:bg-amber-50"
              }"
            >
              ${esc(t.label)}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderPart1() {
  const { whatIs, literalVsFigurado, figurasIntro, figuraGroups, resumen } = PART1_DATA;

  const filterButtons = [
    { id: "all", label: "Բոլորը (16)" },
    { id: "semanticas", label: "A. Իմաստային (1–8)" },
    { id: "repeticion", label: "B. Կրկնություն և շարադասություն (9–14)" },
    { id: "sonido", label: "C. Հնչյունական (15–16)" }
  ];

  const searchLower = state.figuraSearch.trim().toLowerCase();

  const filteredGroups = figuraGroups
    .filter((g) => state.figuraFilter === "all" || g.id === state.figuraFilter)
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (!searchLower) return true;
        return (
          item.nameEs.toLowerCase().includes(searchLower) ||
          item.nameHy.toLowerCase().includes(searchLower) ||
          item.defEs.toLowerCase().includes(searchLower) ||
          item.defHy.toLowerCase().includes(searchLower)
        );
      })
    }))
    .filter((g) => g.items.length > 0);

  return `
    <div class="space-y-8">
      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("p1_what_h", whatIs.headingEs, whatIs.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        <div class="mt-5 space-y-4">
          ${whatIs.paragraphs
            .map((p, idx) =>
              esPhrase(`p1_what_${idx}`, p.es, p.hy, {
                esClass: "text-lg text-stone-800 leading-relaxed"
              })
            )
            .join("")}
        </div>

        <div class="mt-6 p-5 rounded-xl bg-amber-50/70 border border-amber-200">
          <div class="text-xs font-bold text-orange-800 mb-2">Ejemplo</div>
          ${esPhrase("p1_what_ex", whatIs.example.es, `${whatIs.example.hy}\n${whatIs.example.noteHy}`, {
            esClass: "text-xl font-bold text-stone-900"
          })}
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("p1_lit_h", literalVsFigurado.headingEs, literalVsFigurado.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-amber-200 text-sm font-bold text-stone-700">
                <th class="py-3 pr-4">Lenguaje literal</th>
                <th class="py-3 pl-4">Lenguaje figurado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-amber-100">
              ${literalVsFigurado.pairs
                .map(
                  (pair, idx) => `
                <tr>
                  <td class="py-4 pr-4 align-top">
                    ${esPhrase(`lit_${idx}`, pair.literalEs, pair.literalHy, {
                      esClass: "text-base sm:text-lg text-stone-800"
                    })}
                  </td>
                  <td class="py-4 pl-4 align-top">
                    ${esPhrase(`fig_${idx}`, pair.figuradoEs, pair.figuradoHy, {
                      esClass: "text-base sm:text-lg text-orange-800 font-semibold"
                    })}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="mt-6 p-5 rounded-xl bg-orange-50/70 border border-orange-200">
          <div class="text-base font-bold text-orange-900 mb-3">
            ${esPhrase("exam_rule_h", literalVsFigurado.examRuleHeadingEs, literalVsFigurado.examRuleHeadingHy, {
              esClass: "text-base font-bold text-orange-900"
            })}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${literalVsFigurado.examRules
              .map((r, i) =>
                esPhrase(`exam_rule_${i}`, r.es, r.hy, {
                  esClass: "text-base font-medium text-stone-900"
                })
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("fig_intro_h", figurasIntro.headingEs, figurasIntro.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        <div class="mt-5 space-y-3">
          ${esPhrase(
            "fig_intro_def",
            figurasIntro.defEs,
            `${figurasIntro.defHy}\n\n${figurasIntro.extraNoteHy}`,
            {
              esClass: "text-lg text-stone-800"
            }
          )}
        </div>

        <div class="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-amber-200/80">
          <div class="flex flex-wrap items-center gap-1.5 p-1 bg-amber-100/70 rounded-xl border border-amber-200">
            ${filterButtons
              .map(
                (btn) => `
              <button
                type="button"
                data-figura-filter="${btn.id}"
                class="px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  state.figuraFilter === btn.id
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-stone-700 hover:text-stone-900 hover:bg-amber-50"
                }"
              >
                ${esc(btn.label)}
              </button>
            `
              )
              .join("")}
          </div>

          <div class="w-full lg:w-72">
            <input
              type="search"
              data-figura-search="true"
              value="${esc(state.figuraSearch)}"
              placeholder="Որոնել (օր.՝ metáfora, aliteración)..."
              class="w-full px-4 py-2.5 text-base bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>
        </div>

        <div class="mt-6 space-y-8">
          ${
            filteredGroups.length === 0
              ? `<p class="text-base text-stone-500 py-6 text-center">Որոնման արդյունքներ չկան։</p>`
              : filteredGroups
                  .map(
                    (group) => `
            <div>
              <h3 class="text-xl font-bold text-stone-900 mb-4">
                ${esPhrase(`grp_h_${group.id}`, group.titleEs, group.titleHy, {
                  esClass: "text-xl font-bold text-stone-900"
                })}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${group.items
                  .map(
                    (fig) => `
                  <article class="p-5 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between gap-3">
                    <div>
                      <div class="mb-2">
                        <h4 class="text-lg font-bold text-stone-900 tabular-nums">
                          ${esPhrase(`fig_name_${fig.num}`, `${fig.num}. ${fig.nameEs}`, fig.nameHy, {
                            esClass: "text-lg font-bold text-stone-900"
                          })}
                        </h4>
                      </div>
                      <div class="mb-3">
                        ${esPhrase(`fig_def_${fig.num}`, fig.defEs, fig.defHy, {
                          esClass: "text-base text-stone-800"
                        })}
                      </div>
                      <div class="space-y-2 pt-3 border-t border-amber-200/80">
                        <div class="text-xs font-bold text-orange-800 uppercase tracking-wide">Ejemplos</div>
                        ${fig.examples
                          .map((ex, exIdx) =>
                            esPhrase(`fig_ex_${fig.num}_${exIdx}`, ex.es, ex.hy, {
                              esClass: "text-base font-semibold text-orange-900"
                            })
                          )
                          .join("")}
                      </div>
                      ${
                        fig.notes
                          ? `
                        <div class="mt-3 pt-3 border-t border-amber-300 bg-amber-100/70 p-3.5 rounded-lg space-y-2">
                          <div class="text-sm font-bold text-amber-950">
                            ${esPhrase(`fig_note_h_${fig.num}`, fig.noteTitleEs, fig.noteTitleHy, {
                              esClass: "text-sm font-bold text-amber-950"
                            })}
                          </div>
                          ${fig.notes
                            .map((n, nIdx) =>
                              esPhrase(`fig_note_${fig.num}_${nIdx}`, n.es, n.hy, {
                                esClass: "text-sm font-medium text-stone-900"
                              })
                            )
                            .join("")}
                        </div>
                      `
                          : ""
                      }
                    </div>
                  </article>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
                  )
                  .join("")
          }
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8">
        <h3 class="font-display text-2xl font-bold text-stone-900 mb-1">Resumen de las figuras literarias</h3>
        <p class="text-sm text-stone-500 mb-5">Սեղմիր իսպաներեն բնութագրման վրա՝ հայերեն թարգմանությունը բացելու համար</p>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-amber-200 text-sm font-bold text-stone-700">
                <th class="py-3 pr-4">Figura</th>
                <th class="py-3 pl-4">Cómo reconocerla</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-amber-100 text-base">
              ${resumen
                .map(
                  (row, i) => `
                <tr>
                  <td class="py-3 pr-4 font-bold text-stone-900 whitespace-nowrap">${esc(row.figura)}</td>
                  <td class="py-3 pl-4">
                    ${esPhrase(`res_${i}`, row.es, row.hy, { esClass: "text-stone-800 text-base" })}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderPart2() {
  const { intro, narrativo, lirico, dramatico } = PART2_DATA;

  return `
    <div class="space-y-8">
      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("p2_intro_h", intro.headingEs, intro.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        <div class="mt-5 space-y-3">
          ${esPhrase("p2_intro_def", intro.defEs, intro.defHy, { esClass: "text-lg text-stone-800" })}
          ${esPhrase("p2_intro_lead", intro.leadEs, intro.leadHy, { esClass: "text-base font-semibold text-stone-700" })}
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          ${intro.triad
            .map(
              (g, idx) => `
            <div class="p-5 rounded-xl bg-amber-50/60 border border-amber-200">
              <div class="text-xs font-mono font-bold text-orange-700 mb-1">0${idx + 1}</div>
              <div class="mb-2">
                ${esPhrase(`triad_n_${idx}`, g.nameEs, g.nameHy, { esClass: "text-xl font-bold text-stone-900" })}
              </div>
              ${esPhrase(`triad_${idx}`, g.roleEs, g.roleHy, { esClass: "text-base text-orange-900 font-medium" })}
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("nar_h", narrativo.headingEs, narrativo.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        ${esPhrase("nar_def", narrativo.defEs, narrativo.defHy, { esClass: "text-lg text-stone-800" })}

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Elementos de la narración</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${narrativo.elementos
              .map(
                (el, idx) => `
              <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                ${esPhrase(`nar_el_${idx}`, el.es, el.hy, { esClass: "text-base font-bold text-stone-900" })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Tipos de narrador</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${narrativo.narradores
              .map(
                (n, idx) => `
              <div class="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
                <div>
                  ${esPhrase(`nar_t_${idx}`, n.typeEs, n.typeHy, { esClass: "font-bold text-stone-900 text-base" })}
                </div>
                ${
                  n.noteEs
                    ? esPhrase(`nar_note_${idx}`, n.noteEs, n.noteHy, { esClass: "text-sm text-stone-700" })
                    : ""
                }
                <div class="pt-2 border-t border-amber-200/80">
                  ${esPhrase(`nar_ex_${idx}`, n.exampleEs, n.exampleHy, { esClass: "text-base font-medium text-orange-900" })}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Estructura de la narración</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${narrativo.estructura
              .map(
                (st) => `
              <div class="p-5 rounded-xl bg-amber-50/50 border border-amber-200">
                <div class="text-xs font-mono font-bold text-orange-700 mb-1">0${st.step}</div>
                <div class="mb-2">
                  ${esPhrase(`nar_est_h_${st.step}`, st.nameEs, st.nameHy, { esClass: "text-lg font-bold text-stone-900" })}
                </div>
                ${esPhrase(`nar_est_${st.step}`, st.descEs, st.descHy, { esClass: "text-base text-stone-700" })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Subgéneros narrativos</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${narrativo.subgeneros
              .map(
                (sub) => `
              <div class="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div>
                  ${esPhrase(`nar_sub_h_${sub.num}`, `${sub.num}. ${sub.nameEs}`, sub.nameHy, {
                    esClass: "text-lg font-bold text-stone-900"
                  })}
                </div>
                ${esPhrase(`nar_sub_${sub.num}`, sub.descEs, sub.descHy, { esClass: "text-base text-stone-700" })}
              </div>
            `
              )
              .join("")}
          </div>
          <div class="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-200">
            ${esPhrase("nar_nota", narrativo.notaEs, narrativo.notaHy, { esClass: "text-base font-medium text-orange-950" })}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("lir_h", lirico.headingEs, lirico.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        ${esPhrase("lir_def", lirico.defEs, lirico.defHy, { esClass: "text-lg text-stone-800" })}

        <div class="p-5 rounded-xl bg-amber-50/70 border border-amber-200">
          <div class="text-xs font-bold text-orange-800 mb-2">Ejemplo</div>
          ${esPhrase("lir_ex", lirico.example.es, lirico.example.hy, { esClass: "text-lg font-semibold text-orange-900 italic" })}
        </div>

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Elementos de la poesía</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${lirico.elementos
              .map(
                (el, idx) => `
              <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                ${esPhrase(`lir_el_${idx}`, el.es, el.hy, { esClass: "text-base font-bold text-stone-900" })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Tipos de rima</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${lirico.rimas
              .map(
                (r, idx) => `
              <div class="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
                <div>
                  ${esPhrase(`rima_h_${idx}`, r.nameEs, r.nameHy, { esClass: "text-lg font-bold text-stone-900" })}
                </div>
                ${esPhrase(`rima_desc_${idx}`, r.descEs, r.descHy, { esClass: "text-base text-stone-700" })}
                <div class="pt-2 border-t border-amber-200/80 space-y-1.5">
                  ${r.examples
                    .map((ex, eIdx) =>
                      esPhrase(`rima_ex_${idx}_${eIdx}`, ex.es, ex.hy, {
                        esClass: "text-base font-mono font-semibold text-orange-900"
                      })
                    )
                    .join("")}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Subgéneros líricos</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${lirico.subgeneros
              .map(
                (sub) => `
              <div class="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div>
                  ${esPhrase(`lir_sub_h_${sub.num}`, `${sub.num}. ${sub.nameEs}`, sub.nameHy, {
                    esClass: "text-lg font-bold text-stone-900"
                  })}
                </div>
                ${esPhrase(`lir_sub_${sub.num}`, sub.descEs, sub.descHy, { esClass: "text-base text-stone-700" })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("dram_h", dramatico.headingEs, dramatico.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        ${esPhrase("dram_def", dramatico.defEs, dramatico.defHy, { esClass: "text-lg text-stone-800" })}

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Características</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${dramatico.caracteristicas
              .map(
                (c, idx) => `
              <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                ${esPhrase(`dram_car_${idx}`, c.es, c.hy, { esClass: "text-base font-medium text-stone-900" })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-stone-900 mb-3">Subgéneros dramáticos</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${dramatico.subgeneros
              .map(
                (sub) => `
              <div class="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div>
                  ${esPhrase(`dram_sub_h_${sub.num}`, `${sub.num}. ${sub.nameEs}`, sub.nameHy, {
                    esClass: "text-lg font-bold text-stone-900"
                  })}
                </div>
                ${esPhrase(`dram_sub_${sub.num}`, sub.descEs, sub.descHy, { esClass: "text-base text-stone-700" })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-4">
          <h3 class="text-lg font-bold text-stone-900">
            ${esPhrase("teatro_h", dramatico.ejemploTeatro.titleEs, dramatico.ejemploTeatro.titleHy, {
              esClass: "text-lg font-bold text-stone-900"
            })}
          </h3>
          <div class="space-y-2.5 font-mono text-base">
            ${dramatico.ejemploTeatro.lines
              .map((line, idx) =>
                esPhrase(`teatro_l_${idx}`, line.es, line.hy, {
                  esClass:
                    line.role === "acotacion"
                      ? "text-orange-800 italic text-base"
                      : line.role === "escena"
                      ? "font-bold text-stone-900 text-base"
                      : "text-stone-800 text-base"
                })
              )
              .join("")}
          </div>
          <div class="pt-3 border-t border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${dramatico.ejemploTeatro.breakdown
              .map((b, idx) =>
                esPhrase(`teatro_b_${idx}`, b.es, b.hy, { esClass: "text-sm font-semibold text-stone-800" })
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPart3() {
  const { importanceHy, whatIs, caracteristicas, poemExample, sinalefa, reglasMetricas } = PART3_DATA;

  return `
    <div class="space-y-8">
      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-5">
        <div class="pb-4 border-b border-amber-200/80">
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            ${esPhrase("rom_what_h", whatIs.headingEs, whatIs.headingHy, {
              esClass: "font-display text-2xl sm:text-3xl font-bold text-stone-900"
            })}
          </h2>
        </div>

        <p class="text-base font-medium text-orange-950 bg-amber-100/70 border border-amber-300 rounded-xl px-4 py-3">
          ${esc(importanceHy)}
        </p>

        <div class="space-y-3">
          ${whatIs.paragraphs
            .map((p, i) => esPhrase(`rom_what_${i}`, p.es, p.hy, { esClass: "text-lg text-stone-800" }))
            .join("")}
        </div>

        <div class="pt-2">
          <h3 class="text-lg font-bold text-stone-900 mb-3">Características principales</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${caracteristicas
              .map(
                (c, i) => `
              <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                ${esPhrase(`rom_car_${i}`, c.es, c.hy, { esClass: "text-base font-bold text-stone-900" })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/80">
          <div>
            <h3 class="font-display text-2xl font-bold text-stone-900">
              ${esPhrase("rom_ex_h", poemExample.titleEs, poemExample.titleHy, {
                esClass: "font-display text-2xl font-bold text-stone-900"
              })}
            </h3>
          </div>
          <button
            type="button"
            data-toggle-sinalefa="true"
            class="px-4 py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
              state.showSinalefaDetails
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-stone-700 border-amber-300 hover:bg-amber-50"
            }"
          >
            ${state.showSinalefaDetails ? "Թաքցնել վանկերի բաժանումը" : "Ցույց տալ վանկերը և հանգը"}
          </button>
        </div>

        <div class="space-y-3">
          ${poemExample.verses
            .map(
              (v) => `
            <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div class="text-xs font-mono font-bold text-orange-700 mb-1">Verso ${v.num}</div>
                ${esPhrase(`rom_v_${v.num}`, v.es, v.hy, { esClass: "text-xl font-semibold text-stone-900" })}
                ${
                  state.showSinalefaDetails
                    ? `<div class="mt-2 font-mono text-sm text-stone-600">${esc(v.syllables)}${
                        v.sinalefaNote ? ` · <span class="text-orange-800 font-semibold">${esc(v.sinalefaNote)}</span>` : ""
                      }</div>`
                    : ""
                }
              </div>
              <div class="font-mono text-sm tabular-nums shrink-0 ${
                v.type === "par" ? "text-emerald-800 font-bold" : "text-stone-600"
              }">
                ${v.count} sílabas · ${esc(v.rhyme)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          ${esPhrase("rom_scheme", poemExample.schemeEs, `${poemExample.schemeHy}\n\n${poemExample.correctionNoteHy}`, {
            esClass: "text-base font-medium text-stone-900"
          })}
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
        <div class="pb-4 border-b border-amber-200/80">
          <h3 class="font-display text-2xl font-bold text-stone-900">
            ${esPhrase("sin_h", sinalefa.headingEs, sinalefa.headingHy, {
              esClass: "font-display text-2xl font-bold text-stone-900"
            })}
          </h3>
        </div>

        ${esPhrase("sin_def", sinalefa.defEs, sinalefa.defHy, { esClass: "text-lg text-stone-800" })}

        <div class="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
          ${esPhrase("sin_ex", sinalefa.exampleEs, `${sinalefa.exampleHy}\n${sinalefa.exampleBreakdownHy}`, {
            esClass: "text-xl font-bold text-orange-900"
          })}
          <div class="font-mono text-base text-stone-800 pt-1">
            La <span class="px-2 py-0.5 rounded bg-amber-200 text-stone-950 font-semibold">luna‿ilumina</span>‿<span class="px-2 py-0.5 rounded bg-amber-200 text-stone-950 font-semibold">el</span> mar.
          </div>
        </div>

        <div class="pt-4 border-t border-amber-200">
          <h3 class="text-xl font-bold text-stone-900 mb-3">
            ${esPhrase("reg_m_h", reglasMetricas.headingEs, `${reglasMetricas.headingHy} — ${reglasMetricas.introHy}`, {
              esClass: "text-xl font-bold text-stone-900"
            })}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${reglasMetricas.rules
              .map(
                (r, idx) => `
              <div class="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
                <div class="flex items-baseline justify-between gap-2">
                  <span class="text-lg font-bold text-stone-900">${esc(r.wordEs)}</span>
                  <span class="font-mono text-sm font-bold text-orange-700">${esc(r.ruleEs)}</span>
                </div>
                <div>
                  ${esPhrase(`reg_rule_${idx}`, r.ruleEs, `${r.wordHy} · ${r.ruleHy}`, {
                    esClass: "text-sm font-semibold text-stone-700"
                  })}
                </div>
                <div class="pt-2 border-t border-amber-200">
                  ${esPhrase(`reg_m_${idx}`, r.exampleEs, r.exampleHy, {
                    esClass: "text-base font-semibold text-orange-900"
                  })}
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-200">
            ${esPhrase("rom_atencion", reglasMetricas.atencionEs, reglasMetricas.atencionHy, {
              esClass: "text-base font-medium text-orange-950"
            })}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPart4() {
  return `
    <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200">
        <div>
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">PARTE 4. Diferencias importantes</h2>
          <p class="text-sm text-stone-600 mt-1">Սեղմիր իսպաներեն հարցի վրա՝ թարգմանության համար։ Պատասխանները բացվում են առանձին։</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-toggle-all-diff="true"
            class="px-4 py-2 text-sm font-semibold rounded-lg border border-amber-300 bg-amber-50 text-stone-800 hover:bg-amber-100 cursor-pointer"
          >
            ${state.revealedDiff.size === PART4_DIFERENCIAS.length ? "Թաքցնել պատասխանները" : "Բացել բոլոր պատասխանները"}
          </button>
        </div>
      </div>

      <div class="divide-y divide-amber-100">
        ${PART4_DIFERENCIAS.map((item) => {
          const revealed = state.revealedDiff.has(item.id);
          return `
            <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex-1">
                <span class="text-sm font-mono font-bold text-orange-700 mr-2 tabular-nums">${String(item.id).padStart(2, "0")}.</span>
                ${esPhrase(`diff_q_${item.id}`, item.qEs, item.qHy, {
                  inline: true,
                  esClass: "text-lg font-medium text-stone-900"
                })}
              </div>
              <div class="shrink-0 flex items-center gap-3">
                ${
                  revealed
                    ? `<div class="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-base text-emerald-950">
                        ${esPhrase(`diff_a_${item.id}`, item.aEs, item.aHy, {
                          inline: true,
                          esClass: "font-bold text-emerald-950 text-base"
                        })}
                      </div>`
                    : ""
                }
                <button
                  type="button"
                  data-toggle-diff="${item.id}"
                  class="px-3.5 py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                    revealed
                      ? "bg-stone-100 text-stone-700 border-stone-300"
                      : "bg-amber-100 text-orange-900 border-amber-300 hover:bg-amber-200"
                  }"
                >
                  ${revealed ? "Թաքցնել" : "Ver respuesta"}
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderTheoryView() {
  let content = "";
  if (state.theoryPart === "parte1") content = renderPart1();
  else if (state.theoryPart === "parte2") content = renderPart2();
  else if (state.theoryPart === "parte3") content = renderPart3();
  else if (state.theoryPart === "parte4") content = renderPart4();

  return `
    <div class="space-y-6">
      ${renderTheorySubNav()}
      ${content}
    </div>
  `;
}

function renderQuiz25View() {
  const total = PART5_EXAMEN_25.length;
  const answeredCount = Object.keys(state.quizAnswers).length;
  const current = PART5_EXAMEN_25[state.quizIndex];

  const subToggle = `
    <div class="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-amber-200 p-5 sm:p-6">
      <div>
        <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">PARTE 5. Examen de práctica · 25 հարց</h2>
        <p class="text-sm sm:text-base text-stone-600 mt-1">Սեղմիր իսպաներեն հարցի կամ տարբերակի վրա՝ հայերեն թարգմանությունը բացելու համար։ Պատասխանները ստուգվում են առանձին։</p>
      </div>
      <div class="flex items-center gap-1 p-1 bg-amber-100/80 rounded-xl border border-amber-200 shrink-0">
        <button
          type="button"
          data-quiz-submode="questions"
          class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            state.quizSubMode === "questions" ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900"
          }"
        >
          Հարցեր (${answeredCount}/${total})
        </button>
        <button
          type="button"
          data-quiz-submode="answers"
          class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            state.quizSubMode === "answers" ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900"
          }"
        >
          Պատասխաններ և արդյունք
        </button>
      </div>
    </div>
  `;

  if (state.quizSubMode === "answers") {
    let score = 0;
    PART5_EXAMEN_25.forEach((q) => {
      if (state.quizAnswers[q.num] === q.correct) score++;
    });

    return `
      <div class="space-y-6">
        ${subToggle}
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="text-sm font-bold text-orange-800">Արդյունք · Resultado</div>
            <div class="font-display text-3xl font-bold text-stone-900 tabular-nums mt-1">
              ${score} / ${total} ճիշտ պատասխան (${Math.round((score / total) * 100)}%)
            </div>
            <p class="text-base text-stone-600 mt-1">Նշված հարցեր՝ ${answeredCount} / ${total}</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              data-quiz-reset="true"
              class="px-4 py-2.5 text-sm font-semibold rounded-lg border border-amber-300 bg-amber-50 text-stone-800 hover:bg-amber-100 cursor-pointer"
            >
              Սկսել նորից
            </button>
            <button
              type="button"
              data-quiz-submode="questions"
              class="px-4 py-2.5 text-sm font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
            >
              Վերադառնալ հարցերին
            </button>
          </div>
        </div>

        <div class="space-y-4">
          ${PART5_EXAMEN_25.map((q) => {
            const userPick = state.quizAnswers[q.num];
            const isCorrect = userPick === q.correct;
            const correctOpt = q.options.find((o) => o.key === q.correct);
            return `
              <div class="bg-white rounded-xl border border-amber-200 p-5 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-mono text-sm font-bold text-orange-700">Pregunta ${q.num}</span>
                  ${
                    userPick
                      ? isCorrect
                        ? `<span class="text-sm font-bold text-emerald-700">✓ Ճիշտ է (${userPick})</span>`
                        : `<span class="text-sm font-bold text-red-700">✕ Սխալ է (Քո ընտրությունը՝ ${userPick}, ճիշտը՝ ${q.correct})</span>`
                      : `<span class="text-sm font-medium text-stone-500">Պատասխանված չէ · Ճիշտը՝ ${q.correct}</span>`
                  }
                </div>
                <div>${esPhrase(`q25_ans_q_${q.num}`, q.qEs, q.qHy, { esClass: "font-semibold text-stone-900 text-lg" })}</div>
                <div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-base">
                  <span class="font-bold text-emerald-950 mr-1.5">${correctOpt.key}.</span>
                  ${esPhrase(`q25_ans_o_${q.num}`, correctOpt.es, `${correctOpt.hy}\n${q.expHy}`, {
                    inline: true,
                    esClass: "font-semibold text-emerald-950 text-base"
                  })}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  const selected = state.quizAnswers[current.num];

  return `
    <div class="space-y-6">
      ${subToggle}

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8 bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
          <div class="flex items-center justify-between border-b border-amber-200 pb-4">
            <span class="font-mono text-base font-bold text-orange-800 tabular-nums">
              Pregunta ${current.num} de ${total}
            </span>
            <span class="font-mono text-sm text-stone-600 tabular-nums">
              ${answeredCount} respondidas
            </span>
          </div>

          <div class="text-xl sm:text-2xl font-bold text-stone-900">
            ${esPhrase(`q25_q_${current.num}`, current.qEs, current.qHy, {
              esClass: "text-xl sm:text-2xl font-bold text-stone-900"
            })}
          </div>

          <div class="space-y-3">
            ${current.options
              .map((opt) => {
                const isSelected = selected === opt.key;
                const optHyOpen = isTranslationOpen(`q25_opt_${current.num}_${opt.key}`);
                return `
                  <div
                    class="rounded-xl border transition-colors ${
                      isSelected
                        ? "border-orange-600 bg-orange-50/80"
                        : "border-amber-200 bg-white hover:border-amber-400"
                    }"
                  >
                    <div class="flex items-start justify-between gap-3 p-4">
                      <button
                        type="button"
                        data-quiz-pick="${current.num}:${opt.key}"
                        class="flex-1 text-left flex items-start gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-orange-600 rounded"
                      >
                        <span class="w-8 h-8 shrink-0 rounded-lg font-mono text-sm font-bold flex items-center justify-center border ${
                          isSelected
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-amber-100 text-stone-800 border-amber-200"
                        }">${opt.key}</span>
                        <span class="text-base sm:text-lg font-medium text-stone-900 pt-0.5">${esc(opt.es)}</span>
                      </button>
                      <button
                        type="button"
                        data-es-toggle="q25_opt_${current.num}_${opt.key}"
                        aria-expanded="${optHyOpen ? "true" : "false"}"
                        class="px-3 py-1.5 text-xs font-bold text-orange-800 bg-amber-100/70 hover:bg-amber-200 rounded-lg shrink-0 cursor-pointer"
                      >
                        [Հայ]
                      </button>
                    </div>
                    <div
                      data-hy-box="q25_opt_${current.num}_${opt.key}"
                      class="${optHyOpen ? "block" : "hidden"} mx-4 mb-3.5 px-3.5 py-2.5 rounded-lg bg-amber-100 border border-amber-300 text-base text-amber-950"
                    >
                      ${esc(opt.hy)}
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-amber-200">
            <button
              type="button"
              data-quiz-nav="prev"
              ${state.quizIndex === 0 ? "disabled" : ""}
              class="px-5 py-2.5 text-base font-semibold rounded-lg border border-amber-300 bg-white text-stone-800 hover:bg-amber-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <div class="flex items-center gap-2">
              ${
                state.quizIndex < total - 1
                  ? `<button
                      type="button"
                      data-quiz-nav="next"
                      class="px-5 py-2.5 text-base font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
                    >
                      Siguiente
                    </button>`
                  : `<button
                      type="button"
                      data-quiz-submode="answers"
                      class="px-5 py-2.5 text-base font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
                    >
                      Ստուգել պատասխանները
                    </button>`
              }
            </div>
          </div>
        </div>

        <aside class="lg:col-span-4 bg-white rounded-2xl border border-amber-200 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-stone-900">Հարցերի ցանկ (1–25)</h3>
            <span class="font-mono text-sm text-stone-600 tabular-nums">${answeredCount}/${total}</span>
          </div>
          <div class="grid grid-cols-5 gap-2">
            ${PART5_EXAMEN_25.map((q, idx) => {
              const isCurrent = idx === state.quizIndex;
              const isAnswered = Boolean(state.quizAnswers[q.num]);
              return `
                <button
                  type="button"
                  data-quiz-jump="${idx}"
                  class="h-11 rounded-lg font-mono text-sm font-bold tabular-nums transition-colors cursor-pointer border ${
                    isCurrent
                      ? "bg-orange-600 text-white border-orange-600"
                      : isAnswered
                      ? "bg-amber-100 text-orange-950 border-amber-300"
                      : "bg-amber-50/40 text-stone-700 border-amber-200 hover:bg-amber-100"
                  }"
                >
                  ${q.num}
                </button>
              `;
            }).join("")}
          </div>
          <button
            type="button"
            data-quiz-submode="answers"
            class="w-full py-3 px-4 text-sm font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Տեսնել պատասխանները առանձին
          </button>
        </aside>
      </div>
    </div>
  `;
}

function renderOpenAndBosqueView() {
  const headerBar = `
    <div class="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-amber-200 p-5 sm:p-6">
      <div>
        <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">PARTE 6 & 7 · Բաց հարցեր և Տեքստի վերլուծություն</h2>
        <p class="text-sm sm:text-base text-stone-600 mt-1">Սեղմիր իսպաներեն հարցերի և տեքստի վրա՝ թարգմանության համար։ Պատասխանները առանձին են։</p>
      </div>
      <div class="flex items-center gap-1 p-1 bg-amber-100/80 rounded-xl border border-amber-200 shrink-0">
        <button
          type="button"
          data-open-submode="questions"
          class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            state.openSubMode === "questions" ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900"
          }"
        >
          Հարցեր · Preguntas
        </button>
        <button
          type="button"
          data-open-submode="answers"
          class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            state.openSubMode === "answers" ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900"
          }"
        >
          Պատասխաններ · Respuestas
        </button>
      </div>
    </div>
  `;

  if (state.openSubMode === "answers") {
    return `
      <div class="space-y-6">
        ${headerBar}

        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-5">
          <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">
            PARTE 6 · Respuestas (1–10)
          </h3>
          <div class="space-y-4">
            ${PART6_ABIERTAS.map(
              (item) => `
              <div class="p-5 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2.5">
                <div class="text-xs font-mono font-bold text-orange-700">Pregunta ${item.num}</div>
                <div>${esPhrase(`p6_ans_q_${item.num}`, item.qEs, item.qHy, { esClass: "font-semibold text-stone-900 text-base sm:text-lg" })}</div>
                <div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300">
                  ${esPhrase(`p6_ans_${item.num}`, item.aEs, item.aHy, { esClass: "text-base font-medium text-emerald-950" })}
                </div>
              </div>
            `
            ).join("")}
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-5">
          <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">
            PARTE 7 · El bosque misterioso — Respuestas (1–7)
          </h3>
          <div class="space-y-3">
            ${PART7_BOSQUE.questions
              .map(
                (q) => `
              <div class="p-5 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2.5">
                <div>${esPhrase(`p7_ans_q_${q.num}`, `${q.num}. ${q.qEs}`, q.qHy, { esClass: "text-base sm:text-lg font-semibold text-stone-900" })}</div>
                <div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300">
                  ${esPhrase(`p7_ans_${q.num}`, q.aEs, q.aHy, { esClass: "text-base font-medium text-emerald-950" })}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-8">
      ${headerBar}

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
        <div class="border-b border-amber-200 pb-4">
          <h3 class="font-display text-2xl font-bold text-stone-900">PARTE 6. Preguntas abiertas</h3>
          <p class="text-base text-stone-600 mt-1">Այս հարցերը նման են այն հարցերին, որտեղ պետք է ոչ թե տարբերակ ընտրել, այլ ինքնուրույն բացատրել։</p>
        </div>

        <div class="space-y-4">
          ${PART6_ABIERTAS.map(
            (item) => `
            <div class="p-5 rounded-xl bg-amber-50/40 border border-amber-200 space-y-3">
              <div class="flex items-start gap-2.5">
                <span class="font-mono text-sm font-bold text-orange-700 pt-1 tabular-nums">${String(item.num).padStart(2, "0")}.</span>
                <div class="flex-1">
                  ${esPhrase(`p6_q_${item.num}`, item.qEs, item.qHy, { esClass: "font-semibold text-stone-900 text-lg" })}
                </div>
              </div>
              <textarea
                rows="2"
                data-open-note="p6_${item.num}"
                placeholder="Գրիր քո պատասխանը այստեղ ինքնաստուգման համար..."
                class="w-full px-4 py-2.5 text-base bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >${esc(state.openNotes[`p6_${item.num}`] || "")}</textarea>
            </div>
          `
          ).join("")}
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
        <div class="border-b border-amber-200 pb-4">
          <h3 class="font-display text-2xl font-bold text-stone-900">PARTE 7. Ejercicio de análisis</h3>
          <p class="text-base text-stone-600 mt-1">Կարդա տեքստը իսպաներենով (սեղմիր՝ հայերեն թարգմանության համար) և փորձիր ճանաչել արտահայտչամիջոցներն ու ժանրը։</p>
        </div>

        <div class="p-5 sm:p-6 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
          <h4 class="font-display text-xl font-bold text-stone-900">
            ${esPhrase("bosque_title", PART7_BOSQUE.titleEs, PART7_BOSQUE.titleHy, {
              esClass: "font-display text-xl font-bold text-stone-900"
            })}
          </h4>
          ${esPhrase("bosque_text", PART7_BOSQUE.textEs, PART7_BOSQUE.textHy, {
            esClass: "text-lg text-stone-800 leading-relaxed"
          })}
        </div>

        <div class="space-y-3">
          ${PART7_BOSQUE.questions
            .map((q) => {
              const rev = state.revealedBosque.has(q.num);
              return `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2.5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span class="font-mono text-sm font-bold text-orange-700 mr-1.5">${q.num}.</span>
                    ${esPhrase(`bosque_q_${q.num}`, q.qEs, q.qHy, {
                      inline: true,
                      esClass: "font-semibold text-stone-900 text-lg"
                    })}
                  </div>
                  <button
                    type="button"
                    data-toggle-bosque="${q.num}"
                    class="px-3.5 py-2 text-sm font-semibold rounded-lg border shrink-0 cursor-pointer ${
                      rev
                        ? "bg-stone-100 text-stone-700 border-stone-300"
                        : "bg-amber-100 text-orange-900 border-amber-300 hover:bg-amber-200"
                    }"
                  >
                    ${rev ? "Թաքցնել" : "Ver respuesta"}
                  </button>
                </div>
                ${
                  rev
                    ? `<div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300">
                        ${esPhrase(`bosque_a_${q.num}`, q.aEs, q.aHy, { esClass: "text-base font-medium text-emerald-950" })}
                      </div>`
                    : ""
                }
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function renderExam80View() {
  const partTabs = [
    { id: "p1", label: "Մաս 1 · Միջոցներ (1–20)" },
    { id: "p2", label: "Մաս 2 · Ուղիղ/Փոխ. (21–30)" },
    { id: "p3", label: "Մաս 3 · Ժանրեր (31–45)" },
    { id: "p4", label: "Մաս 4 · Ճիշտ/Սխալ (46–60)" },
    { id: "p5", label: "Մաս 5 · Տեքստեր (61–80)" }
  ];

  const headerBar = `
    <div class="bg-white rounded-2xl border border-amber-200 p-6 space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">${esc(EXAMEN_80.titleEs)}</h2>
          <p class="text-base text-stone-600">${esc(EXAMEN_80.subtitleEs)}</p>
        </div>
        <div class="flex items-center gap-1 p-1 bg-amber-100/80 rounded-xl border border-amber-200 w-fit shrink-0">
          <button
            type="button"
            data-exam80-submode="questions"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              state.exam80SubMode === "questions" ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900"
            }"
          >
            Հարցեր · Preguntas
          </button>
          <button
            type="button"
            data-exam80-submode="answers"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              state.exam80SubMode === "answers" ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900"
            }"
          >
            Պատասխաններ · Respuestas
          </button>
        </div>
      </div>

      <p class="text-base text-stone-700">${esc(EXAMEN_80.introHy)}</p>

      <div class="flex flex-wrap items-center gap-1.5 p-1.5 bg-amber-100/70 rounded-xl border border-amber-200 w-fit max-w-full">
        ${partTabs
          .map(
            (t) => `
          <button
            type="button"
            data-exam80-part="${t.id}"
            class="px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              state.exam80Part === t.id ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900 hover:bg-amber-50"
            }"
          >
            ${esc(t.label)}
          </button>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  let body = "";

  if (state.exam80SubMode === "answers") {
    body = renderExam80AnswersForPart(state.exam80Part);
  } else {
    if (state.exam80Part === "p1") {
      const p1 = EXAMEN_80.parte1;
      body = `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
          <div class="border-b border-amber-200 pb-4">
            <h3 class="font-display text-2xl font-bold text-stone-900">
              ${esPhrase("e80_p1_h", p1.titleEs, p1.titleHy, { esClass: "font-display text-2xl font-bold text-stone-900" })}
            </h3>
            <div class="mt-2">
              ${esPhrase("e80_p1_inst", p1.instEs, p1.instHy, { esClass: "text-base text-stone-700 font-medium" })}
            </div>
          </div>
          <div class="space-y-3">
            ${p1.items
              .map((item) => {
                const rev = state.revealedExam80.has(item.num);
                return `
                <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2.5">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex-1">
                      <span class="font-mono text-sm font-bold text-orange-700 mr-2 tabular-nums">${item.num}.</span>
                      ${esPhrase(`e80_1_${item.num}`, item.es, item.hy, {
                        inline: true,
                        esClass: "font-medium text-stone-900 text-lg"
                      })}
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        data-exam80-input="${item.num}"
                        value="${esc(state.exam80UserAnswers[item.num] || "")}"
                        placeholder="Քո պատասխանը..."
                        class="w-44 px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        data-toggle-e80="${item.num}"
                        class="px-3.5 py-2 text-sm font-semibold rounded-lg border cursor-pointer ${
                          rev
                            ? "bg-stone-100 text-stone-700 border-stone-300"
                            : "bg-amber-100 text-orange-900 border-amber-300 hover:bg-amber-200"
                        }"
                      >
                        ${rev ? "Թաքցնել" : "Ver respuesta"}
                      </button>
                    </div>
                  </div>
                  ${
                    rev
                      ? `<div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-base">
                          ${esPhrase(`e80_1_rev_${item.num}`, item.ansEs, `${item.ansHy} — ${item.expHy}`, {
                            esClass: "font-bold text-emerald-950 text-base"
                          })}
                        </div>`
                      : ""
                  }
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      `;
    } else if (state.exam80Part === "p2") {
      const p2 = EXAMEN_80.parte2;
      body = `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
          <div class="border-b border-amber-200 pb-4">
            <h3 class="font-display text-2xl font-bold text-stone-900">
              ${esPhrase("e80_p2_h", p2.titleEs, p2.titleHy, { esClass: "font-display text-2xl font-bold text-stone-900" })}
            </h3>
            <div class="mt-2">
              ${esPhrase("e80_p2_inst", p2.instEs, p2.instHy, { esClass: "text-base text-stone-700 font-medium" })}
            </div>
          </div>
          <div class="space-y-3">
            ${p2.items
              .map((item) => {
                const picked = state.exam80UserAnswers[item.num];
                return `
                <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span class="font-mono text-sm font-bold text-orange-700 mr-2 tabular-nums">${item.num}.</span>
                    ${esPhrase(`e80_2_${item.num}`, item.es, item.hy, {
                      inline: true,
                      esClass: "font-medium text-stone-900 text-lg"
                    })}
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    ${["Literal", "Figurado"]
                      .map(
                        (opt) => `
                      <button
                        type="button"
                        data-exam80-choice="${item.num}:${opt}"
                        class="px-3.5 py-2 text-sm font-semibold rounded-lg border cursor-pointer transition-colors ${
                          picked === opt
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-white text-stone-800 border-amber-300 hover:bg-amber-100"
                        }"
                      >
                        ${opt}
                      </button>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      `;
    } else if (state.exam80Part === "p3") {
      const p3 = EXAMEN_80.parte3;
      body = `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
          <div class="border-b border-amber-200 pb-4">
            <h3 class="font-display text-2xl font-bold text-stone-900">
              ${esPhrase("e80_p3_h", p3.titleEs, p3.titleHy, { esClass: "font-display text-2xl font-bold text-stone-900" })}
            </h3>
            <div class="mt-2">
              ${esPhrase("e80_p3_inst", p3.instEs, p3.instHy, { esClass: "text-base text-stone-700 font-medium" })}
            </div>
          </div>
          <div class="space-y-3">
            ${p3.items
              .map(
                (item) => `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex-1">
                  <span class="font-mono text-sm font-bold text-orange-700 mr-2 tabular-nums">${item.num}.</span>
                  ${esPhrase(`e80_3_${item.num}`, item.es, item.hy, {
                    inline: true,
                    esClass: "font-medium text-stone-900 text-lg"
                  })}
                </div>
                <input
                  type="text"
                  data-exam80-input="${item.num}"
                  value="${esc(state.exam80UserAnswers[item.num] || "")}"
                  placeholder="Ժանր / ենթաժանր..."
                  class="w-full sm:w-52 px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 shrink-0"
                />
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    } else if (state.exam80Part === "p4") {
      const p4 = EXAMEN_80.parte4;
      body = `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-6">
          <div class="border-b border-amber-200 pb-4">
            <h3 class="font-display text-2xl font-bold text-stone-900">
              ${esPhrase("e80_p4_h", p4.titleEs, p4.titleHy, { esClass: "font-display text-2xl font-bold text-stone-900" })}
            </h3>
            <div class="mt-2">
              ${esPhrase("e80_p4_inst", p4.instEs, p4.instHy, { esClass: "text-base text-stone-700 font-medium" })}
            </div>
          </div>
          <div class="space-y-3">
            ${p4.items
              .map((item) => {
                const picked = state.exam80UserAnswers[item.num];
                return `
                <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex-1">
                    <span class="font-mono text-sm font-bold text-orange-700 mr-2 tabular-nums">${item.num}.</span>
                    ${esPhrase(`e80_4_${item.num}`, item.es, item.hy, {
                      inline: true,
                      esClass: "font-medium text-stone-900 text-lg"
                    })}
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    ${["Verdadero", "Falso"]
                      .map(
                        (opt) => `
                      <button
                        type="button"
                        data-exam80-choice="${item.num}:${opt}"
                        class="px-3.5 py-2 text-sm font-semibold rounded-lg border cursor-pointer transition-colors ${
                          picked === opt
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-white text-stone-800 border-amber-300 hover:bg-amber-100"
                        }"
                      >
                        ${opt}
                      </button>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      `;
    } else if (state.exam80Part === "p5") {
      const p5 = EXAMEN_80.parte5;
      body = `
        <div class="space-y-6">
          ${p5.textos
            .map(
              (texto) => `
            <article class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-5">
              <div class="pb-3 border-b border-amber-200">
                <h3 class="font-display text-2xl font-bold text-stone-900">
                  ${esPhrase(`t_h_${texto.id}`, texto.titleEs, texto.titleHy, {
                    esClass: "font-display text-2xl font-bold text-stone-900"
                  })}
                </h3>
              </div>

              <div class="p-5 sm:p-6 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                ${
                  texto.isPoem
                    ? texto.verses
                        .map((v, vIdx) =>
                          esPhrase(`${texto.id}_v_${vIdx}`, v.es, v.hy, {
                            esClass: "text-lg italic font-semibold text-stone-900"
                          })
                        )
                        .join("")
                    : texto.paragraphs
                        .map((p, pIdx) =>
                          esPhrase(`${texto.id}_p_${pIdx}`, p.es, p.hy, {
                            esClass: "text-lg text-stone-800 leading-relaxed"
                          })
                        )
                        .join("")
                }
              </div>

              <div class="space-y-3">
                <h4 class="text-base font-bold text-orange-900">Preguntas de análisis</h4>
                ${texto.questions
                  .map(
                    (q) => `
                  <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2.5">
                    <div>
                      <span class="font-mono text-sm font-bold text-orange-700 mr-2 tabular-nums">${q.num}.</span>
                      ${esPhrase(`e80_5_q_${q.num}`, q.qEs, q.qHy, {
                        inline: true,
                        esClass: "font-semibold text-stone-900 text-lg"
                      })}
                    </div>
                    <textarea
                      rows="2"
                      data-open-note="e80_${q.num}"
                      placeholder="Գրիր վերլուծությունդ այստեղ..."
                      class="w-full px-3.5 py-2.5 text-base bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >${esc(state.openNotes[`e80_${q.num}`] || "")}</textarea>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </article>
          `
            )
            .join("")}
        </div>
      `;
    }
  }

  return `
    <div class="space-y-6">
      ${headerBar}
      ${body}
      <div class="bg-white rounded-2xl border border-amber-200 p-6 space-y-3 text-base text-stone-800">
        <p>${esc(EXAMEN_80.finalAdvice.summaryHy)}</p>
        <p class="text-stone-600">${esc(EXAMEN_80.finalAdvice.formatHy)}</p>
      </div>
    </div>
  `;
}

function renderExam80AnswersForPart(partId) {
  if (partId === "p1") {
    return `
      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
        <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">
          Respuestas · Parte 1 (1–20) — Figuras literarias
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${EXAMEN_80.parte1.items
            .map((item) => {
              const userVal = state.exam80UserAnswers[item.num];
              return `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div class="text-sm font-medium text-stone-700">${item.num}. ${esPhrase(`e80_a1q_${item.num}`, item.es, item.hy, { inline: true, esClass: "text-sm font-medium text-stone-700" })}</div>
                <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-300">
                  ${esPhrase(`e80_a1_${item.num}`, item.ansEs, `${item.ansHy} — ${item.expHy}`, {
                    esClass: "text-base font-bold text-emerald-950"
                  })}
                </div>
                ${userVal ? `<div class="text-xs text-stone-600">Քո գրածը՝ ${esc(userVal)}</div>` : ""}
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }
  if (partId === "p2") {
    return `
      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
        <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">
          Respuestas · Parte 2 (21–30) — Literal o figurado
        </h3>
        <div class="space-y-3">
          ${EXAMEN_80.parte2.items
            .map((item) => {
              const userPick = state.exam80UserAnswers[item.num];
              const match = userPick === item.ans;
              return `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-base font-semibold text-stone-900">${item.num}. ${esPhrase(`e80_a2q_${item.num}`, item.es, item.hy, { inline: true, esClass: "text-base font-semibold text-stone-900" })}</div>
                  ${
                    userPick
                      ? `<span class="text-sm font-bold ${match ? "text-emerald-700" : "text-red-700"}">${
                          match ? "✓ Ճիշտ է" : `✕ Քոնը՝ ${userPick}`
                        }</span>`
                      : ""
                  }
                </div>
                <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-base">
                  <span class="font-bold text-emerald-950 mr-2">${esc(item.ans)}</span>
                  ${esPhrase(`e80_a2_${item.num}`, item.expEs, item.expHy, {
                    inline: true,
                    esClass: "text-emerald-950 text-base"
                  })}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }
  if (partId === "p3") {
    return `
      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
        <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">
          Respuestas · Parte 3 (31–45) — Géneros y subgéneros
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${EXAMEN_80.parte3.items
            .map((item) => {
              const userVal = state.exam80UserAnswers[item.num];
              return `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div class="text-sm text-stone-700">${item.num}. ${esPhrase(`e80_a3q_${item.num}`, item.es, item.hy, { inline: true, esClass: "text-sm text-stone-700" })}</div>
                <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-300">
                  ${esPhrase(`e80_a3_${item.num}`, item.ansEs, item.ansHy, {
                    esClass: "text-base font-bold text-emerald-950"
                  })}
                </div>
                ${userVal ? `<div class="text-xs text-stone-600">Քո գրածը՝ ${esc(userVal)}</div>` : ""}
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }
  if (partId === "p4") {
    return `
      <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
        <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">
          Respuestas · Parte 4 (46–60) — Verdadero o falso
        </h3>
        <div class="space-y-3">
          ${EXAMEN_80.parte4.items
            .map((item) => {
              const userPick = state.exam80UserAnswers[item.num];
              const match = userPick === item.ans;
              return `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-base font-medium text-stone-900">${item.num}. ${esPhrase(`e80_a4q_${item.num}`, item.es, item.hy, { inline: true, esClass: "text-base font-medium text-stone-900" })}</div>
                  ${
                    userPick
                      ? `<span class="text-sm font-bold ${match ? "text-emerald-700" : "text-red-700"}">${
                          match ? "✓ Ճիշտ է" : `✕ Քոնը՝ ${userPick}`
                        }</span>`
                      : ""
                  }
                </div>
                <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-base">
                  ${esPhrase(`e80_a4_${item.num}`, item.correctionEs, item.correctionHy, {
                    esClass: "font-bold text-emerald-950 text-base"
                  })}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-6">
      ${EXAMEN_80.parte5.textos
        .map(
          (texto) => `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
          <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">
            Respuestas · ${esc(texto.titleEs)}
          </h3>
          <div class="space-y-3">
            ${texto.questions
              .map(
                (q) => `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div class="text-base font-semibold text-stone-900">${q.num}. ${esPhrase(`e80_a5q_${q.num}`, q.qEs, q.qHy, { inline: true, esClass: "text-base font-semibold text-stone-900" })}</div>
                <div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300">
                  ${esPhrase(`e80_a5_${q.num}`, q.aEs, q.aHy, { esClass: "text-base font-medium text-emerald-950" })}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function renderAnswersHubView() {
  const filters = [
    { id: "all", label: "Բոլոր պատասխանները" },
    { id: "quiz25", label: "Թեստ (25)" },
    { id: "open", label: "Բաց հարցեր (1–10)" },
    { id: "bosque", label: "El bosque (1–7)" },
    { id: "exam80_1", label: "80 · Մաս 1 (1–20)" },
    { id: "exam80_2", label: "80 · Մաս 2 (21–30)" },
    { id: "exam80_3", label: "80 · Մաս 3 (31–45)" },
    { id: "exam80_4", label: "80 · Մաս 4 (46–60)" },
    { id: "exam80_5", label: "80 · Տեքստեր (61–80)" }
  ];

  const show = (sec) => state.answersSection === "all" || state.answersSection === sec;

  return `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl border border-amber-200 p-6 space-y-4">
        <div>
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900">Պատասխանների կենտրոն · Respuestas</h2>
          <p class="text-base text-stone-600 mt-1">Այստեղ առանձին հավաքված են բոլոր թեստերի, բաց հարցերի, տեքստերի և 80 վարժությունների պատասխանները։ Սեղմիր իսպաներենի վրա՝ հայերեն թարգմանությունը բացելու համար։</p>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 p-1.5 bg-amber-100/70 rounded-xl border border-amber-200">
          ${filters
            .map(
              (f) => `
            <button
              type="button"
              data-ans-filter="${f.id}"
              class="px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                state.answersSection === f.id ? "bg-orange-600 text-white shadow-sm" : "text-stone-700 hover:text-stone-900 hover:bg-amber-50"
              }"
            >
              ${esc(f.label)}
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      ${
        show("quiz25")
          ? `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
          <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">PARTE 5 · 25 հարցանոց թեստի պատասխաններ</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${PART5_EXAMEN_25.map((q) => {
              const opt = q.options.find((o) => o.key === q.correct);
              return `
                <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                  <div class="text-sm font-medium text-stone-700">${q.num}. ${esPhrase(`hub_q25q_${q.num}`, q.qEs, q.qHy, { inline: true, esClass: "text-sm font-medium text-stone-700" })}</div>
                  <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-base">
                    <span class="font-bold text-emerald-950 mr-1">${opt.key}.</span>
                    ${esPhrase(`hub_q25_${q.num}`, opt.es, `${opt.hy}\n${q.expHy}`, {
                      inline: true,
                      esClass: "font-bold text-emerald-950 text-base"
                    })}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `
          : ""
      }

      ${
        show("open")
          ? `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
          <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">PARTE 6 · Բաց հարցերի պատասխաններ (1–10)</h3>
          <div class="space-y-3">
            ${PART6_ABIERTAS.map(
              (item) => `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div class="text-base font-semibold text-stone-900">${item.num}. ${esPhrase(`hub_p6q_${item.num}`, item.qEs, item.qHy, { inline: true, esClass: "text-base font-semibold text-stone-900" })}</div>
                <div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300">
                  ${esPhrase(`hub_p6_${item.num}`, item.aEs, item.aHy, { esClass: "text-base font-medium text-emerald-950" })}
                </div>
              </div>
            `
            ).join("")}
          </div>
        </div>
      `
          : ""
      }

      ${
        show("bosque")
          ? `
        <div class="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
          <h3 class="font-display text-2xl font-bold text-stone-900 border-b border-amber-200 pb-3">PARTE 7 · El bosque misterioso (1–7)</h3>
          <div class="space-y-3">
            ${PART7_BOSQUE.questions
              .map(
                (q) => `
              <div class="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div class="text-base font-semibold text-stone-900">${q.num}. ${esPhrase(`hub_p7q_${q.num}`, q.qEs, q.qHy, { inline: true, esClass: "text-base font-semibold text-stone-900" })}</div>
                <div class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300">
                  ${esPhrase(`hub_p7_${q.num}`, q.aEs, q.aHy, { esClass: "text-base font-medium text-emerald-950" })}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      ${show("exam80_1") ? renderExam80AnswersForPart("p1") : ""}
      ${show("exam80_2") ? renderExam80AnswersForPart("p2") : ""}
      ${show("exam80_3") ? renderExam80AnswersForPart("p3") : ""}
      ${show("exam80_4") ? renderExam80AnswersForPart("p4") : ""}
      ${show("exam80_5") ? renderExam80AnswersForPart("p5") : ""}
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="mt-12 border-t border-amber-200 bg-[#FFFDF7]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone-600">
        <span>Lengua Castellana y Literatura · 1.º de ESO · 7.º curso</span>
        <span>Փոխաբերական լեզու · Գրական ժանրեր · Ռոմանս · Քննական վարժություններ</span>
      </div>
    </footer>
  `;
}

function renderApp() {
  const root = document.getElementById("app");
  if (!root) return;

  let mainContent = "";
  if (state.view === "theory") mainContent = renderTheoryView();
  else if (state.view === "quiz25") mainContent = renderQuiz25View();
  else if (state.view === "open") mainContent = renderOpenAndBosqueView();
  else if (state.view === "exam80") mainContent = renderExam80View();
  else if (state.view === "answers") mainContent = renderAnswersHubView();

  root.innerHTML = `
    <div class="min-h-screen flex flex-col">
      ${renderTopBar()}
      ${renderHeroBanner()}
      <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        ${mainContent}
      </main>
      ${renderFooter()}
    </div>
  `;
}

function toggleSingleTranslation(id) {
  const shouldOpen = state.showAllTranslations
    ? false
    : !state.openTranslations.has(id);

  if (state.showAllTranslations) {
    state.showAllTranslations = false;
    document.querySelectorAll("[data-hy-box]").forEach((el) => {
      const boxId = el.getAttribute("data-hy-box");
      if (boxId && boxId !== id) {
        state.openTranslations.add(boxId);
      }
    });
    state.openTranslations.delete(id);
    renderApp();
    return;
  }

  if (shouldOpen) state.openTranslations.add(id);
  else state.openTranslations.delete(id);

  const btn = document.querySelector(`[data-es-toggle="${CSS.escape(id)}"]`);
  const box = document.querySelector(`[data-hy-box="${CSS.escape(id)}"]`);
  if (btn && box) {
    btn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    box.classList.toggle("hidden", !shouldOpen);
    box.classList.toggle("block", shouldOpen);
  } else {
    renderApp();
  }
}

function bindEvents() {
  const root = document.getElementById("app");
  if (!root) return;

  root.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const esBtn = target.closest("[data-es-toggle]");
    if (esBtn) {
      const id = esBtn.getAttribute("data-es-toggle");
      if (id) toggleSingleTranslation(id);
      return;
    }

    const navBtn = target.closest("[data-nav]");
    if (navBtn) {
      const nextView = navBtn.getAttribute("data-nav");
      if (nextView) {
        state.view = nextView;
        state.mobileMenuOpen = false;
        renderApp();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (target.closest("[data-toggle-mobile-menu]")) {
      state.mobileMenuOpen = !state.mobileMenuOpen;
      renderApp();
      return;
    }

    if (target.closest("[data-toggle-all-hy]")) {
      state.showAllTranslations = !state.showAllTranslations;
      if (!state.showAllTranslations) {
        state.openTranslations.clear();
      }
      renderApp();
      return;
    }

    const theoryBtn = target.closest("[data-theory-part]");
    if (theoryBtn) {
      state.theoryPart = theoryBtn.getAttribute("data-theory-part") || "parte1";
      renderApp();
      return;
    }

    const figFilter = target.closest("[data-figura-filter]");
    if (figFilter) {
      state.figuraFilter = figFilter.getAttribute("data-figura-filter") || "all";
      renderApp();
      return;
    }

    if (target.closest("[data-toggle-sinalefa]")) {
      state.showSinalefaDetails = !state.showSinalefaDetails;
      renderApp();
      return;
    }

    const diffBtn = target.closest("[data-toggle-diff]");
    if (diffBtn) {
      const id = Number(diffBtn.getAttribute("data-toggle-diff"));
      if (state.revealedDiff.has(id)) state.revealedDiff.delete(id);
      else state.revealedDiff.add(id);
      renderApp();
      return;
    }

    if (target.closest("[data-toggle-all-diff]")) {
      if (state.revealedDiff.size === PART4_DIFERENCIAS.length) {
        state.revealedDiff.clear();
      } else {
        PART4_DIFERENCIAS.forEach((d) => state.revealedDiff.add(d.id));
      }
      renderApp();
      return;
    }

    const quizSub = target.closest("[data-quiz-submode]");
    if (quizSub) {
      state.quizSubMode = quizSub.getAttribute("data-quiz-submode") || "questions";
      renderApp();
      return;
    }

    if (target.closest("[data-quiz-reset]")) {
      state.quizAnswers = {};
      state.quizIndex = 0;
      state.quizSubMode = "questions";
      saveState();
      renderApp();
      return;
    }

    const quizPick = target.closest("[data-quiz-pick]");
    if (quizPick) {
      const [numStr, key] = (quizPick.getAttribute("data-quiz-pick") || "").split(":");
      if (numStr && key) {
        state.quizAnswers[Number(numStr)] = key;
        saveState();
        renderApp();
      }
      return;
    }

    const quizNav = target.closest("[data-quiz-nav]");
    if (quizNav) {
      const dir = quizNav.getAttribute("data-quiz-nav");
      if (dir === "prev" && state.quizIndex > 0) state.quizIndex--;
      if (dir === "next" && state.quizIndex < PART5_EXAMEN_25.length - 1) state.quizIndex++;
      renderApp();
      return;
    }

    const quizJump = target.closest("[data-quiz-jump]");
    if (quizJump) {
      state.quizIndex = Number(quizJump.getAttribute("data-quiz-jump") || 0);
      renderApp();
      return;
    }

    const openSub = target.closest("[data-open-submode]");
    if (openSub) {
      state.openSubMode = openSub.getAttribute("data-open-submode") || "questions";
      renderApp();
      return;
    }

    const bosqueBtn = target.closest("[data-toggle-bosque]");
    if (bosqueBtn) {
      const num = Number(bosqueBtn.getAttribute("data-toggle-bosque"));
      if (state.revealedBosque.has(num)) state.revealedBosque.delete(num);
      else state.revealedBosque.add(num);
      renderApp();
      return;
    }

    const e80Sub = target.closest("[data-exam80-submode]");
    if (e80Sub) {
      state.exam80SubMode = e80Sub.getAttribute("data-exam80-submode") || "questions";
      renderApp();
      return;
    }

    const e80Part = target.closest("[data-exam80-part]");
    if (e80Part) {
      state.exam80Part = e80Part.getAttribute("data-exam80-part") || "p1";
      renderApp();
      return;
    }

    const e80Btn = target.closest("[data-toggle-e80]");
    if (e80Btn) {
      const num = Number(e80Btn.getAttribute("data-toggle-e80"));
      if (state.revealedExam80.has(num)) state.revealedExam80.delete(num);
      else state.revealedExam80.add(num);
      renderApp();
      return;
    }

    const e80Choice = target.closest("[data-exam80-choice]");
    if (e80Choice) {
      const [numStr, val] = (e80Choice.getAttribute("data-exam80-choice") || "").split(":");
      if (numStr && val) {
        state.exam80UserAnswers[Number(numStr)] = val;
        saveState();
        renderApp();
      }
      return;
    }

    const ansFilter = target.closest("[data-ans-filter]");
    if (ansFilter) {
      state.answersSection = ansFilter.getAttribute("data-ans-filter") || "all";
      renderApp();
      return;
    }
  });

  root.addEventListener("input", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    if (target.hasAttribute("data-figura-search")) {
      state.figuraSearch = target.value;
      const cursorPos = target.selectionStart;
      renderApp();
      const newInput = document.querySelector("[data-figura-search]");
      if (newInput instanceof HTMLInputElement) {
        newInput.focus();
        if (cursorPos !== null) newInput.setSelectionRange(cursorPos, cursorPos);
      }
      return;
    }

    if (target.hasAttribute("data-open-note")) {
      const key = target.getAttribute("data-open-note");
      if (key) {
        state.openNotes[key] = target.value;
        saveState();
      }
      return;
    }

    if (target.hasAttribute("data-exam80-input")) {
      const num = Number(target.getAttribute("data-exam80-input"));
      if (num) {
        state.exam80UserAnswers[num] = target.value;
        saveState();
      }
    }
  });
}

loadSavedState();
renderApp();
bindEvents();
