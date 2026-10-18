import {useLayoutEffect,useRef,type ButtonHTMLAttributes} from 'react';
import {GlossText} from './GlossText';
export function EnglishOption({text,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{text:string}){
 const ref=useRef<HTMLButtonElement>(null);
 useLayoutEffect(()=>{const button=ref.current; if(!button)return;let alive=true;
 const fit=()=>{const label=button.querySelector<HTMLElement>('.englishOptionLabel');const inner=button.querySelector<HTMLElement>('.englishOptionText');if(!label||!inner)return;const preferred=button.closest('.large')?20:17;const current=parseFloat(getComputedStyle(inner).fontSize);const natural=inner.getBoundingClientRect().width;const available=label.clientWidth; if(natural&&available)button.style.fontSize=Math.min(preferred,current*(available-2)/natural)+'px';};
 const observer=new ResizeObserver(fit);observer.observe(button);const host=button.closest('.reviewStage')?.firstElementChild||document.querySelector('#root>div');const mode=new MutationObserver(fit);if(host)mode.observe(host,{attributes:true,attributeFilter:['class']});fit();document.fonts.ready.then(()=>{if(alive)fit()});return()=>{alive=false;observer.disconnect();mode.disconnect()};},[text]);
 return <button {...props} ref={ref} className={'englishOption '+className}><span className="englishOptionLabel"><span className="englishOptionText"><GlossText text={text}/></span></span><span className="englishOptionCue" aria-hidden="true">选择</span></button>
}
