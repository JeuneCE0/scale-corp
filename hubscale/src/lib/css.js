// HubScale — Global CSS (injected via <style>)
import { T, FONT } from './theme.js';

export const GLOBAL_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html{overflow-x:clip}
body{margin:0;font-family:${FONT};background:var(--hs-bg,${T.bg});color:var(--hs-text,${T.text});background-image:radial-gradient(ellipse at 15% -5%,rgba(249,115,22,.07) 0%,transparent 50%),radial-gradient(ellipse at 85% -5%,rgba(99,102,241,.05) 0%,transparent 50%);transition:background .3s ease,color .3s ease}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes barGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pageEnter{from{opacity:0;transform:translateY(10px) scale(.998)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes pagePulse{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}
@keyframes bounceIn{0%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1.05)}70%{transform:scale(.95)}100%{transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes confettiDrop{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(120px) rotate(720deg)}}
@keyframes bellShake{0%{transform:rotate(0)}15%{transform:rotate(12deg)}30%{transform:rotate(-10deg)}45%{transform:rotate(8deg)}60%{transform:rotate(-6deg)}75%{transform:rotate(3deg)}100%{transform:rotate(0)}}
@keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes checkBounce{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
@keyframes skeletonShimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
@keyframes numberTick{0%{opacity:0;transform:translateY(-100%)}100%{opacity:1;transform:translateY(0)}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 5px rgba(249,115,22,.2)}50%{box-shadow:0 0 20px rgba(249,115,22,.4)}}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
@keyframes premiumShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

.fade-up{animation:fadeUp .4s ease forwards;opacity:0}
.fade-in{animation:fadeIn .3s ease forwards}
.scale-in{animation:scaleIn .25s ease forwards}
.bounce-in{animation:bounceIn .5s ease forwards}
.slide-in-right{animation:slideInRight .3s ease forwards}
.check-bounce{animation:checkBounce .3s ease forwards}
.d1{animation-delay:.03s}.d2{animation-delay:.06s}.d3{animation-delay:.09s}.d4{animation-delay:.12s}
.d5{animation-delay:.15s}.d6{animation-delay:.18s}

/* Skeleton loading */
.skeleton{background:linear-gradient(90deg,var(--hs-surface2,${T.surface2}) 25%,var(--hs-border,${T.border})44 50%,var(--hs-surface2,${T.surface2}) 75%);background-size:200px 100%;animation:skeletonShimmer 1.5s ease-in-out infinite;border-radius:8px}
.skeleton-text{height:12px;margin-bottom:8px;border-radius:4px}
.skeleton-circle{border-radius:50%}

/* Confetti */
.confetti-piece{position:fixed;top:-10px;z-index:9999;pointer-events:none;animation:confettiDrop 2s ease-out forwards}

/* Bell shake */
.bell-shake{animation:bellShake .5s ease}

/* Glow pulse for important elements */
.glow-pulse{animation:glowPulse 2s ease-in-out infinite}

/* Interactive */
.hoverable{transition:all .15s ease}
.hoverable:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.2)}
.pressable{transition:all .1s ease}
.pressable:hover{transform:translateY(-1px)}
.pressable:active{transform:scale(.97)}

/* Smooth number transitions */
.number-tick{animation:numberTick .3s ease forwards}

/* Scrollbar */
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--hs-border,${T.border});border-radius:4px}

/* Focus */
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--hs-accent,${T.accent})44;outline-offset:2px}

/* Glass morphism — Dark (default) */
.glass{background:rgba(17,17,19,.55);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.07);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.03);transition:border-color .25s ease,box-shadow .25s ease,transform .25s ease,background .3s ease}
.glass:hover{border-color:rgba(255,255,255,.12);box-shadow:0 8px 32px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.05);transform:translateY(-1px)}
.glass-static{background:rgba(17,17,19,.55);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.07);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.03);transition:background .3s ease,border-color .3s ease,box-shadow .3s ease}
.glass-input{background:rgba(9,9,11,.5);border:1px solid rgba(255,255,255,.06);border-radius:10px;transition:all .2s ease}
.glass-input:focus-within{border-color:rgba(99,102,241,.4);box-shadow:0 0 12px rgba(99,102,241,.08)}

/* Glass morphism — Light mode overrides */
[data-theme="light"] .glass{background:rgba(255,255,255,.75);border-color:rgba(0,0,0,.08);box-shadow:0 2px 16px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.5)}
[data-theme="light"] .glass:hover{border-color:rgba(0,0,0,.14);box-shadow:0 6px 24px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.5)}
[data-theme="light"] .glass-static{background:rgba(255,255,255,.75);border-color:rgba(0,0,0,.08);box-shadow:0 2px 16px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.5)}
[data-theme="light"] .glass-input{background:rgba(255,255,255,.85);border-color:rgba(0,0,0,.1)}
[data-theme="light"] .glass-input:focus-within{border-color:rgba(99,102,241,.5);box-shadow:0 0 12px rgba(99,102,241,.12)}

