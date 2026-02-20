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

.fade-up{animation:fadeUp .4s ease forwards;opacity:0}
.fade-in{animation:fadeIn .3s ease forwards}
.scale-in{animation:scaleIn .25s ease forwards}
.d1{animation-delay:.03s}.d2{animation-delay:.06s}.d3{animation-delay:.09s}.d4{animation-delay:.12s}
.d5{animation-delay:.15s}.d6{animation-delay:.18s}

/* Interactive */
.hoverable{transition:all .15s ease}
.hoverable:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.2)}
.pressable{transition:all .1s ease}
.pressable:hover{transform:translateY(-1px)}
.pressable:active{transform:scale(.97)}

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

/* Table responsive */
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.table-wrap table{min-width:500px}

/* Sub-tabs scrollable */
.subtabs{display:flex;gap:0;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.subtabs::-webkit-scrollbar{display:none}

/* Tablet (769px - 1024px) */
@media(min-width:769px) and (max-width:1024px){
  .kpi-grid{grid-template-columns:repeat(2, 1fr) !important}
  .grid-desktop-3{grid-template-columns:repeat(2, 1fr) !important}
  .grid-desktop-15-1{grid-template-columns:1fr !important}
  .grid-desktop-2{grid-template-columns:1fr !important}
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
}
@media(min-width:769px){
  .mobile-header{display:none !important}
}
@media(max-width:480px){
  .kpi-grid{grid-template-columns:1fr !important}
  .grid-2-mobile-1{grid-template-columns:1fr !important}
}
`;
