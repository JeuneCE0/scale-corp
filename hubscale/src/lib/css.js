// HubScale — Global CSS (injected via <style>)
import { T, FONT } from './theme.js';

export const GLOBAL_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{margin:0;overflow-x:hidden;font-family:${FONT};background:${T.bg};color:${T.text}}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes barGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pageEnter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
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

.fade-up{animation:fadeUp .4s ease forwards;opacity:0}
.fade-in{animation:fadeIn .3s ease forwards}
.scale-in{animation:scaleIn .25s ease forwards}
.bounce-in{animation:bounceIn .5s ease forwards}
.slide-in-right{animation:slideInRight .3s ease forwards}
.check-bounce{animation:checkBounce .3s ease forwards}
.d1{animation-delay:.03s}.d2{animation-delay:.06s}.d3{animation-delay:.09s}.d4{animation-delay:.12s}
.d5{animation-delay:.15s}.d6{animation-delay:.18s}

/* Skeleton loading */
.skeleton{background:linear-gradient(90deg,${T.surface2} 25%,${T.border}44 50%,${T.surface2} 75%);background-size:200px 100%;animation:skeletonShimmer 1.5s ease-in-out infinite;border-radius:8px}
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
::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}

/* Focus */
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid ${T.accent}44;outline-offset:2px}

/* Glass morphism */
.glass{background:rgba(17,17,19,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.06);border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,.2)}
.glass:hover{border-color:rgba(99,102,241,.15)}
.glass-static{background:rgba(17,17,19,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.06);border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,.2)}
.glass-input{background:rgba(9,9,11,.5);border:1px solid rgba(255,255,255,.06);border-radius:10px;transition:all .2s ease}
.glass-input:focus-within{border-color:rgba(99,102,241,.4);box-shadow:0 0 12px rgba(99,102,241,.08)}

/* Dark-friendly date/time pickers */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator,
input[type="month"]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(1.8);opacity:.6;cursor:pointer}
input[type="date"]::-webkit-calendar-picker-indicator:hover,
input[type="time"]::-webkit-calendar-picker-indicator:hover,
input[type="month"]::-webkit-calendar-picker-indicator:hover{opacity:1}
::-webkit-datetime-edit-fields-wrapper{color:${T.text}}
::-webkit-datetime-edit{color:${T.text}}
::-webkit-datetime-edit-text{color:${T.textMuted}}

/* Table responsive */
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.table-wrap table{min-width:500px}

/* Sub-tabs scrollable */
.subtabs{display:flex;gap:0;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.subtabs::-webkit-scrollbar{display:none}

/* Calendar grid */
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:${T.border};border-radius:12px;overflow:hidden}
.cal-cell{background:${T.surface};padding:4px;min-height:70px;cursor:pointer;transition:background .1s}
.cal-cell:hover{background:${T.surface2}}
.cal-cell.today{background:rgba(249,115,22,.08);box-shadow:inset 0 0 0 1px ${T.orange}44}
.cal-cell.other-month{opacity:.35}
.cal-header{background:${T.surface2};padding:8px 4px;text-align:center;font-size:10px;font-weight:700;color:${T.textMuted};text-transform:uppercase;letter-spacing:.5px;min-height:auto}
.cal-event-dot{width:6px;height:6px;border-radius:3px;display:inline-block;margin:1px}

/* Notification panel */
.notif-panel{position:absolute;top:100%;right:0;width:360px;max-height:420px;overflow-y:auto;background:${T.surface};border:1px solid ${T.border};border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.4);z-index:200}

/* Streak badge */
.streak-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}

/* Selection checkbox */
.sel-check{width:16px;height:16px;border-radius:4px;border:2px solid ${T.border};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0}
.sel-check.checked{border-color:${T.accent};background:${T.accentBg}}

/* Score ring */
.score-ring{position:relative;display:inline-flex;align-items:center;justify-content:center}

/* Tablet (769px - 1024px) */
@media(min-width:769px) and (max-width:1024px){
  .kpi-grid{grid-template-columns:repeat(2, 1fr) !important}
  .grid-desktop-3{grid-template-columns:repeat(2, 1fr) !important}
  .grid-desktop-15-1{grid-template-columns:1fr !important}
  .grid-desktop-2{grid-template-columns:1fr !important}
  .notif-panel{width:300px}
}

/* Mobile (<768px) */
@media(max-width:768px){
  .hide-mobile{display:none !important}
  .mobile-header{display:flex !important}
  .kpi-grid{grid-template-columns:1fr 1fr !important}
  .grid-desktop-2{grid-template-columns:1fr !important}
  .grid-desktop-3{grid-template-columns:1fr !important}
  .grid-desktop-15-1{grid-template-columns:1fr !important}
  .nav-tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .nav-tabs-scroll::-webkit-scrollbar{display:none}
  .page-pad{padding:12px 14px 30px !important}
  .modal-inner{width:100% !important;max-width:100% !important;margin:8px !important;padding:16px !important}
  .notif-panel{width:calc(100vw - 32px);right:-8px}
  .cal-cell{min-height:50px}
}
@media(min-width:769px){
  .mobile-header{display:none !important}
}
@media(max-width:480px){
  .kpi-grid{grid-template-columns:1fr !important}
  .grid-2-mobile-1{grid-template-columns:1fr !important}
}

/* Smart compact numbers on mobile */
.compact-num{display:none}
@media(max-width:640px){.full-num{display:none !important}.compact-num{display:inline !important}}

/* Skip nav link (a11y) */
.skip-nav{position:absolute;top:-40px;left:0;background:${T.accent};color:#fff;padding:8px 16px;z-index:9999;font-size:13px;font-weight:600;border-radius:0 0 8px 0;transition:top .2s}
.skip-nav:focus{top:0}

/* Page transition */
.page-transition{animation:pageEnter .3s ease forwards}

/* Drag handle */
.drag-handle{cursor:grab;opacity:.3;transition:opacity .15s;user-select:none}
.drag-handle:hover{opacity:.8}
.drag-handle:active{cursor:grabbing}

/* Tour overlay */
.tour-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1200}
.tour-spotlight{position:fixed;z-index:1201;box-shadow:0 0 0 9999px rgba(0,0,0,.6);border-radius:12px;pointer-events:none;transition:all .4s ease}
.tour-popover{position:fixed;z-index:1202;max-width:320px}
`;