/* Light mode — body, nav, date pickers, hoverable */
[data-theme="light"] body{background-image:radial-gradient(ellipse at 15% -5%,rgba(249,115,22,.04) 0%,transparent 50%),radial-gradient(ellipse at 85% -5%,rgba(99,102,241,.03) 0%,transparent 50%)}
[data-theme="light"] .hoverable:hover{box-shadow:0 4px 12px rgba(0,0,0,.08)}
[data-theme="light"] .nav-tab:hover:not([aria-selected="true"]){background:rgba(0,0,0,.04);color:var(--hs-textSecondary)}
[data-theme="light"] .nav-tab .tab-icon{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.06)}
[data-theme="light"] input[type="date"]::-webkit-calendar-picker-indicator,
[data-theme="light"] input[type="time"]::-webkit-calendar-picker-indicator,
[data-theme="light"] input[type="month"]::-webkit-calendar-picker-indicator{filter:none;opacity:.6;cursor:pointer}
[data-theme="light"] .notif-panel{box-shadow:0 16px 48px rgba(0,0,0,.12)}
[data-theme="light"] .skeleton{background:linear-gradient(90deg,#f4f4f5 25%,#e4e4e7 50%,#f4f4f5 75%);background-size:200px 100%}

/* Dark-friendly date/time pickers (default dark) */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator,
input[type="month"]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(1.8);opacity:.6;cursor:pointer}
input[type="date"]::-webkit-calendar-picker-indicator:hover,
input[type="time"]::-webkit-calendar-picker-indicator:hover,
input[type="month"]::-webkit-calendar-picker-indicator:hover{opacity:1}
::-webkit-datetime-edit-fields-wrapper{color:var(--hs-text,${T.text})}
::-webkit-datetime-edit{color:var(--hs-text,${T.text})}
::-webkit-datetime-edit-text{color:var(--hs-textMuted,${T.textMuted})}

/* Table responsive */
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.table-wrap table{min-width:500px}

/* Sub-tabs scrollable */
.subtabs{display:flex;gap:0;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.subtabs::-webkit-scrollbar{display:none}

/* Calendar grid */
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--hs-border,${T.border});border-radius:12px;overflow:hidden}
.cal-cell{background:var(--hs-surface,${T.surface});padding:4px;min-height:70px;cursor:pointer;transition:background .1s}
.cal-cell:hover{background:var(--hs-surface2,${T.surface2})}
.cal-cell.today{background:rgba(249,115,22,.08);box-shadow:inset 0 0 0 1px var(--hs-orange,${T.orange})44}
.cal-cell.other-month{opacity:.35}
.cal-header{background:var(--hs-surface2,${T.surface2});padding:8px 4px;text-align:center;font-size:10px;font-weight:700;color:var(--hs-textMuted,${T.textMuted});text-transform:uppercase;letter-spacing:.5px;min-height:auto}
.cal-event-dot{width:6px;height:6px;border-radius:3px;display:inline-block;margin:1px}

/* Notification panel */
.notif-panel{position:absolute;top:100%;right:0;width:360px;max-height:420px;overflow-y:auto;background:var(--hs-surface,${T.surface});border:1px solid var(--hs-border,${T.border});border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.4);z-index:200}

/* Streak badge */
.streak-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}

/* Selection checkbox */
.sel-check{width:16px;height:16px;border-radius:4px;border:2px solid var(--hs-border,${T.border});display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0}
.sel-check.checked{border-color:var(--hs-accent,${T.accent});background:var(--hs-accentBg,${T.accentBg})}

/* Score ring */
.score-ring{position:relative;display:inline-flex;align-items:center;justify-content:center}

/* Modern navigation tabs */
.nav-tab-bar{display:flex;gap:2px;padding:4px 0 8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.nav-tab-bar::-webkit-scrollbar{display:none}
.nav-tab{position:relative;background:transparent;border:1px solid transparent;cursor:pointer;padding:7px 14px;font-family:${FONT};display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--hs-textMuted,${T.textMuted});border-radius:10px;transition:all .2s ease;white-space:nowrap;flex-shrink:0}
.nav-tab:hover:not([aria-selected="true"]){background:rgba(255,255,255,.04);color:var(--hs-textSecondary,${T.textSecondary})}
.nav-tab .tab-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);transition:all .25s ease;flex-shrink:0}

/* Tablet (769px - 1024px) */
@media(min-width:769px) and (max-width:1024px){
  .kpi-grid{grid-template-columns:repeat(2, 1fr) !important}
  .grid-desktop-3{grid-template-columns:repeat(2, 1fr) !important}
  .grid-desktop-15-1{grid-template-columns:1fr !important}
  .grid-desktop-2{grid-template-columns:1fr !important}
  .notif-panel{width:300px}
  .pipeline-cols{grid-template-columns:repeat(3, 1fr) !important}
  .analytics-funnel-grid{grid-template-columns:1fr !important}
}

