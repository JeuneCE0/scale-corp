import { C } from './theme.js';
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.5s ease forwards;opacity:0}
@keyframes barGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes si{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes bg{from{width:0}to{width:var(--w,100%)}}
@keyframes mi{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes sp{to{transform:rotate(360deg)}}@keyframes sh{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes gl{0%,100%{border-color:rgba(255,170,0,.1)}50%{border-color:rgba(255,170,0,.35)}}
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes typing{0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes weatherPulse{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.08);filter:brightness(1.2)}}
@keyframes shimmerKPI{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-12px);max-height:0}to{opacity:1;transform:translateY(0);max-height:200px}}
@keyframes barExpand{from{width:0%}to{width:var(--target-w,100%)}}
@keyframes fadeTab{from{opacity:0}to{opacity:1}}
@keyframes toastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}
@keyframes churnPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(248,113,113,.4)}50%{opacity:.85;box-shadow:0 0 8px 2px rgba(248,113,113,.3)}}
@keyframes typingDots{0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}
.typing-dots span{display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.td};margin:0 2px;animation:typingDots 1.4s infinite both}
.typing-dots span:nth-child(2){animation-delay:.2s}
.typing-dots span:nth-child(3){animation-delay:.4s}
.tab-fade{animation:fadeTab .2s ease both}
.slide-down{animation:slideDown .3s ease both}
.kpi-shimmer:hover::after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,transparent,rgba(255,170,0,.06),transparent);background-size:200% 100%;animation:shimmerKPI 1.5s ease infinite;pointer-events:none}
@keyframes celebIn{0%{opacity:0;transform:scale(.3) translateY(50px)}40%{transform:scale(1.1) translateY(-10px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(120vh) rotate(720deg);opacity:0}}
@keyframes celebGlow{0%,100%{box-shadow:0 0 20px rgba(255,170,0,.15)}50%{box-shadow:0 0 40px rgba(255,170,0,.4),0 0 80px rgba(255,170,0,.15)}}
@keyframes mglow{0%,100%{box-shadow:0 0 3px rgba(255,170,0,.2)}50%{box-shadow:0 0 10px rgba(255,170,0,.4)}}
.fu{animation:fu .35s ease both}.fi{animation:fi .25s ease both}.si{animation:si .3s ease both}
.d1{animation-delay:.03s}.d2{animation-delay:.06s}.d3{animation-delay:.09s}.d4{animation-delay:.12s}.d5{animation-delay:.15s}.d6{animation-delay:.18s}.d7{animation-delay:.21s}.d8{animation-delay:.24s}
.hv{transition:all .18s ease}.hv:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.25)}
.ba{transition:all .12s ease}.ba:hover{transform:translateY(-1px)}.ba:active{transform:scale(.97)}
.mi{animation:mi .25s cubic-bezier(.16,1,.3,1)}.gl{animation:gl 2.5s ease infinite}.fl{animation:fl 3s ease-in-out infinite}
.pg{animation:bg .5s cubic-bezier(.4,0,.2,1) both}
.dots span{animation:typing 1.4s infinite both}.dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideInUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes typeReveal{from{max-height:0;opacity:0}to{max-height:600px;opacity:1}}
@media(max-width:768px){.sidebar-desktop{display:none !important}.main-content{margin-left:0 !important}.mobile-header{display:flex !important}.kpi-grid-responsive{grid-template-columns:1fr 1fr !important}.chart-responsive{min-height:180px}.tx-list-mobile .tx-detail{display:none}}
@media(min-width:769px){.mobile-header{display:none !important}}
@media(max-width:768px){.admin-grid{grid-template-columns:1fr !important}.admin-card{min-width:auto !important}.admin-stats-row{grid-template-columns:1fr !important;gap:8px !important}.pulse-grid{grid-template-columns:1fr !important}.pulse-left,.pulse-right{display:none !important}.pulse-center{grid-column:1 !important}.main-content div[style*="grid-template-columns: repeat(4"]{grid-template-columns:1fr 1fr !important}.main-content div[style*="grid-template-columns: 1fr 1fr 1fr"]{grid-template-columns:1fr !important}.main-content div[style*="gridTemplateColumns"]{min-width:0 !important}.admin-responsive-grid{grid-template-columns:1fr !important}.admin-responsive-2col{grid-template-columns:1fr 1fr !important}table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;font-size:11px !important}.admin-soc-grid{grid-template-columns:1fr !important}.admin-soc-selector{left:10px !important;top:50px !important}.main-content{padding-top:48px !important}.glass-card,.glass-card-static{min-width:0 !important}.modal-wide{width:90vw !important;max-width:90vw !important}.ai-chat-panel{width:90vw !important;right:0 !important;max-width:none !important}.notif-panel{width:85vw !important;right:0 !important}}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.brd};border-radius:3px}
input[type=range]{-webkit-appearance:none;background:${C.brd};height:3px;border-radius:4px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${C.acc};cursor:pointer;box-shadow:0 2px 6px rgba(255,170,0,.3)}
select{cursor:pointer}select:focus{border-color:${C.acc}44}
button:focus-visible{outline:2px solid ${C.acc}44;outline-offset:2px}
.glass-bg{background:#06060b;background-image:radial-gradient(at 20% 30%,rgba(255,170,0,.03) 0%,transparent 50%),radial-gradient(at 80% 70%,rgba(255,157,0,.02) 0%,transparent 50%),radial-gradient(at 50% 50%,rgba(96,165,250,.015) 0%,transparent 60%)}
.glass-card{background:rgba(14,14,22,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.06);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.3);transition:all .3s cubic-bezier(.4,0,.2,1)}
.glass-card:hover{border-color:rgba(255,170,0,.15);transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
.glass-card-static{background:rgba(14,14,22,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.06);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.3)}
.glass-sidebar{background:rgba(14,14,22,.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-right:1px solid rgba(255,255,255,.04)}
.glass-input{background:rgba(6,6,11,.6);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:all .2s ease}
.glass-input:focus-within{border-color:rgba(255,170,0,.3);box-shadow:0 0 16px rgba(255,170,0,.08)}
.glass-modal{background:rgba(14,14,22,.85);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 64px rgba(0,0,0,.6)}
.glow-accent{box-shadow:0 0 20px rgba(255,170,0,.15)}
.glow-accent-strong{box-shadow:0 0 30px rgba(255,170,0,.25),0 4px 16px rgba(0,0,0,.3)}
.glass-btn-ghost{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.glass-btn-ghost:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}`;