/* Mobile (<768px) */
@media(max-width:768px){
  .hide-mobile{display:none !important}
  .mobile-header{display:flex !important}
  .kpi-grid{grid-template-columns:1fr 1fr !important;gap:8px !important}
  .grid-desktop-2{grid-template-columns:1fr !important}
  .grid-desktop-3{grid-template-columns:1fr !important}
  .grid-desktop-15-1{grid-template-columns:1fr !important}
  .nav-tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .nav-tabs-scroll::-webkit-scrollbar{display:none}
  .page-pad{padding:12px 10px 70px !important}
  .modal-inner{width:100% !important;max-width:100% !important;margin:0 !important;max-height:100vh !important;border-radius:16px 16px 0 0 !important;position:fixed !important;bottom:0 !important;top:auto !important}
  .notif-panel{width:calc(100vw - 16px);right:-4px;max-height:70vh}
  .cal-cell{min-height:44px;padding:2px !important}
  .cal-header{padding:6px 2px !important;font-size:9px !important}
  .pipeline-cols{display:flex !important;flex-direction:column !important;gap:12px !important}
  .pipeline-col{max-height:350px !important}
  .analytics-funnel-grid{grid-template-columns:1fr !important}
  .integration-search-bar{flex-direction:column !important}
  .integration-cat-tabs{justify-content:flex-start !important;overflow-x:auto !important;scrollbar-width:none !important;flex-wrap:nowrap !important}
  .integration-cat-tabs::-webkit-scrollbar{display:none}
  .api-log-entry{flex-direction:column !important;align-items:flex-start !important;gap:6px !important}
  .offline-banner-text{font-size:10px !important}
  .nav-tab{padding:5px 10px !important;font-size:11px !important;gap:5px !important}
  .nav-tab .tab-icon{width:24px !important;height:24px !important;font-size:12px !important;border-radius:6px !important}
  .nav-tab-bar{gap:1px !important;padding:2px 0 6px !important}
  .glass-static,.glass{border-radius:12px !important}
  .table-wrap table{min-width:400px}
  .subtabs{gap:0;font-size:11px}
  .streak-badge{font-size:10px !important;padding:2px 8px !important}
  h1,h2,h3{word-break:break-word}
}
@media(min-width:769px){
  .mobile-header{display:none !important}
}
@media(max-width:480px){
  .kpi-grid{grid-template-columns:1fr !important;gap:6px !important}
  .grid-2-mobile-1{grid-template-columns:1fr !important}
  .pipeline-cols{display:flex !important;flex-direction:column !important}
  .nav-tab span.tab-icon+span{display:none}
  .nav-tab{padding:6px 8px !important}
  .cal-cell{min-height:38px}
  .cal-event-dot{width:4px !important;height:4px !important;border-radius:2px !important}
}

/* Smart compact numbers on mobile */
.compact-num{display:none}
@media(max-width:640px){.full-num{display:none !important}.compact-num{display:inline !important}}

/* Touch targets — ensure minimum 44px on mobile */
@media(max-width:768px){
  button,a,[role="tab"],[role="button"]{min-height:44px}
  select{min-height:44px}
  input[type="text"],input[type="email"],input[type="password"],input[type="number"],input[type="search"],input[type="tel"],input[type="url"],input[type="date"],input[type="time"],textarea{min-height:44px;font-size:16px !important}
}

/* Safe area for notch devices */
@supports(padding:max(0px)){
  .page-pad{padding-bottom:max(70px,env(safe-area-inset-bottom,70px)) !important}
  nav[role="navigation"]{padding-left:max(20px,env(safe-area-inset-left,20px));padding-right:max(20px,env(safe-area-inset-right,20px))}
}

/* Skip nav link (a11y) */
.skip-nav{position:absolute;top:-40px;left:0;background:var(--hs-accent,${T.accent});color:#fff;padding:8px 16px;z-index:9999;font-size:13px;font-weight:600;border-radius:0 0 8px 0;transition:top .2s}
.skip-nav:focus{top:0}

/* Page transition */
.page-transition{animation:pageEnter .25s ease forwards}

/* Drag handle */
.drag-handle{cursor:grab;opacity:.3;transition:opacity .15s;user-select:none}
.drag-handle:hover{opacity:.8}
.drag-handle:active{cursor:grabbing}

/* Tour overlay */
.tour-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1200}
.tour-spotlight{position:fixed;z-index:1201;box-shadow:0 0 0 9999px rgba(0,0,0,.6);border-radius:12px;pointer-events:none;transition:all .4s ease}
.tour-popover{position:fixed;z-index:1202;max-width:320px}
`;
